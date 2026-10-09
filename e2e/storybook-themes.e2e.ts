// The Storybook controls end to end: Style, Theme, High contrast, Hue, and Density, through the
// real toolbar and through shared URLs, on canvases and Docs previews. Each setting is independent,
// keyboard accessible, and composes with the others.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Browser, Page } from 'playwright-core';
import type { Server } from 'node:http';
import { assignmentFromAttributes, resolvedCss, tokenCssName, type TokenSourceV2 } from '../lib/figma-tokens';
import { canon, close, expectedColor, launch, parseColor, startServer } from './harness';

const source: TokenSourceV2 = JSON.parse(readFileSync('tokens/source.json', 'utf8'));
const STYLES = ['Atlas', 'Selene', 'Helios', 'Ares'];
const KEYS = ['style', 'color-scheme', 'contrast', 'primary', 'density'] as const;
type Settings = { style: string; 'color-scheme': string; contrast: string; primary: string; density: string };
const DEFAULTS: Settings = { style: 'Atlas', 'color-scheme': 'Light', contrast: 'Normal', primary: 'Blue', density: 'Relaxed' };

let server: Server, browser: Browser, base: string;
before(async () => { ({ server, base } = await startServer()); browser = await launch(); });
after(async () => { await browser.close(); server.close(); });

const preview = (page: Page) => page.frameLocator('#storybook-preview-iframe');
const settingsOf = (page: Page): Promise<Settings> => preview(page).locator('html').evaluate((h, keys) => Object.fromEntries(keys.map(k => [k, h.getAttribute(`data-sp-mode-${k}`)])) as never, [...KEYS]);
// Storybook re-renders the preview after a global changes, so wait for the attributes to settle.
async function expectSettings(page: Page, expected: Settings, message = '') {
  const deadline = Date.now() + 8000;
  let last: Settings = await settingsOf(page);
  while (JSON.stringify(last) !== JSON.stringify(expected) && Date.now() < deadline) { await page.waitForTimeout(100); last = await settingsOf(page); }
  assert.deepEqual(last, expected, message);
}
const toggle = (page: Page) => page.getByRole('switch', { name: 'High contrast' });
const dropdown = (page: Page, label: string) => page.getByRole('button', { name: new RegExp(`${label}: `) });
async function openUi(url: string): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(`${base}/?path=${url}`);
  await toggle(page).waitFor();
  await preview(page).locator('sp-button, sp-icon-button').first().waitFor();
  return page;
}
async function pick(page: Page, label: string, value: string) {
  await dropdown(page, label).click();
  await page.getByRole('option', { name: `${label}: ${value}`, exact: true }).click();
  await page.waitForFunction(([l, v]) => [...document.querySelectorAll('button')].some(b => b.textContent?.trim() === `${l}: ${v}`), [label, value]);
}

describe('Storybook theme controls', () => {
  test('the defaults are Atlas, Light, high contrast off, Blue, and Relaxed, and the toolbar shows each current value', async () => {
    const page = await openUi('/story/components-button--playground');
    assert.deepEqual(await settingsOf(page), DEFAULTS);
    for (const text of ['Style: Atlas', 'Theme: Light', 'Hue: Blue', 'Density: Relaxed']) assert.equal(await dropdown(page, text.split(':')[0]).innerText(), text);
    assert.equal(await toggle(page).innerText(), 'High contrast: Off');
    assert.equal(await toggle(page).getAttribute('aria-checked'), 'false');
    await page.close();
  });

  test('high contrast is a toggle button, not a theme value: the Theme dropdown offers only Light and Dark', async () => {
    const page = await openUi('/story/components-button--playground');
    await dropdown(page, 'Theme').click();
    assert.deepEqual(await page.getByRole('listbox').filter({ hasText: 'Theme: Light' }).getByRole('option').allInnerTexts(), ['Theme: Light', 'Theme: Dark']);
    await page.keyboard.press('Escape');
    await page.close();
  });

  test('each control changes only its own setting, and switching high contrast off restores normal contrast', async () => {
    const page = await openUi('/story/components-button--playground');
    let expected: Settings = { ...DEFAULTS };
    const check = async (change: Partial<Settings>) => { expected = { ...expected, ...change }; await expectSettings(page, expected); };
    await pick(page, 'Hue', 'Purple'); await check({ primary: 'Purple' });
    await pick(page, 'Density', 'Compact'); await check({ density: 'Compact' });
    await pick(page, 'Style', 'Helios'); await check({ style: 'Helios' });
    await pick(page, 'Theme', 'Dark'); await check({ 'color-scheme': 'Dark' });
    await toggle(page).click(); await check({ contrast: 'High' });
    assert.equal(await toggle(page).getAttribute('aria-checked'), 'true');
    assert.equal(await toggle(page).innerText(), 'High contrast: On');
    await pick(page, 'Style', 'Ares'); await check({ style: 'Ares' });
    await pick(page, 'Theme', 'Light'); await check({ 'color-scheme': 'Light' });
    await expectSettings(page, { ...expected, contrast: 'High' }, 'high contrast survives style and theme changes');
    await toggle(page).click(); await check({ contrast: 'Normal' });
    assert.equal(await toggle(page).getAttribute('aria-checked'), 'false');
    await page.close();
  });

  test('the controls work from the keyboard and expose their state', async () => {
    const page = await openUi('/story/components-button--playground');
    await toggle(page).focus();
    assert.match(await page.locator('body').ariaSnapshot(), /switch "High contrast"/);
    await page.keyboard.press('Space');
    await expectSettings(page, { ...DEFAULTS, contrast: 'High' });
    assert.equal(await toggle(page).getAttribute('aria-checked'), 'true');
    await page.keyboard.press('Enter');
    await expectSettings(page, DEFAULTS);
    assert.equal(await toggle(page).getAttribute('aria-checked'), 'false');
    // A dropdown opens from the keyboard and an option is chosen from the keyboard.
    await dropdown(page, 'Style').focus();
    await page.keyboard.press('Enter');
    const option = page.getByRole('option', { name: 'Style: Selene', exact: true });
    await option.waitFor();
    await option.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent?.trim() === 'Style: Selene'));
    await expectSettings(page, { ...DEFAULTS, style: 'Selene' });
    await page.close();
  });

  test('selections stay when navigating to another story and are reproducible from the URL', async () => {
    const page = await openUi('/story/components-button--playground');
    await pick(page, 'Style', 'Helios');
    await pick(page, 'Hue', 'Sky');
    await toggle(page).click();
    await page.waitForFunction(() => decodeURIComponent(location.search).includes('highContrast:!true'));
    const url = new URL(page.url());
    const globals = url.searchParams.get('globals')!;
    for (const part of ['style:Helios', 'hue:Sky', 'highContrast:!true']) assert.ok(globals.includes(part), `${part} is in ${globals}`);
    await page.getByRole('link', { name: 'Icon Button' }).first().click().catch(() => page.getByText('Icon Button', { exact: true }).first().click());
    await page.getByRole('link', { name: 'Variants' }).last().click();
    await preview(page).locator('sp-icon-button').first().waitFor();
    await expectSettings(page, { ...DEFAULTS, style: 'Helios', primary: 'Sky', contrast: 'High' }, 'the settings survive navigating to another story');
    // Opening that exact link in a new browser session gives the same settings and labels.
    const copy = await openUi(`/story/components-button--playground&globals=${globals}`);
    assert.deepEqual(await settingsOf(copy), { ...DEFAULTS, style: 'Helios', primary: 'Sky', contrast: 'High' });
    assert.equal(await dropdown(copy, 'Style').innerText(), 'Style: Helios');
    assert.equal(await toggle(copy).innerText(), 'High contrast: On');
    await copy.close();
    await page.close();
  });

  test('a link from before the split, with a combined theme value, still opens in that theme with high contrast on', async () => {
    const page = await browser.newPage();
    await page.goto(`${base}/iframe.html?id=components-button--playground&viewMode=story&globals=theme:${encodeURIComponent('Dark High Contrast')}`);
    await page.waitForFunction(() => document.body.classList.contains('sb-show-main'));
    const attrs = await page.evaluate(() => ['color-scheme', 'contrast'].map(k => document.documentElement.getAttribute(`data-sp-mode-${k}`)));
    assert.deepEqual(attrs, ['Dark', 'High']);
    await page.close();
  });

  test('Docs previews use the same settings as the canvas', async () => {
    const page = await openUi('/docs/components-button--docs&globals=style:Ares;theme:Dark;highContrast:!true;hue:Orange;density:Compact');
    const attrs = { ...DEFAULTS, style: 'Ares', 'color-scheme': 'Dark', contrast: 'High', primary: 'Orange', density: 'Compact' };
    assert.deepEqual(await settingsOf(page), attrs);
    const docsBackground = await preview(page).locator('.docs-story').first().evaluate(e => getComputedStyle(e).backgroundColor);
    assert.ok(close(parseColor(docsBackground), expectedColor(source, 'semantic-color.color.background.default', assignmentFromAttributes(source, attrs))), `docs story background ${docsBackground}`);
    const button = preview(page).locator('.docs-story sp-button').first();
    const bg = await button.evaluate(el => getComputedStyle(el.shadowRoot!.querySelector('button')!).backgroundColor);
    assert.ok(close(parseColor(bg), expectedColor(source, 'semantic-color.color.primary.default', assignmentFromAttributes(source, attrs))), `docs button ${bg}`);
    assert.equal(await button.evaluate(el => getComputedStyle(el.shadowRoot!.querySelector('button')!).height), '32px', 'Compact density in the Docs preview');
    await page.close();
  });
});

describe('all 16 style, color scheme, and contrast combinations', () => {
  test('resolved tokens and visible Button output match the intended semantic modes for every combination', async () => {
    const page = await browser.newPage();
    const names = source.tokens.map(t => tokenCssName(t, source));
    let combos = 0;
    for (const style of STYLES) for (const scheme of ['Light', 'Dark']) for (const high of [false, true]) {
      const attrs = { ...DEFAULTS, style, 'color-scheme': scheme, contrast: high ? 'High' : 'Normal', primary: 'Purple' };
      await page.goto(`${base}/iframe.html?id=components-button--variants&viewMode=story&globals=style:${style};theme:${scheme};highContrast:!${high};hue:Purple`);
      await page.waitForFunction(() => document.body.classList.contains('sb-show-main') && document.querySelector('sp-button'));
      assert.deepEqual(await page.evaluate(keys => Object.fromEntries(keys.map(k => [k, document.documentElement.getAttribute(`data-sp-mode-${k}`)])), [...KEYS]), attrs);
      // Every token, resolved by the browser, against the Figma semantic modes.
      const assign = assignmentFromAttributes(source, attrs);
      const got = await page.evaluate(names => { const cs = getComputedStyle(document.documentElement); return Object.fromEntries(names.map(n => [n, cs.getPropertyValue(n)])); }, names);
      const wrong = source.tokens.filter(t => canon(got[tokenCssName(t, source)]) !== canon(resolvedCss(source, t.key, assign))).map(t => t.key);
      assert.deepEqual(wrong.slice(0, 3), [], `${JSON.stringify(attrs)} tokens`);
      // Visible output: Primary and Secondary fills (the style button tokens, which Selene changes for Secondary), Dashed border weight, and focus ring color.
      // Anonymous callbacks only: a named helper would pull tsx's __name shim into the page.
      const visible = await page.evaluate(() => {
        const read = ['primary', 'secondary', 'dashed'].map(v => getComputedStyle(document.querySelector(`sp-button[variant=${v}]`)!.shadowRoot!.querySelector('button')!));
        return { primary: read[0].backgroundColor, secondary: read[1].backgroundColor, dashed: read[2].borderTopWidth, text: read[0].color };
      });
      assert.ok(close(parseColor(visible.primary), expectedColor(source, 'style.style.button.primary.background.default', assign)), `primary fill ${JSON.stringify(attrs)}`);
      assert.ok(close(parseColor(visible.secondary), expectedColor(source, 'style.style.button.secondary.background.default', assign)), `secondary fill ${JSON.stringify(attrs)}`);
      assert.ok(close(parseColor(visible.text), expectedColor(source, 'style.style.button.primary.foreground.default', assign)), `primary text ${JSON.stringify(attrs)}`);
      assert.equal(visible.dashed, high ? '2px' : '1px', `dashed border width, high contrast ${high}`);
      // Focus stays visible in every combination: a real Tab lands on the first button and draws the
      // 2 px ring (the ::after of the inner button) in the focus-ring color of that style, scheme, and contrast.
      await page.keyboard.press('Tab');
      const ring = await page.evaluate(() => {
        const inner = (document.activeElement as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot.activeElement!;
        const cs = getComputedStyle(inner, '::after');
        return { style: cs.borderTopStyle, width: cs.borderTopWidth, color: cs.borderTopColor, matches: inner.matches(':focus-visible') };
      });
      assert.deepEqual([ring.style, ring.width, ring.matches], ['solid', '2px', true], `focus ring ${JSON.stringify(attrs)}`);
      assert.ok(close(parseColor(ring.color), expectedColor(source, 'semantic-color.color.focus-ring.default', assign)), `focus ring color ${ring.color} ${JSON.stringify(attrs)}`);
      combos++;
    }
    assert.equal(combos, 16);
    await page.close();
  });
});
