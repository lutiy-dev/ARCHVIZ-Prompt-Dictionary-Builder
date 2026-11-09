import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,existsSync,readFileSync,promises as fs,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
const root=process.cwd();
const mime={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[file.slice(file.lastIndexOf('.'))]||'application/octet-stream'}).end(data);
 }catch{res.writeHead(404).end('Not found');}
});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const exe=process.env.CHROME_BIN||['google-chrome','google-chrome-stable','chromium','chromium-browser'].find(c=>spawnSync('which',[c],{stdio:'ignore'}).status===0);
assert.ok(exe,'Real Chrome/Chromium required: browser test must not skip');
const profile=mkdtempSync(join(tmpdir(),'archviz-smoke-'));
let chrome,ws,seq=0;const pending=new Map(),exceptions=[];
function send(method,params={}){return new Promise((ok,bad)=>{
 const id=++seq,t=setTimeout(()=>{pending.delete(id);bad(Error('CDP timeout '+method));},12000);
 pending.set(id,msg=>{clearTimeout(t);msg.error?bad(Error(JSON.stringify(msg.error))):ok(msg.result)});
 ws.send(JSON.stringify({id,method,params}));
});}
async function evaluate(js){
 const r=await send('Runtime.evaluate',{expression:'(async()=>{'+js+'})()',awaitPromise:true,returnByValue:true});
 if(r.exceptionDetails)throw Error('Browser JS '+r.exceptionDetails.text);
 return r.result?.value;
}
async function poll(js,name){for(let i=0;i<100;i++){try{if(await evaluate(js))return;}catch{}await delay(100);}throw Error('Timeout: '+name);}
async function pass(label,js){assert.equal(await evaluate(js),true,label);console.log('BROWSER PASS '+label);}
try{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const url='http://127.0.0.1:'+server.address().port+'/';
 chrome=spawn(exe,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-allow-origins=*','--remote-debugging-port=0','--user-data-dir='+profile,url],{stdio:'ignore'});
 const portFile=join(profile,'DevToolsActivePort');
 for(let i=0;i<100&&!existsSync(portFile);i++)await delay(100);
 assert.ok(existsSync(portFile),'Chrome debugging port not created');
 const port=Number(readFileSync(portFile,'utf8').split('\n')[0]);
 let target;
 for(let i=0;i<100&&!target;i++){
  const list=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
  target=list.find(t=>t.type==='page'&&t.url.startsWith(url));if(!target)await delay(100);
 }
 assert.ok(target,'Chrome did not open app');
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((ok,bad)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',bad,{once:true});});
 ws.addEventListener('message',event=>{
  const m=JSON.parse(event.data);
  if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}
  else if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.text);
 });
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
 await poll('return !!document.querySelector("#vdTabVideo") && !!document.querySelector("#vdDemo")','DOM');
 await pass('Standard visible on first load','return !document.querySelector("#standardMode").hidden && document.querySelector("#videoDirectorRoot").hidden');
 const keys=await evaluate('return [localStorage.getItem("archviz-prompt-studio-v1"),localStorage.getItem("archviz-prompt-library-v1")]');
 await evaluate('document.querySelector("#vdTabVideo").click();document.querySelector("#vdDemo").click();return true');
 await pass('Synthetic demo and actor references appear','return !document.querySelector("#videoDirectorRoot").hidden && document.querySelectorAll("#vdShotList button").length===13 && document.querySelector("#vdPrompt").value.includes("subject_definitions:") && document.querySelector("#vdManifest").textContent.includes("male_ref")');
 await evaluate('document.querySelector("#vdShotFields .vd-item .vd-retention button").click();return true');
 await pass('Retention editor creates a rule','return !!document.querySelector("#vdShotFields .vd-retention-row")');
 await evaluate('let n=document.querySelectorAll("#vdShotFields .vd-retention-row select")[1];n.value="attribute_transfer";n.dispatchEvent(new Event("change",{bubbles:true}));return true');
 await evaluate('let n=document.querySelector("#vdShotFields .vd-retention-row input");n.value="facade, windows";n.dispatchEvent(new Event("change",{bubbles:true}));return true');
 await pass('Retention attributes compile','return document.querySelector("#vdPrompt").value.includes("attribute_transfer (attributes: facade, windows)")');
 await evaluate('window.prompt=()=> "Browser Smoke Preset";document.querySelector("#vdShotFields .vd-item .vd-actions button:nth-child(2)").click();return true');
 await pass('Custom layer preset saved','return document.querySelector("#vdLayerPresets").textContent.includes("Browser Smoke Preset")');
 await evaluate('document.querySelector("#vdLayerPresets button").click();return true');
 await pass('Layer preset cloned to the shot','return document.querySelectorAll("#vdShotFields .vd-retention-row").length>=2');
 const currentKeys=await evaluate('return [localStorage.getItem("archviz-prompt-studio-v1"),localStorage.getItem("archviz-prompt-library-v1")]');
 assert.deepEqual(currentKeys,keys,'Old storage keys changed');
 console.log('BROWSER PASS legacy storage unchanged');
 await send('Page.reload',{ignoreCache:true});
 await poll('return !!document.querySelector("#vdProjects") && document.querySelector("#vdProjects").options.length>1','project persists after reload');
 await pass('Video Director project persists','return localStorage.getItem("archviz-video-director-v1").includes("Browser Smoke Preset")');
 await poll('return !!navigator.serviceWorker?.controller','PWA controller');
 const cacheKeys=await evaluate('return await caches.keys()');
 assert.ok(cacheKeys.some(k=>k.startsWith('archviz-prompt-studio-shell-')),'PWA shell cache absent');
 console.log('BROWSER PASS service-worker cache installed');
 await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await send('Page.reload',{ignoreCache:false});
 await poll('return !!document.querySelector("#vdTabVideo") && !!document.querySelector("#vdProjects")','offline boot');
 await pass('PWA shell offline','return !!document.querySelector("#vdTabVideo") && !!document.querySelector("#vdProjects")');
 await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 assert.deepEqual(exceptions,[],'Uncaught JavaScript exceptions');
 console.log('BROWSER PASS no uncaught exceptions');
}finally{
 try{ws?.close();}catch{}
 if(chrome){const exit=new Promise(ok=>chrome.once('exit',ok));chrome.kill();await Promise.race([exit,delay(2500)]);}
 await new Promise(ok=>server.close(ok));
 try{rmSync(profile,{recursive:true,force:true,maxRetries:8,retryDelay:200});}catch(e){console.error('Chrome cleanup:',e.message);}
}
