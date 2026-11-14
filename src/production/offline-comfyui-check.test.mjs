import test from 'node:test';
import assert from 'node:assert/strict';
import {validateOfflineComfyFiles} from './offline-comfyui-check.mjs';
const file=x=>({size:Buffer.byteLength(x),text:async()=>x});
const definitions=file(JSON.stringify({Example:{input:{required:{text:['STRING',{}]}}}}));
test('offline API prompt validation does not queue or imply runtime verification',async()=>{
 const graph=file(JSON.stringify({'1':{class_type:'Example',inputs:{text:'test'}}}));
 const report=await validateOfflineComfyFiles(graph,definitions);
 assert.equal(report.valid,true);assert.equal(report.queue_allowed,false);
 assert.equal(report.runtime_tested,false);assert.equal(report.model_selection_verified,false);
 assert.equal(report.network_used,false);assert.equal(report.status,'OFFLINE_VALIDATED_UNVERIFIED');
});
test('unsupported node fails without approval',async()=>{
 const graph=file(JSON.stringify({'1':{class_type:'Unknown',inputs:{}}}));
 const report=await validateOfflineComfyFiles(graph,definitions);
 assert.equal(report.valid,false);assert.equal(report.status,'BLOCKED');
});
test('reject GUI workflow and malformed or oversized inputs',async()=>{
 await assert.rejects(validateOfflineComfyFiles(file('{"nodes":[]}'),definitions),/UI workflow JSON/);
 await assert.rejects(validateOfflineComfyFiles(file('{'),definitions),/valid JSON/);
 await assert.rejects(validateOfflineComfyFiles({size:9*1024*1024,text:async()=>{throw Error('must never read')}},definitions),/8 MiB/);
});
