import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { runInNewContext } from 'node:vm';
import { readFileSync } from 'node:fs';
const bundled=buildSync({entryPoints:['plugin/code.ts'],bundle:true,write:false,format:'iife',target:'es2017'}).outputFiles[0].text;
const fixture=()=>JSON.parse(readFileSync('tokens/fixtures/lab.json','utf8'));
function mock(){
 let n=0;const collections:any[]=[],variables:any[]=[],messages:any[]=[],storage:Record<string,string>={};
 const figma:any={showUI(){},commitUndo(){},root:{name:'Test document',getPluginData:(k:string)=>storage[k]??'',setPluginData:(k:string,v:string)=>storage[k]=v},ui:{postMessage:(m:any)=>messages.push(m)},variables:{
  getLocalVariableCollectionsAsync:async()=>collections,getLocalVariablesAsync:async()=>variables,
  createVariableCollection:(name:string)=>{const id='c'+(++n),modeId='m'+(++n);const c={id,name,defaultModeId:modeId,modes:[{modeId,name:'Mode 1'}],renameMode(id:string,name:string){this.modes.find(m=>m.modeId===id)!.name=name;},addMode(name:string){const modeId='m'+(++n);this.modes.push({modeId,name});return modeId;}};collections.push(c);return c;},
  createVariable:(name:string,c:any,resolvedType:string)=>{const v={id:'v'+(++n),name,variableCollectionId:c.id,resolvedType,valuesByMode:{} as Record<string,unknown>,setValueForMode(id:string,value:unknown){this.valuesByMode[id]=value;}};variables.push(v);return v;}
 }};
 runInNewContext(bundled,{figma,__html__:''});
 return {figma,collections,variables,messages,storage,send:async(type:string,source?:unknown)=>{await figma.ui.onmessage({type,source});return messages.at(-1);}};
}
test('plugin creates aliases, repeats idempotently, and preserves IDs through rename',async()=>{
 const m=mock();const s=fixture();assert.equal((await m.send('preview',s)).type,'plan');assert.equal((await m.send('apply')).type,'done');
 assert.equal(m.variables.length,s.tokens.length);assert.equal(m.collections[0].modes.length,2);
 const id=m.variables[2].id;assert.equal(Object.values(m.variables[2].valuesByMode)[0] && (Object.values(m.variables[2].valuesByMode)[0] as any).id,m.variables[1].id);
 const plan=await m.send('preview',s);assert.ok(plan.rows.every((r:any)=>r.action==='Unchanged'));
 s.tokens[2].name='radius/renamed';await m.send('preview',s);await m.send('apply');assert.equal(m.variables[2].id,id);assert.equal(m.variables[2].name,'radius/renamed');
 s.tokens=s.tokens.filter((t:any)=>t.key!=='space.control');const removal=await m.send('preview',s);assert.ok(removal.rows.some((r:any)=>r.action==='Retain'));await m.send('apply');assert.equal(m.variables.length,fixture().tokens.length);
});
test('plugin rejects stale preview and deleted mapped variables',async()=>{
 const m=mock();const s=fixture();await m.send('preview',s);await m.send('apply');await m.send('preview',s);m.variables[0].name='changed outside plugin';assert.match((await m.send('apply')).message,/changed/);
 m.variables.pop();assert.match((await m.send('preview',s)).message,/mapping needs repair/);
});
