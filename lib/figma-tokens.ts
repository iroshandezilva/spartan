// Production token pipeline: a verified export of the Spartan DS Figma variables
// becomes `spartan.tokens.v2` (tokens/source.json), then mode-aware CSS.
// Unlike v1 (lib/token-contract.ts, kept for the plugin and its fixture), v2 allows
// aliases across collections and resolves them per mode.

export type Unit = 'px' | 'percent';
export type Rgba = { r: number; g: number; b: number; a: number };
export type Ref = { alias: string };
export type AlphaColor = { alpha: { color: Ref | Rgba; opacity: Ref | number } };
export type ValueV2 = number | string | boolean | Rgba | Ref | AlphaColor;
export type TokenType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
export type TokenV2 = {
  key: string;
  name: string;
  collection: string;
  type: TokenType;
  unit?: Unit;
  figma: { id: string; key: string; codeSyntax?: string };
  values: Record<string, ValueV2>;
};
export type CollectionV2 = {
  key: string;
  name: string;
  cssPrefix: string;
  figma: { id: string; key: string };
  modes: { name: string; figmaId: string }[];
};
export type TokenSourceV2 = {
  schema: 'spartan.tokens.v2';
  version: string;
  source: { figmaFileKey: string; figmaFileName: string; exportedAt: string };
  collections: CollectionV2[];
  tokens: TokenV2[];
};

export type FigmaAlias = { type: 'VARIABLE_ALIAS'; id: string };
export type FigmaValue = number | string | boolean | [number, number, number, number] | { a: string } | { color: FigmaAlias | [number, number, number, number]; opacity: FigmaAlias | number };
export type FigmaVariable = { id: string; key: string; name: string; type: TokenType; css?: string; values: FigmaValue[] };
export type FigmaCollection = { id: string; key: string; name: string; modes: { id: string; name: string }[]; variables: FigmaVariable[] };
export type FigmaExport = {
  schema: 'spartan.figma-export.v1';
  file: { key: string; name: string };
  exportedAt: string;
  collections: FigmaCollection[];
};

// Mapping that needs human review when the Figma library gains a collection.
const COLLECTION_RULES: Record<string, { key: string; cssPrefix: string }> = {
  '01 Primitives': { key: 'primitives', cssPrefix: 'prim' },
  '02 Primary': { key: 'primary', cssPrefix: 'hue' },
  '03 Semantic Color': { key: 'semantic-color', cssPrefix: '' },
  '04 Semantic Foundation': { key: 'semantic-foundation', cssPrefix: '' },
  '05 Component': { key: 'component', cssPrefix: '' },
  '06 Density': { key: 'density', cssPrefix: '' },
  // Figma already names these --sp-style-*, which matches the derived CSS names.
  '07 Style': { key: 'style', cssPrefix: '' },
};

// FLOAT tokens carry no unit in Figma. Literal values get one from their first
// name segment; aliases inherit from their target. A family without a rule fails
// the import so a new family forces a decision instead of defaulting silently.
const PX_FAMILIES = new Set(['style', 'space', 'size', 'radius', 'border-width', 'density', 'contrast', 'badge', 'button', 'dialog', 'field', 'popover', 'selection', 'tooltip', 'avatar', 'switch']);
const UNITLESS_LINE_HEIGHTS = new Set(['normal', 'relaxed', 'snug', 'tight']);

function literalUnit(name: string): Unit | undefined {
  const [first, second, third] = name.split('/');
  if (first === 'opacity') return 'percent';
  if (first === 'font') {
    if (second === 'weight') return undefined;
    if (second === 'size') return 'px';
    if (second === 'line-height') return UNITLESS_LINE_HEIGHTS.has(third) ? undefined : 'px';
    throw new Error(`No unit rule for FLOAT token "${name}".`);
  }
  if (PX_FAMILIES.has(first)) return 'px';
  throw new Error(`No unit rule for FLOAT token "${name}". Add its family to PX_FAMILIES or handle it explicitly.`);
}

const slug = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
const round6 = (n: number) => +n.toFixed(6);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export const isRef = (v: unknown): v is Ref => isObj(v) && typeof v.alias === 'string';
export const isAlpha = (v: unknown): v is AlphaColor => isObj(v) && isObj(v.alpha);
export const isRgba = (v: unknown): v is Rgba => isObj(v) && ['r', 'g', 'b', 'a'].every(k => typeof v[k] === 'number');

export const tokenCssName = (t: TokenV2, s: TokenSourceV2) => {
  const prefix = s.collections.find(c => c.key === t.collection)?.cssPrefix;
  const segs = t.key.split('.').slice(1);
  return '--sp-' + (prefix ? prefix + '-' : '') + segs.join('-');
};

const figmaId = (id: string) => id.replace(/^VariableID:/, '');

export function importFigmaExport(raw: unknown): TokenSourceV2 {
  const ex = raw as FigmaExport;
  if (!ex || ex.schema !== 'spartan.figma-export.v1' || !Array.isArray(ex.collections)) throw new Error('Expected a spartan.figma-export.v1 file.');
  const collections: CollectionV2[] = [];
  const tokens: TokenV2[] = [];
  const byFigmaId = new Map<string, TokenV2>();
  const sorted = [...ex.collections].sort((a, b) => a.name.localeCompare(b.name));
  type Pending = { token: TokenV2; mode: string; v: FigmaValue };
  const pending: Pending[] = [];

  for (const c of sorted) {
    const rule = COLLECTION_RULES[c.name];
    if (!rule) throw new Error(`Unmapped Figma collection "${c.name}". Add it to COLLECTION_RULES.`);
    if (!c.modes.length) throw new Error(`Collection "${c.name}" has no modes.`);
    collections.push({ key: rule.key, name: c.name, cssPrefix: rule.cssPrefix, figma: { id: c.id, key: c.key }, modes: c.modes.map(m => ({ name: m.name, figmaId: m.id })) });
    for (const v of c.variables) {
      if (v.values.length !== c.modes.length) throw new Error(`Variable "${v.name}" has ${v.values.length} values for ${c.modes.length} modes.`);
      const segs = v.name.split('/').map(slug);
      if (segs.some(s => !s)) throw new Error(`Variable name cannot be turned into a key: "${v.name}"`);
      const token: TokenV2 = { key: `${rule.key}.${segs.join('.')}`, name: v.name, collection: rule.key, type: v.type, figma: { id: v.id, key: v.key, ...(v.css ? { codeSyntax: v.css } : {}) }, values: {} };
      if (byFigmaId.has(v.id)) throw new Error(`Duplicate Figma variable id ${v.id}.`);
      byFigmaId.set(v.id, token);
      tokens.push(token);
      c.modes.forEach((m, i) => pending.push({ token, mode: m.name, v: v.values[i] }));
    }
  }

  const refTo = (a: FigmaAlias | { a: string }, from: TokenV2, mode: string): Ref => {
    const id = figmaId('a' in a ? (a as { a: string }).a : (a as FigmaAlias).id);
    const target = byFigmaId.get(id);
    if (!target) throw new Error(`Unresolved alias in ${from.key}/${mode}: Figma variable ${id} is not in the export.`);
    return { alias: target.key };
  };
  const rgba = (v: number[], where: string): Rgba => {
    if (v.length !== 4 || v.some(n => typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1)) throw new Error(`Invalid color at ${where}.`);
    return { r: v[0], g: v[1], b: v[2], a: v[3] };
  };
  for (const { token, mode, v } of pending) {
    const where = `${token.key}/${mode}`;
    let out: ValueV2;
    if (Array.isArray(v)) out = rgba(v, where);
    else if (isObj(v)) {
      const o = v as Record<string, unknown>;
      if (typeof o.a === 'string') out = refTo({ a: o.a }, token, mode);
      else if ('color' in o && 'opacity' in o) {
        const color = Array.isArray(o.color) ? rgba(o.color as number[], where) : refTo(o.color as FigmaAlias, token, mode);
        const opacity = typeof o.opacity === 'number' ? o.opacity : refTo(o.opacity as FigmaAlias, token, mode);
        out = { alpha: { color, opacity } };
      } else throw new Error(`Unsupported value shape at ${where}: ${JSON.stringify(v)}`);
    } else if (typeof v === 'number') {
      if (!Number.isFinite(v)) throw new Error(`Non-finite number at ${where}.`);
      out = round6(v);
    } else if (typeof v === 'string' || typeof v === 'boolean') out = v;
    else throw new Error(`Unsupported value shape at ${where}: ${JSON.stringify(v)}`);
    token.values[mode] = out;
  }

  const source: TokenSourceV2 = {
    schema: 'spartan.tokens.v2',
    version: `figma-${ex.exportedAt}`,
    source: { figmaFileKey: ex.file.key, figmaFileName: ex.file.name, exportedAt: ex.exportedAt },
    collections,
    tokens,
  };
  // Units depend on resolved alias targets, so assign them after the graph exists.
  assignUnits(source);
  return validateTokensV2(source);
}

function assignUnits(s: TokenSourceV2) {
  const byKey = new Map(s.tokens.map(t => [t.key, t]));
  const memo = new Map<string, Unit | undefined>();
  const visiting = new Set<string>();
  const unitOf = (t: TokenV2): Unit | undefined => {
    if (t.type !== 'FLOAT') return undefined;
    if (memo.has(t.key)) return memo.get(t.key);
    if (visiting.has(t.key)) throw new Error(`Alias cycle through ${t.key}.`);
    visiting.add(t.key);
    const units = new Set<Unit | undefined>();
    for (const v of Object.values(t.values)) {
      if (isRef(v)) units.add(unitOf(byKey.get(v.alias)!));
      else if (typeof v === 'number') units.add(literalUnit(t.name));
      else throw new Error(`Unsupported FLOAT value in ${t.key}.`);
    }
    visiting.delete(t.key);
    if (units.size !== 1) throw new Error(`${t.key} mixes units across modes: ${[...units].map(u => u ?? 'none').join(', ')}.`);
    const unit = [...units][0];
    memo.set(t.key, unit);
    return unit;
  };
  for (const t of s.tokens) {
    const unit = unitOf(t);
    if (unit) t.unit = unit;
  }
}

export function validateTokensV2(input: unknown): TokenSourceV2 {
  const s = input as TokenSourceV2;
  if (!s || s.schema !== 'spartan.tokens.v2' || !Array.isArray(s.collections) || !Array.isArray(s.tokens) || typeof s.version !== 'string' || !s.version.trim()) throw new Error('Expected a spartan.tokens.v2 file with a version, collections, and tokens.');
  const collections = new Map<string, CollectionV2>();
  for (const c of s.collections) {
    if (!/^[a-z][a-z0-9-]*$/.test(c.key) || collections.has(c.key)) throw new Error(`Collection keys must be unique slugs: ${c.key}`);
    if (!c.modes.length || new Set(c.modes.map(m => m.name)).size !== c.modes.length || c.modes.some(m => !/^[a-zA-Z][a-zA-Z0-9 -]*$/.test(m.name))) throw new Error(`Collection ${c.key} needs unique mode names.`);
    collections.set(c.key, c);
  }
  const byKey = new Map<string, TokenV2>();
  const cssNames = new Map<string, string>();
  const figmaIds = new Set<string>();
  for (const t of s.tokens) {
    const c = collections.get(t.collection);
    if (!c) throw new Error(`Unknown collection for ${t.key}.`);
    if (!/^[a-z][a-z0-9._-]*$/.test(t.key) || byKey.has(t.key)) throw new Error(`Token keys must be unique: ${t.key}`);
    if (figmaIds.has(t.figma.id)) throw new Error(`Duplicate Figma id ${t.figma.id} on ${t.key}.`);
    figmaIds.add(t.figma.id);
    const css = tokenCssName(t, s);
    if (cssNames.has(css)) throw new Error(`CSS name collision: ${t.key} and ${cssNames.get(css)} both produce ${css}.`);
    cssNames.set(css, t.key);
    if (!['COLOR', 'FLOAT', 'STRING', 'BOOLEAN'].includes(t.type)) throw new Error(`Unsupported type ${t.type} on ${t.key}.`);
    if (t.unit !== undefined && (t.type !== 'FLOAT' || !['px', 'percent'].includes(t.unit))) throw new Error(`Unsupported unit on ${t.key}.`);
    if (Object.keys(t.values).length !== c.modes.length || c.modes.some(m => !(m.name in t.values))) throw new Error(`Values must cover exactly the modes of ${t.collection}: ${t.key}`);
    byKey.set(t.key, t);
  }
  const target = (from: TokenV2, mode: string, r: Ref) => {
    const t = byKey.get(r.alias);
    if (!t) throw new Error(`Unresolved alias ${from.key}/${mode} -> ${r.alias}.`);
    return t;
  };
  for (const t of s.tokens) for (const [mode, v] of Object.entries(t.values)) {
    const where = `${t.key}/${mode}`;
    if (isRef(v)) {
      const to = target(t, mode, v);
      if (to.type !== t.type) throw new Error(`Alias type mismatch ${where} -> ${to.key}: ${t.type} vs ${to.type}.`);
      if (to.unit !== t.unit) throw new Error(`Alias unit mismatch ${where} -> ${to.key}: ${t.unit ?? 'none'} vs ${to.unit ?? 'none'}.`);
    } else if (isAlpha(v)) {
      if (t.type !== 'COLOR') throw new Error(`Alpha color on a non-color token ${where}.`);
      const { color, opacity } = v.alpha;
      if (isRef(color)) { if (target(t, mode, color).type !== 'COLOR') throw new Error(`Alpha color of ${where} must reference a COLOR token.`); }
      else if (!isRgba(color)) throw new Error(`Invalid alpha color in ${where}.`);
      if (isRef(opacity)) { const o = target(t, mode, opacity); if (o.type !== 'FLOAT' || o.unit !== 'percent') throw new Error(`Alpha opacity of ${where} must reference a percent token, got ${o.key}.`); }
      else if (typeof opacity !== 'number' || opacity < 0 || opacity > 100) throw new Error(`Alpha opacity of ${where} must be 0 to 100.`);
    } else if (t.type === 'COLOR') {
      if (!isRgba(v) || [v.r, v.g, v.b, v.a].some(n => n < 0 || n > 1)) throw new Error(`Invalid COLOR value ${where}.`);
    } else if (t.type === 'FLOAT') {
      if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`Invalid FLOAT value ${where}.`);
      if (t.unit === 'percent' && (v < 0 || v > 100)) throw new Error(`Percent value out of range at ${where}.`);
    } else if (t.type === 'STRING' ? typeof v !== 'string' : typeof v !== 'boolean') throw new Error(`Invalid ${t.type} value ${where}.`);
  }
  // Cycle check over the union of every mode's edges: conservative, and mode-independent.
  const edges = (t: TokenV2) => Object.values(t.values).flatMap(v => isRef(v) ? [v.alias] : isAlpha(v) ? [v.alpha.color, v.alpha.opacity].filter(isRef).map(r => r.alias) : []);
  const state = new Map<string, 1 | 2>();
  const visit = (k: string, path: string[]) => {
    if (state.get(k) === 2) return;
    if (state.get(k) === 1) throw new Error(`Alias cycle: ${[...path, k].join(' -> ')}`);
    state.set(k, 1);
    for (const n of edges(byKey.get(k)!)) visit(n, [...path, k]);
    state.set(k, 2);
  };
  for (const t of s.tokens) visit(t.key, []);
  return s;
}

// ---- Resolution ----

const channel = (n: number) => +(n * 255).toFixed(3);

export type Resolved = number | string | boolean | Rgba | { alpha: { color: Rgba; opacity: number } };
export type ModeAssignment = Record<string, string>;

// Resolves a token to a literal for one explicit mode per collection. Collections
// missing from `assign` use their first mode, matching the CSS defaults.
export function resolveToken(input: TokenSourceV2, key: string, assign: ModeAssignment = {}): Resolved {
  const byKey = new Map(input.tokens.map(t => [t.key, t]));
  const colls = new Map(input.collections.map(c => [c.key, c]));
  const walk = (k: string): Resolved => {
    const t = byKey.get(k);
    if (!t) throw new Error(`Unknown token ${k}.`);
    const mode = assign[t.collection] ?? colls.get(t.collection)!.modes[0].name;
    if (!(mode in t.values)) throw new Error(`${t.collection} has no mode "${mode}".`);
    const v = t.values[mode];
    if (isRef(v)) return walk(v.alias);
    if (isAlpha(v)) {
      const color = isRef(v.alpha.color) ? (walk(v.alpha.color.alias) as Rgba) : v.alpha.color;
      const opacity = isRef(v.alpha.opacity) ? (walk(v.alpha.opacity.alias) as number) : v.alpha.opacity;
      return { alpha: { color, opacity } };
    }
    return v;
  };
  return walk(key);
}

/** The CSS text a token resolves to for one mode per collection, as the generated CSS spells it. */
export function resolvedCss(input: TokenSourceV2, key: string, assign: ModeAssignment = {}): string {
  const t = input.tokens.find(x => x.key === key);
  if (!t) throw new Error(`Unknown token ${key}.`);
  const rgb = (c: Rgba) => `rgb(${channel(c.r)} ${channel(c.g)} ${channel(c.b)} / ${c.a})`;
  const v = resolveToken(input, key, assign);
  if (typeof v === 'number') return `${v}${t.unit === 'px' ? 'px' : t.unit === 'percent' ? '%' : ''}`;
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? '1' : '0';
  if ('alpha' in v) return `color-mix(in srgb, ${rgb(v.alpha.color)} ${v.alpha.opacity}%, transparent)`;
  return rgb(v);
}

// ---- CSS ----

const modeSelector = (collection: string, mode: string) => `[data-sp-mode-${collection}="${mode}"]`;

function analyze(s: TokenSourceV2) {
  const byKey = new Map(s.tokens.map(t => [t.key, t]));
  const colls = new Map(s.collections.map(c => [c.key, c]));
  const order = new Map(s.collections.map((c, i) => [c.key, i]));
  const css = (t: TokenV2) => tokenCssName(t, s);
  const rgb = (c: Rgba) => `rgb(${channel(c.r)} ${channel(c.g)} ${channel(c.b)} / ${c.a})`;
  const unitSuffix = (t: TokenV2) => (t.unit === 'px' ? 'px' : t.unit === 'percent' ? '%' : '');

  const expr = (t: TokenV2, mode: string): string => {
    const v = t.values[mode];
    if (isRef(v)) return `var(${css(byKey.get(v.alias)!)})`;
    if (isAlpha(v)) {
      const c = isRef(v.alpha.color) ? `var(${css(byKey.get(v.alpha.color.alias)!)})` : rgb(v.alpha.color);
      const o = isRef(v.alpha.opacity) ? `var(${css(byKey.get(v.alpha.opacity.alias)!)})` : `${v.alpha.opacity}%`;
      return `color-mix(in srgb, ${c} ${o}, transparent)`;
    }
    if (typeof v === 'number') return `${v}${unitSuffix(t)}`;
    if (typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'boolean') return v ? '1' : '0';
    return rgb(v);
  };

  // Which collections' mode selection can change this token's resolved value.
  const depMemo = new Map<string, Set<string>>();
  const deps = (t: TokenV2): Set<string> => {
    const hit = depMemo.get(t.key);
    if (hit) return hit;
    const modes = colls.get(t.collection)!.modes;
    const out = new Set<string>();
    if (new Set(modes.map(m => expr(t, m.name))).size > 1) out.add(t.collection);
    for (const v of Object.values(t.values)) {
      const refs = isRef(v) ? [v] : isAlpha(v) ? [v.alpha.color, v.alpha.opacity].filter(isRef) : [];
      for (const r of refs) for (const d of deps(byKey.get(r.alias)!)) out.add(d);
    }
    depMemo.set(t.key, out);
    return out;
  };
  return { byKey, colls, order, css, rgb, expr, deps };
}

// Collections whose mode can change each token, in collection order.
export function modeDependencies(input: unknown): Map<string, string[]> {
  const s = validateTokensV2(input);
  const { deps, order } = analyze(s);
  return new Map(s.tokens.map(t => [t.key, [...deps(t)].sort((a, b) => order.get(a)! - order.get(b)!)]));
}

export function renderCSSV2(input: unknown): string {
  const s = validateTokensV2(input);
  const { colls, order, css, expr, deps } = analyze(s);

  type Entry = { selectors: string[]; specificity: number; decl: string };
  const entries: Entry[] = [];
  const defaults = (k: string) => colls.get(k)!.modes[0].name;
  for (const t of s.tokens) {
    const D = [...deps(t)].sort((a, b) => order.get(a)! - order.get(b)!);
    const own = t.collection;
    const ownModes = colls.get(own)!.modes;
    const decl = (mode: string) => `  ${css(t)}: ${expr(t, mode)};`;
    if (D.length === 0) { entries.push({ selectors: [':root'], specificity: 0, decl: decl(ownModes[0].name) }); continue; }
    const foreign = D.filter(k => k !== own);
    if (!D.includes(own)) {
      // The value is the same in every own mode; it is only re-declared where a collection
      // it depends on changes mode, so its var() references resolve there.
      for (const k of foreign) for (const m of colls.get(k)!.modes) {
        const sel = modeSelector(k, m.name);
        entries.push({ selectors: k === foreign[0] && m.name === defaults(k) ? [':root', sel] : [sel], specificity: 1, decl: decl(ownModes[0].name) });
      }
      continue;
    }
    if (foreign.length === 0) {
      for (const m of ownModes) {
        const sel = modeSelector(own, m.name);
        entries.push({ selectors: m.name === ownModes[0].name ? [':root', sel] : [sel], specificity: 1, decl: decl(m.name) });
      }
      continue;
    }
    // The value depends on its own collection's mode and on other collections' modes.
    //  - the default value on :root;
    //  - the default value where only a foreign collection sets a mode, so its var()
    //    references re-resolve there;
    //  - each own mode's value, one specificity step higher, so on an element that sets its
    //    own mode and a foreign mode the own mode wins and its var() resolves with both.
    // No combination selectors are needed, so any number of collections can be combined.
    entries.push({ selectors: [':root'], specificity: 0, decl: decl(ownModes[0].name) });
    for (const k of foreign) for (const m of colls.get(k)!.modes) entries.push({ selectors: [modeSelector(k, m.name)], specificity: 1, decl: decl(ownModes[0].name) });
    for (const m of ownModes) entries.push({ selectors: [modeSelector(own, m.name).repeat(2)], specificity: 2, decl: decl(m.name) });
  }

  // Group declarations that share a selector list, lower specificity first.
  const blocks = new Map<string, { specificity: number; decls: string[] }>();
  for (const e of entries) {
    const key = e.selectors.join(',\n');
    const b = blocks.get(key) ?? { specificity: e.specificity, decls: [] };
    b.decls.push(e.decl);
    blocks.set(key, b);
  }
  const ordered = [...blocks.entries()].map(([sel, b], i) => ({ sel, ...b, i })).sort((x, y) => x.specificity - y.specificity || x.i - y.i);
  const header = [
    '/* Generated from tokens/source.json. Do not edit. */',
    '/* Mode attributes: ' + s.collections.map(c => `data-sp-mode-${c.key} = ${c.modes.map(m => m.name).join(' | ')}`).join('; ') + ' */',
    '/* Collections that feed each other (semantic-color <- primary) resolve per element: set their attributes on the same element. */',
  ].join('\n');
  return header + '\n' + ordered.map(b => `${b.sel} {\n${b.decls.join('\n')}\n}`).join('\n\n') + '\n';
}

// ---- Drift ----

export type Drift = { added: string[]; removed: string[]; renamed: string[]; changed: string[]; modes: string[] };
export function diffExports(prev: FigmaExport, next: FigmaExport): Drift {
  const flat = (e: FigmaExport) => new Map(e.collections.flatMap(c => c.variables.map(v => [v.id, { c, v }] as const)));
  const a = flat(prev), b = flat(next);
  const d: Drift = { added: [], removed: [], renamed: [], changed: [], modes: [] };
  const colls = new Map(prev.collections.map(c => [c.id, c]));
  for (const c of next.collections) {
    const p = colls.get(c.id);
    if (!p) { d.modes.push(`collection added: ${c.name}`); continue; }
    if (p.name !== c.name) d.modes.push(`collection renamed: ${p.name} -> ${c.name}`);
    if (JSON.stringify(p.modes) !== JSON.stringify(c.modes)) d.modes.push(`modes changed in ${c.name}: ${p.modes.map(m => m.name)} -> ${c.modes.map(m => m.name)}`);
  }
  for (const c of prev.collections) if (!next.collections.some(n => n.id === c.id)) d.modes.push(`collection removed: ${c.name}`);
  for (const [id, { c, v }] of b) {
    const old = a.get(id);
    if (!old) { d.added.push(`${c.name} / ${v.name}`); continue; }
    if (old.v.name !== v.name) d.renamed.push(`${old.c.name} / ${old.v.name} -> ${v.name}`);
    if (old.v.type !== v.type || JSON.stringify(old.v.values) !== JSON.stringify(v.values)) d.changed.push(`${c.name} / ${v.name}: ${JSON.stringify(old.v.values)} -> ${JSON.stringify(v.values)}`);
  }
  for (const [id, { c, v }] of a) if (!b.has(id)) d.removed.push(`${c.name} / ${v.name}`);
  return d;
}
export const hasDrift = (d: Drift) => Object.values(d).some(l => l.length > 0);
