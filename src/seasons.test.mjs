import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compose} from './composer.mjs';
import {previewRu} from './translation-ru.mjs';
const lib=JSON.parse(fs.readFileSync(new URL('../data/prompt_blocks.json',import.meta.url)));
const presets=JSON.parse(fs.readFileSync(new URL('../data/presets.json',import.meta.url)));
test('four seasonal presets keep camera/mask and leave time of day independent',()=>{
 for(const season of ['spring','summer','autumn','winter']){
 const p=presets.find(p=>p.id==='season-'+season);assert.ok(p.blocks.includes(season));assert.ok(p.blocks.includes('mask'));assert.ok(p.blocks.includes('geometry'));
 const r=compose(lib,p.blocks.map(id=>({id})));assert.equal(r.warnings.length,0);assert.ok(!previewRu(r.text,lib).incomplete);
 for(const time of ['overcast','night','golden-hour','blue-hour','early-morning','bright-midday','late-afternoon','twilight'])assert.ok(!p.blocks.includes(time));
 }
});
test('Autumn leaves and Winter snow have editable defaults and translated previews',()=>{
 for(const id of ['added-snow-cover','autumn-fallen-leaves']){
 const b=lib.blocks.find(b=>b.id===id);assert.deepEqual(Object.keys(b.parameters),['amount','distribution']);
 const r=compose(lib,[{id,parameters:{amount:'moderate coverage',distribution:'near the left edge'}}]);assert.match(r.text,/moderate coverage/);assert.match(r.text,/near the left edge/);assert.match(previewRu(r.text,lib).text,/\[EN: moderate coverage\]/);
 assert.match(b.text,/entrances/);assert.match(b.text,/mask/);
 }
});
test('ground decorations flag incompatible seasons and each other',()=>{
 for(const pair of [['added-snow-cover','spring'],['added-snow-cover','summer'],['added-snow-cover','autumn'],['autumn-fallen-leaves','spring'],['autumn-fallen-leaves','summer'],['autumn-fallen-leaves','winter'],['added-snow-cover','autumn-fallen-leaves']])assert.equal(compose(lib,pair.map(id=>({id}))).warnings.length,1);
});
