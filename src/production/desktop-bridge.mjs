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
