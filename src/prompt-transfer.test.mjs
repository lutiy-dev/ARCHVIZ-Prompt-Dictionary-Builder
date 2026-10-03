import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {exportPrompts,importPrompts,transferLimit} from './prompt-transfer.mjs';
import {snapshotPrompt,writePrompts,readPrompts} from './saved-prompts.mjs';
const library=JSON.parse(fs.readFileSync(new URL('../data/prompt_blocks.json',import.meta.url))),presets=JSON.parse(fs.readFileSync(new URL('../data/presets.json',import.meta.url)));
const record=id=>snapshotPrompt({id,name:'Transfer',scenario:'facade',text:'Frozen English final text',selection:[{id:'brick',parameters:{scale:'custom'}}],library,createdAt:'2026-10-03T00:00:00.000Z'});
const envelope=(...prompts)=>({schema_version:1,prompts});
test('single and all exports import frozen text and snapshots, preserving existing library',()=>{
 const current=envelope(record('home')),original=structuredClone(current);
 const one=importPrompts(exportPrompts(envelope(record('work')),library,presets),current,library,presets);
 assert.equal(one.added,1);assert.deepEqual(current,original);
 const all=importPrompts(exportPrompts(one.data,library,presets),envelope(),library,presets);
 assert.deepEqual(all.data,one.data);
 const store=new Map([['archviz-prompt-studio-v1','unchanged']]);const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 writePrompts(storage,all.data,library,presets);assert.deepEqual(readPrompts(storage,library,presets).data,all.data);assert.equal(store.get('archviz-prompt-studio-v1'),'unchanged');
});
test('repeat import skips IDs, including reordered parameter keys; changed same ID rejects atomically',()=>{
 const current=envelope(record('same')),reordered=structuredClone(current);reordered.prompts[0].parameters.brick=Object.fromEntries(Object.entries(reordered.prompts[0].parameters.brick).reverse());
 const repeated=importPrompts(JSON.stringify(reordered),current,library,presets);assert.equal(repeated.added,0);assert.equal(repeated.skipped,1);
 const incoming=envelope(record('new'),record('same'));incoming.prompts[1].text='different';assert.throws(()=>importPrompts(JSON.stringify(incoming),current,library,presets));assert.equal(current.prompts.length,1);
});
test('malformed, unknown references, wrong versions, over-limit files and capacity reject without mutation',()=>{
 const current=envelope(record('existing')),before=JSON.stringify(current);
 const bad=envelope(record('bad'));bad.prompts[0].blockIds=['unknown'];
 for(const text of ['{broken',JSON.stringify({schema_version:2,prompts:[]}),JSON.stringify(bad),' '.repeat(transferLimit+1)])assert.throws(()=>importPrompts(text,current,library,presets));
 const full=envelope(...Array.from({length:500},(_,i)=>record(String(i))));assert.throws(()=>importPrompts(JSON.stringify(envelope(record('overflow'))),full,library,presets));
 assert.equal(JSON.stringify(current),before);
});
