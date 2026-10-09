import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { importFigmaExport, renderCSSV2, tokenCssName, type FigmaExport } from '../lib/figma-tokens';

const require = createRequire(import.meta.url);
const source = () => importFigmaExport(JSON.parse(readFileSync('tokens/figma/spartan-ds.export.json', 'utf8')) as FigmaExport);
const read = (p: string) => readFileSync(new URL(`../packages/components/src/components/${p}`, import.meta.url), 'utf8');

test('package exports resolve to built JavaScript, types, and the generated token CSS', () => {
  const pkg = JSON.parse(readFileSync(require.resolve('@spartant/components/package.json'), 'utf8'));
  for (const [entry, target] of Object.entries<any>(pkg.exports)) {
    if (typeof target === 'object') {
      assert.ok(require.resolve(`@spartant/components${entry.slice(1)}`), entry);
      readFileSync(new URL(target.types, new URL('../packages/components/', import.meta.url)));
    }
  }
  assert.equal(readFileSync(require.resolve('@spartant/components/tokens.css'), 'utf8'), renderCSSV2(source()));
});

test('consumer import registers both elements once and keeps their public properties', async () => {
  const { SpButton, SpIconButton } = await import('@spartant/components');
  await import('@spartant/components/button');
  await import('@spartant/components/icon-button');
  assert.equal(customElements.get('sp-button'), SpButton);
  assert.equal(customElements.get('sp-icon-button'), SpIconButton);
  assert.equal(SpButton.formAssociated, true);
  assert.deepEqual(Object.keys(SpButton.properties), ['variant', 'type', 'disabled', 'name', 'value', 'size', 'shape', 'loading']);
  assert.deepEqual(Object.keys(SpIconButton.properties), ['variant', 'type', 'disabled', 'name', 'value', 'size', 'label']);
});

test('component styles only reference variables the token build emits', () => {
  const s = source();
  const emitted = new Set(s.tokens.map(t => tokenCssName(t, s)));
  for (const file of ['shared/action.styles.ts', 'button/sp-button.styles.ts', 'icon-button/sp-icon-button.styles.ts']) {
    for (const name of new Set(read(file).match(/--sp-[a-z0-9-]+/g) ?? [])) assert.ok(emitted.has(name), `${file} uses ${name}, which no token produces`);
  }
});

test('component styles contain no hard-coded colors, sizes, or radii outside the spinner dimensions and focus ring', () => {
  for (const file of ['shared/action.styles.ts', 'button/sp-button.styles.ts', 'icon-button/sp-icon-button.styles.ts']) {
    const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(/i, `${file} has a literal color`);
    for (const m of css.matchAll(/(width|height|padding[a-z-]*|border-radius|font-size|line-height|gap|min-width):\s*([^;]+);/g)) {
      const value = m[2].trim();
      assert.ok(!/^\d/.test(value) || /^(0|100%|1|2px|8px|12px|16px|1\.25px)(?![\w.])/.test(value), `${file}: ${m[0]}`);
    }
  }
});

test('stories exist for every variant, size, and state in the Figma sets', () => {
  const button = read('button/sp-button.stories.ts');
  for (const v of ['primary', 'secondary', 'danger', 'ghost', 'dashed', 'danger-subtle', 'warning']) assert.match(button, new RegExp(`'${v}'`));
  for (const story of ['Variants', 'Sizes', 'Shapes', 'WithIcons', 'Disabled', 'Loading', 'Density', 'InForm']) assert.match(button, new RegExp(`export const ${story}\\b`));
  const icon = read('icon-button/sp-icon-button.stories.ts');
  for (const s of ['xs', 'sm', 'base']) assert.match(icon, new RegExp(`'${s}'`));
  assert.deepEqual(readdirSync(new URL('../packages/components/src/components', import.meta.url)).sort(), ['button', 'icon-button', 'shared']);
});
