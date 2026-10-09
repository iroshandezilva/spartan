// Renders the licensed Central Icons package (round, outlined, radius 2, stroke 1.5,
// the style the Figma guideline requires) to static SVG markup for Storybook only.
// Output is git-ignored and never part of the published package or dist.
// Without the package installed (it is an optional dependency whose preinstall needs
// CENTRAL_LICENSE_KEY), an empty set is written and the stories fall back to a plain icon.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const OUT = new URL('../.storybook/generated/icons.json', import.meta.url);
const PACKAGE = '@central-icons-react/round-outlined-radius-2-stroke-1.5';
mkdirSync(new URL('./', OUT), { recursive: true });

const require = createRequire(import.meta.url);
let icons;
try {
  icons = await import(require.resolve(PACKAGE));
} catch {
  writeFileSync(OUT, '[]\n');
  console.warn(`${PACKAGE} is not installed (set CENTRAL_LICENSE_KEY and run pnpm install). Storybook will show the fallback icon only.`);
  process.exit(0);
}

const { createElement } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Each entry: [name, search words, svg]. The vendor's accessible label, such as
// "plus-small, add small", doubles as the search keywords.
const entries = [];
for (const [name, Icon] of Object.entries(icons)) {
  if (!/^Icon[A-Z0-9]/.test(name) || (typeof Icon !== 'object' && typeof Icon !== 'function')) continue;
  // The package also exports every icon as <Name>Default; skip those aliases.
  if (name.endsWith('Default') && name.slice(0, -'Default'.length) in icons) continue;
  const labelled = renderToStaticMarkup(createElement(Icon, { mode: 'raw', ariaHidden: false }));
  const words = (labelled.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').toLowerCase();
  const svg = renderToStaticMarkup(createElement(Icon, { mode: 'raw' })).replace(/ (width|height)="[^"]*"/g, '').replace(/ aria-hidden="true"/, '');
  entries.push([name, words, svg]);
}
entries.sort((a, b) => a[0].localeCompare(b[0]));
writeFileSync(OUT, JSON.stringify(entries) + '\n');
console.log(`Wrote ${entries.length} icons for Storybook.`);
