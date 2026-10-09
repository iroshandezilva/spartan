import { validateTokens, isAlias, type TokenSource, type TokenValue } from '../lib/token-contract';
type Mapping = { variables: Record<string,string>; collections: Record<string,string> };
type Row = { key: string; action: string; detail: string };
const storage = 'spartan-token-map-v1';
figma.showUI(__html__, { width: 480, height: 580, themeColors: true });
let preview: { source: TokenSource; snapshot: string } | undefined;
let busy = false;
function mapping(): Mapping {
  const raw = figma.root.getPluginData(storage);
  return raw ? JSON.parse(raw) : { variables: {}, collections: {} };
}
async function inspect(source: TokenSource) {
  const map = mapping();
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync();
  const selectedCollections = new Map<string, VariableCollection | undefined>();
  const selectedVariables = new Map<string, Variable | undefined>();
  const rows: Row[] = [];
  for (const c of source.collections) {
    const saved = map.collections[c.key];
    const matches = saved ? collections.filter(v => v.id === saved) : collections.filter(v => v.name === c.name);
    if (matches.length > 1 || (saved && !matches.length)) throw new Error(`Collection mapping needs repair: ${c.key}`);
    const existing = matches[0];
    if (existing && existing.name !== c.name) throw new Error(`Collection rename requires a migration: ${c.key}`);
    if (existing && new Set(existing.modes.map(m=>m.name)).size !== existing.modes.length) throw new Error(`Duplicate mode names: ${c.name}`);
    selectedCollections.set(c.key, existing);
    if (!existing) rows.push({ key: c.name, action: 'Create collection', detail: c.modes.join(', ') });
    else for (const mode of c.modes) if (!existing.modes.some(m=>m.name===mode)) rows.push({ key: c.name, action: 'Add mode', detail: mode });
  }
  for (const t of source.tokens) {
    const saved = map.variables[t.key];
    const collection = selectedCollections.get(t.collection);
    const matches = saved ? variables.filter(v=>v.id===saved) : variables.filter(v=>v.variableCollectionId===collection?.id && v.name===t.name);
    if (matches.length>1 || (saved && !matches.length)) throw new Error(`Variable mapping needs repair: ${t.key}`);
    const existing = matches[0];
    if (existing && (existing.resolvedType !== t.type || existing.variableCollectionId !== collection?.id)) throw new Error(`Type or collection change requires a migration: ${t.key}`);
    const collision = variables.find(v=>v.variableCollectionId===collection?.id && v.name===t.name && v.id!==existing?.id);
    if (collision) throw new Error(`Variable name already exists: ${t.name}`);
    selectedVariables.set(t.key, existing);
  }
  for (const t of source.tokens) {
    const current = selectedVariables.get(t.key);
    const c = selectedCollections.get(t.collection);
    let changed = !current || current.name !== t.name;
    for (const [mode,value] of Object.entries(t.values)) {
      const id = c?.modes.find(m=>m.name===mode)?.modeId;
      const expected = isAlias(value) ? { type: 'VARIABLE_ALIAS', id: selectedVariables.get(value.alias)?.id ?? 'NEW' } : value;
      if (!id || JSON.stringify(current?.valuesByMode[id]) !== JSON.stringify(expected)) changed = true;
    }
    rows.push({ key: t.key, action: !current ? 'Create' : changed ? 'Update' : 'Unchanged', detail: t.name });
  }
  for (const key of Object.keys(map.variables)) if (!source.tokens.some(t=>t.key===key)) rows.push({ key, action: 'Retain', detail: 'Missing from source. Existing variable will not be deleted.' });
  const snapshot = JSON.stringify({ map, collections: collections.map(c=>({id:c.id,name:c.name,modes:c.modes})).sort((a,b)=>a.id.localeCompare(b.id)), variables:variables.map(v=>({id:v.id,name:v.name,type:v.resolvedType,collection:v.variableCollectionId,values:v.valuesByMode})).sort((a,b)=>a.id.localeCompare(b.id)) });
  return { map, rows, snapshot, selectedCollections, selectedVariables };
}
async function apply(source: TokenSource, plan: Awaited<ReturnType<typeof inspect>>) {
  const map = plan.map;
  for (const c of source.collections) {
    let collection = plan.selectedCollections.get(c.key);
    if (!collection) { collection = figma.variables.createVariableCollection(c.name); collection.renameMode(collection.defaultModeId,c.modes[0]); }
    for (const mode of c.modes) if (!collection.modes.some(m=>m.name===mode)) collection.addMode(mode);
    map.collections[c.key] = collection.id; plan.selectedCollections.set(c.key,collection);
  }
  for (const t of source.tokens) {
    const variable = plan.selectedVariables.get(t.key) ?? figma.variables.createVariable(t.name, plan.selectedCollections.get(t.collection)!, t.type);
    variable.name=t.name; map.variables[t.key]=variable.id; plan.selectedVariables.set(t.key,variable);
  }
  for (const t of source.tokens) {
    const variable=plan.selectedVariables.get(t.key)!;
    const collection=plan.selectedCollections.get(t.collection)!;
    for (const [mode,value] of Object.entries(t.values)) {
      const resolved: VariableValue = isAlias(value) ? { type:'VARIABLE_ALIAS',id:map.variables[value.alias] } : value as Exclude<TokenValue,{alias:string}>;
      variable.setValueForMode(collection.modes.find(m=>m.name===mode)!.modeId,resolved);
    }
  }
  figma.root.setPluginData(storage,JSON.stringify(map));
  figma.root.setPluginData('spartan-token-last-sync',JSON.stringify({version:source.version,at:new Date().toISOString()}));
  figma.commitUndo();
}
figma.ui.onmessage=async(message: {type:string;source?:unknown})=>{
  if (busy) return;
  busy=true;
  try {
    if (message.type==='preview') {
      preview=undefined;
      const source=validateTokens(message.source);
      const plan=await inspect(source);
      preview={source,snapshot:plan.snapshot};
      figma.ui.postMessage({type:'plan',rows:plan.rows,version:source.version,file:figma.root.name});
    } else if(message.type==='apply') {
      if(!preview) throw new Error('Preview a token file first.');
      const {source,snapshot}=preview;
      const plan=await inspect(source);
      preview=undefined;
      if(plan.snapshot!==snapshot) throw new Error('The Figma file changed. Preview again before applying.');
      await apply(source,plan);
      figma.ui.postMessage({type:'done',message:`Applied ${source.version}. Verify aliases, modes, and bound components before marking Figma complete.`});
    }
  } catch(error) {
    preview=undefined;
    figma.ui.postMessage({type:'error',message:(error instanceof Error ? error.message : 'Sync failed.') + (message.type==='apply' ? ' If changes were partially applied, use Figma Undo before retrying.' : '')});
  } finally {busy=false;}
};
