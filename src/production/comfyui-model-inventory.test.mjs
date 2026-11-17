import test from 'node:test';import assert from 'node:assert/strict';
import {verifySelectedModels,createComfyExecutionGate} from './comfyui-execution.mjs';
const graph={'1':{class_type:'CheckpointLoaderSimple',inputs:{ckpt_name:'verified.safetensors'}}};
const info={CheckpointLoaderSimple:{input:{required:{ckpt_name:[['verified.safetensors','other.safetensors']]}}}};
test('Selected checkpoint must match exact live object_info choice',()=>{const r=verifySelectedModels(graph,info);assert.equal(r.model_selection_verified,true);assert.equal(r.verified,1)});
test('Absent or substituted model is blocked',()=>{const replaced=structuredClone(graph);replaced['1'].inputs.ckpt_name='missing.safetensors';assert.throws(()=>verifySelectedModels(replaced,info),/model not in current node inventory/);assert.throws(()=>verifySelectedModels(graph,{}),/model not in current node inventory/)});
test('COMBO format also verifies current model names',()=>{const combo={CheckpointLoaderSimple:{input:{required:{ckpt_name:['COMBO',{options:['verified.safetensors']}]}}}};assert.equal(verifySelectedModels(graph,combo).verified,1)});
test('ComfyUI stage refuses absent model before issuing approval ticket',()=>{const gate=createComfyExecutionGate();assert.throws(()=>gate.stage({graph,objectInfo:{}}),/unsupported workflow/);const staged=gate.stage({graph,objectInfo:info});assert.equal(staged.model_selection_verified,true);assert.equal(staged.model_count,1)});
