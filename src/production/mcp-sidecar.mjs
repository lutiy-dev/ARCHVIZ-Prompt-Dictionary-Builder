#!/usr/bin/env node
/** MCP stdio LAB server. No HTTP listener, shell, model invocation or file IO. */
import readline from 'node:readline';
import {prepareTask,evaluateGeometryQC} from './core.mjs';
import {validateComfyPrompt} from './comfyui-adapter.mjs';
const protocolVersion='2025-06-18';
export const specs=[
 {name:'prepare_archviz_task',description:'Validate a draft architectural task. Does not invoke AI.',inputSchema:{type:'object',properties:{task:{type:'object'}},required:['task'],additionalProperties:false}},
 {name:'review_geometry_metrics',description:'Advisory geometry review; never returns architectural acceptance.',inputSchema:{type:'object',properties:{metrics:{type:'object'}},required:['metrics'],additionalProperties:false}},
 {name:'validate_comfy_prompt',description:'Offline validation against provided node definitions. No ComfyUI execution.',inputSchema:{type:'object',properties:{graph:{type:'object'},object_info:{type:'object'}},required:['graph','object_info'],additionalProperties:false}}
];
const methods={
 prepare_archviz_task:args=>prepareTask(args.task),
 review_geometry_metrics:args=>evaluateGeometryQC(args.metrics),
 validate_comfy_prompt:args=>validateComfyPrompt(args.graph,args.object_info)
};
export function reply(request){
 const {id,method,params={}}=request;
 if(method==='notifications/initialized'||id===undefined||id===null)return null;
 if(method==='initialize')return{jsonrpc:'2.0',id,result:{protocolVersion,capabilities:{tools:{}},serverInfo:{name:'ovizlab-prompt-studio-lab',version:'0.1.0'}}};
 if(method==='ping')return{jsonrpc:'2.0',id,result:{}};
 if(method==='tools/list')return{jsonrpc:'2.0',id,result:{tools:specs}};
 if(method==='tools/call'){
  const name=params.name,args=params.arguments;
  if(!Object.prototype.hasOwnProperty.call(methods,name))return{jsonrpc:'2.0',id,error:{code:-32602,message:'Unknown tool'}};
  try{return{jsonrpc:'2.0',id,result:{content:[{type:'text',text:JSON.stringify(methods[name](args??{}))}],isError:false}}}
  catch(e){return{jsonrpc:'2.0',id,result:{content:[{type:'text',text:'BLOCKED: '+e.message}],isError:true}}}
 }
 return{jsonrpc:'2.0',id,error:{code:-32601,message:'Method not found'}};
}
if(process.argv[1]&&new URL(import.meta.url).pathname.endsWith(process.argv[1].replaceAll('\\','/'))){
 const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
 rl.on('line',line=>{let response;try{const req=JSON.parse(line);if(!req||req.jsonrpc!=='2.0')throw Error('Invalid JSON-RPC');response=reply(req)}catch{response={jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid request'}}}if(response)process.stdout.write(JSON.stringify(response)+'\n')});
}