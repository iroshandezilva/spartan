// Run inside the Spartan DS file with the Figma MCP `use_figma` tool (or a plugin
// console). Read-only. Prints one collection (or a slice of it) as JSON lines plus a
// trailing #HASHES line, which scripts/assemble-figma-export.ts verifies.
//
// use_figma caps its return value at 20 KB and has no network access, so large
// collections are exported in slices: change FROM and TO, run again, and save each
// output to its own file. Slice 1 (FROM = 0) carries the collection header.
//
// To refresh only what changed, set IDS to the Figma variable IDs that were added or
// changed (find them with `pnpm tokens:manifest`, which diffs a manifest of per-variable
// hashes against the snapshot). The header is then marked partial, and the assembler
// merges those variables into the existing collection instead of replacing it.
const NAME = '01 Primitives'; // collection name
const FROM = 0;
const TO = 62; // use a large number for the last slice
const IDS = null; // for example ['848:17', '858:16'] for a partial refresh

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const c = cols.find(x => x.name === NAME);
const r6 = x => Math.round(x * 1e6) / 1e6;
const val = v =>
  v && typeof v === 'object' && v.type === 'VARIABLE_ALIAS' ? { a: v.id.replace('VariableID:', '') }
  : v && typeof v === 'object' && 'r' in v ? [r6(v.r), r6(v.g), r6(v.b), v.a === undefined ? 1 : r6(v.a)]
  : v;
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); };
const all = vars.filter(v => v.variableCollectionId === c.id && (!IDS || IDS.includes(v.id.replace('VariableID:', '')))).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
const head = JSON.stringify({ collection: { id: c.id.replace('VariableCollectionId:', ''), key: c.key, name: c.name, modes: c.modes.map(m => ({ id: m.modeId, name: m.name })), ...(IDS ? { partial: true } : {}) } });
const lines = (FROM === 0 ? [head] : []).concat(
  all.slice(FROM, TO).map(v => JSON.stringify({ id: v.id.replace('VariableID:', ''), key: v.key, name: v.name, type: v.resolvedType, css: (v.codeSyntax && v.codeSyntax.WEB) || undefined, values: c.modes.map(m => val(v.valuesByMode[m.modeId])) })),
);
return 'total=' + all.length + '\n' + lines.join('\n') + '\n#HASHES ' + lines.map(fnv).join(',');
