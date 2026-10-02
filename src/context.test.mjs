import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compose} from './composer.mjs';
import {previewRu} from './translation-ru.mjs';
const lib=JSON.parse(fs.readFileSync(new URL('../data/prompt_blocks.json',import.meta.url)));
const presets=JSON.parse(fs.readFileSync(new URL('../data/presets.json',import.meta.url)));
for(const id of ['environment-context','night-lighting','people-insertion'])test(`${id}: resolved, conflict-free EN/RU production prompt`,()=>{
 const p=presets.find(p=>p.id===id),r=compose(lib,p.blocks.map(id=>({id})));
 assert.equal(r.warnings.length,0);assert.ok(!r.text.includes('{{'));assert.ok(!previewRu(r.text,lib).incomplete);
});
test('Environment and people insertion detect incompatible existing controls',()=>{
 for(const pair of [['environment-extension','exclude'],['add-people','people'],['perspective-scale-match','video-motion'],['match-source-lighting','night']])assert.equal(compose(lib,pair.map(id=>({id}))).warnings.length,1,pair.join('/'));
});
test('People parameters and context parameters retain custom values in EN and mark RU fragments',()=>{
 const people=compose(lib,[{id:'add-people',parameters:{count:'three',activity:'waiting at the entrance'}}]).text;
 assert.match(people,/Add three new people/);assert.match(previewRu(people,lib).text,/\[EN: waiting at the entrance\]/);
 const context=compose(lib,[{id:'context-description',parameters:{context:'low-rise neighboring buildings'}}]).text;
 assert.match(context,/low-rise neighboring buildings/);
});
test('Night preset grounds illumination in existing sources without forcing new cars or fixtures',()=>{
 const p=presets.find(p=>p.id==='night-lighting');const text=compose(lib,p.blocks.map(id=>({id}))).text;
 assert.match(text,/do not add poles, fixtures/);assert.match(text,/visible existing vehicles/);assert.match(text,/some rooms dark/);assert.ok(!p.blocks.includes('match-source-lighting'));
});
