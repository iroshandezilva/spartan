// Chromium's own CSS cascade against the token resolver: every generated custom property,
// in every combination of style, hue, theme, and density, plus nested mode overrides.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Browser } from 'playwright-core';
import type { Server } from 'node:http';
import { modeDependencies, resolvedCss, tokenCssName, type TokenSourceV2 } from '../lib/figma-tokens';
import { launch, openCanvas, startServer } from './harness';

const source: TokenSourceV2 = JSON.parse(readFileSync('tokens/source.json', 'utf8'));
const deps = modeDependencies(source);
// Chromium serializes colors in custom properties as hex while the generator writes rgb(), so
// both sides are compared as eight-digit hex.
const hex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g;
export const canon = (s: string) => s.replace(/\s+/g, ' ').trim().replace(COLOR, c => {
  if (c.startsWith('#')) {
    const d = c.slice(1);
    const full = d.length <= 4 ? [...d].map(x => x + x).join('') : d;
    return '#' + full.padEnd(8, 'f').toLowerCase();
  }
  const n = (c.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  return '#' + hex(n[0]) + hex(n[1]) + hex(n[2]) + hex((n[3] ?? 1) * 255);
});
const norm = canon;
const names = new Map(source.tokens.map(t => [t.key, tokenCssName(t, source)]));
const modes = (key: string) => source.collections.find(c => c.key === key)!.modes.map(m => m.name);
const STYLES = modes('style'), HUES = modes('primary'), THEMES = modes('semantic-color'), DENSITIES = modes('density');

let server: Server, browser: Browser, base: string;
before(async () => { ({ server, base } = await startServer()); browser = await launch(); });
after(async () => { await browser.close(); server.close(); });

describe('generated token CSS in Chromium', () => {
  test('every token resolves to the Figma value for all 128 style, hue, theme, and density combinations', async () => {
    const page = await openCanvas(browser, base);
    let checked = 0;
    for (const style of STYLES) for (const primary of HUES) for (const theme of THEMES) for (const density of DENSITIES) {
      const assign = { style, primary, 'semantic-color': theme, density };
      const expected = Object.fromEntries(source.tokens.map(t => [names.get(t.key)!, canon(resolvedCss(source, t.key, assign))]));
      const actual = await page.evaluate(({ assign, names }) => {
        const root = document.documentElement;
        for (const [k, v] of Object.entries(assign)) root.setAttribute(`data-sp-mode-${k}`, v);
        const cs = getComputedStyle(root);
        return Object.fromEntries(names.map(name => [name, cs.getPropertyValue(name)]));
      }, { assign, names: Object.keys(expected) });
      const wrong = Object.entries(expected).filter(([name, value]) => canon(actual[name]) !== value).map(([name, value]) => `${name}: got "${actual[name].trim()}" want "${value}"`);
      assert.deepEqual(wrong.slice(0, 3), [], `${JSON.stringify(assign)}: ${wrong.length} wrong`);
      checked += source.tokens.length;
    }
    assert.equal(checked, 547 * 128);
    await page.close();
  });

  test('the style radius follows the Style Modes document: Atlas 8, Selene 12, Helios pill, Ares 0', async () => {
    const page = await openCanvas(browser, base);
    const radius = (style?: string) => page.evaluate(style => {
      const root = document.documentElement;
      if (style) root.setAttribute('data-sp-mode-style', style); else root.removeAttribute('data-sp-mode-style');
      return getComputedStyle(root).getPropertyValue('--sp-style-button-radius').trim();
    }, style);
    assert.equal(await radius(), '8px', 'no attribute means Atlas');
    assert.deepEqual([await radius('Atlas'), await radius('Selene'), await radius('Helios'), await radius('Ares')], ['8px', '12px', '9999px', '0px']);
    await page.close();
  });

  test('nested style, theme, and density overrides re-resolve inside their subtree and leave the parent alone', async () => {
    const page = await openCanvas(browser, base);
    const outer = { style: 'Atlas', primary: 'Orange', 'semantic-color': 'Dark', density: 'Compact' };
    const result = await page.evaluate(outer => {
      const root = document.documentElement;
      for (const [k, v] of Object.entries(outer)) root.setAttribute(`data-sp-mode-${k}`, v);
      const host = document.getElementById('storybook-root')!;
      host.innerHTML = '<div id="a" data-sp-mode-style="Helios"><div id="b" data-sp-mode-density="Relaxed"><p id="c">x</p></div></div><div id="d" data-sp-mode-semantic-color="Light"><p id="e">x</p></div>';
      // Anonymous callbacks only: a named helper would pull tsx's __name shim into the page.
      const probes: [string, string, string][] = [
        ['parentRadius', 'root', '--sp-style-button-radius'], ['aRadius', 'a', '--sp-style-button-radius'], ['cRadius', 'c', '--sp-style-button-radius'],
        ['cHeight', 'c', '--sp-button-height-base'], ['aHeight', 'a', '--sp-button-height-base'],
        ['eBackground', 'e', '--sp-color-background-default'], ['parentBackground', 'root', '--sp-color-background-default'], ['eRadius', 'e', '--sp-style-button-radius'],
      ];
      return Object.fromEntries(probes.map(p => [p[0], getComputedStyle(p[1] === 'root' ? root : document.getElementById(p[1])!).getPropertyValue(p[2]).trim()]));
    }, outer);
    const css = (key: string, assign: Record<string, string>) => canon(resolvedCss(source, key, assign));
    assert.equal(canon(result.parentRadius), css('style.style.button.radius', { style: 'Atlas' }));
    assert.equal(result.aRadius, '9999px');
    assert.equal(result.cRadius, '9999px', 'a deeper density change keeps the Helios style');
    assert.equal(result.aHeight, '32px', 'Compact until a deeper override');
    assert.equal(result.cHeight, '40px', 'the nested Relaxed density applies');
    assert.equal(canon(result.eBackground), css('semantic-color.color.background.default', { 'semantic-color': 'Light' }));
    assert.notEqual(canon(result.eBackground), canon(result.parentBackground));
    assert.equal(result.eRadius, '8px', 'a theme override leaves the style alone');
    await page.close();
  });

  test('the three-collection token re-resolves on one element for every style, hue, and theme', async () => {
    assert.deepEqual(deps.get('style.style.field.border.hover'), ['primary', 'semantic-color', 'style']);
    const page = await openCanvas(browser, base);
    for (const style of STYLES) for (const primary of HUES) for (const theme of THEMES) {
      const assign = { style, primary, 'semantic-color': theme };
      const got = await page.evaluate(assign => {
        const root = document.documentElement;
        for (const [k, v] of Object.entries(assign)) root.setAttribute(`data-sp-mode-${k}`, v);
        return getComputedStyle(root).getPropertyValue('--sp-style-field-border-hover').replace(/\s+/g, ' ').trim();
      }, assign);
      assert.equal(canon(got), canon(resolvedCss(source, 'style.style.field.border.hover', assign)), JSON.stringify(assign));
    }
    await page.close();
  });
});
