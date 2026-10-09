export type TokenValue = number | string | boolean | { r: number; g: number; b: number; a: number } | { alias: string };
export type Token = { key: string; name: string; collection: string; type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'; unit?: 'px'; values: Record<string, TokenValue> };
export type TokenSource = { schema: 'spartant.tokens.v1'; version: string; collections: { key: string; name: string; modes: string[] }[]; tokens: Token[] };
export const isAlias = (v: TokenValue): v is { alias: string } => typeof v === 'object' && v !== null && 'alias' in v;
export const cssName = (key: string) => '--sp-' + key.replace(/[._]/g, '-');
export function validateTokens(input: unknown): TokenSource {
  const s = input as TokenSource;
  if (!s || s.schema !== 'spartant.tokens.v1' || typeof s.version !== 'string' || !s.version.trim() || !Array.isArray(s.collections) || !Array.isArray(s.tokens) || s.tokens.length > 5000) throw new Error('Expected a spartant.tokens.v1 file with a version, collections, and tokens.');
  const collections = new Map<string, TokenSource['collections'][number]>();
  const names = new Set<string>();
  for (const c of s.collections) {
    if (!c || !/^[a-z][a-z0-9-]*$/.test(c.key) || typeof c.name !== 'string' || !c.name.trim() || collections.has(c.key) || names.has(c.name)) throw new Error('Collection keys and names must be unique.');
    if (!Array.isArray(c.modes) || !c.modes.length || c.modes.length > 40 || c.modes.some(m => typeof m !== 'string' || !/^[a-zA-Z][a-zA-Z0-9 -]*$/.test(m)) || new Set(c.modes).size !== c.modes.length) throw new Error('Each collection needs unique, non-empty mode names.');
    collections.set(c.key, c); names.add(c.name);
  }
  const tokens = new Map<string, Token>(), cssNames = new Set<string>(), tokenNames = new Set<string>();
  for (const t of s.tokens) {
    if (!t || typeof t.key !== 'string' || !/^[a-z][a-z0-9._-]*$/.test(t.key) || tokens.has(t.key) || cssNames.has(cssName(t.key))) throw new Error('Token keys must be unique and produce unique CSS names.');
    const c = collections.get(t.collection);
    if (!c || typeof t.name !== 'string' || !t.name.trim() || tokenNames.has(`${t.collection}:${t.name}`)) throw new Error(`Invalid collection or duplicate name: ${t.key}`);
    if (!['COLOR','FLOAT','STRING','BOOLEAN'].includes(t.type) || (t.unit !== undefined && (t.unit !== 'px' || t.type !== 'FLOAT'))) throw new Error(`Unsupported type or unit: ${t.key}`);
    if (!t.values || typeof t.values !== 'object' || Object.keys(t.values).length !== c.modes.length) throw new Error(`Values must cover exactly the collection modes: ${t.key}`);
    for (const mode of c.modes) {
      if (!Object.prototype.hasOwnProperty.call(t.values, mode)) throw new Error(`Missing mode ${mode}: ${t.key}`);
      const v = t.values[mode];
      if (isAlias(v)) { if (typeof v.alias !== 'string') throw new Error('Invalid alias.'); continue; }
      const valid = t.type === 'FLOAT' ? typeof v === 'number' && Number.isFinite(v)
        : t.type === 'STRING' ? typeof v === 'string'
        : t.type === 'BOOLEAN' ? typeof v === 'boolean'
        : typeof v === 'object' && v !== null && ['r','g','b','a'].every(k => typeof (v as any)[k] === 'number' && (v as any)[k] >= 0 && (v as any)[k] <= 1);
      if (!valid) throw new Error(`Invalid ${t.type} value: ${t.key}/${mode}`);
    }
    tokens.set(t.key,t); cssNames.add(cssName(t.key)); tokenNames.add(`${t.collection}:${t.name}`);
  }
  for (const token of s.tokens) for (const [mode, value] of Object.entries(token.values)) {
    if (!isAlias(value)) continue;
    const target = tokens.get(value.alias);
    if (!target || target.type !== token.type || target.unit !== token.unit) throw new Error(`Missing or incompatible alias: ${token.key} -> ${value.alias}`);
    if (target.collection !== token.collection) throw new Error('Cross-collection aliases are not supported in v1.');
    const seen = new Set([token.key]); let current: TokenValue = value;
    while (isAlias(current)) {
      if (seen.has(current.alias)) throw new Error(`Alias cycle in ${mode}: ${token.key}`);
      seen.add(current.alias);
      const next = tokens.get(current.alias);
      if (!next) throw new Error(`Missing alias ${current.alias}`);
      current = next.values[mode];
    }
  }
  return s;
}
export function renderCSS(input: unknown) {
  const s = validateTokens(input);
  function value(t: Token, mode: string) {
    const v = t.values[mode];
    if (isAlias(v)) return `var(${cssName(v.alias)})`;
    if (typeof v === 'object') return `rgb(${[v.r,v.g,v.b].map(n => +(n * 255).toFixed(3)).join(' ')} / ${v.a})`;
    if (typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'boolean') return v ? '1' : '0';
    return `${v}${t.unit ?? ''}`;
  }
  return '/* Generated from tokens/source.json. Do not edit. */\n' + s.collections.map(c => c.modes.map((m, i) => {
    const selector = `[data-sp-mode-${c.key}="${m}"]`;
    return `${i === 0 ? ':root, ' : ''}${selector} {\n${s.tokens.filter(t => t.collection === c.key).map(t => `  ${cssName(t.key)}: ${value(t,m)};`).join('\n')}\n}`;
  }).join('\n\n')).join('\n\n') + '\n';
}
