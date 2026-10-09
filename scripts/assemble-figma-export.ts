// Builds a spartan.figma-export.v1 file from saved outputs of scripts/figma-export.js.
//   node --import tsx scripts/assemble-figma-export.ts <dir-of-outputs> <out.json> [YYYY-MM-DD]
// Files are read in name order. Each line is checked against its hash, so a
// mistyped or truncated copy fails here instead of becoming a wrong token.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import type { FigmaCollection, FigmaExport, FigmaVariable } from '../lib/figma-tokens';

export const fnv = (s: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
};

export function assemble(files: { name: string; text: string }[], fileInfo: FigmaExport['file'], exportedAt: string): FigmaExport {
  const collections: FigmaCollection[] = [];
  const expected = new Map<string, number>();
  for (const { name, text } of [...files].sort((a, b) => a.name.localeCompare(b.name))) {
    const rows = text.trimEnd().split('\n');
    const hashLine = rows.pop() ?? '';
    if (!hashLine.startsWith('#HASHES ')) throw new Error(`${name}: missing #HASHES line.`);
    const total = rows[0]?.match(/^total=(\d+)$/);
    const lines = total ? rows.slice(1) : rows;
    const hashes = hashLine.slice('#HASHES '.length).split(',');
    if (lines.length !== hashes.length) throw new Error(`${name}: ${lines.length} lines but ${hashes.length} hashes.`);
    lines.forEach((l, i) => { if (fnv(l) !== hashes[i]) throw new Error(`${name}: line ${i + 1} does not match its hash.`); });
    for (const l of lines) {
      const row = JSON.parse(l);
      if (row.collection) { collections.push({ ...row.collection, variables: [] }); if (total) expected.set(row.collection.name, +total[1]); }
      else if (!collections.length) throw new Error(`${name}: variables before any collection header.`);
      else collections.at(-1)!.variables.push(row as FigmaVariable);
    }
  }
  for (const c of collections) {
    if (expected.has(c.name) && expected.get(c.name) !== c.variables.length) throw new Error(`${c.name}: expected ${expected.get(c.name)} variables, assembled ${c.variables.length}. A slice is missing or repeated.`);
  }
  return { schema: 'spartan.figma-export.v1', file: fileInfo, exportedAt, collections };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [dir, out, date = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
  if (!dir || !out) throw new Error('Usage: assemble-figma-export.ts <dir> <out.json> [date]');
  const names = (await readdir(dir)).filter(f => f.endsWith('.txt'));
  const files = await Promise.all(names.map(async name => ({ name, text: await readFile(`${dir}/${name}`, 'utf8') })));
  const result = assemble(files, { key: 'PhcMPmdpkpgxH3N83SvpBY', name: 'Spartan DS' }, date);
  await writeFile(out, JSON.stringify(result, null, 1) + '\n');
  console.log(`Assembled ${result.collections.reduce((n, c) => n + c.variables.length, 0)} variables from ${result.collections.length} collections into ${out}`);
}
