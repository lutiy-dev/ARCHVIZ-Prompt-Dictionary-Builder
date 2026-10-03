import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compose} from './composer.mjs';
import {previewRu} from './translation-ru.mjs';
const library=JSON.parse(fs.readFileSync(new URL('../data/prompt_blocks.json',import.meta.url)));
const presets=JSON.parse(fs.readFileSync(new URL('../data/presets.json',import.meta.url)));
const preset=presets.find(p=>p.id==='first-last-video');
test('endpoint video composes both references, locked camera and translated defaults',()=>{
 const result=compose(library,preset.blocks.map(id=>({id})));
 assert.deepEqual(result.warnings,[]);
 assert.match(result.text,/starts at the first image and ends at the last image/);
 assert.match(result.text,/same camera/);
 assert.match(result.text,/camera locked/);
 assert.match(result.text,/5 seconds/);
 assert.ok(preset.blocks.includes('video-arch-preserve'));
 assert.ok(preset.blocks.includes('video-stability'));
 const ru=previewRu(result.text,library);
 assert.equal(ru.incomplete,false);
 assert.match(ru.text,/первым изображением и заканчивающийся последним/);
});
test('endpoint video retains custom duration and transition without altering EN',()=>{
 const result=compose(library,preset.blocks.map(id=>({id,parameters:id==='first-last-goal'?{duration:'8 seconds'}:id==='first-last-transition'?{transition:'summer changes gradually into autumn'}:{}})));
 assert.match(result.text,/8 seconds/);
 assert.match(result.text,/summer changes gradually into autumn/);
 assert.match(previewRu(result.text,library).text,/\[EN: summer changes gradually into autumn\]/);
 assert.ok(!result.text.includes('{{'));
});
test('endpoint video flags incompatible single-image references and moving camera',()=>{
 for(const id of ['video-arch-goal','video-object-goal','video-reference','video-motion']){
  const result=compose(library,[...preset.blocks,id].map(id=>({id})));
  assert.equal(result.warnings.length,1,id);
 }
});
