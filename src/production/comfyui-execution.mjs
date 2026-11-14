/**
 * ComfyUI execution gate for a trusted local backend only.
 * No UI, API key, model download, workflow mutation or automatic consent.
 */
import {createHash,randomUUID} from 'node:crypto';
import {validateComfyPrompt} from './comfyui-adapter.mjs';

const BLOCK=m=>{throw Error('BLOCKED: '+m)};
const isRecord=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const SHA=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9_-]{1,128}$/;
function stable(value){
 if(Array.isArray(value))return value.map(stable);
 if(isRecord(value))return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
 return value;
}
export function graphDigest(graph){
 if(!isRecord(graph)||!Object.keys(graph).length)BLOCK('invalid API prompt');
 return createHash('sha256').update(JSON.stringify(stable(graph))).digest('hex');
}
export function createComfyExecutionGate({origin='http://127.0.0.1:8188',fetchImpl=globalThis.fetch}={}){
 const url=new URL(origin);
 if(url.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.pathname!=='/'||url.search||url.hash||url.username||url.password)BLOCK('only direct local ComfyUI');
 let candidate=null,approvedToken=null;
 const send=async(path,options={})=>{
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);
  try{const response=await fetchImpl(new URL(path,url).href,{...options,redirect:'error',signal:abort.signal});
   if(!response.ok)throw Error('HTTP '+response.status);
   return await response.json();
  }finally{clearTimeout(timer)}
 };
 return Object.freeze({
  /** Stage a clone only; models and nodes must be known before approving anything. */
  stage({graph,objectInfo,clientId=randomUUID()}={}){
   const result=validateComfyPrompt(graph,objectInfo);
   if(!result.valid)BLOCK('unsupported workflow: '+result.errors.join('; '));
   if(!ID.test(clientId))BLOCK('invalid client id');
   const copy=structuredClone(graph),digest=graphDigest(copy);
   approvedToken=null;candidate={graph:copy,digest,clientId};
   return {status:'REVIEW_REQUIRED',digest,node_count:result.node_count,dependencies:result.dependencies,client_id:clientId,model_selection_verified:false,queued:false};
  },
  /** Must be called only as direct result of a human confirmation in a trusted UI. */
  approve({digest,userConfirmed=false}={}){
   if(userConfirmed!==true||!candidate||!SHA.test(digest)||digest!==candidate.digest)BLOCK('exact graph user approval required');
   approvedToken=randomUUID();return {status:'APPROVED_FOR_ONE_QUEUE',ticket:approvedToken,digest};
  },
  async queue({ticket}={}){
   if(typeof ticket!=='string'||!approvedToken||ticket!==approvedToken||!candidate)BLOCK('approved ticket required');
   approvedToken=null; // consume before any await, even on network failures
   const payload={prompt:candidate.graph,client_id:candidate.clientId};
   const response=await send('/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   if(!ID.test(response?.prompt_id))throw Error('ComfyUI returned invalid prompt_id');
   return {status:'QUEUED_UNVERIFIED',prompt_id:response.prompt_id,digest:candidate.digest,model_selection_verified:false,geometry_verified:false};
  },
  async history(promptId){
   if(!ID.test(promptId))BLOCK('invalid prompt ID');
   const result=await send('/history/'+encodeURIComponent(promptId),{method:'GET'});
   if(!isRecord(result))BLOCK('invalid history payload');
   return {status:'HISTORY_RECEIVED_UNREVIEWED',prompt_id:promptId,history:result};
  },
  discard(){candidate=null;approvedToken=null;return {status:'DISCARDED'};}
 });
}
