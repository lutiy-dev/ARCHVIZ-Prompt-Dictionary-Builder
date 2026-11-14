#!/usr/bin/env node
/** Windows CI smoke for the bundled native stdio sidecar, without model execution. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
const pathname=resolve(process.argv[2]||'');
assert.ok(process.argv[2]&&existsSync(pathname),'Native MCP executable missing');
const child=spawn(pathname,[],{stdio:['pipe','pipe','pipe'],windowsHide:true});
let buffer='',seq=0,stderr='',requests=new Map();
child.stderr.on('data',b=>{stderr+=b.toString().slice(0,1000)});
child.stdout.on('data',chunk=>{
 buffer+=chunk.toString();
 while(buffer.includes('\n')){
  const idx=buffer.indexOf('\n'),line=buffer.slice(0,idx);buffer=buffer.slice(idx+1);
  if(!line.trim())continue;
  const answer=JSON.parse(line),pending=requests.get(answer.id);
  if(pending){requests.delete(answer.id);clearTimeout(pending.timer);pending.resolve(answer)}
 }
});
function call(method,params={}){
 const id=++seq;
 return new Promise((resolveAnswer,reject)=>{
  const timer=setTimeout(()=>{requests.delete(id);reject(Error('Native MCP timed out: '+method+' '+stderr))},10000);
  requests.set(id,{resolve:resolveAnswer,timer});
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
 });
}
try{
 const hello=await call('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'ci-smoke',version:'1'}});
 assert.equal(hello.result.serverInfo.name,'ovizlab-mcp-native');
 assert.equal(hello.result.protocolVersion,'2025-06-18');
 child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
 const listed=await call('tools/list');
 assert.deepEqual(listed.result.tools.map(x=>x.name),['runtime_info']);
 const status=await call('tools/call',{name:'runtime_info',arguments:{}});
 assert.equal(status.result.isError,false);
 assert.equal(JSON.parse(status.result.content[0].text).external_execution_enabled,false);
 const rejected=await call('tools/call',{name:'arbitrary_shell',arguments:{}});
 assert.equal(rejected.error.code,-32602);
 console.log('NATIVE_MCP_STDIO_PASS');
}finally{
 for(const p of requests.values())clearTimeout(p.timer);
 child.kill();
}
