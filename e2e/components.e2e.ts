// Real-browser checks against the built Storybook: real key presses through
// Playwright's keyboard, computed styles from the generated token CSS, accessible
// names, forms, density, and theme. Run with `pnpm test:e2e`.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Browser, Page } from 'playwright-core';
import type { Server } from 'node:http';
import type { TokenSourceV2 } from '../lib/figma-tokens';
import { close, expectedColor, launch, openCanvas, parseColor, setAttrs, setMarkup, startServer, themeAttrs } from './harness';

const source: TokenSourceV2 = JSON.parse(readFileSync('tokens/source.json', 'utf8'));
const THEMES = ['Light', 'Dark', 'Light High Contrast', 'Dark High Contrast'];
const HUES = ['Blue', 'Purple', 'Orange', 'Sky'];
const VARIANTS = ['primary', 'secondary', 'danger', 'ghost', 'dashed', 'danger-subtle', 'warning'] as const;

let server: Server, browser: Browser, base: string;
before(async () => { ({ server, base } = await startServer()); browser = await launch(); });
after(async () => { await browser.close(); server.close(); });

const inner = (sel: string) => `${sel} >> css=button`;
const style = (page: Page, sel: string, prop: string) => page.locator(sel).evaluate((el, p) => getComputedStyle(el.shadowRoot!.querySelector('button')!).getPropertyValue(p), prop);
const counter = (page: Page, sel: string) => page.locator(sel).evaluate(el => { (el as any).__clicks = 0; el.addEventListener('click', () => (el as any).__clicks++); });
const clicks = (page: Page, sel: string) => page.locator(sel).evaluate(el => (el as any).__clicks as number);

describe('sp-button keyboard and activation', () => {
  test('Tab reaches the button, shows the focus ring, and Enter and Space each activate once', async () => {
    const page = await openCanvas(browser, base);
    await setMarkup(page, '<sp-button id="b">Save</sp-button>');
    await counter(page, '#b');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'b');
    assert.equal(await style(page, '#b', 'outline-style'), 'solid');
    assert.equal(await style(page, '#b', 'outline-width'), '2px');
    assert.ok(close(parseColor(await style(page, '#b', 'outline-color')), expectedColor(source, 'semantic-color.color.focus-ring.default', {})));
    await page.keyboard.press('Enter');
    assert.equal(await clicks(page, '#b'), 1);
    await page.keyboard.press('Space');
    assert.equal(await clicks(page, '#b'), 2);
    await page.close();
  });

  test('a pointer click does not draw the focus ring', async () => {
    const page = await openCanvas(browser, base);
    await setMarkup(page, '<sp-button id="b">Save</sp-button>');
    await page.locator('#b').click();
    assert.equal(await style(page, '#b', 'outline-style'), 'none');
    await page.close();
  });

  test('disabled buttons are skipped by Tab and never activate', async () => {
    const page = await openCanvas(browser, base);
    await setMarkup(page, '<sp-button id="a" disabled>A</sp-button><sp-button id="b">B</sp-button>');
    await counter(page, '#a');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'b');
    await page.locator('#a').click({ force: true });
    assert.equal(await clicks(page, '#a'), 0);
    await page.close();
  });

  test('a loading button stays focusable, is announced busy, and ignores Enter, Space, and clicks', async () => {
    const page = await openCanvas(browser, base);
    await setMarkup(page, '<form id="f"><sp-button id="b" type="submit" loading>Save</sp-button></form>');
    await counter(page, '#b');
    await page.evaluate(() => document.getElementById('f')!.addEventListener('submit', e => { e.preventDefault(); (window as any).submitted = true; }));
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'b');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await page.locator('#b').click();
    assert.equal(await clicks(page, '#b'), 0);
    assert.equal(await page.evaluate(() => (window as any).submitted), undefined);
    assert.equal(await page.locator(inner('#b')).getAttribute('aria-busy'), 'true');
    assert.equal(await page.locator('#b').evaluate(el => getComputedStyle(el.shadowRoot!.querySelector('.label')!).opacity), '0');
    assert.equal(await page.locator('#b').evaluate(el => getComputedStyle(el.shadowRoot!.querySelector('.spinner')!).display), 'flex');
    await page.close();
  });

  test('the spinner stops animating under prefers-reduced-motion', async () => {
    const page = await openCanvas(browser, base);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setMarkup(page, '<sp-button id="b" loading>Save</sp-button>');
    assert.equal(await page.locator('#b').evaluate(el => getComputedStyle(el.shadowRoot!.querySelector('.spinner span')!).animationName), 'none');
    await page.close();
  });
});

describe('forms', () => {
  const markup = '<form id="f"><input id="email" name="email" value="a@b.c"><sp-button id="go" type="submit" name="intent" value="save">Go</sp-button><sp-button id="rs" type="reset">Reset</sp-button></form>';
  test('Enter on a submit button submits the form with its name and value; reset restores fields', async () => {
    const page = await openCanvas(browser, base);
    await setMarkup(page, markup);
    await page.evaluate(() => document.getElementById('f')!.addEventListener('submit', e => { e.preventDefault(); const d = new FormData(e.target as HTMLFormElement, (e as SubmitEvent).submitter); (window as any).sent = [...d].map(([k, v]) => `${k}=${v}`).join('&'); }));
    await page.locator('#go').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => (window as any).sent), 'email=a@b.c&intent=save');
    await page.locator('#email').fill('changed');
    await page.locator('#rs').focus();
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#email').inputValue(), 'a@b.c');
    await page.close();
  });

  test('a disabled fieldset disables its buttons: no focus, no submit', async () => {
    const page = await openCanvas(browser, base);
    await setMarkup(page, '<form id="f"><fieldset disabled><sp-button id="go" type="submit">Go</sp-button></fieldset></form>');
    await page.evaluate(() => document.getElementById('f')!.addEventListener('submit', e => { e.preventDefault(); (window as any).sent = true; }));
    await page.keyboard.press('Tab');
    assert.notEqual(await page.evaluate(() => document.activeElement?.id), 'go');
    await page.locator('#go').click({ force: true });
    assert.equal(await page.evaluate(() => (window as any).sent), undefined);
    await page.close();
  });
});

describe('accessible names', () => {
  test('a button is named by its label and an icon button by its label attribute', async () => {
    const page = await openCanvas(browser, base);
    await setMarkup(page, '<sp-button id="b">Save changes</sp-button><sp-icon-button id="i" label="Add item"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/></svg></sp-icon-button>');
    assert.match(await page.locator('#b').ariaSnapshot(), /button "Save changes"/);
    assert.match(await page.locator('#i').ariaSnapshot(), /button "Add item"/);
    await page.close();
  });

  test('an icon button without a label has no aria-label and warns', async () => {
    const page = await openCanvas(browser, base);
    const warnings: string[] = [];
    page.on('console', m => m.type() === 'warning' && warnings.push(m.text()));
    await setMarkup(page, '<sp-icon-button id="i"></sp-icon-button>');
    assert.equal(await page.locator(inner('#i')).getAttribute('aria-label'), null);
    assert.ok(warnings.some(w => /needs a `label`/.test(w)));
    await page.close();
  });
});

describe('density: sizes follow the generated Component and Density variables', () => {
  // Heights read from Figma: Button Base 40, Small 32; Compact 32 and 28; Icon Button also has Extra small 24.
  const expected: Record<string, Record<string, number>> = {
    Relaxed: { 'btn-base': 40, 'btn-sm': 32, 'ib-base': 40, 'ib-sm': 32, 'ib-xs': 24 },
    Compact: { 'btn-base': 32, 'btn-sm': 28, 'ib-base': 32, 'ib-sm': 28, 'ib-xs': 24 },
  };
  const markup = '<sp-button id="btn-base">Button</sp-button><sp-button id="btn-sm" size="sm">Button</sp-button><sp-icon-button id="ib-base" label="a"><svg aria-hidden="true"/></sp-icon-button><sp-icon-button id="ib-sm" size="sm" label="a"><svg aria-hidden="true"/></sp-icon-button><sp-icon-button id="ib-xs" size="xs" label="a"><svg aria-hidden="true"/></sp-icon-button>';
  for (const density of ['Relaxed', 'Compact']) {
    test(`${density}: button and icon button boxes`, async () => {
      const page = await openCanvas(browser, base, 'components-button--playground', { density });
      await setMarkup(page, markup);
      for (const [id, h] of Object.entries(expected[density])) {
        const box = await page.locator('#' + id).boundingBox();
        assert.equal(box!.height, h, `${id} height`);
        if (id.startsWith('ib-')) assert.equal(box!.width, h, `${id} is square`);
      }
      await page.close();
    });
  }

  test('paddings, icon size, and type size follow density (Base, Relaxed then Compact)', async () => {
    const page = await openCanvas(browser, base);
    await setMarkup(page, '<sp-button id="b"><svg slot="start" viewBox="0 0 24 24" aria-hidden="true"></svg>Button</sp-button>');
    const read = () => page.locator('#b').evaluate(el => {
      const r = el.shadowRoot!, btn = getComputedStyle(r.querySelector('button')!), label = getComputedStyle(r.querySelector('.label')!), icon = r.querySelector('.icon')!.getBoundingClientRect();
      return { outer: btn.paddingLeft, label: label.paddingLeft, font: btn.fontSize, line: btn.lineHeight, icon: icon.width };
    });
    assert.deepEqual(await read(), { outer: '10px', label: '6px', font: '15px', line: '22px', icon: 20 });
    await page.evaluate(() => document.documentElement.setAttribute('data-sp-mode-density', 'Compact'));
    assert.deepEqual(await read(), { outer: '6px', label: '6px', font: '14px', line: '20px', icon: 18 });
    await page.close();
  });

  test('a nested density attribute re-resolves only its subtree', async () => {
    const page = await openCanvas(browser, base);
    await setMarkup(page, '<sp-button id="outer">A</sp-button><div data-sp-mode-density="Compact"><sp-button id="inner">B</sp-button></div>');
    assert.equal((await page.locator('#outer').boundingBox())!.height, 40);
    assert.equal((await page.locator('#inner').boundingBox())!.height, 32);
    await page.close();
  });
});

describe('theme, hue, shape, and variants resolve through the real variables', () => {
  test('primary fill, hover, and pressed follow Semantic Color mode and Primary hue', async () => {
    for (const theme of THEMES) for (const hue of HUES) {
      const page = await openCanvas(browser, base, 'components-button--playground', { ...themeAttrs(theme), primary: hue });
      await setMarkup(page, '<sp-button id="b">Save</sp-button>');
      const assign = { 'semantic-color': theme, primary: hue };
      const fill = (key: string) => expectedColor(source, `semantic-color.color.primary.${key}`, assign);
      const where = `${theme}/${hue}`;
      assert.ok(close(parseColor(await style(page, '#b', 'background-color')), fill('default')), `default ${where}`);
      assert.ok(close(parseColor(await style(page, '#b', 'color')), fill('foreground')), `foreground ${where}`);
      await page.locator('#b').hover();
      assert.ok(close(parseColor(await style(page, '#b', 'background-color')), fill('hover')), `hover ${where}`);
      await page.mouse.down();
      assert.ok(close(parseColor(await style(page, '#b', 'background-color')), fill('active')), `pressed ${where}`);
      await page.mouse.up();
      await page.close();
    }
  });

  test('every variant renders its Figma fill and text color, and a disabled button uses the disabled surface', async () => {
    const page = await openCanvas(browser, base);
    const keys: Record<(typeof VARIANTS)[number], [string, string]> = {
      primary: ['color.primary.default', 'color.primary.foreground'],
      secondary: ['color.secondary.default', 'color.secondary.foreground'],
      danger: ['color.danger.default', 'color.danger.foreground'],
      ghost: ['', 'color.foreground.default'],
      dashed: ['color.dashed.default', 'color.secondary.foreground'],
      'danger-subtle': ['color.danger.subtle.default', 'color.danger.text'],
      warning: ['color.warning.default', 'color.warning.foreground'],
    };
    for (const theme of THEMES) {
      const assign = { 'semantic-color': theme };
      await setAttrs(page, themeAttrs(theme));
      await setMarkup(page, VARIANTS.map(v => `<sp-button id="${v}" variant="${v}">x</sp-button><sp-button id="${v}-d" variant="${v}" disabled>x</sp-button>`).join(''));
      for (const v of VARIANTS) {
        const [fillKey, textKey] = keys[v];
        const fill = parseColor(await style(page, '#' + v, 'background-color'));
        if (fillKey) assert.ok(close(fill, expectedColor(source, 'semantic-color.' + fillKey, assign), 2), `${v} fill ${theme}: ${JSON.stringify(fill)}`);
        else assert.equal(fill.a, 0, `${v} is transparent`);
        assert.ok(close(parseColor(await style(page, '#' + v, 'color')), expectedColor(source, 'semantic-color.' + textKey, assign)), `${v} text ${theme}`);
        const dFill = parseColor(await style(page, `#${v}-d`, 'background-color'));
        if (v === 'ghost') assert.equal(dFill.a, 0);
        else assert.ok(close(dFill, expectedColor(source, 'semantic-color.color.surface.disabled', assign)), `${v} disabled fill ${theme}`);
        assert.ok(close(parseColor(await style(page, `#${v}-d`, 'color')), expectedColor(source, 'semantic-color.color.foreground.disabled', assign)), `${v} disabled text ${theme}`);
      }
    }
    await page.close();
  });

  test('dashed uses the border-width variable, which doubles in the high contrast modes', async () => {
    const page = await openCanvas(browser, base);
    for (const [theme, width] of [['Light', '1px'], ['Dark', '1px'], ['Light High Contrast', '2px'], ['Dark High Contrast', '2px']]) {
      await setAttrs(page, themeAttrs(theme));
      await setMarkup(page, '<sp-button id="d" variant="dashed">x</sp-button>');
      assert.equal(await style(page, '#d', 'border-top-style'), 'dashed');
      assert.equal(await style(page, '#d', 'border-top-width'), width, theme);
    }
    await page.close();
  });

  test('radius follows the control and pill radius variables', async () => {
    const page = await openCanvas(browser, base);
    await setMarkup(page, '<sp-button id="r">x</sp-button><sp-button id="p" shape="pill">x</sp-button>');
    assert.equal(await style(page, '#r', 'border-top-left-radius'), '8px');
    assert.equal(await style(page, '#p', 'border-top-left-radius'), '9999px');
    await page.close();
  });

  test('secondary and primary draw the two control shadows; danger does not', async () => {
    const page = await openCanvas(browser, base);
    await setMarkup(page, '<sp-button id="p">x</sp-button><sp-button id="d" variant="danger">x</sp-button>');
    const shadow = await style(page, '#p', 'box-shadow');
    assert.match(shadow, /0px 1px 3px 0px/);
    assert.match(shadow, /0px 0px 2px 0px/);
    assert.equal(await style(page, '#d', 'box-shadow'), 'none');
    await page.close();
  });
});
