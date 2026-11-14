import {cp,copyFile,mkdir,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join,resolve} from 'node:path';

const ROOT=resolve(import.meta.dirname,'..');
const OUT=join(ROOT,'dist');
const sources=['index.html','sw.js','pwa-install-capture.js','manifest.webmanifest','src','data','icons'];
const assetsOnly=process.argv.includes('--assets-only');
const run=(command,args,cwd)=>{const r=spawnSync(command,args,{cwd,stdio:'inherit',shell:process.platform==='win32'});if(r.status!==0)throw Error(command+' exited '+r.status)};
await rm(OUT,{recursive:true,force:true});await mkdir(OUT,{recursive:true});
for(const name of sources)await cp(join(ROOT,name),join(OUT,name),{recursive:true});
const icon=await readFile(join(ROOT,'icons','icon-192.png'));
if(!icon.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Source icon is not PNG');
const iconDir=join(ROOT,'src-tauri','icons');await mkdir(iconDir,{recursive:true});
await writeFile(join(iconDir,'icon.png'),icon);
const header=Buffer.alloc(22);header.writeUInt16LE(1,2);header.writeUInt16LE(1,4);
header[6]=192;header[7]=192;header[8]=0;header[9]=0;header.writeUInt16LE(1,10);
header.writeUInt16LE(32,12);header.writeUInt32LE(icon.length,14);header.writeUInt32LE(22,18);
await writeFile(join(iconDir,'icon.ico'),Buffer.concat([header,icon]));
const listed=(await readdir(OUT)).sort();
if(!listed.includes('index.html')||!listed.includes('src')||!listed.includes('data'))throw Error('Static desktop artifact incomplete');
if(!assetsOnly){
 if(process.platform!=='win32')throw Error('Windows installer is Windows-only; run --assets-only on non-Windows');
 run('cargo',['build','--release','--manifest-path',join(ROOT,'src-mcp','Cargo.toml')],ROOT);
 const triple=process.env.TAURI_ENV_TARGET_TRIPLE||'x86_64-pc-windows-msvc';
 if(triple!=='x86_64-pc-windows-msvc')throw Error('Only verified Windows x64 target is supported in LAB');
 const binDir=join(ROOT,'src-tauri','binaries');await mkdir(binDir,{recursive:true});
 await copyFile(join(ROOT,'src-mcp','target','release','ovizlab-mcp.exe'),join(binDir,'ovizlab-mcp-'+triple+'.exe'));
}
console.log('DESKTOP_ASSETS_OK',listed.join(','));