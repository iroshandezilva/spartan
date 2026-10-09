// Compares a manifest from scripts/figma-manifest.js with the committed snapshot and lists
// the variables to refetch. Exits 1 when anything differs.
//   pnpm tokens:manifest path/to/manifest.txt
import { readFile } from 'node:fs/promises';
import type { FigmaCollection, FigmaExport, FigmaVariable } from '../lib/figma-tokens';
import { fnv } from './assemble-figma-export';

const variableHash = (v: FigmaVariable) => fnv(JSON.stringify({ id: v.id, key: v.key, name: v.name, type: v.type, css: v.css, values: v.values }));
const headHash = (c: FigmaCollection) => fnv(JSON.stringify({ collection: { id: c.id, key: c.key, name: c.name, modes: c.modes } }));

export type ManifestDiff = { collection: string; headChanged: boolean; changed: string[]; added: string[]; removed: string[]; isNew: boolean };

export function manifestDiff(snapshot: FigmaExport, manifest: string): ManifestDiff[] {
  const byName = new Map(snapshot.collections.map(c => [c.name, c]));
  const out: ManifestDiff[] = [];
  const seen = new Set<string>();
  for (const line of manifest.trim().split('\n')) {
    const [name, head, count, rows] = line.split('|');
    const figma = new Map(rows.split(',').filter(Boolean).map(r => { const i = r.lastIndexOf(':'); return [r.slice(0, i), r.slice(i + 1)] as const; }));
    if (figma.size !== +count) throw new Error(`${name}: manifest lists ${figma.size} variables but says ${count}.`);
    seen.add(name);
    const mine = byName.get(name);
    if (!mine) { out.push({ collection: name, headChanged: true, changed: [], added: [...figma.keys()], removed: [], isNew: true }); continue; }
    const hashes = new Map(mine.variables.map(v => [v.id, variableHash(v)]));
    out.push({
      collection: name,
      headChanged: headHash(mine) !== head,
      changed: [...figma].filter(([id, h]) => hashes.has(id) && hashes.get(id) !== h).map(([id]) => id),
      added: [...figma.keys()].filter(id => !hashes.has(id)),
      removed: [...hashes.keys()].filter(id => !figma.has(id)),
      isNew: false,
    });
  }
  for (const c of snapshot.collections) if (!seen.has(c.name)) out.push({ collection: c.name, headChanged: true, changed: [], added: [], removed: c.variables.map(v => v.id), isNew: false });
  return out;
}

export const hasManifestDrift = (d: ManifestDiff[]) => d.some(c => c.headChanged || c.changed.length || c.added.length || c.removed.length);

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: diff-figma-manifest.ts <manifest.txt>');
  const snapshot: FigmaExport = JSON.parse(await readFile('tokens/figma/spartan-ds.export.json', 'utf8'));
  const diff = manifestDiff(snapshot, await readFile(file, 'utf8'));
  for (const c of diff) {
    const state = c.isNew ? 'NEW COLLECTION' : c.headChanged ? 'header changed (name or modes)' : 'header same';
    console.log(`${c.collection}: ${state}; changed ${c.changed.length}, added ${c.added.length}, removed ${c.removed.length}`);
    for (const [k, ids] of [['changed', c.changed], ['added', c.added], ['removed', c.removed]] as const) if (ids.length) console.log(`  ${k}: ${ids.join(' ')}`);
  }
  if (hasManifestDrift(diff)) process.exit(1);
  console.log('Snapshot matches the manifest.');
}
