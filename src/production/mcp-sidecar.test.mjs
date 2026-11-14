import test from 'node:test';import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';import {reply,specs} from './mcp-sidecar.mjs';
test('MCP exposes only pure tools',()=>{assert.deepEqual(specs.map(s=>s.name),['prepare_archviz_task','review_geometry_metrics','validate_comfy_prompt']);assert.ok(reply({jsonrpc:'2.0',id:1,method:'initialize'}).result.capabilities.tools)});
test('MCP geometry tool never accepts',()=>{const r=reply({jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'review_geometry_metrics',arguments:{metrics:{source_id:'a',result_id:'b',alignment_error_px:0,contour_mismatch_ratio:0,reviewed_regions:1,protected_regions:1}}}});assert.equal(JSON.parse(r.result.content[0].text).status,'REVIEW_REQUIRED')});
test('MCP rejects unrecognized tool',()=>assert.equal(reply({jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'execute_shell'}}).error.code,-32602));
test('Real stdio subprocess handles JSON-RPC',async()=>{
 const child=spawn(process.execPath,[new URL('./mcp-sidecar.mjs',import.meta.url).pathname],{stdio:['pipe','pipe','pipe']});
 try{let buffer='',responses=[];child.stdout.on('data',chunk=>{buffer+=chunk.toString();while(buffer.includes('\n')){const i=buffer.indexOf('\n');const line=buffer.slice(0,i);buffer=buffer.slice(i+1);if(line)responses.push(JSON.parse(line));}});
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'test',version:'1'}}})+'\n');
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/list',params:{}})+'\n');
 for(let n=0;n<50&&responses.length<2;n++)await new Promise(r=>setTimeout(r,30));
 assert.equal(responses.length,2);assert.equal(responses[0].result.protocolVersion,'2025-06-18');assert.equal(responses[1].result.tools.length,3);
 }finally{child.kill()}
});