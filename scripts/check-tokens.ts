// Fails when generated token artifacts are stale, or, given a fresh Figma export,
// when the Figma library has drifted from the committed snapshot.
//   pnpm tokens:check                      committed export -> source.json -> tokens.css
//   pnpm tokens:check path/to/export.json  also diff the committed export against a new one
import { readFile } from 'node:fs/promises';
import { diffExports, hasDrift, importFigmaExport, renderCSSV2, type FigmaExport } from '../lib/figma-tokens';
import { stringifySource } from './import-figma-tokens';

const read = async (p: string) => readFile(p, 'utf8');
const snapshot: FigmaExport = JSON.parse(await read('tokens/figma/spartan-ds.export.json'));
const source = importFigmaExport(snapshot);
const problems: string[] = [];

if ((await read('tokens/source.json')) !== stringifySource(source)) problems.push('tokens/source.json is stale. Run pnpm tokens:import.');
if ((await read('public/tokens.css')) !== renderCSSV2(source)) problems.push('public/tokens.css is stale. Run pnpm tokens:build.');

const next = process.argv[2];
if (next) {
  const drift = diffExports(snapshot, JSON.parse(await read(next)));
  if (hasDrift(drift)) {
    for (const [kind, items] of Object.entries(drift)) for (const i of items) problems.push(`Figma drift (${kind}): ${i}`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Tokens are current (${source.tokens.length} tokens, snapshot ${snapshot.exportedAt}).`);
