/** Read-only Tauri status interface; never exposes tools or process spawning. */
export async function getDesktopStatus(tauri=globalThis.__TAURI__){
 if(!tauri?.core?.invoke)return {runtime:'WEB_PWA',mcp_ready:false,external_execution_enabled:false};
 try{
  const state=await tauri.core.invoke('desktop_status');
  if(state?.runtime!=='TAURI_2_LAB'||typeof state.mcp_ready!=='boolean')throw Error('Invalid Tauri status');
  return {runtime:state.runtime,mcp_ready:state.mcp_ready,external_execution_enabled:false};
 }catch{return {runtime:'TAURI_UNVERIFIED',mcp_ready:false,external_execution_enabled:false}}
}

/** Explicit read-only local ComfyUI probe, available only in the native Desktop host. */
export async function probeComfyUi(tauri=globalThis.__TAURI__){
 if(!tauri?.core?.invoke)return {status:'BLOCKED',reason:'DESKTOP_ONLY',execution_allowed:false};
 try{
  const response=await tauri.core.invoke('comfyui_health');
  if(!['CONNECTED_UNVERIFIED','DISCONNECTED'].includes(response?.status))throw Error('Unexpected health report');
  return {status:response.status,origin:'http://127.0.0.1:8188',execution_allowed:false};
 }catch{return {status:'BLOCKED',reason:'HEALTH_PROBE_FAILED',execution_allowed:false}}
}


/** Auto-discover a local ComfyUI API on loopback only. No network scan, no execution. */
export async function discoverComfyUi(tauri=globalThis.__TAURI__){
 if(!tauri?.core?.invoke)return {status:'BLOCKED',reason:'DESKTOP_ONLY',execution_allowed:false};
 try{
  const response=await tauri.core.invoke('comfyui_discover');
  if(!['CONNECTED_UNVERIFIED','DISCONNECTED'].includes(response?.status))throw Error('Unexpected discovery report');
  return {...response,execution_allowed:false};
 }catch{return {status:'BLOCKED',reason:'DISCOVERY_FAILED',execution_allowed:false}}
}

/** Manual localhost fallback when auto-discovery cannot identify a ComfyUI API. */
export async function probeComfyUiPort(port,tauri=globalThis.__TAURI__){
 const value=Number(port);
 if(!Number.isInteger(value)||value<1||value>65535)return {status:'BLOCKED',reason:'INVALID_PORT',execution_allowed:false};
 if(!tauri?.core?.invoke)return {status:'BLOCKED',reason:'DESKTOP_ONLY',execution_allowed:false};
 try{
  const response=await tauri.core.invoke('comfyui_probe_port',{port:value});
  if(!['CONNECTED_UNVERIFIED','DISCONNECTED'].includes(response?.status))throw Error('Unexpected manual probe');
  return {...response,execution_allowed:false};
 }catch{return {status:'BLOCKED',reason:'MANUAL_PROBE_FAILED',execution_allowed:false}}
}


/** Fetch ComfyUI object_info from the already discovered localhost endpoint. Read-only; no queue. */
export async function fetchComfyUiObjectInfo(port,tauri=globalThis.__TAURI__){
 const value=Number(port);
 if(!Number.isInteger(value)||value<1||value>65535)return {status:'BLOCKED',reason:'INVALID_PORT',execution_allowed:false};
 if(!tauri?.core?.invoke)return {status:'BLOCKED',reason:'DESKTOP_ONLY',execution_allowed:false};
 try{
  const response=await tauri.core.invoke('comfyui_object_info',{port:value});
  if(!['OBJECT_INFO_READY','BLOCKED'].includes(response?.status))throw Error('Unexpected object_info report');
  return {...response,execution_allowed:false};
 }catch{return {status:'BLOCKED',reason:'OBJECT_INFO_FETCH_FAILED',execution_allowed:false}}
}
