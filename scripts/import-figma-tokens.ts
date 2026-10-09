import { readFile, writeFile } from 'node:fs/promises';
import { importFigmaExport } from '../lib/figma-tokens';

const EXPORT = 'tokens/figma/spartan-ds.export.json';
const OUT = 'tokens/source.json';

// One collection or token per line keeps diffs reviewable.
export function stringifySource(s: ReturnType<typeof importFigmaExport>) {
  const { collections, tokens, ...head } = s;
  const lines = (items: unknown[]) => items.map(i => '    ' + JSON.stringify(i)).join(',\n');
  return `{\n  "schema": ${JSON.stringify(head.schema)},\n  "version": ${JSON.stringify(head.version)},\n  "source": ${JSON.stringify(head.source)},\n  "collections": [\n${lines(collections)}\n  ],\n  "tokens": [\n${lines(tokens)}\n  ]\n}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const source = importFigmaExport(JSON.parse(await readFile(EXPORT, 'utf8')));
  await writeFile(OUT, stringifySource(source));
  console.log(`Imported ${source.tokens.length} tokens from ${source.collections.length} collections into ${OUT}`);
}
