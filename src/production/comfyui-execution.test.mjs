import test from 'node:test';import assert from 'node:assert/strict';
import {createComfyExecutionGate,graphDigest} from './comfyui-execution.mjs';
const graph={'1':{class_type:'SaveImage',inputs:{images:['2',0],filename_prefix:'ARCHVIZ'}} ,'2':{class_type:'LoadImage',inputs:{image:'original.png'}}};
const info={SaveImage:{input:{required:{images:['IMAGE'],filename_prefix:['STRING']}}},LoadImage:{input:{required:{image:['STRING']}}}};
test('Digest is deterministic under object key ordering',()=>{assert.equal(graphDigest(graph),graphDigest({'2':graph['2'],'1':graph['1']}))});
test('Cannot queue without a reviewed exact graph',async()=>{
 let calls=0;const gate=createComfyExecutionGate({fetchImpl:async()=>{calls++;return {ok:true,json:async()=>({prompt_id:'p1'})}}});
 await assert.rejects(()=>gate.queue({ticket:'x'}),/BLOCKED/);
 const staged=gate.stage({graph,objectInfo:info,clientId:'c1'});
 assert.equal(staged.model_selection_verified,false);
 assert.throws(()=>gate.approve({digest:staged.digest,userConfirmed:false}),/BLOCKED/);
 assert.throws(()=>gate.approve({digest:'a'.repeat(64),userConfirmed:true}),/BLOCKED/);
 assert.equal(calls,0);
});
test('One approval authorizes one POST; graph cloned before mutation',async()=>{
 let urls=[],payloads=[];
 const gate=createComfyExecutionGate({fetchImpl:async(url,opts)=>{urls.push(url);payloads.push(JSON.parse(opts.body));return {ok:true,json:async()=>({prompt_id:'prompt_1'})}}});
 const copy=structuredClone(graph),staged=gate.stage({graph:copy,objectInfo:info,clientId:'user_1'});
 copy['2'].inputs.image='mutated.png';
 const ticket=gate.approve({digest:staged.digest,userConfirmed:true}).ticket;
 const sent=await gate.queue({ticket});
 assert.equal(sent.status,'QUEUED_UNVERIFIED');assert.equal(sent.geometry_verified,false);
 assert.equal(payloads[0].prompt['2'].inputs.image,'original.png');
 assert.deepEqual(urls,['http://127.0.0.1:8188/prompt']);
 await assert.rejects(()=>gate.queue({ticket}),/BLOCKED/);
});
test('Missing required nodes reject before approval',()=>{const gate=createComfyExecutionGate();assert.throws(()=>gate.stage({graph,objectInfo:{}}),/BLOCKED/)});
test('Remote hosts and invalid prompt IDs fail closed',async()=>{
 assert.throws(()=>createComfyExecutionGate({origin:'http://192.168.1.5:8188'}),/BLOCKED/);
 const gate=createComfyExecutionGate({fetchImpl:async()=>({ok:true,json:async()=>({prompt_id:'../bad'})})});
 const staged=gate.stage({graph,objectInfo:info});
 const token=gate.approve({digest:staged.digest,userConfirmed:true}).ticket;
 await assert.rejects(()=>gate.queue({ticket:token}),/invalid prompt_id/);
});
test('History requires a safe identifier and is always unreviewed',async()=>{
 const gate=createComfyExecutionGate({fetchImpl:async()=>({ok:true,json:async()=>({prompt_1:{status:{completed:true}}})})});
 await assert.rejects(()=>gate.history('../oops'),/BLOCKED/);
 const data=await gate.history('prompt_1');assert.equal(data.status,'HISTORY_RECEIVED_UNREVIEWED');
});
