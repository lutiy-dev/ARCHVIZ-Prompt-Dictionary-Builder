/** Read-only Tauri status interface; never exposes tools or process spawning. */
export async function getDesktopStatus(tauri=globalThis.__TAURI__){
 if(!tauri?.core?.invoke)return {runtime:'WEB_PWA',mcp_ready:false,external_execution_enabled:false};
 try{
  const state=await tauri.core.invoke('desktop_status');
  if(state?.runtime!=='TAURI_2_LAB'||typeof state.mcp_ready!=='boolean')throw Error('Invalid Tauri status');
  return {runtime:state.runtime,mcp_ready:state.mcp_ready,external_execution_enabled:false};
 }catch{return {runtime:'TAURI_UNVERIFIED',mcp_ready:false,external_execution_enabled:false}}
}
