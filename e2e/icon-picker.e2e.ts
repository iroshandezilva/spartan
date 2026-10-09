// Drives the full Storybook UI: search the Icons panel, pick left and right icons, and
// check the Button in the preview iframe. Skipped when the licensed library is not installed.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Browser, Page } from 'playwright-core';
import type { Server } from 'node:http';
import { launch, startServer } from './harness';

const icons: unknown[] = JSON.parse(readFileSync('packages/components/.storybook/generated/icons.json', 'utf8'));
const skip = icons.length === 0 && 'licensed icon library not installed';

let server: Server, browser: Browser, base: string;
before(async () => { ({ server, base } = await startServer()); browser = await launch(); });
after(async () => { await browser.close(); server.close(); });

async function openStory(path: string): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(`${base}/?path=/story/${path}`);
  await page.getByRole('tab', { name: 'Icons' }).click();
  return page;
}
const slotted = (page: Page, slot: string) => page.frameLocator('#storybook-preview-iframe').locator(`sp-button > svg[slot="${slot}"]`);

describe('Icons panel', { skip }, () => {
  test('searches by keyword, picks a left and a right icon, and clears one', async () => {
    const page = await openStory('components-button--playground');
    const search = page.getByRole('searchbox', { name: 'Search icons' });
    await search.fill('arrow right');
    const options = page.getByRole('option');
    assert.ok((await options.count()) > 1);
    await page.getByRole('option', { name: /^ArrowRight$/ }).click();
    await slotted(page, 'start').waitFor();
    assert.equal(await slotted(page, 'end').count(), 0);

    await page.getByRole('button', { name: /^Right icon/ }).click();
    await search.fill('checkmark');
    await page.getByRole('option', { name: /^Checkmark1$/ }).click();
    await slotted(page, 'end').waitFor();
    assert.equal(await slotted(page, 'start').count(), 1, 'left icon stays');

    await page.getByRole('button', { name: /^Left icon/ }).click();
    await page.getByRole('button', { name: /^Remove left icon$/ }).click();
    await page.frameLocator('#storybook-preview-iframe').locator('sp-button > svg[slot="start"]').waitFor({ state: 'detached' });
    assert.equal(await slotted(page, 'end').count(), 1);
    await page.close();
  });

  test('keywords from the vendor label find icons whose name does not contain the word', async () => {
    const page = await openStory('components-button--playground');
    await page.getByRole('searchbox', { name: 'Search icons' }).fill('switch horizontal');
    assert.ok((await page.getByRole('option', { name: /^ArrowRightLeft$/ }).count()) >= 1);
    await page.getByRole('searchbox', { name: 'Search icons' }).fill('zzzzqq');
    await page.getByText('No icons match').waitFor();
    await page.close();
  });

  test('the picked icon is sized by the icon frame and follows density', async () => {
    const page = await openStory('components-button--playground');
    await page.getByRole('searchbox', { name: 'Search icons' }).fill('plus-small');
    await page.getByRole('option', { name: /^PlusSmall$/ }).click();
    const svg = slotted(page, 'start');
    await svg.waitFor();
    assert.equal((await svg.boundingBox())!.width, 20);
    await page.close();
  });

  test('the Icon Button story offers a single Icon target', async () => {
    const page = await openStory('components-icon-button--playground');
    await page.getByRole('searchbox', { name: 'Search icons' }).fill('trash');
    await page.getByRole('option').first().click();
    await page.frameLocator('#storybook-preview-iframe').locator('sp-icon-button svg').waitFor();
    assert.equal(await page.getByRole('button', { name: /^Left icon/ }).count(), 0);
    await page.close();
  });
});
