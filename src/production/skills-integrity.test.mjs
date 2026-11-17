import test from 'node:test';import assert from 'node:assert/strict';
import {gitBlobSha,fetchPinnedSkill} from './skills-router.mjs';
const raw='---\nname: archviz-geometry-guardian\ndescription: QC\n---\n# Skill';
const ref={name:'archviz-geometry-guardian',sha:'a'.repeat(40)};
test('Git SHA-1 object hashing matches expected blob format',()=>{assert.equal(gitBlobSha('hello'),'b6fc4c620b67d95f953a5c1c1230aaab5db5a1b0')});
test('Pinned source is integrity verified with exact known blob SHA',async()=>{const result=await fetchPinnedSkill(ref,{allowNetwork:true,expectedBlobSha:gitBlobSha(raw),fetchImpl:async()=>({ok:true,text:async()=>raw})});assert.equal(result.verified_source_integrity,true);assert.equal(result.source.status,'SOURCE_BLOB_VERIFIED')});
test('Unexpected source bytes are blocked rather than trusted',async()=>{await assert.rejects(()=>fetchPinnedSkill(ref,{allowNetwork:true,expectedBlobSha:'a'.repeat(40),fetchImpl:async()=>({ok:true,text:async()=>raw})}),/integrity mismatch/)});
