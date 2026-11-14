#!/usr/bin/env node
/**
 * ARCHVIZ Desktop LAB host: local HTTP UI + private stdio MCP child.
 * Requires Node 22+, not a packaged Windows/Tauri release.
 */
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFile,realpath,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,extname,sep} from 'node:path';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const MIME={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
const MAX_SIZE=12*1024*1024;
const TIMEOUT=4500;
export function createLabHost({root=ROOT,spawnProcess=spawn}={}){
 let server=null,child=null,ready=false;
 let rx='',seq=0;
 const requests=new Map();
 const failAll=error=>{for(const [,entry] of requests){clearTimeout(entry.timer);entry.reject(error)}requests.clear()};
 const ingest=chunk=>{
  rx+=chunk.toString('utf8');if(rx.length>1024*1024){failAll(Error('MCP output overflow'));void stop();return}
  let idx;while((idx=rx.indexOf('\n'))>=0){
   const line=rx.slice(0,idx);rx=rx.slice(idx+1);let packet;
   try{packet=JSON.parse(line)}catch{continue}
   const request=requests.get(packet.id);if(!request)continue;
   clearTimeout(request.timer);requests.delete(packet.id);
   packet.error?request.reject(Error(packet.error.message||'MCP error')):request.resolve(packet.result);
  }
 };
 const rpc=(method,params={})=>new Promise((resolve,reject)=>{
  if(!child||!child.stdin.writable){reject(Error('MCP child not ready'));return}
  const id=++seq;
  const timer=setTimeout(()=>{requests.delete(id);reject(Error('MCP timeout: '+method))},TIMEOUT);
  requests.set(id,{resolve,reject,timer});
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n',error=>{if(error){clearTimeout(timer);requests.delete(id);reject(error)}});
 });
 async function start({port=0}={}){
  if(child||server)throw Error('LAB host already started');
  child=spawnProcess(process.execPath,[resolve(ROOT,'src/production/mcp-sidecar.mjs')],{cwd:ROOT,stdio:['pipe','pipe','pipe'],windowsHide:true});
  child.stdout.on('data',ingest);child.stderr.on('data',()=>{}); // no protocol on stderr, no secrets in logs
  child.on('error',error=>failAll(error));
  child.on('exit',(code,signal)=>{ready=false;failAll(Error('MCP exited: '+(signal||code)));});
  try{
   const hello=await rpc('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'archviz-desktop-lab',version:'0.1.0'}});
   if(hello?.serverInfo?.name!=='ovizlab-prompt-studio-lab')throw Error('Unexpected MCP server identity');
   const tools=await rpc('tools/list');
   if(!Array.isArray(tools?.tools)||tools.tools.length!==3)throw Error('Unexpected MCP tool registry');
   const allowed=new Set(['prepare_archviz_task','review_geometry_metrics','validate_comfy_prompt']);
   if(tools.tools.some(t=>!allowed.has(t.name)))throw Error('Disallowed MCP tool');
   child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
   server=createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'");
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405).end();return}
    try{
     const raw=new URL(req.url,'http://localhost').pathname;
     const decoded=decodeURIComponent(raw);
     if(decoded.includes('\0')||decoded.includes('\\'))throw Error('Invalid path');
     const rel=decoded==='/'?'/index.html':decoded;
     const path=resolve(root,'.'+rel);
     if(path!==root&&!path.startsWith(root+sep))throw Error('Path outside application');
     if(!Object.prototype.hasOwnProperty.call(MIME,extname(path)))throw Error('Unsupported asset type');
     const actual=await realpath(path),realRoot=await realpath(root);
     if(actual!==realRoot&&!actual.startsWith(realRoot+sep))throw Error('Symlink outside application');
     const file=await stat(actual);
     if(!file.isFile()||file.size>MAX_SIZE)throw Error('Invalid asset size');
     const bytes=await readFile(actual);
     res.writeHead(200,{'Content-Type':MIME[extname(actual)],'Cache-Control':'no-store'});
     res.end(req.method==='HEAD'?undefined:bytes);
    }catch{res.writeHead(404,{'Content-Type':'text/plain'}).end('Not found')}
   });
   await new Promise((ok,bad)=>{server.once('error',bad);server.listen(port,'127.0.0.1',ok)});
   ready=true;
   return {url:'http://127.0.0.1:'+server.address().port+'/',mcp:'STDIO_READY',tools:tools.tools.map(t=>t.name)};
  }catch(error){await stop();throw error}
 }
 async function stop(){
  ready=false;
  if(server){const previous=server;server=null;await new Promise(resolve=>previous.close(()=>resolve()))}
  if(child){const previous=child;child=null;previous.kill();failAll(Error('LAB host closing'))}
 }
 return {start,stop,get ready(){return ready}};
}
export async function main(argv=process.argv.slice(2)){
 const noBrowser=argv.includes('--no-browser');
 const portFlag=argv.find(a=>a.startsWith('--port='));
 const port=portFlag?Number(portFlag.slice(7)):0;
 if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid port');
 const host=createLabHost();
 let closing=false;
 const shutdown=()=>{if(closing)return;closing=true;void host.stop().then(()=>process.exit(0))};
 process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
 const state=await host.start({port});
 process.stdout.write('LAB_READY '+JSON.stringify(state)+'\n');
 if(!noBrowser){
  const [command,args]=process.platform==='win32'?['explorer.exe',[state.url]]:process.platform==='darwin'?['open',[state.url]]:['xdg-open',[state.url]];
  try{const launcher=spawn(command,args,{stdio:'ignore',detached:true});launcher.on('error',()=>process.stderr.write('Browser launch unavailable; use '+state.url+'\n'));launcher.unref()}catch{process.stderr.write('Open manually: '+state.url+'\n')}
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{process.stderr.write('LAB_FAILED '+error.message+'\n');process.exitCode=1});
