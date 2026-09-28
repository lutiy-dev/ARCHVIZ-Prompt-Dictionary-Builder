// Dependency-free checker for the keywords used in this schema only.
// Not a general JSON Schema implementation or metaschema validator.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const schema=read('schemas/prompt-blocks.v0.1.schema.json'),lib=read('data/prompt_blocks.json');
function check(v,s){
 if(s.const!==undefined)assert.deepEqual(v,s.const);
 if(s.enum)assert.ok(s.enum.includes(v));
 if(s.type==='object'){assert.ok(v!==null&&typeof v==='object'&&!Array.isArray(v));for(const k of s.required||[])assert.ok(Object.hasOwn(v,k));for(const [k,x] of Object.entries(v)){if(s.propertyNames)check(k,s.propertyNames);if(s.properties&&Object.hasOwn(s.properties,k))check(x,s.properties[k]);else if(s.additionalProperties===false)assert.fail('Unknown field '+k);else if(typeof s.additionalProperties==='object')check(x,s.additionalProperties);}}
 if(s.type==='array'){assert.ok(Array.isArray(v));if(s.minItems)assert.ok(v.length>=s.minItems);if(s.uniqueItems)assert.equal(new Set(v.map(x=>JSON.stringify(x))).size,v.length);if(s.items)for(const x of v)check(x,s.items);}
 if(s.type==='integer'){assert.ok(Number.isInteger(v));if(s.minimum!==undefined)assert.ok(v>=s.minimum);}
 if(s.type==='string'||s.pattern){assert.equal(typeof v,'string');if(s.minLength)assert.ok(v.length>=s.minLength);if(s.maxLength)assert.ok(v.length<=s.maxLength);if(s.pattern)assert.ok(new RegExp(s.pattern).test(v));}
}
check(lib,schema);const byId=new Map(lib.blocks.map(b=>[b.id,b]));assert.equal(byId.size,lib.blocks.length);
for(const b of lib.blocks){const matches=[...b.text.matchAll(/\{\{([a-z][a-z0-9_]*)\}\}/g)];assert.deepEqual([...new Set(matches.map(m=>m[1]))].sort(),Object.keys(b.parameters).sort());assert.ok(!/[{}]/.test(b.text.replace(/\{\{([a-z][a-z0-9_]*)\}\}/g,'')));for(const id of b.conflicts){assert.notEqual(id,b.id);assert.ok(byId.has(id));assert.ok(byId.get(id).conflicts.includes(b.id));}}
for(const d of read('data/dictionary.json')){const b=byId.get(d.block_id);assert.ok(b);assert.equal(d.term_en,b.en);assert.equal(d.term_ru,b.ru);assert.equal(d.category,b.category);}
for(const p of read('data/presets.json')){assert.equal(new Set(p.blocks).size,p.blocks.length);for(const id of p.blocks)assert.ok(byId.has(id));}
for(const mutate of [x=>x.blocks[0].status='TESTED',x=>x.blocks[0].section='TYPO',x=>x.blocks[5].parameters.scale='',x=>x.blocks[0].unexpected=true,x=>x.schema_version='0.1']){const bad=structuredClone(lib);mutate(bad);assert.throws(()=>check(bad,schema));}
console.log('PASS: schema keyword subset, 20 blocks, references/templates/metadata/conflict symmetry; 5 invalid fixtures rejected. Full Draft 2020-12 metaschema validation NOT run.');
