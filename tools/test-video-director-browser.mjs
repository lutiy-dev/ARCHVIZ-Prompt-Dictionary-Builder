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
async function pass(label,js){const got=await evaluate(js);
 if(got!==true){const diagnostics=await evaluate('return {notice:document.querySelector("#vdNotice")?.textContent,projects:document.querySelector("#vdProjects")?.options?.length,shotButtons:document.querySelectorAll("#vdShotList button").length,prompt:document.querySelector("#vdPrompt")?.value?.slice(0,200),manifest:document.querySelector("#vdManifest")?.textContent?.slice(0,200),visible:document.querySelector("#videoDirectorRoot")?.hidden,exceptions:window.__vdErrors||null}');console.error('BROWSER DIAGNOSTICS '+label,JSON.stringify(diagnostics));}
 assert.equal(got,true,label);console.log('BROWSER PASS '+label);}
try{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const url='http://127.0.0.1:'+server.address().port+'/';
 chrome=spawn(exe,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-allow-origins=*','--remote-debugging-port=0','--user-data-dir='+profile,url],{stdio:['ignore','ignore','pipe']});
 let chromeStderr='';chrome.stderr.on('data',part=>{chromeStderr=(chromeStderr+part.toString()).slice(-2000)});
 const portFile=join(profile,'DevToolsActivePort');
 for(let i=0;i<250&&!existsSync(portFile)&&chrome.exitCode===null;i++)await delay(100);
 assert.ok(existsSync(portFile),'Chrome debugging port not created within 25s; exit='+chrome.exitCode+' stderr='+chromeStderr);
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
 await poll('return document.querySelector("#videoDirectorRoot")?.dataset.ready==="true" && document.querySelector("#vdTabVideo")?.dataset.ready==="true"','app initialization');
 await pass('Standard visible on first load','return !document.querySelector("#standardMode").hidden && document.querySelector("#videoDirectorRoot").hidden');
 await pass('Standard Dictionary has independent scroll within bounded panel','const lib=document.querySelector("#library");return getComputedStyle(lib).overflowY==="auto"&&lib.clientHeight>0&&lib.scrollHeight>lib.clientHeight');

 await pass('Shared UI design tokens loaded','return getComputedStyle(document.documentElement).getPropertyValue("--ds-content-max").trim()==="1680px" && getComputedStyle(document.documentElement).getPropertyValue("--panel").trim()===getComputedStyle(document.documentElement).getPropertyValue("--card").trim()');
 await pass('Unified stylesheet loaded without 404','return [...document.styleSheets].some(s=>s.href?.includes("design-system.css"))');
 await pass('Video and Production use open workspace shells','const roots=[".vd-root",".production-root"].map(s=>getComputedStyle(document.querySelector(s)));return roots.every(s=>s.borderTopWidth==="0px"&&s.backgroundImage==="none")');

 await poll('return document.querySelector("#productionRoot")?.dataset.ready==="true"','production initialization');
 await evaluate('document.querySelector("#productionTab").click();return true');
 await pass('Production cabinet navigation','return !document.querySelector("#productionRoot").hidden && document.querySelector("#standardMode").hidden && document.querySelector("#productionCabinets").querySelectorAll("button").length===5');
 await pass('Shared workspace context reflects selected mode','return document.querySelector("#workspaceContext")?.textContent.includes("AI Production")');
 await evaluate('document.querySelector("#productionProject").value="project_01";document.querySelector("#productionBrief").value="Preserve hotel geometry";document.querySelector(".production-panel button").click();return true');
 await pass('Art Director prepares a safe local draft','return document.querySelector("#productionTask").value.includes("archviz_production_task") && document.querySelector("#productionTask").value.includes("HARD")');
 await pass('Inspector defaults to summary with unchanged JSON contract','return document.querySelector("#productionSummary")?.hidden===false && document.querySelector("#productionTask").value.includes("archviz_production_task") && document.querySelector("[data-view=summary]")?.getAttribute("aria-selected")==="true"');
 await pass('Result Inspector JSON scroll height constrained','const area=document.querySelector("#productionTask"),style=getComputedStyle(area);return style.overflowY==="auto"&&parseFloat(style.maxHeight)>0');

 await evaluate('document.querySelector("[data-view=json]").click();return true');
 await pass('Inspector JSON is accessible and complete','return !document.querySelector("#productionJson").hidden && document.querySelector("#productionTask").value.includes("architecture_lock") && document.querySelector("#productionSummary").hidden');
 await evaluate('document.querySelector("[data-view=json]").dispatchEvent(new KeyboardEvent("keydown",{key:"Home",bubbles:true}));return true');
 await pass('Result Inspector keyboard Home returns to Summary','return !document.querySelector("#productionSummary").hidden && document.querySelector("[data-view=summary]").getAttribute("aria-selected")==="true" && document.activeElement===document.querySelector("[data-view=summary]")');

 await evaluate('document.querySelector("[data-view=issues]").click();return true');
 await pass('Inspector issues does not claim geometry verified','return !document.querySelector("#productionIssues").hidden && document.querySelector("#productionIssues").textContent.includes("NOT VERIFIED")');
 await evaluate('document.querySelector("[data-view=history]").click();return true');
 await pass('Inspector history reflects isolated records','return !document.querySelector("#productionHistory").hidden && document.querySelector("#productionHistoryPreview").textContent.includes("GENERATED")');

 await pass('Art Director candidate review requires explicit input','return document.querySelector("#productionCandidateJson")?.tagName==="TEXTAREA" && document.querySelector("#productionContent").textContent.includes("Accept recommendations")');

 await pass('Independent Production History key written','return JSON.parse(localStorage.getItem("archviz-production-history-v1")).records.length===1');

 await evaluate('Array.from(document.querySelectorAll("#productionCabinets button")).find(x=>x.dataset.cabinet==="mcp_comfyui").click();return true');
 await pass('MCP integrations are disconnected by default','return document.querySelector("#productionContent").textContent.includes("NOT CONNECTED")');
 await pass('Local ComfyUI auto-discovery exposed as an explicit read-only action','return document.querySelector("#productionContent").textContent.includes("Re-detect local ComfyUI") && document.querySelector("#productionContent").textContent.includes("Manual localhost port")');
 await pass('Web/PWA auto-discovery remains Desktop-only','return document.querySelector("#productionContent").textContent.includes("Web/PWA") && document.querySelector("#productionContent").textContent.includes("read-only")');

 await evaluate('Array.from(document.querySelectorAll("#productionCabinets button")).find(x=>x.dataset.cabinet==="geometry_guardian").click();return true');
 await pass('Geometry QC displays two local image inputs and diff action','return document.querySelector("#productionOriginalFile")?.type==="file" && document.querySelector("#productionCandidateFile")?.type==="file" && document.querySelector("#productionContent").textContent.includes("Compare local image pixels")');
 await pass('Geometry Guardian shows side-by-side local preview placeholders','return document.querySelectorAll(".production-image-preview").length===2 && document.querySelectorAll(".production-image-preview figcaption").length===2');

 await evaluate('document.querySelector("#vdTabStandard").click();return true');


 async function mouseClick(selector){
  const point=await evaluate('const el=document.querySelector('+JSON.stringify(selector)+');const r=el.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;const hit=document.elementFromPoint(x,y);return {x,y,hit:hit?.id||hit?.className,reachable:hit===el||el.contains(hit)}');
  assert.ok(point.reachable,'Pointer blocked for '+selector+': '+JSON.stringify(point));
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',clickCount:1});
 }
 for(const [width,height] of [[1920,1080],[1366,768],[1101,800],[1100,800],[960,768],[800,900],[390,844]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await evaluate('window.scrollTo(0,0);return true');
  await pass('Mode tabs have space at '+width+'x'+height,'const nav=document.querySelector(".vd-mode-tabs"),r=nav.getBoundingClientRect(),b=document.querySelector("#vdTabVideo").getBoundingClientRect();return b.height>0 && b.top>=r.top && b.bottom<=r.bottom');
  await mouseClick('#productionTab');
  await pass('Production cabinet uses full content width at '+width+'x'+height,
   'const host=document.querySelector(".production-content"),panel=host.querySelector(".production-panel"),layout=document.querySelector(".production-layout");const a=host.getBoundingClientRect(),b=panel.getBoundingClientRect();return getComputedStyle(host).display==="block" && b.width>0 && b.width>=a.width*0.95 && layout.getBoundingClientRect().width<=innerWidth+1');
  await pass('Production QC output responsive at '+width+'x'+height,
   'const a=document.querySelector(".production-content").getBoundingClientRect(),b=document.querySelector(".production-output").getBoundingClientRect();return innerWidth>=1400?b.left>=a.right-2:b.top>=a.bottom-2');
  if([960,1366,1920].includes(width)){
   const snapshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   const dir=join(root,'artifacts','ui');await fs.mkdir(dir,{recursive:true});
   await fs.writeFile(join(dir,'production-'+width+'x'+height+'.png'),Buffer.from(snapshot.data,'base64'));
  }
  await mouseClick('#vdTabVideo');
  await pass('Video workspace uses same outer gutter as Production at '+width+'x'+height,'const a=getComputedStyle(document.querySelector(".vd-root")),b=getComputedStyle(document.querySelector(".production-root"));return a.maxWidth===b.maxWidth && a.paddingLeft===b.paddingLeft && a.paddingRight===b.paddingRight');
  await pass('Pointer opens video at '+width+'x'+height,'return !document.querySelector("#videoDirectorRoot").hidden && document.querySelector("#standardMode").hidden');
  await mouseClick('#vdTabStandard');
  await pass('Standard workspace shares outer gutter at '+width+'x'+height,'const a=getComputedStyle(document.querySelector(".shell")),b=getComputedStyle(document.querySelector(".vd-root"));return a.maxWidth===b.maxWidth && a.paddingLeft===b.paddingLeft && a.paddingRight===b.paddingRight');
  if([960,1366,1920].includes(width)){
   const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   const dir=join(root,'artifacts','ui');await fs.mkdir(dir,{recursive:true});
   await fs.writeFile(join(dir,'standard-'+width+'x'+height+'.png'),Buffer.from(shot.data,'base64'));
  }
  await pass('Pointer returns to standard at '+width+'x'+height,'return document.querySelector("#videoDirectorRoot").hidden && !document.querySelector("#standardMode").hidden');
 }
 await send('Emulation.clearDeviceMetricsOverride');
 const keys=await evaluate('return [localStorage.getItem("archviz-prompt-studio-v1"),localStorage.getItem("archviz-prompt-library-v1")]');
 await evaluate('document.querySelector("#vdTabVideo").click();return true');
 await pass('Project-first empty state hides workspace when no project','return document.querySelector("#vdEmptyState")?.hidden===false && document.querySelector("#vdWorkspace")?.hidden===true && document.querySelector("#vdStartNew")?.type==="button"');
 await evaluate('document.querySelector("#vdDemo").click();return true');
 await poll('return document.querySelectorAll("#vdShotList button").length===13 && document.querySelector("#vdPrompt").value.includes("subject_definitions:")','demo compilation');
 await pass('Synthetic demo and actor references appear','return !document.querySelector("#videoDirectorRoot").hidden && document.querySelectorAll("#vdShotList button").length===13 && document.querySelector("#vdPrompt").value.includes("subject_definitions:") && document.querySelector("#vdManifest").textContent.includes("male_ref")');
 await pass('Project-first start screen closes after demo selection','return document.querySelector("#vdEmptyState").hidden && !document.querySelector("#vdWorkspace").hidden');
 await pass('Video shot list is bounded and independently scrollable','const list=document.querySelector("#vdShotList"),style=getComputedStyle(list);return style.overflowY==="auto"&&parseFloat(style.maxHeight)>0');

 await pass('Shot list has a single visibly selected item','const buttons=[...document.querySelectorAll("#vdShotList button[aria-pressed]")];return buttons.length===12 && buttons.filter(b=>b.getAttribute("aria-pressed")==="true").length===1 && getComputedStyle(buttons.find(b=>b.getAttribute("aria-pressed")==="false")).backgroundColor!==getComputedStyle(buttons.find(b=>b.getAttribute("aria-pressed")==="true")).backgroundColor');
 await pass('Shot Composer has five visual section headings','return document.querySelectorAll("#vdShotFields > .vd-editor-subheading").length===5');
 for(const [width,height] of [[960,768],[1366,768],[1920,1080]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await evaluate('window.scrollTo(0,0);return true');
  const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  const dir=join(root,'artifacts','ui');await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(join(dir,'video-'+width+'x'+height+'.png'),Buffer.from(screenshot.data,'base64'));
 }
 await send('Emulation.clearDeviceMetricsOverride');

 await pass('Video Director editor disclosures present','return document.querySelectorAll(".vd-panel-disclosure").length===5');
 await evaluate('document.querySelector("#vdReferences").closest("section").querySelector(".vd-panel-disclosure").click();return true');
 await pass('Video Director reference editor collapses without losing records','return document.querySelector("#vdReferences").hidden && document.querySelector("#vdReferences").children.length>0');
 await evaluate('document.querySelector("#vdReferences").closest("section").querySelector(".vd-panel-disclosure").click();return true');
 await pass('Video Director reference editor expands with original content','return !document.querySelector("#vdReferences").hidden && document.querySelector("#vdReferences").children.length>0');

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
 await evaluate('window.__vdBeforeReload=1;return true');
 await send('Page.reload',{ignoreCache:false});
 await poll('return window.__vdBeforeReload===undefined && document.readyState==="complete" && !!document.querySelector("#vdProjects") && document.querySelector("#vdProjects").options.length>1','project persists after reload');
 await pass('Production History persists after browser reload','return JSON.parse(localStorage.getItem("archviz-production-history-v1")).records.length===1');
 await pass('Video Director project persists','return localStorage.getItem("archviz-video-director-v1").includes("Browser Smoke Preset")');
 const swDiag=await evaluate('return {secure:isSecureContext,supported:!!navigator.serviceWorker,controlled:!!navigator.serviceWorker?.controller,registrations:await navigator.serviceWorker.getRegistrations().then(rs=>rs.map(r=>({scope:r.scope,active:r.active?.state,installing:r.installing?.state,waiting:r.waiting?.state}))),caches:await caches.keys()}');console.log('PWA DIAGNOSTICS:',JSON.stringify(swDiag));
 await send('Page.navigate',{url});
 await poll('return document.readyState==="complete" && !!navigator.serviceWorker?.controller','PWA controller');
 const cacheKeys=await evaluate('return await caches.keys()');
 assert.ok(cacheKeys.some(k=>k.startsWith('archviz-prompt-studio-shell-')),'PWA shell cache absent');
 console.log('BROWSER PASS service-worker cache installed');
 await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await evaluate('window.__vdBeforeOffline=1;return true');
 await send('Page.reload',{ignoreCache:false});
 await poll('return window.__vdBeforeOffline===undefined && document.readyState==="complete" && !!document.querySelector("#vdTabVideo") && !!document.querySelector("#vdProjects")','offline boot');
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
