import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright-core';
import { resolveToken, type ModeAssignment, type Rgba, type TokenSourceV2 } from '../lib/figma-tokens';

const ROOT = join(process.cwd(), 'packages/components/storybook-static');
const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

export async function startServer(): Promise<{ server: Server; base: string }> {
  const server = createServer(async (req, res) => {
    try {
      const path = normalize(decodeURIComponent(new URL(req.url!, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
      const file = path === '/' ? '/index.html' : path;
      const body = await readFile(join(ROOT, file));
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  const { port } = server.address() as { port: number };
  return { server, base: `http://127.0.0.1:${port}` };
}

export const launch = (): Promise<Browser> => chromium.launch();

// Opens a story iframe so Storybook's bundle registers the custom elements and
// token CSS, then clears the canvas for the test's own markup.
export async function openCanvas(browser: Browser, base: string, story = 'components-button--playground', modes: Record<string, string> = {}): Promise<Page> {
  const page = await browser.newPage();
  await page.goto(`${base}/iframe.html?id=${story}&viewMode=story`);
  // Wait for Storybook to finish rendering the story, or it would overwrite the test markup.
  await page.waitForFunction(() => document.body.classList.contains('sb-show-main') && customElements.get('sp-button') && customElements.get('sp-icon-button'));
  await page.evaluate(modes => {
    document.getElementById('storybook-root')!.replaceChildren();
    for (const [k, v] of Object.entries(modes)) document.documentElement.setAttribute(`data-sp-mode-${k}`, v);
  }, modes);
  return page;
}

export const setMarkup = (page: Page, html: string) => page.evaluate(html => { document.getElementById('storybook-root')!.innerHTML = html; }, html).then(() => page.waitForTimeout(50));

// Setting attributes on the document root, and the combined theme names split into the two settings
// the code API exposes: 'Dark High Contrast' is color scheme Dark with high contrast on.
export const themeAttrs = (theme: string): Record<string, string> => ({ 'color-scheme': theme.replace(' High Contrast', ''), contrast: theme.endsWith('High Contrast') ? 'High' : 'Normal' });
export const setAttrs = (page: Page, attrs: Record<string, string>) => page.evaluate(attrs => { for (const [k, v] of Object.entries(attrs)) document.documentElement.setAttribute(`data-sp-mode-${k}`, v); }, attrs);

// ---- expected colors, from the generated token source ----

export const channel = (n: number) => Math.round(n * 255);
export const rgbOf = (c: Rgba) => ({ r: channel(c.r), g: channel(c.g), b: channel(c.b), a: c.a });

// Parses rgb(), rgba(), and color(srgb ...) as Chrome serializes computed colors.
export function parseColor(text: string): { r: number; g: number; b: number; a: number } {
  const nums = (text.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
  if (text.startsWith('color(srgb')) return { r: Math.round(nums[0] * 255), g: Math.round(nums[1] * 255), b: Math.round(nums[2] * 255), a: nums[3] ?? 1 };
  return { r: nums[0], g: nums[1], b: nums[2], a: nums[3] ?? 1 };
}

export function expectedColor(source: TokenSourceV2, key: string, assign: ModeAssignment) {
  const v = resolveToken(source, key, assign);
  if (typeof v === 'object' && 'alpha' in v) return { ...rgbOf(v.alpha.color), a: v.alpha.color.a * (v.alpha.opacity / 100) };
  return rgbOf(v as Rgba);
}

export function close(a: { r: number; g: number; b: number; a: number }, b: { r: number; g: number; b: number; a: number }, tol = 1) {
  return Math.abs(a.r - b.r) <= tol && Math.abs(a.g - b.g) <= tol && Math.abs(a.b - b.b) <= tol && Math.abs(a.a - b.a) <= 0.01;
}

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
