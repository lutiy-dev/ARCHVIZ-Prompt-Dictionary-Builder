import {prepareTask,authorizeToolCall,integrationStatus,evaluateGeometryQC,appendHistory} from './core.mjs';
import {readHistory,addHistoryRecord,exportHistory} from './history-store.mjs';
import {compareImageFiles} from './image-qc.mjs';
import {getDesktopStatus} from './desktop-bridge.mjs';

const $=id=>document.getElementById(id);
const names={art_director:'AI Art Director',geometry_guardian:'Geometry Guardian',skills:'OVizLAB Skills',mcp_comfyui:'MCP / ComfyUI',history:'Production History'};
const initialHistory=readHistory(localStorage);
let chosen='art_director',currentTask=null,history=initialHistory.records;
let historyError=initialHistory.error;
function node(tag,value){const e=document.createElement(tag);if(value!==undefined)e.textContent=value;return e;}
function field(label,id,placeholder='',multiline=false){
 const wrap=node('label');wrap.className='production-field';
 const caption=node('span',label),input=node(multiline?'textarea':'input');
 input.id=id;input.placeholder=placeholder;wrap.append(caption,input);return wrap;
}
function action(label,callback){const b=node('button',label);b.type='button';b.onclick=callback;return b;}
function panel(title,description){
 const e=node('section');e.className='production-panel';e.append(node('h2',title),node('p',description));return e;
}
function feedback(message,failed=false){$('productionNotice').textContent=message;$('productionNotice').dataset.failed=String(failed);}
function result(data){$('productionTask').value=JSON.stringify(data,null,2);}
function exportJson(filename,content){
 const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json'}));
 const a=node('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function redraw(){
 for(const b of $('productionCabinets').querySelectorAll('button')){const active=b.dataset.cabinet===chosen;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
 const host=$('productionContent');host.replaceChildren();
 if(chosen==='art_director'){
  const p=panel('AI Art Director · Draft','Формирование задания без вызова AI-модели. Сохранение исходной архитектуры по умолчанию.');
  p.append(field('Project ID','productionProject','project_01'),field('Shot ID (optional)','productionShot','shot_05'),field('Art-direction brief','productionBrief','Composition, materials, lighting and allowed changes',true));
  const l=node('label');l.className='production-field';l.append(node('span','Architecture Lock'));
  const lock=node('select');lock.id='productionLock';for(const value of ['HARD','SOFT','EDITABLE']){const o=node('option',value);o.value=value;lock.append(o);}l.append(lock);p.append(l);
  p.append(action('Prepare task · no execution',()=>{
   try{const id='task_'+(crypto.randomUUID?.()||String(Date.now())).replaceAll('-','').slice(0,20);
    currentTask=prepareTask({id,project_id:$('productionProject').value.trim(),shot_id:$('productionShot').value.trim()||null,cabinet:'art_director',description:$('productionBrief').value.trim(),architecture_lock:$('productionLock').value});
    const entry={id:'log_'+id,task_id:id,status:'GENERATED',note:'Prepared in Web/PWA with no AI call'};
    history=appendHistory(history,entry);
    try{if(historyError)throw Error(historyError);addHistoryRecord(localStorage,entry)}catch(error){historyError=error.message;feedback('GENERATED · task prepared; history not persisted: '+historyError,true);result(currentTask);return}
    result(currentTask);feedback('GENERATED · локальное задание сохранено в отдельную историю, AI не подключён');
   }catch(e){feedback('BLOCKED · '+e.message,true);}
  }));host.append(p);
 }else if(chosen==='geometry_guardian'){
  const p=panel('Geometry Guardian · Advisory QC','Проверка только вручную введённых метрик. Изображения не анализируются; автоматический PASS запрещён.');
  for(const [label,id,placeholder] of [['Original ID','productionSource','original'],['AI Result ID','productionResult','result'],['Alignment error px','productionAlignment','0'],['Contour mismatch ratio 0-1','productionContour','0'],['Reviewed regions','productionRegions','0'],['Protected regions','productionProtected','0']])p.append(field(label,id,placeholder));
  const files=node('div');files.className='production-image-pair';
  const imageInput=(title,id)=>{const row=node('label');row.className='production-field';const input=node('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.id=id;row.append(node('span',title),input);return row};
  files.append(imageInput('Original Corona render','productionOriginalFile'),imageInput('AI candidate','productionCandidateFile'));
  p.append(files);
  p.append(action('Compare local image pixels · LAB',async()=>{
   const a=$('productionOriginalFile')?.files?.[0],b=$('productionCandidateFile')?.files?.[0];
   if(!a||!b){feedback('BLOCKED · select two image files',true);return}
   try{
    feedback('Comparing images locally · no cloud upload');
    const comparison=await compareImageFiles(a,b);
    result(comparison.report);
    const previous=document.getElementById('productionDifferenceCanvas');previous?.remove();
    const overlay=comparison.canvas;overlay.id='productionDifferenceCanvas';overlay.setAttribute('aria-label','Red regions indicate changed pixels, not confirmed geometry defects');overlay.className='production-difference-canvas';
    p.append(node('p','Difference overlay · red = pixel change; verify windows/facade manually'),overlay);
    feedback('REVIEW REQUIRED · pixel difference is not geometry validation');
   }catch(e){feedback('BLOCKED · '+e.message,true)}
  }));
  p.append(action('Review metrics',()=>{try{
   const v=evaluateGeometryQC({source_id:$('productionSource').value.trim(),result_id:$('productionResult').value.trim(),alignment_error_px:Number($('productionAlignment').value),contour_mismatch_ratio:Number($('productionContour').value),reviewed_regions:Number($('productionRegions').value),protected_regions:Number($('productionProtected').value)});
   result(v);feedback('REVIEW REQUIRED · оценка не подтверждает сохранение геометрии');
  }catch(e){feedback('BLOCKED · '+e.message,true)}}));host.append(p);
 }else if(chosen==='skills'){
  const p=panel('OVizLAB Skills · Pinned Source','Только проверка формы ссылки; фактическая загрузка и исполнение Skill не реализованы.');
  p.append(field('Skill ID','productionSkillId','archviz-geometry-guardian'),field('Repository','productionRepo','lutiy-dev/GitHab-Skills'),field('Canonical path','productionSkillPath','skills/archviz-geometry-guardian/SKILL.md'),field('Exact commit SHA','productionSkillSha','40 lowercase hex'));
  p.append(action('Validate source metadata',()=>{const sha=$('productionSkillSha').value.trim();
   if(!/^[0-9a-f]{40}$/.test(sha)){feedback('BLOCKED · exact commit SHA required',true);return;}
   result({status:'SOURCE_DECLARED_NOT_FETCHED',skill_id:$('productionSkillId').value.trim(),repository:$('productionRepo').value.trim(),path:$('productionSkillPath').value.trim(),sha});
   feedback('NOT VERIFIED · метаданные проверены, источник не загружен');
  }));host.append(p);
 }else if(chosen==='mcp_comfyui'){
  const p=panel('MCP / ComfyUI · Connection Readiness','Web/PWA не запускает локальные процессы. Защищённый desktop bridge пока отсутствует.');
  for(const name of ['OpenAI API','Local MCP','ComfyUI'])p.append(node('div',name+' · '+integrationStatus().status+' / NOT CONNECTED'));
  const native=node('div','Desktop Sidecar · CHECKING');p.append(native);
  void getDesktopStatus().then(s=>{native.textContent='Desktop Sidecar · '+s.runtime+(s.mcp_ready?' / STDIO READY':' / NOT CONNECTED');});
  p.append(action('Check execution policy (dry-run)',()=>{
   const decision=authorizeToolCall({server_id:'comfyui',tool_id:'queue',effect:'execute'},{allow:[]});
   result(decision);feedback('Tool call denied · '+decision.reason);
  }));host.append(p);
 }else{
  const p=panel('Production History · Local','История хранится только в данном браузере под отдельным ключом. Экспортируйте JSON для резервной копии.');
  if(historyError)p.append(node('p','BLOCKED: existing history cannot be safely read or overwritten: '+historyError));
  const pre=node('pre',JSON.stringify(history,null,2));pre.className='production-history';p.append(pre);
  p.append(action('Export history JSON',()=>{if(historyError){feedback('BLOCKED · history unreadable; original storage retained',true);return;}try{exportJson('archviz-production-history.json',JSON.parse(exportHistory(localStorage)))}catch(e){feedback('BLOCKED · '+e.message,true)}}));host.append(p);
 }
}
for(const [name,label] of Object.entries(names)){const b=action(label,()=>{chosen=name;redraw();feedback('LAB · внешние интеграции отключены')});b.dataset.cabinet=name;$('productionCabinets').append(b);}
$('productionExportTask').addEventListener('click',()=>{if(!currentTask){feedback('BLOCKED · сначала сформируйте задание',true);return;}exportJson(currentTask.id+'.json',currentTask);feedback('GENERATED · exported metadata only')});
redraw();$('productionRoot').dataset.ready='true';
