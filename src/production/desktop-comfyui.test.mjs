import test from 'node:test';import assert from 'node:assert/strict';
import {probeComfyUi} from './desktop-bridge.mjs';
test('Web PWA never makes local ComfyUI network requests',async()=>{const s=await probeComfyUi(null);assert.equal(s.status,'BLOCKED');assert.equal(s.execution_allowed,false)});
test('Native health uses restricted desktop IPC only',async()=>{const s=await probeComfyUi({core:{invoke:async name=>{assert.equal(name,'comfyui_health');return{status:'CONNECTED_UNVERIFIED'}}}});assert.equal(s.status,'CONNECTED_UNVERIFIED');assert.equal(s.execution_allowed,false)});
test('Malformed native response fails closed',async()=>{const s=await probeComfyUi({core:{invoke:async()=>({status:'EXECUTION_APPROVED'})}});assert.equal(s.status,'BLOCKED')});
