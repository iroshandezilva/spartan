import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { diffExports, hasDrift, importFigmaExport, modeDependencies, renderCSSV2, resolveToken, validateTokensV2, type FigmaExport, type Rgba, type TokenSourceV2 } from '../lib/figma-tokens';
import { stringifySource } from '../scripts/import-figma-tokens';

const snapshot = (): FigmaExport => JSON.parse(readFileSync('tokens/figma/spartan-ds.export.json', 'utf8'));
const production = (): TokenSourceV2 => JSON.parse(readFileSync('tokens/source.json', 'utf8'));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

test('the Figma snapshot holds the six collections, modes, and variable counts audited in Spartan DS', () => {
  const ex = snapshot();
  assert.deepEqual(ex.collections.map(c => [c.name, c.variables.length]).sort(), [['01 Primitives', 183], ['02 Primary', 13], ['03 Semantic Color', 79], ['04 Semantic Foundation', 58], ['05 Component', 66], ['06 Density', 62]]);
  const modes = Object.fromEntries(ex.collections.map(c => [c.name, c.modes.map(m => m.name)]));
  assert.deepEqual(modes['02 Primary'], ['Blue', 'Purple', 'Orange', 'Sky']);
  assert.deepEqual(modes['03 Semantic Color'], ['Light', 'Dark', 'Light High Contrast', 'Dark High Contrast']);
  assert.deepEqual(modes['06 Density'], ['Relaxed', 'Compact']);
  const ids = ex.collections.flatMap(c => c.variables.map(v => v.id));
  assert.equal(new Set(ids).size, 461);
  assert.equal(new Set(ex.collections.flatMap(c => c.variables.map(v => v.key))).size, 461);
});

test('committed source.json and tokens.css match the snapshot (drift gate)', () => {
  const source = importFigmaExport(snapshot());
  assert.equal(readFileSync('tokens/source.json', 'utf8'), stringifySource(source));
  assert.equal(readFileSync('public/tokens.css', 'utf8'), renderCSSV2(source));
});

test('cross-collection alias chains resolve to the values read from Figma in both density modes', () => {
  const s = production();
  const px = (key: string, density: string) => resolveToken(s, key, { density });
  // Component -> Density -> Primitives, in 06 Density's Relaxed and Compact modes.
  assert.deepEqual([px('component.button.height.base', 'Relaxed'), px('component.button.height.base', 'Compact')], [40, 32]);
  assert.deepEqual([px('component.button.height.sm', 'Relaxed'), px('component.button.height.sm', 'Compact')], [32, 28]);
  assert.deepEqual([px('component.button.height.xs', 'Relaxed'), px('component.button.height.xs', 'Compact')], [24, 24]);
  assert.deepEqual([px('component.button.height.lg', 'Relaxed'), px('component.button.height.lg', 'Compact')], [40, 32]);
  assert.deepEqual([px('component.button.outer-padding-x.base', 'Relaxed'), px('component.button.outer-padding-x.base', 'Compact')], [10, 6]);
  assert.deepEqual([px('component.button.outer-padding-x.sm', 'Relaxed'), px('component.button.outer-padding-x.sm', 'Compact')], [8, 6]);
  assert.deepEqual([px('component.button.label-padding-x.base', 'Relaxed'), px('component.button.label-padding-x.base', 'Compact')], [6, 6]);
  assert.deepEqual([px('component.button.label-padding-x.sm', 'Relaxed'), px('component.button.label-padding-x.sm', 'Compact')], [4, 4]);
  assert.deepEqual([px('density.density.control.icon-size.base', 'Relaxed'), px('density.density.control.icon-size.base', 'Compact')], [20, 18]);
  assert.equal(px('semantic-foundation.radius.control', 'Relaxed'), 8);
  assert.equal(px('semantic-foundation.radius.pill', 'Compact'), 9999);
  // Semantic Foundation reaches into Semantic Color (contrast modes) and back out to Primitives.
  assert.deepEqual(['Light', 'Dark', 'Light High Contrast', 'Dark High Contrast'].map(m => resolveToken(s, 'semantic-foundation.border-width.default', { 'semantic-color': m })), [1, 1, 2, 2]);
});

test('semantic colors resolve through every Semantic Color mode and Primary hue', () => {
  const s = production();
  const at = (mode: string, hue: string) => resolveToken(s, 'semantic-color.color.primary.default', { 'semantic-color': mode, primary: hue }) as Rgba;
  assert.deepEqual(at('Light', 'Blue'), { r: 0, g: 0.427451, b: 0.807843, a: 1 });
  assert.deepEqual(at('Light', 'Purple'), { r: 0.537255, g: 0.2, b: 0.894118, a: 1 });
  assert.deepEqual(at('Dark', 'Orange'), { r: 0.678431, g: 0.313726, b: 0, a: 1 });
  assert.deepEqual(at('Light High Contrast', 'Sky'), { r: 0, g: 0.254902, b: 0.329412, a: 1 });
  assert.deepEqual(at('Dark High Contrast', 'Sky'), { r: 0.486275, g: 0.85098, b: 0.988235, a: 1 });
  // Alpha-bound colors keep the aliased color and the percent opacity.
  const subtle = resolveToken(s, 'semantic-color.color.danger.subtle.default', { 'semantic-color': 'Dark' });
  assert.deepEqual(subtle, { alpha: { color: { r: 1, g: 0.494118, b: 0.466667, a: 1 }, opacity: 20 } });
});

test('mode dependencies are detected per token, including aliases that cross collections', () => {
  const deps = modeDependencies(production());
  assert.deepEqual(deps.get('component.button.height.base'), ['density']);
  assert.deepEqual(deps.get('component.badge.padding-x'), []);
  assert.deepEqual(deps.get('primitives.space.4'), []);
  assert.deepEqual(deps.get('semantic-color.color.primary.default'), ['primary', 'semantic-color']);
  assert.deepEqual(deps.get('semantic-color.color.surface.default'), ['semantic-color']);
  assert.deepEqual(deps.get('semantic-foundation.border-width.default'), ['semantic-color']);
  assert.ok([...deps.values()].every(d => d.length <= 2));
});

// ---- A small cascade simulator, independent of the generator ----

type Rule = { selectors: string[][]; order: number; decls: Map<string, string> };
function parseCSS(css: string): Rule[] {
  const rules: Rule[] = [];
  const re = /([^{}]+)\{([^}]*)\}/g;
  let m: RegExpExecArray | null, order = 0;
  while ((m = re.exec(css.replace(/\/\*[\s\S]*?\*\//g, '')))) {
    const selectors = m[1].split(',').map(x => x.trim()).filter(Boolean).map(sel => sel === ':root' ? [':root'] : [...sel.matchAll(/\[(data-sp-mode-[a-z-]+)="([^"]+)"\]/g)].map(a => `${a[1]}=${a[2]}`));
    const decls = new Map([...m[2].matchAll(/(--sp-[a-z0-9-]+):\s*([^;]+);/g)].map(d => [d[1], d[2].trim()] as const));
    rules.push({ selectors, order: order++, decls });
  }
  return rules;
}
// Computes custom properties down a chain of elements; each element's attrs are
// { collectionKey: modeName }. var() resolves at the element that declares it.
function computeChain(rules: Rule[], chain: Record<string, string>[]) {
  let inherited = new Map<string, string>();
  for (let depth = 0; depth < chain.length; depth++) {
    const attrs = new Set(Object.entries(chain[depth]).map(([k, v]) => `data-sp-mode-${k}=${v}`));
    const winners = new Map<string, { spec: number; order: number; value: string }>();
    for (const r of rules) for (const sel of r.selectors) {
      const hit = sel[0] === ':root' ? depth === 0 : sel.every(a => attrs.has(a));
      if (!hit) continue;
      const spec = sel[0] === ':root' ? 1 : sel.length;
      for (const [name, value] of r.decls) {
        const cur = winners.get(name);
        if (!cur || spec > cur.spec || (spec === cur.spec && r.order > cur.order)) winners.set(name, { spec, order: r.order, value });
      }
    }
    const scope = new Map(inherited);
    for (const [n, w] of winners) scope.set(n, w.value);
    const resolve = (name: string, seen: string[] = []): string => {
      if (seen.includes(name)) throw new Error('cycle ' + seen.join('>'));
      const raw = scope.get(name);
      if (raw === undefined) throw new Error('undefined ' + name);
      return raw.replace(/var\((--[a-z0-9-]+)\)/g, (_, n) => resolve(n, [...seen, name]));
    };
    const next = new Map(inherited);
    for (const n of winners.keys()) next.set(n, resolve(n));
    inherited = next;
  }
  return inherited;
}
const rgbText = (c: Rgba) => `rgb(${+(c.r * 255).toFixed(3)} ${+(c.g * 255).toFixed(3)} ${+(c.b * 255).toFixed(3)} / ${c.a})`;
const literal = (s: TokenSourceV2, key: string, assign: Record<string, string>) => {
  const t = s.tokens.find(x => x.key === key)!;
  const v = resolveToken(s, key, assign);
  if (typeof v === 'number') return `${v}${t.unit === 'px' ? 'px' : t.unit === 'percent' ? '%' : ''}`;
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? '1' : '0';
  if ('alpha' in v) return `color-mix(in srgb, ${rgbText(v.alpha.color)} ${v.alpha.opacity}%, transparent)`;
  return rgbText(v);
};
const cssVar = (s: TokenSourceV2, key: string) => {
  const t = s.tokens.find(x => x.key === key)!, c = s.collections.find(x => x.key === t.collection)!;
  return '--sp-' + (c.cssPrefix ? c.cssPrefix + '-' : '') + key.split('.').slice(1).join('-');
};
function combos(s: TokenSourceV2) {
  const keys = ['primary', 'semantic-color', 'density'];
  const modes = keys.map(k => s.collections.find(c => c.key === k)!.modes.map(m => m.name));
  return modes[0].flatMap(a => modes[1].flatMap(b => modes[2].map(c => ({ [keys[0]]: a, [keys[1]]: b, [keys[2]]: c }))));
}

test('generated CSS resolves every token to the Figma-resolved value for every mode combination on one element', () => {
  const s = production(), rules = parseCSS(renderCSSV2(s));
  for (const assign of combos(s)) {
    const got = computeChain(rules, [assign]);
    for (const t of s.tokens) assert.equal(got.get(cssVar(s, t.key)), literal(s, t.key, assign), `${t.key} @ ${JSON.stringify(assign)}`);
  }
});

test('a nested density override re-resolves component tokens in its subtree', () => {
  const s = production(), rules = parseCSS(renderCSSV2(s)), deps = modeDependencies(s);
  const outer = { primary: 'Blue', 'semantic-color': 'Dark', density: 'Relaxed' };
  const got = computeChain(rules, [outer, { density: 'Compact' }]);
  assert.equal(got.get('--sp-button-height-base'), '32px');
  assert.equal(got.get('--sp-button-outer-padding-x-base'), '6px');
  for (const t of s.tokens) {
    const d = deps.get(t.key)!;
    if (d.length > 1 || (d.length === 1 && d[0] !== 'density' && d[0] !== 'semantic-color')) continue;
    // Single-collection dependents follow the nearest ancestor that sets their collection.
    const expected = literal(s, t.key, { ...outer, density: 'Compact' });
    assert.equal(got.get(cssVar(s, t.key)), expected, t.key);
  }
});

test('nested Semantic Color overrides re-resolve semantic tokens and keep the outer density', () => {
  const s = production(), rules = parseCSS(renderCSSV2(s)), deps = modeDependencies(s);
  const outer = { primary: 'Blue', 'semantic-color': 'Light', density: 'Compact' };
  const got = computeChain(rules, [outer, { 'semantic-color': 'Dark' }]);
  for (const t of s.tokens) {
    const d = deps.get(t.key)!;
    if (d.length > 1) continue;
    assert.equal(got.get(cssVar(s, t.key)), literal(s, t.key, { ...outer, 'semantic-color': 'Dark' }), t.key);
  }
});

test('CSS generation is deterministic and keeps default modes on :root', () => {
  const s = production(), css = renderCSSV2(s);
  assert.equal(css, renderCSSV2(clone(s)));
  assert.match(css, /:root,\n\[data-sp-mode-density="Relaxed"\] \{[^}]*--sp-density-control-height-base: 40px;/);
  const compact = css.match(/\[data-sp-mode-density="Compact"\] \{([^}]*)\}/)![1];
  assert.match(compact, /--sp-density-control-height-base: 32px;/);
  assert.match(compact, /--sp-button-height-base: var\(--sp-density-control-height-base\);/);
  assert.match(css, /--sp-opacity-disabled: var\(--sp-prim-opacity-50\);/);
  assert.match(css, /--sp-prim-opacity-50: 50%;/);
});

// ---- Failures must be explicit ----

const failing = (mutate: (ex: FigmaExport) => void, pattern: RegExp) => {
  const ex = clone(snapshot());
  mutate(ex);
  assert.throws(() => importFigmaExport(ex), pattern);
};
const variable = (ex: FigmaExport, name: string) => ex.collections.flatMap(c => c.variables).find(v => v.name === name)!;

test('import fails on unresolved aliases', () => failing(ex => { variable(ex, 'button/height/sm').values = [{ a: '999:999' }]; }, /Unresolved alias in component\.button\.height\.sm\/Value/));
test('import fails on alias type mismatches', () => failing(ex => { variable(ex, 'button/height/sm').values = [{ a: '6:72' }]; }, /type mismatch/));
test('import fails on alias cycles', () => failing(ex => { variable(ex, 'button/height/base').values = [{ a: '10:7' }]; }, /cycle/));
test('import fails on unmapped collections', () => failing(ex => { ex.collections[0].name = '07 Mystery'; }, /Unmapped Figma collection "07 Mystery"/));
test('import fails on unsupported value shapes', () => failing(ex => { variable(ex, 'badge/gap').values = [{ nope: 1 } as never]; }, /Unsupported value shape at component\.badge\.gap\/Value/));
test('import fails on non-finite numbers', () => failing(ex => { variable(ex, 'badge/gap').values = [Infinity]; }, /Non-finite/));
test('import fails when a variable lacks a value for a mode', () => failing(ex => { variable(ex, 'density/control/gap').values = [8]; }, /1 values for 2 modes/));
test('import fails on FLOAT families without a unit rule', () => failing(ex => { variable(ex, 'badge/gap').name = 'mystery/gap'; }, /No unit rule for FLOAT token "mystery\/gap"/));
test('import fails on CSS name collisions', () => failing(ex => { variable(ex, 'badge/padding-y').name = 'badge/padding-x'; }, /collision|Token keys must be unique/));
test('import fails when an alpha opacity does not reference a percent token', () => failing(ex => {
  const v = variable(ex, 'color/danger/subtle/default');
  v.values[0] = { color: { type: 'VARIABLE_ALIAS', id: 'VariableID:5:9' }, opacity: { type: 'VARIABLE_ALIAS', id: 'VariableID:53:5' } };
}, /must reference a percent token/));
test('import fails on colors outside 0 to 1', () => failing(ex => { variable(ex, 'dialog/backdrop/default').values = [[2, 0, 0, 1]]; }, /Invalid color/));

test('validation rejects hand-edited source files with the same explicit errors', () => {
  const edit = (f: (s: TokenSourceV2) => void) => { const s = clone(production()); f(s); return () => validateTokensV2(s); };
  const token = (s: TokenSourceV2, key: string) => s.tokens.find(t => t.key === key)!;
  assert.throws(edit(s => { token(s, 'component.button.height.sm').values.Value = { alias: 'density.missing' }; }), /Unresolved alias/);
  assert.throws(edit(s => { delete token(s, 'density.density.control.gap').values.Compact; }), /cover exactly the modes/);
  assert.throws(edit(s => { token(s, 'component.badge.gap').unit = 'percent'; token(s, 'component.badge.padding-x').values.Value = { alias: 'component.badge.gap' }; }), /unit mismatch/);
  assert.throws(edit(s => { s.schema = 'spartant.tokens.v1' as never; }), /spartant\.tokens\.v2/);
});

test('drift diff reports added, removed, renamed, changed variables and mode changes', () => {
  const next = clone(snapshot());
  assert.equal(hasDrift(diffExports(snapshot(), next)), false);
  const density = next.collections.find(c => c.name === '06 Density')!;
  density.variables.find(v => v.name === 'density/control/height/base')!.values = [44, 32];
  density.variables.find(v => v.name === 'density/control/gap')!.name = 'density/control/spacing';
  density.variables.pop();
  density.modes.push({ id: '53:9', name: 'Spacious' });
  next.collections.find(c => c.name === '05 Component')!.variables.push({ id: '10:999', key: 'k', name: 'chip/height', type: 'FLOAT', values: [28] });
  const d = diffExports(snapshot(), next);
  assert.equal(d.changed.length, 1);
  assert.match(d.changed[0], /density\/control\/height\/base: \[40,32\] -> \[44,32\]/);
  assert.deepEqual(d.renamed, ['06 Density / density/control/gap -> density/control/spacing']);
  assert.deepEqual(d.added, ['05 Component / chip/height']);
  assert.equal(d.removed.length, 1);
  assert.match(d.modes[0], /modes changed in 06 Density/);
});

test('assembling saved Figma outputs verifies every line against its hash', async () => {
  const { assemble, fnv } = await import('../scripts/assemble-figma-export');
  const head = JSON.stringify({ collection: { id: '1:1', key: 'k', name: '05 Component', modes: [{ id: '1:2', name: 'Value' }] } });
  const row = (n: number) => JSON.stringify({ id: `1:${n}`, key: `k${n}`, name: `badge/gap${n}`, type: 'FLOAT', values: [n] });
  const out = (lines: string[], total?: number) => (total ? `total=${total}\n` : '') + lines.join('\n') + '\n#HASHES ' + lines.map(fnv).join(',');
  const info = { key: 'F', name: 'Spartan DS' };
  const result = assemble([{ name: 'a.txt', text: out([head, row(3)], 2) }, { name: 'b.txt', text: out([row(4)], 2) }], info, '2026-01-01');
  assert.deepEqual(result.collections[0].variables.map(v => v.id), ['1:3', '1:4']);
  const corrupt = out([head, row(3)], 2).replace('"badge/gap3"', '"badge/gap9"');
  assert.throws(() => assemble([{ name: 'a.txt', text: corrupt }], info, '2026-01-01'), /does not match its hash/);
  assert.throws(() => assemble([{ name: 'a.txt', text: out([head, row(3)], 2) }], info, '2026-01-01'), /expected 2 variables, assembled 1/);
  assert.throws(() => assemble([{ name: 'a.txt', text: head }], info, '2026-01-01'), /missing #HASHES/);
});
