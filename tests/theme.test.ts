import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COLOR_SCHEMES, DENSITIES, HUES, STYLES, THEME_ATTRIBUTES, applyTheme, fromLegacyTheme, readTheme } from '../packages/components/src/theme';
import type { TokenSourceV2 } from '../lib/figma-tokens';

const source: TokenSourceV2 = JSON.parse(readFileSync('tokens/source.json', 'utf8'));
// A stand-in element: the API only needs three attribute methods.
const element = () => {
  const attrs = new Map<string, string>();
  return { attrs, setAttribute: (k: string, v: string) => void attrs.set(k, v), removeAttribute: (k: string) => void attrs.delete(k), getAttribute: (k: string) => attrs.get(k) ?? null };
};

test('the theme constants and attribute names come from the generated token source', () => {
  const collection = (key: string) => source.collections.find(c => c.key === key)!;
  assert.deepEqual([...STYLES], collection('style').modes.map(m => m.name));
  assert.deepEqual([...HUES], collection('primary').modes.map(m => m.name));
  assert.deepEqual([...DENSITIES], collection('density').modes.map(m => m.name));
  const semantic = collection('semantic-color');
  const axis = (key: string) => semantic.axes!.find(a => a.key === key)!;
  assert.deepEqual([...COLOR_SCHEMES], axis('color-scheme').values);
  assert.deepEqual(axis('contrast').values, ['Normal', 'High']);
  assert.deepEqual(THEME_ATTRIBUTES, {
    style: 'data-sp-mode-style',
    colorScheme: 'data-sp-mode-color-scheme',
    contrast: 'data-sp-mode-contrast',
    hue: 'data-sp-mode-primary',
    density: 'data-sp-mode-density',
  });
  // High contrast is not a color scheme value anywhere in the public types or constants.
  assert.ok(![...COLOR_SCHEMES, ...STYLES, ...HUES, ...DENSITIES].some(v => /contrast/i.test(v)));
});

test('settings are independent: changing one leaves the others, and high contrast switches off again', () => {
  const el = element();
  applyTheme(el, { style: 'Helios', colorScheme: 'Dark', hue: 'Purple', density: 'Compact', highContrast: true });
  assert.deepEqual(readTheme(el), { style: 'Helios', colorScheme: 'Dark', highContrast: true, hue: 'Purple', density: 'Compact' });
  applyTheme(el, { highContrast: false });
  assert.deepEqual(readTheme(el), { style: 'Helios', colorScheme: 'Dark', highContrast: false, hue: 'Purple', density: 'Compact' });
  applyTheme(el, { colorScheme: 'Light' });
  assert.equal(el.attrs.get('data-sp-mode-contrast'), 'Normal');
  assert.equal(el.attrs.get('data-sp-mode-style'), 'Helios');
  applyTheme(el, { style: 'Ares', highContrast: true });
  assert.deepEqual(readTheme(el), { style: 'Ares', colorScheme: 'Light', highContrast: true, hue: 'Purple', density: 'Compact' });
});

test('null removes a setting so it inherits again, and an untouched field is never written', () => {
  const el = element();
  applyTheme(el, { style: 'Selene', highContrast: true });
  applyTheme(el, { highContrast: null });
  assert.deepEqual(readTheme(el), { style: 'Selene' });
  assert.equal(el.attrs.has('data-sp-mode-color-scheme'), false);
  applyTheme(el, {});
  assert.deepEqual(readTheme(el), { style: 'Selene' });
});

test('invalid values fail explicitly and change nothing', () => {
  const el = element();
  applyTheme(el, { style: 'Atlas', colorScheme: 'Light' });
  assert.throws(() => applyTheme(el, { colorScheme: 'Dark High Contrast' as never }), /Invalid color scheme "Dark High Contrast"/);
  assert.throws(() => applyTheme(el, { style: 'Helios', hue: 'Green' as never }), /Invalid hue "Green"/);
  assert.throws(() => applyTheme(el, { highContrast: 'yes' as never }), /Invalid highContrast/);
  assert.deepEqual(readTheme(el), { style: 'Atlas', colorScheme: 'Light' }, 'the partial call applied nothing');
  el.setAttribute('data-sp-mode-density', 'Cozy');
  assert.throws(() => readTheme(el), /Invalid density "Cozy"/);
});

test('legacy combined theme values migrate to a color scheme and a contrast flag', () => {
  assert.deepEqual(fromLegacyTheme('Light'), { colorScheme: 'Light', highContrast: false });
  assert.deepEqual(fromLegacyTheme('Dark'), { colorScheme: 'Dark', highContrast: false });
  assert.deepEqual(fromLegacyTheme('Light High Contrast'), { colorScheme: 'Light', highContrast: true });
  assert.deepEqual(fromLegacyTheme('Dark High Contrast'), { colorScheme: 'Dark', highContrast: true });
  assert.throws(() => fromLegacyTheme('Sepia'), /Unknown legacy theme "Sepia"/);
  // Every combined Figma mode is covered exactly, so no source mode is left without a migration.
  const modes = source.collections.find(c => c.key === 'semantic-color')!.modes.map(m => m.name);
  for (const mode of modes) assert.doesNotThrow(() => fromLegacyTheme(mode));
});
