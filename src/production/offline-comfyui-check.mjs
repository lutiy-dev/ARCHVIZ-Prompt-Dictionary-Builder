/** Offline ComfyUI API prompt check. No runtime, queue, model changes or uploads. */
import {validateComfyPrompt} from './comfyui-adapter.mjs';

const MAX_FILE_BYTES=8*1024*1024;
function isRecord(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
async function readJsonFile(file,label){
 if(!file||typeof file.size!=='number'||typeof file.text!=='function')throw Error(label+' JSON file required');
 if(file.size<=0||file.size>MAX_FILE_BYTES)throw Error(label+' file must be 1 byte to 8 MiB');
 let value;
 try{value=JSON.parse(await file.text());}catch{throw Error(label+' must contain valid JSON');}
 if(!isRecord(value))throw Error(label+' must contain a JSON object');
 return value;
}
/** Accept exported API-prompt graph or a {prompt: graph} API envelope, not UI workflow JSON. */
export async function validateOfflineComfyFiles(promptFile,infoFile){
 const [source,objectInfo]=await Promise.all([readJsonFile(promptFile,'API prompt'),readJsonFile(infoFile,'object_info')]);
 const graph=isRecord(source.prompt)?source.prompt:source;
 if(Array.isArray(graph.nodes))throw Error('UI workflow JSON is not an API prompt; export API format');
 const report=validateComfyPrompt(graph,objectInfo);
 return {...report,status:report.valid?'OFFLINE_VALIDATED_UNVERIFIED':'BLOCKED',
  runtime_tested:false,model_selection_verified:false,queue_allowed:false,network_used:false,
  notice:'Local structural check only. Actual installed models, custom nodes and runtime are NOT verified.'};
}
