import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../pwa-install-capture.js',import.meta.url),'utf8');

async function simulate(native){
  const handlers={};
  const operations=[];
  const button={hidden:false,addEventListener:(type,fn)=>{handlers['button:'+type]=fn}};
  const help={hidden:true};
  const registration={unregister:()=>{operations.push('unregister');return Promise.resolve(true)}};
  const navigator={serviceWorker:{
    register:()=>{operations.push('register');return Promise.resolve(registration)},
    getRegistration:(scope)=>{operations.push('lookup:'+scope);return Promise.resolve(registration)},
  }};
  const document={
    addEventListener:(type,fn)=>{handlers['document:'+type]=fn},
    getElementById:(id)=>id==='installApp'?button:id==='installHelp'?help:null,
  };
  const window={isSecureContext:true,__TAURI__:native?{core:{invoke:()=>{}}}:undefined,
    addEventListener:(type,fn)=>{handlers['window:'+type]=fn}};
  runInNewContext(source,{document,window,navigator,matchMedia:()=>({matches:false}),console});
  handlers['document:DOMContentLoaded']();
  await Promise.resolve();await Promise.resolve();
  return {operations,button};
}
test('Tauri skips PWA registration and unregisters only its own scoped worker',async()=>{
  const {operations,button}=await simulate(true);
  assert.deepEqual(operations,['lookup:./','unregister']);
  assert.equal(button.hidden,true);
});
test('Web/PWA still registers offline worker and keeps browser install control',async()=>{
  const {operations,button}=await simulate(false);
  assert.deepEqual(operations,['register']);
  assert.equal(button.hidden,false);
});
