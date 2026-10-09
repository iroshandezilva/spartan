// Builds a spartan.figma-export.v1 file from saved outputs of scripts/figma-export.js.
//   node --import tsx scripts/assemble-figma-export.ts <dir-of-outputs> <out.json> [YYYY-MM-DD] [--base snapshot.json]
// Files are read in name order. Each line is checked against its hash, so a
// mistyped or truncated copy fails here instead of becoming a wrong token.
// With --base, collections that no output mentions are kept from the snapshot, an
// output with a full header replaces its collection, and one with a partial header
// merges its variables into the collection by ID.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import type { FigmaCollection, FigmaExport, FigmaVariable } from '../lib/figma-tokens';

export const fnv = (s: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
};

export function assemble(files: { name: string; text: string }[], fileInfo: FigmaExport['file'], exportedAt: string, base?: FigmaExport): FigmaExport {
  const collections: FigmaCollection[] = [];
  const expected = new Map<string, number>();
  const partial = new Set<string>();
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
      if (row.collection) {
        const { partial: isPartial, ...head } = row.collection;
        const prior = base?.collections.find(c => c.id === head.id);
        if (isPartial && !prior) throw new Error(`${name}: partial refresh of ${head.name}, which is not in the base snapshot.`);
        collections.push({ ...head, variables: isPartial ? structuredClone(prior!.variables) : [] });
        if (isPartial) partial.add(head.name);
        else if (total) expected.set(head.name, +total[1]);
        continue;
      }
      const target = collections.at(-1);
      if (target && partial.has(target.name)) {
        const at = target.variables.findIndex(v => v.id === row.id);
        if (at >= 0) target.variables[at] = row as FigmaVariable;
        else target.variables.push(row as FigmaVariable);
      }
      else if (!target) throw new Error(`${name}: variables before any collection header.`);
      else target.variables.push(row as FigmaVariable);
    }
  }
  for (const c of collections) {
    if (expected.has(c.name) && expected.get(c.name) !== c.variables.length) throw new Error(`${c.name}: expected ${expected.get(c.name)} variables, assembled ${c.variables.length}. A slice is missing or repeated.`);
  }
  for (const prior of base?.collections ?? []) if (!collections.some(c => c.id === prior.id)) collections.push(prior);
  // Keep the base snapshot's order so refreshes diff cleanly; new collections go last.
  const order = (c: FigmaCollection) => { const i = base?.collections.findIndex(b => b.id === c.id) ?? -1; return i < 0 ? Infinity : i; };
  collections.sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
  return { schema: 'spartan.figma-export.v1', file: fileInfo, exportedAt, collections };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const baseAt = args.indexOf('--base');
  const base: FigmaExport | undefined = baseAt >= 0 ? JSON.parse(await readFile(args.splice(baseAt, 2)[1], 'utf8')) : undefined;
  const [dir, out, date = new Date().toISOString().slice(0, 10)] = args;
  if (!dir || !out) throw new Error('Usage: assemble-figma-export.ts <dir> <out.json> [date] [--base snapshot.json]');
  const names = (await readdir(dir)).filter(f => f.endsWith('.txt'));
  const files = await Promise.all(names.map(async name => ({ name, text: await readFile(`${dir}/${name}`, 'utf8') })));
  const result = assemble(files, { key: 'PhcMPmdpkpgxH3N83SvpBY', name: 'Spartan DS' }, date, base);
  await writeFile(out, JSON.stringify(result, null, 1) + '\n');
  console.log(`Assembled ${result.collections.reduce((n, c) => n + c.variables.length, 0)} variables from ${result.collections.length} collections into ${out}`);
}
