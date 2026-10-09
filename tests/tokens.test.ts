import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderCSS, validateTokens } from '../lib/token-contract';
const fixture=()=>JSON.parse(readFileSync(new URL('../tokens/fixtures/lab.json',import.meta.url),'utf8'));
test('CSS preserves aliases, lengths, and mode selectors deterministically',()=>{
 const css=renderCSS(fixture());assert.match(css,/--sp-radius-control: var\(--sp-radius-base\)/);assert.match(css,/6px/);assert.match(css,/data-sp-mode-lab="Dark"/);assert.equal(css,renderCSS(fixture()));
});
test('invalid alias graphs, missing modes, and CSS-name collisions are rejected',()=>{
 let s=fixture();s.tokens[2].values.Light.alias='missing';assert.throws(()=>validateTokens(s),/alias/);
 s=fixture();s.tokens[1].values.Light={alias:'radius.control'};assert.throws(()=>validateTokens(s),/cycle/);
 s=fixture();delete s.tokens[1].values.Dark;assert.throws(()=>validateTokens(s),/modes/);
 s=fixture();s.tokens.push({...s.tokens[1],key:'radius-base',name:'other'});assert.throws(()=>validateTokens(s),/unique CSS/);
 s=fixture();s.tokens[1].values.Light=-Infinity;assert.throws(()=>validateTokens(s),/Invalid/);
});
