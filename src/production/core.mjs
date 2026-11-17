/** Shared, side-effect-free production contracts; no network, filesystem or model access. */
export const STATUS=Object.freeze({GENERATED:'GENERATED',VALIDATED:'VALIDATED',TESTED:'TESTED',ACCEPTED:'ACCEPTED',REJECTED:'REJECTED',BLOCKED:'BLOCKED',NOT_TESTED:'NOT_TESTED'});
export const CABINETS=Object.freeze(['standard','art_director','video_director','geometry_guardian','skills','mcp_comfyui','history']);
export const ARCHITECTURE_LOCKS=Object.freeze(['HARD','SOFT','EDITABLE']);
const identifier=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(v);
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const check=(ok,why)=>{if(!ok)throw Error(why)};
const string=(v,n=2000)=>typeof v==='string'&&v.length<=n;
export function prepareTask(input){
 check(plain(input),'Invalid task');
 const {id,project_id,shot_id=null,cabinet,description,architecture_lock='HARD',source_ref=null,skill=null,model=null}=input;
 check(identifier(id)&&identifier(project_id),'Invalid task or project ID');
 check(shot_id===null||identifier(shot_id),'Invalid shot ID');
 check(CABINETS.includes(cabinet),'Unknown cabinet');
 check(string(description,10000)&&description.trim(),'Task description required');
 check(ARCHITECTURE_LOCKS.includes(architecture_lock),'Unknown architecture lock');
 check(source_ref===null||identifier(source_ref),'Invalid source reference');
 if(skill!==null)check(plain(skill)&&identifier(skill.id)&&string(skill.repository,200)&&string(skill.path,300)&&/^[a-f0-9]{40}$/.test(skill.sha),'Skill requires exact SHA');
 if(model!==null)check(plain(model)&&string(model.identifier,200)&&model.identifier.trim()&&string(model.version,120),'Invalid model identifier');
 return {schema_version:1,kind:'archviz_production_task',id,project_id,shot_id,cabinet,description,architecture_lock,source_ref,skill:skill?structuredClone(skill):null,model:model?structuredClone(model):null,status:STATUS.GENERATED};
}
/** Deny-by-default tool permissions. A policy decision is not the tool executor. */
export function authorizeToolCall(request,policy){
 if(!plain(request)||!identifier(request.server_id)||!identifier(request.tool_id)||!['read','write','execute'].includes(request.effect))return {allowed:false,reason:'INVALID_REQUEST'};
 if(!plain(policy)||!Array.isArray(policy.allow)||!policy.allow.includes(request.server_id+':'+request.tool_id))return {allowed:false,reason:'NOT_ALLOWLISTED'};
 if(request.effect!=='read'&&policy.user_approved!==true)return {allowed:false,reason:'USER_APPROVAL_REQUIRED'};
 if(request.effect==='execute'&&policy.execution_enabled!==true)return {allowed:false,reason:'EXECUTION_DISABLED'};
 return {allowed:true,reason:'AUTHORIZED'};
}
export function integrationStatus({connected=false,adapter_verified=false,runtime_tested=false}={}){
 if(!connected)return {status:STATUS.BLOCKED,reason:'NOT_CONNECTED'};
 if(!adapter_verified)return {status:STATUS.NOT_TESTED,reason:'ADAPTER_NOT_VERIFIED'};
 if(!runtime_tested)return {status:STATUS.NOT_TESTED,reason:'RUNTIME_NOT_TESTED'};
 return {status:STATUS.TESTED,reason:'RUNTIME_VERIFIED'};
}
export function appendHistory(history,entry){
 check(Array.isArray(history),'Invalid history');
 check(plain(entry)&&identifier(entry.id)&&identifier(entry.task_id)&&Object.values(STATUS).includes(entry.status),'Invalid history entry');
 check(string(entry.note,2000),'Invalid history note');
 check(!history.some(x=>x.id===entry.id),'Duplicate history ID');
 return [...history,structuredClone(entry)];
}
/** Preliminary metrics never constitute verified geometry or automatic acceptance. */
export function evaluateGeometryQC(input){
 check(plain(input),'Invalid QC input');
 const {source_id,result_id,alignment_error_px,contour_mismatch_ratio,reviewed_regions=0,protected_regions=0}=input;
 check(identifier(source_id)&&identifier(result_id)&&source_id!==result_id,'Distinct image IDs required');
 if(!Number.isFinite(alignment_error_px)||!Number.isFinite(contour_mismatch_ratio)||alignment_error_px<0||contour_mismatch_ratio<0||contour_mismatch_ratio>1||![reviewed_regions,protected_regions].every(v=>Number.isInteger(v)&&v>=0))return {status:'REVIEW_REQUIRED',reasons:['UNRELIABLE_METRICS']};
 if(!reviewed_regions||!protected_regions)return {status:'REVIEW_REQUIRED',reasons:['NO_PROTECTED_REGION_EVIDENCE']};
 if(alignment_error_px>2)return {status:'REVIEW_REQUIRED',reasons:['ALIGNMENT_UNCERTAIN']};
 if(contour_mismatch_ratio>0.015)return {status:'REVIEW_REQUIRED',reasons:['CONTOUR_DIFFERENCE']};
 return {status:'REVIEW_REQUIRED',reasons:['METRICS_WITHIN_PRELIMINARY_BOUNDS','MANUAL_ACCEPTANCE_REQUIRED']};
}
