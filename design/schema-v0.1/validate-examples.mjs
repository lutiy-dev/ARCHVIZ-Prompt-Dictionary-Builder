// Offline validator for the subset of JSON Schema used by this design.
// Not a general Draft 2020-12 validator; no metaschema validation.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const common=read('common.schema.json'),ds=read('dictionary.schema.json'),bs=read('prompt-blocks.schema.json');
const dictionary=read('examples/dictionary.json'),library=read('examples/prompt_blocks.json');
function check(v,s){
 if(s.$ref){assert.ok(s.$ref.startsWith('common.schema.json#/$defs/'));return check(v,common.$defs[s.$ref.split('/').at(-1)]);}
 if(s.anyOf){assert.ok(s.anyOf.some(x=>{try{check(v,x);return true;}catch{return false;}}));return;}
 if(Object.hasOwn(s,'const'))assert.deepEqual(v,s.const);
 if(s.enum)assert.ok(s.enum.includes(v));
 if(s.type){const types=Array.isArray(s.type)?s.type:[s.type];assert.ok(types.some(t=>t==='null'?v===null:t==='array'?Array.isArray(v):t==='object'?v!==null&&typeof v==='object'&&!Array.isArray(v):t==='integer'?Number.isInteger(v):t==='number'?typeof v==='number'&&Number.isFinite(v):typeof v===t));}
 if(typeof v==='string'){if(s.minLength)assert.ok([...v].length>=s.minLength);if(s.pattern)assert.ok(new RegExp(s.pattern).test(v));}
 if(typeof v==='number'&&s.minimum!==undefined)assert.ok(v>=s.minimum);
 if(Array.isArray(v)){if(s.minItems)assert.ok(v.length>=s.minItems);if(s.uniqueItems)assert.equal(new Set(v.map(x=>JSON.stringify(x))).size,v.length);if(s.items)for(const x of v)check(x,s.items);}
 if(v!==null&&typeof v==='object'&&!Array.isArray(v)){for(const k of s.required||[])assert.ok(Object.hasOwn(v,k));for(const [k,x] of Object.entries(v)){if(s.propertyNames)check(k,s.propertyNames);if(s.properties&&Object.hasOwn(s.properties,k))check(x,s.properties[k]);else if(s.additionalProperties===false)assert.fail('Unknown field: '+k);else if(typeof s.additionalProperties==='object')check(x,s.additionalProperties);}}
}
function valueCheck(p,v){if(p.type==='text'){assert.equal(typeof v,'string');assert.ok(v.trim().length>0&&[...v].length<=p.max_length&&!/\{\{|\}\}/.test(v));}else if(p.type==='enum')assert.ok(p.options.some(o=>o.value===v));else{assert.equal(typeof v,'number');assert.ok(Number.isFinite(v)&&v>=p.minimum&&v<=p.maximum);if(p.type==='integer')assert.ok(Number.isInteger(v));}}
function semantic(d,l){
 check(d,ds);check(l,bs);assert.equal(d.library_revision,l.library_revision);
 const terms=new Map(d.terms.map(t=>[t.id,t])),blocks=new Map(l.blocks.map(b=>[b.id,b]));assert.equal(terms.size,d.terms.length);assert.equal(blocks.size,l.blocks.length);
 for(const x of [...d.terms,...l.blocks]){if(x.provenance.origin!=='authored')assert.ok(x.provenance.source_refs.length);if(x.quality.content_status!=='GENERATED')assert.ok(x.quality.evidence_refs.length);if(x.quality.maturity==='production_standard'){assert.equal(x.quality.content_status,'TESTED');assert.ok(x.quality.approval_refs.length);}}
 for(const t of d.terms)for(const id of t.related_term_ids){assert.notEqual(id,t.id);assert.ok(terms.has(id));}
 for(const b of l.blocks){
  for(const r of b.term_refs)assert.equal(terms.get(r.id)?.revision,r.revision);
  for(const r of b.requires_all){assert.notEqual(r.id,b.id);assert.equal(blocks.get(r.id)?.revision,r.revision);}
  for(const id of b.conflicts_with){assert.notEqual(id,b.id);assert.ok(blocks.has(id));}
  assert.equal(new Set(b.required_inputs.map(i=>i.role)).size,b.required_inputs.length);
  for(const language of ['en','ru']){const text=b.template[language],keys=[...new Set([...text.matchAll(/\{\{([a-z][a-z0-9_]*)\}\}/g)].map(m=>m[1]))].sort();assert.deepEqual(keys,Object.keys(b.parameters).sort());assert.ok(!/[{}]/.test(text.replace(/\{\{([a-z][a-z0-9_]*)\}\}/g,'')));}
  for(const p of Object.values(b.parameters)){
   const numerical=['number','integer'].includes(p.type);
   if(numerical){assert.ok(Number.isFinite(p.minimum)&&Number.isFinite(p.maximum)&&p.minimum<=p.maximum);assert.ok(!Object.hasOwn(p,'options')&&!Object.hasOwn(p,'max_length'));}
   else{assert.ok(!Object.hasOwn(p,'minimum')&&!Object.hasOwn(p,'maximum'));if(p.type==='text'){assert.ok(Number.isInteger(p.max_length)&&p.max_length>0);assert.ok(!Object.hasOwn(p,'options'));}else{assert.ok(p.options?.length);assert.equal(new Set(p.options.map(o=>o.value)).size,p.options.length);assert.ok(!Object.hasOwn(p,'max_length'));}}
   if(Object.hasOwn(p,'default'))valueCheck(p,p.default);
  }
 }
 const active=new Set(),done=new Set();function walk(id){assert.ok(!active.has(id),'Dependency cycle');if(done.has(id))return;active.add(id);for(const r of blocks.get(id).requires_all)walk(r.id);active.delete(id);done.add(id);}for(const id of blocks.keys())walk(id);
}
semantic(dictionary,library);
let rejected=0;const fails=[
 (d,l)=>l.schema_version=1,
 (d,l)=>l.blocks[0].unknown='x',
 (d,l)=>l.blocks[2].section='TYPO',
 (d,l)=>l.blocks[2].term_refs[0].revision=99,
 (d,l)=>l.blocks[2].requires_all[0].id='missing',
 (d,l)=>l.blocks[0].requires_all=[{id:l.blocks[2].id,revision:1}],
 (d,l)=>l.blocks[2].template.ru+=' {{unknown}}',
 (d,l)=>l.blocks[2].parameters.joint_width_mm.default='wide',
 (d,l)=>l.blocks[2].parameters.roughness.default='unknown',
 (d,l)=>l.blocks[2].parameters.joint_width_mm.maximum=-1,
 (d,l)=>l.blocks[0].quality.content_status='TESTED',
 (d,l)=>l.blocks[0].quality.maturity='production_standard',
 (d,l)=>d.library_revision='other',
 (d,l)=>d.terms[0].provenance.origin='imported',
 (d,l)=>l.blocks.push(structuredClone(l.blocks[0]))
];
for(const mutate of fails){const d=structuredClone(dictionary),l=structuredClone(library);mutate(d,l);assert.throws(()=>semantic(d,l));rejected++;}
console.log(`PASS: 4 terms + 4 blocks; schema subset, bilingual placeholders, parameter constraints, exact references, dependencies, provenance/status gates. ${rejected} negative fixtures rejected. No full metaschema validation, runtime adapter, UI or image tests.`);
