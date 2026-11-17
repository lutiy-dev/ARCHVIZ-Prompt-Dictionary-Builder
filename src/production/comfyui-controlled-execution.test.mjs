import test from 'node:test';
import assert from 'node:assert/strict';
import {graphDigestWeb,stageControlledExecution,extractComfyOutputs,historyCompleted} from './comfyui-controlled-execution.mjs';

const cryptoImpl=globalThis.crypto;
const graph={
 '1':{class_type:'Loader',inputs:{ckpt_name:'model.safetensors'}},
 '2':{class_type:'SaveImage',inputs:{images:['1',0],filename_prefix:'ARCHVIZ'}}
};
const info={
 Loader:{input:{required:{ckpt_name:[['model.safetensors','other.safetensors']]}}},
 SaveImage:{input:{required:{images:['IMAGE'],filename_prefix:['STRING']}}}
};

test('controlled stage is deterministic, immutable and review-only',async()=>{
 const staged=await stageControlledExecution({graph,objectInfo:info,filename:'a.json',clientId:'client_1',cryptoImpl});
 assert.equal(staged.status,'READY_FOR_HUMAN_APPROVAL');
 assert.equal(staged.node_count,2);
 assert.equal(staged.model_count,1);
 assert.equal(staged.model_selection_verified,true);
 assert.equal(staged.geometry_verified,false);
 assert.equal(staged.queued,false);
 assert.match(staged.digest,/^[a-f0-9]{64}$/);
 const digest=await graphDigestWeb({'2':graph['2'],'1':graph['1']},cryptoImpl);
 assert.equal(staged.digest,digest);
 graph['1'].inputs.ckpt_name='other.safetensors';
 assert.equal(staged.graph['1'].inputs.ckpt_name,'model.safetensors');
});

test('stage blocks unknown models and invalid client ids',async()=>{
 const bad=structuredClone(graph);bad['1'].inputs.ckpt_name='missing.safetensors';
 await assert.rejects(()=>stageControlledExecution({graph:bad,objectInfo:info,filename:'a.json',clientId:'c1',cryptoImpl}),/model not in current node inventory/);
 await assert.rejects(()=>stageControlledExecution({graph,objectInfo:info,filename:'a.json',clientId:'bad id',cryptoImpl}),/invalid client id/);
});

test('output discovery uses only metadata returned by ComfyUI history',()=>{
 const history={prompt_1:{status:{completed:true},outputs:{'8':{images:[{filename:'final.png',subfolder:'ARCHVIZ',type:'output'}]},'9':{videos:[{filename:'clip.mp4',subfolder:'video',type:'output'}]}}}};
 assert.deepEqual(extractComfyOutputs(history,'prompt_1'),[
  {node_id:'8',kind:'images',filename:'final.png',subfolder:'ARCHVIZ',type:'output'},
  {node_id:'9',kind:'videos',filename:'clip.mp4',subfolder:'video',type:'output'}
 ]);
 assert.deepEqual(historyCompleted(history,'prompt_1'),{done:true,failed:false});
});

test('history completion stays pending without completion evidence and reports errors',()=>{
 assert.deepEqual(historyCompleted({prompt_1:{status:{status_str:'running'},outputs:{}}},'prompt_1'),{done:false,failed:false});
 assert.deepEqual(historyCompleted({prompt_1:{status:{status_str:'error'}}},'prompt_1'),{done:true,failed:true});
});
