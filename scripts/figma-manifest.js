// Run inside the Spartan DS file with the Figma MCP `use_figma` tool. Read-only.
// Returns one line per collection: name | hash of its header | variable count | id:hash pairs.
// The hash of a variable covers its ID, key, name, type, code syntax, and every mode value,
// the same fields as the export, so `pnpm tokens:manifest <saved output>` can tell exactly
// which variables were added, removed, or changed since the snapshot without a full export.
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const r6 = x => Math.round(x * 1e6) / 1e6;
const val = v =>
  v && typeof v === 'object' && v.type === 'VARIABLE_ALIAS' ? { a: v.id.replace('VariableID:', '') }
  : v && typeof v === 'object' && 'r' in v ? [r6(v.r), r6(v.g), r6(v.b), v.a === undefined ? 1 : r6(v.a)]
  : v;
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); };
const out = [];
for (const c of cols) {
  const head = JSON.stringify({ collection: { id: c.id.replace('VariableCollectionId:', ''), key: c.key, name: c.name, modes: c.modes.map(m => ({ id: m.modeId, name: m.name })) } });
  const mine = vars.filter(v => v.variableCollectionId === c.id);
  const rows = mine.map(v => v.id.replace('VariableID:', '') + ':' + fnv(JSON.stringify({ id: v.id.replace('VariableID:', ''), key: v.key, name: v.name, type: v.resolvedType, css: (v.codeSyntax && v.codeSyntax.WEB) || undefined, values: c.modes.map(m => val(v.valuesByMode[m.modeId])) })));
  out.push(c.name + '|' + fnv(head) + '|' + mine.length + '|' + rows.join(','));
}
return out.join('\n');
