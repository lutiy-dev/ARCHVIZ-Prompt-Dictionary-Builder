import {validateComfyPrompt} from './comfyui-adapter.mjs';

const BLOCK=message=>{throw Error('BLOCKED: '+message)};
const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const ID=/^[A-Za-z0-9_-]{1,128}$/;

function stable(value){
 if(Array.isArray(value))return value.map(stable);
 if(isRecord(value))return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));
 return value;
}
function toHex(buffer){return [...new Uint8Array(buffer)].map(byte=>byte.toString(16).padStart(2,'0')).join('')}

export async function graphDigestWeb(graph,cryptoImpl=globalThis.crypto){
 if(!isRecord(graph)||!Object.keys(graph).length)BLOCK('invalid API prompt');
 if(!cryptoImpl?.subtle?.digest)BLOCK('Web Crypto SHA-256 unavailable');
 const bytes=new TextEncoder().encode(JSON.stringify(stable(graph)));
 return toHex(await cryptoImpl.subtle.digest('SHA-256',bytes));
}

export function verifySelectedModelsWeb(graph,objectInfo){
 const keys=/^(ckpt_name|lora_name|vae_name|unet_name|clip_name|control_net_name|model_name|upscale_model_name|style_model_name)$/i;
 let verified=0;
 for(const node of Object.values(graph)){
  for(const [key,value] of Object.entries(node.inputs||{})){
   if(!keys.test(key)||typeof value!=='string')continue;
   const types=objectInfo?.[node.class_type]?.input;
   const descriptor=types?.required?.[key]||types?.optional?.[key];
   const choices=Array.isArray(descriptor?.[0])?descriptor[0]:(descriptor?.[0]==='COMBO'?descriptor?.[1]?.options:null);
   if(!Array.isArray(choices)||!choices.includes(value))BLOCK('model not in current node inventory: '+node.class_type+'.'+key);
   verified++;
  }
 }
 return {verified,model_selection_verified:verified>0};
}

export async function stageControlledExecution({graph,objectInfo,filename='workflow.json',clientId,cryptoImpl=globalThis.crypto}={}){
 const validation=validateComfyPrompt(graph,objectInfo);
 if(!validation.valid)BLOCK('unsupported workflow: '+validation.errors.join('; '));
 if(typeof filename!=='string'||!filename.trim()||filename.length>240)BLOCK('invalid workflow filename');
 if(!ID.test(clientId||''))BLOCK('invalid client id');
 const modelAudit=verifySelectedModelsWeb(graph,objectInfo);
 const copy=structuredClone(graph);
 const digest=await graphDigestWeb(copy,cryptoImpl);
 return Object.freeze({
  status:'READY_FOR_HUMAN_APPROVAL',
  graph:copy,
  digest,
  filename:filename.trim(),
  client_id:clientId,
  node_count:validation.node_count,
  dependencies:validation.dependencies,
  model_count:modelAudit.verified,
  model_selection_verified:modelAudit.model_selection_verified,
  geometry_verified:false,
  queued:false
 });
}

export function extractComfyOutputs(history,promptId){
 if(!isRecord(history)||!ID.test(promptId||''))return [];
 const record=history[promptId];
 if(!isRecord(record))return [];
 const outputs=isRecord(record.outputs)?record.outputs:{};
 const files=[];
 for(const [nodeId,output] of Object.entries(outputs)){
  if(!isRecord(output))continue;
  for(const [kind,items] of Object.entries(output)){
   if(!Array.isArray(items))continue;
   for(const item of items){
    if(!isRecord(item)||typeof item.filename!=='string'||!item.filename)continue;
    files.push({
     node_id:nodeId,
     kind,
     filename:item.filename,
     subfolder:typeof item.subfolder==='string'?item.subfolder:'',
     type:typeof item.type==='string'?item.type:'output'
    });
   }
  }
 }
 return files;
}

export function historyCompleted(history,promptId){
 if(!isRecord(history)||!ID.test(promptId||''))return {done:false,failed:false};
 const record=history[promptId];
 if(!isRecord(record))return {done:false,failed:false};
 const status=record.status;
 const statusText=JSON.stringify(status||{}).toLowerCase();
 if(statusText.includes('error')||statusText.includes('failed'))return {done:true,failed:true};
 const completed=status?.completed===true||record.completed===true||Object.keys(isRecord(record.outputs)?record.outputs:{}).length>0;
 return {done:completed,failed:false};
}
