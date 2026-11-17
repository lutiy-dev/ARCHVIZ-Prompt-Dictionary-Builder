import test from 'node:test';import assert from 'node:assert/strict';
import {getDesktopStatus,discoverComfyUi,probeComfyUiPort,fetchComfyUiObjectInfo} from './desktop-bridge.mjs';
test('Web/PWA does not acquire native privileges',async()=>{const s=await getDesktopStatus(null);assert.equal(s.runtime,'WEB_PWA');assert.equal(s.external_execution_enabled,false)});
test('Desktop readiness comes only from native command result',async()=>{const s=await getDesktopStatus({core:{invoke:async name=>{assert.equal(name,'desktop_status');return{runtime:'TAURI_2_LAB',mcp_ready:true}}}});assert.equal(s.mcp_ready,true);assert.equal(s.external_execution_enabled,false)});
test('Failed or malformed native status fails closed',async()=>{assert.equal((await getDesktopStatus({core:{invoke:async()=>({runtime:'unknown',mcp_ready:true})}})).mcp_ready,false);assert.equal((await getDesktopStatus({core:{invoke:async()=>{throw Error('stop')}}})).runtime,'TAURI_UNVERIFIED')});

test('ComfyUI auto-discovery accepts only native CONNECTED/DISCONNECTED reports',async()=>{
 const calls=[];
 const state=await discoverComfyUi({core:{invoke:async name=>{calls.push(name);return{status:'CONNECTED_UNVERIFIED',origin:'http://127.0.0.1:8000',port:8000,api_verified:true}}}});
 assert.deepEqual(calls,['comfyui_discover']);assert.equal(state.origin,'http://127.0.0.1:8000');assert.equal(state.execution_allowed,false);
});
test('ComfyUI discovery fails closed in Web/PWA',async()=>{assert.equal((await discoverComfyUi(null)).reason,'DESKTOP_ONLY')});
test('Manual ComfyUI port validates range and invokes loopback probe',async()=>{
 assert.equal((await probeComfyUiPort(0,null)).reason,'INVALID_PORT');
 let seen;const state=await probeComfyUiPort('8188',{core:{invoke:async(name,args)=>{seen={name,args};return{status:'DISCONNECTED',origin:'http://127.0.0.1:8188',port:8188}}}});
 assert.deepEqual(seen,{name:'comfyui_probe_port',args:{port:8188}});assert.equal(state.status,'DISCONNECTED');
});

test('automatic object_info retrieval uses native read-only command',async()=>{
 let seen;const state=await fetchComfyUiObjectInfo(8188,{core:{invoke:async(name,args)=>{seen={name,args};return{status:'OBJECT_INFO_READY',port:8188,node_count:321,object_info:{KSampler:{}}}}}});
 assert.deepEqual(seen,{name:'comfyui_object_info',args:{port:8188}});
 assert.equal(state.status,'OBJECT_INFO_READY');assert.equal(state.node_count,321);assert.equal(state.execution_allowed,false);
});
test('automatic object_info fails closed without Desktop bridge',async()=>{assert.equal((await fetchComfyUiObjectInfo(8188,null)).reason,'DESKTOP_ONLY')});
