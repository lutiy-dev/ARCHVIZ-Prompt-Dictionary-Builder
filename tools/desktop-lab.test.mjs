import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createLabHost} from './desktop-lab.mjs';
test('Desktop LAB starts private MCP and loopback HTTP, then stops',async()=>{
 const host=createLabHost();let state;
 try{
  state=await host.start();assert.equal(state.mcp,'STDIO_READY');
  assert.equal(state.tools.length,3);assert.match(state.url,/^http:\/\/127\.0\.0\.1:\d+\/$/);
  const html=await fetch(state.url).then(r=>r.text());assert.match(html,/ARCHVIZ/);
  const script=await fetch(new URL('src/production/ui.mjs',state.url));assert.equal(script.status,200);
  const bad=await fetch(new URL('src/production/unknown.secret',state.url));assert.equal(bad.status,404);
  const noPost=await fetch(state.url,{method:'POST'});assert.equal(noPost.status,405);
 }finally{await host.stop()}
 assert.equal(host.ready,false);
 await assert.rejects(()=>fetch(state.url),/fetch failed|ECONNREFUSED/);
});
test('Desktop LAB rejects unsafe port and double start',async()=>{
 const host=createLabHost();try{await host.start();await assert.rejects(()=>host.start(),/already started/)}finally{await host.stop()}
});
test('Desktop LAB process advertises readiness and handles exit',async()=>{
 const child=spawn(process.execPath,[new URL('./desktop-lab.mjs',import.meta.url).pathname,'--no-browser'],{stdio:['ignore','pipe','pipe']});
 let output='';
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('LAB_READY timed out')),8000);
   child.stdout.on('data',chunk=>{output+=chunk.toString();if(output.includes('LAB_READY ')){clearTimeout(timer);resolve()}});
   child.once('exit',code=>{clearTimeout(timer);reject(Error('Exited before ready '+code))});
  });
  assert.match(output,/STDIO_READY/);
 }finally{child.kill('SIGTERM')}
});
