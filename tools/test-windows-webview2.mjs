#!/usr/bin/env node
/** Real Windows release EXE / WebView2 UI smoke using Chromium DevTools Protocol.
 * No installation, credential use, external network, or writes to user projects.
 * Fails closed if WebView2 debugging is unavailable (not a successful UI test).
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createServer} from 'node:net';

if(process.platform!=='win32')throw Error('Windows-only WebView2 smoke');
const exe=resolve(process.argv[2]||'src-tauri/target/release/ovizlab-prompt-studio.exe');
assert.ok(existsSync(exe),'Release executable missing: '+exe);
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const port=await new Promise((ok,bad)=>{
 const server=createServer();server.once('error',bad);
 server.listen(0,'127.0.0.1',()=>{const p=server.address().port;server.close(()=>ok(p));});
});
const env={...process.env,WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS:'--remote-debugging-port='+port};
let app,ws;const pending=new Map();let sequence=0;
function send(method,params={}){
 return new Promise((ok,bad)=>{
  const id=++sequence;
  const timeout=setTimeout(()=>{pending.delete(id);bad(Error('CDP timeout '+method));},8000);
  pending.set(id,message=>{clearTimeout(timeout);message.error?bad(Error(JSON.stringify(message.error))):ok(message.result);});
  ws.send(JSON.stringify({id,method,params}));
 });
}
try{
 app=spawn(exe,[],{cwd:resolve('src-tauri/target/release'),env,stdio:'ignore'});
 let target;
 for(let i=0;i<180&&!target;i++){
  if(app.exitCode!==null)throw Error('Desktop exited before WebView2 attached: '+app.exitCode);
  try{
   const response=await fetch('http://127.0.0.1:'+port+'/json/list',{signal:AbortSignal.timeout(1000)});
   if(response.ok)target=(await response.json()).find(x=>x.type==='page'&&x.webSocketDebuggerUrl);
  }catch{}
  if(!target)await sleep(200);
 }
 assert.ok(target,'FAIL: WebView2 DevTools endpoint never appeared; desktop UI NOT VERIFIED');
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((ok,bad)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',bad,{once:true});});
 ws.addEventListener('message',event=>{let message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){pending.get(message.id)(message);pending.delete(message.id);}});
 await send('Runtime.enable');
 let report;
 for(let i=0;i<100;i++){
  const response=await send('Runtime.evaluate',{expression:'({ready:document.readyState,title:document.title,bodyText:document.body?.innerText?.slice(0,250),standard:!!document.querySelector("#standardMode"),video:!!document.querySelector("#videoDirectorRoot"),production:!!document.querySelector("#productionRoot"),background:getComputedStyle(document.body).backgroundColor,url:location.href})',returnByValue:true});
  report=response.result?.value;
  if(report?.standard&&report?.video&&report?.production)break;
  await sleep(150);
 }
 console.log('WEBVIEW2_UI_DIAGNOSTIC',JSON.stringify(report));
 assert.ok(report?.standard&&report?.video&&report?.production,'FAIL: WebView2 release executable did not render Prompt Studio HTML');
 assert.ok(report.bodyText?.includes('ARCHVIZ')||report.bodyText?.includes('Prompt Studio'),'FAIL: WebView2 body empty or wrong application');
 console.log('WINDOWS_WEBVIEW2_UI_PASS');
}finally{
 for(const x of pending.values())clearTimeout(x);
 try{ws?.close()}catch{}
 if(app){app.kill();await sleep(600);}
}
