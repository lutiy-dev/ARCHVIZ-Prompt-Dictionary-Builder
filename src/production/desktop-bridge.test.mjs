import test from 'node:test';import assert from 'node:assert/strict';
import {getDesktopStatus} from './desktop-bridge.mjs';
test('Web/PWA does not acquire native privileges',async()=>{const s=await getDesktopStatus(null);assert.equal(s.runtime,'WEB_PWA');assert.equal(s.external_execution_enabled,false)});
test('Desktop readiness comes only from native command result',async()=>{const s=await getDesktopStatus({core:{invoke:async name=>{assert.equal(name,'desktop_status');return{runtime:'TAURI_2_LAB',mcp_ready:true}}}});assert.equal(s.mcp_ready,true);assert.equal(s.external_execution_enabled,false)});
test('Failed or malformed native status fails closed',async()=>{assert.equal((await getDesktopStatus({core:{invoke:async()=>({runtime:'unknown',mcp_ready:true})}})).mcp_ready,false);assert.equal((await getDesktopStatus({core:{invoke:async()=>{throw Error('stop')}}})).runtime,'TAURI_UNVERIFIED')});
