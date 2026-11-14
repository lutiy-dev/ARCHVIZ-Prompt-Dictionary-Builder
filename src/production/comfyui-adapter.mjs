/** Server-side ComfyUI adapter. No model substitutions or queue calls without explicit approval. */
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const fail=m=>{throw new Error(m)};
export function validateComfyPrompt(graph,objectInfo){
 if(!isObject(graph)||!Object.keys(graph).length)fail('ComfyUI API prompt must be a nonempty object');
 if(!isObject(objectInfo))fail('Node definitions unavailable: cannot validate offline');
 const errors=[],dependencies=[];
 for(const [id,node] of Object.entries(graph)){
  if(!/^\d+$/.test(id)||!isObject(node)||typeof node.class_type!=='string'||!isObject(node.inputs)){errors.push('Invalid node: '+id);continue}
  if(!Object.prototype.hasOwnProperty.call(objectInfo,node.class_type)){errors.push('Missing node: '+node.class_type);continue}
  dependencies.push(node.class_type);
  const defs=objectInfo[node.class_type]?.input;
  if(!isObject(defs)){errors.push('Missing input contract: '+node.class_type);continue}
  for(const key of Object.keys(defs.required||{}))if(!Object.prototype.hasOwnProperty.call(node.inputs,key))errors.push(id+': required input '+key+' missing');
  for(const [key,value] of Object.entries(node.inputs)){
   if(!Object.prototype.hasOwnProperty.call(defs.required||{},key)&&!Object.prototype.hasOwnProperty.call(defs.optional||{},key))errors.push(id+': unknown input '+key);
   if(Array.isArray(value)){
    if(value.length!==2||(typeof value[0]!=='string'&&typeof value[0]!=='number')||!Number.isInteger(value[1])||value[1]<0||!Object.prototype.hasOwnProperty.call(graph,String(value[0])))errors.push(id+': dangling or invalid link '+key);
   }
  }
 }
 return {valid:errors.length===0,errors,dependencies:[...new Set(dependencies)].sort(),node_count:Object.keys(graph).length,status:errors.length?'BLOCKED':'VALIDATED',runtime_tested:false};
}
export function createComfyAdapter({origin='http://127.0.0.1:8188',fetchImpl=globalThis.fetch}={}){
 const url=new URL(origin);
 if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.protocol!=='http:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)fail('Only direct local ComfyUI HTTP endpoints are allowed');
 async function get(path){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),4500);try{const res=await fetchImpl(new URL(path,url).href,{method:'GET',redirect:'error',signal:ctrl.signal});if(!res.ok)fail('ComfyUI '+path+' returned HTTP '+res.status);return await res.json()}finally{clearTimeout(timer)}}
 return Object.freeze({
  origin:url.origin,
  async health(){const state=await get('/system_stats');if(!isObject(state))fail('Invalid system_stats');return {reachable:true,status:'CONNECTED_UNVERIFIED',stats:state}},
  async inventory(){const info=await get('/object_info');if(!isObject(info))fail('Invalid object_info');return info},
  async validate(graph){return validateComfyPrompt(graph,await get('/object_info'))},
  async queue(){fail('Execution requires separately reviewed desktop consent and implementation; disabled in LAB')}
 });
}