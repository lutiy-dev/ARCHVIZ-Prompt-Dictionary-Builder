import {prepareTask,authorizeToolCall,integrationStatus,evaluateGeometryQC,appendHistory} from './core.mjs';
import {readHistory,addHistoryRecord,exportHistory} from './history-store.mjs';
import {compareImageFiles} from './image-qc.mjs';
import {getDesktopStatus,probeComfyUi} from './desktop-bridge.mjs';
import {validateOfflineComfyFiles} from './offline-comfyui-check.mjs';
import {stageArtCandidate,decideArtCandidate} from './candidate-review.mjs';

const $=id=>document.getElementById(id);
const names={art_director:'AI Art Director',geometry_guardian:'Geometry Guardian',skills:'OVizLAB Skills',mcp_comfyui:'MCP / ComfyUI',history:'Production History'};
const initialHistory=readHistory(localStorage);
let chosen='art_director',currentTask=null,stagedCandidate=null,history=initialHistory.records;
let historyError=initialHistory.error;
const previewUrls=new Set();
function clearPreviewUrls(){for(const url of previewUrls)URL.revokeObjectURL(url);previewUrls.clear();}
function node(tag,value){const e=document.createElement(tag);if(value!==undefined)e.textContent=value;return e;}
function field(label,id,placeholder='',multiline=false){
 const wrap=node('label');wrap.className='production-field';
 const caption=node('span',label),input=node(multiline?'textarea':'input');
 input.id=id;input.placeholder=placeholder;wrap.append(caption,input);return wrap;
}
function action(label,callback){const b=node('button',label);b.type='button';b.onclick=callback;
 if(/^(Export|Copy|Reject|Stage|Check|Validate source|Probe|Review metrics)/.test(label))b.classList.add('production-secondary');
 if(/^Reject/.test(label))b.classList.add('production-danger');
 return b;}
function panel(title,description){
 const e=node('section');e.className='production-panel';e.append(node('h2',title),node('p',description));return e;
}
function feedback(message,failed=false){$('productionNotice').textContent=message;$('productionNotice').dataset.failed=String(failed);}
const resultTabs=[...document.querySelectorAll('.production-result-tabs [role="tab"]')];
let currentResult=null;
function setResultView(view){
 const views={summary:'productionSummary',issues:'productionIssues',json:'productionJson',history:'productionHistory'};
 if(!Object.hasOwn(views,view))return;
 for(const [name,id] of Object.entries(views))$(id).hidden=name!==view;
 for(const tab of resultTabs){const active=tab.dataset.view===view;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
 if(view==='history')$('productionHistoryPreview').textContent=historyError?'BLOCKED · '+historyError:JSON.stringify(history,null,2);
}
function result(data){
 currentResult=data;
 $('productionTask').value=JSON.stringify(data,null,2);
 const status=typeof data?.status==='string'?data.status:'NOT_VERIFIED';
 const summary=$('productionSummary');summary.replaceChildren();
 const statusLine=node('strong',status);statusLine.className='production-result-status';
 summary.append(statusLine,node('p',data?.notice||data?.reason||'Технический результат. Выполните ручную проверку перед принятием.'));
 const safe=['status','task_id','prompt_id','node_count','model_count','geometry_verified','runtime_tested','network_used'];
 for(const key of safe){if(data?.[key]===undefined)continue;const item=node('div');item.className='production-result-fact';item.append(node('span',key),node('strong',String(data[key])));summary.append(item);}
 const issues=$('productionIssues');issues.replaceChildren();
 const findings=[...(Array.isArray(data?.errors)?data.errors:[]),...(Array.isArray(data?.issues)?data.issues.map(x=>typeof x==='string'?x:JSON.stringify(x)):[])];
 if(data?.geometry_verified!==true)findings.push('Geometry preservation NOT VERIFIED');
 if(data?.runtime_tested!==true)findings.push('Real model/runtime test NOT VERIFIED');
 if(data?.status==='BLOCKED'&&typeof data?.reason==='string')findings.push(data.reason);
 if(!findings.length)findings.push('No reported issues; this is not an automatic QC PASS.');
 for(const issue of findings)issues.append(node('p',issue));
 setResultView('summary');
}
function exportJson(filename,content){
 const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json'}));
 const a=node('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function redraw(){
 clearPreviewUrls();
 for(const b of $('productionCabinets').querySelectorAll('button')){const active=b.dataset.cabinet===chosen;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
 const host=$('productionContent');host.replaceChildren();
 if(chosen==='art_director'){
  const p=panel('AI Art Director · Draft','Формирование задания без вызова AI-модели. Сохранение исходной архитектуры по умолчанию.');
  p.append(field('Project ID','productionProject','project_01'),field('Shot ID (optional)','productionShot','shot_05'),field('Art-direction brief','productionBrief','Composition, materials, lighting and allowed changes',true));
  const l=node('label');l.className='production-field';l.append(node('span','Architecture Lock'));
  const lock=node('select');lock.id='productionLock';for(const value of ['HARD','SOFT','EDITABLE']){const o=node('option',value);o.value=value;lock.append(o);}l.append(lock);p.append(l);
  p.append(action('Prepare task · no execution',()=>{
   try{const id='task_'+(crypto.randomUUID?.()||String(Date.now())).replaceAll('-','').slice(0,20);
    stagedCandidate=null;
    currentTask=prepareTask({id,project_id:$('productionProject').value.trim(),shot_id:$('productionShot').value.trim()||null,cabinet:'art_director',description:$('productionBrief').value.trim(),architecture_lock:$('productionLock').value});
    const entry={id:'log_'+id,task_id:id,status:'GENERATED',note:'Prepared in Web/PWA with no AI call'};
    history=appendHistory(history,entry);
    try{if(historyError)throw Error(historyError);addHistoryRecord(localStorage,entry)}catch(error){historyError=error.message;feedback('GENERATED · task prepared; history not persisted: '+historyError,true);result(currentTask);return}
    result(currentTask);feedback('GENERATED · локальное задание сохранено в отдельную историю, AI не подключён');
   }catch(e){feedback('BLOCKED · '+e.message,true);}
  }));
  p.append(field('Structured AI Candidate JSON · review only','productionCandidateJson','Paste structured output from an approved AI call',true));
  const reviewLabel=node('label');reviewLabel.className='production-field';
  const reviewBox=node('input');reviewBox.type='checkbox';reviewBox.id='productionGeometryAcknowledged';
  reviewLabel.append(reviewBox,node('span','Geometry risk reviewed manually (not an automatic QC PASS)'));p.append(reviewLabel);
  p.append(action('Stage candidate JSON',()=>{
   try{
    if(!currentTask)throw Error('Prepare an Art Director task first');
    stagedCandidate=stageArtCandidate(currentTask,$('productionCandidateJson').value);
    result(stagedCandidate);feedback('CANDIDATE_REVIEW_REQUIRED · source project unchanged');
   }catch(e){feedback('BLOCKED · '+e.message,true)}
  }));
  for(const decision of ['ACCEPTED','REJECTED'])p.append(action(decision==='ACCEPTED'?'Accept recommendations':'Reject recommendations',()=>{
   try{
    const decided=decideArtCandidate(stagedCandidate,{decision,userConfirmed:true,geometryReviewed:$('productionGeometryAcknowledged').checked});
    const id='decision_'+(crypto.randomUUID?.()||String(Date.now())).replaceAll('-','').slice(0,18);
    const entry={id,task_id:decided.task_id,status:decision,note:'Recommendation decision only; project NOT modified'};
    if(historyError)throw Error(historyError);
    addHistoryRecord(localStorage,entry);
    history=appendHistory(history,entry);
    stagedCandidate=null;result(decided);feedback(decision+' · recommendations only; no project data modified');
   }catch(e){feedback('BLOCKED · '+e.message,true)}
  }));
  host.append(p);
 }else if(chosen==='geometry_guardian'){
  const p=panel('Geometry Guardian · Advisory QC','Локальное пиксельное сравнение и ручные метрики. Результат не доказывает сохранение архитектурной геометрии; автоматический PASS запрещён.');
  for(const [label,id,placeholder] of [['Original ID','productionSource','original'],['AI Result ID','productionResult','result'],['Alignment error px','productionAlignment','0'],['Contour mismatch ratio 0-1','productionContour','0'],['Reviewed regions','productionRegions','0'],['Protected regions','productionProtected','0']])p.append(field(label,id,placeholder));
  const files=node('div');files.className='production-image-pair';
  const imageInput=(title,id)=>{const row=node('label');row.className='production-field';const input=node('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.id=id;row.append(node('span',title),input);return row};
  files.append(imageInput('Original Corona render','productionOriginalFile'),imageInput('AI candidate','productionCandidateFile'));
  p.append(files);
  const previews=node('div');previews.className='production-image-pair production-image-previews';
  for(const [id,label] of [['productionOriginalFile','Source · Corona'],['productionCandidateFile','Candidate · AI']]){
   const figure=node('figure');figure.className='production-image-preview';
   const caption=node('figcaption',label);const placeholder=node('p','Файл не выбран');
   figure.append(caption,placeholder);previews.append(figure);
   let previousUrl=null;
   queueMicrotask(()=>{
    const input=$(id);if(!input)return;
    input.addEventListener('change',()=>{
     if(previousUrl){URL.revokeObjectURL(previousUrl);previewUrls.delete(previousUrl);previousUrl=null;}
     figure.replaceChildren(caption);
     const file=input.files?.[0];
     if(!file){figure.append(node('p','Файл не выбран'));return;}
     if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>30_000_000){figure.append(node('p','BLOCKED · неподдерживаемое изображение'));return;}
     const img=node('img');img.alt=label+' · local preview, not QC evidence';img.loading='lazy';
     previousUrl=URL.createObjectURL(file);previewUrls.add(previousUrl);img.src=previousUrl;
     img.onerror=()=>{figure.replaceChildren(caption,node('p','BLOCKED · невозможно прочитать изображение'));};
     figure.append(img);
    });
   });
  }
  p.append(previews);
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
  const p=panel('MCP / ComfyUI · Connection Readiness','Web/PWA не запускает локальные процессы. Desktop имеет ограниченный read-only bridge; очередь генерации пока не подключена.');
  for(const name of ['OpenAI API','Local MCP','ComfyUI'])p.append(node('div',name+' · '+integrationStatus().status+' / NOT CONNECTED'));
  const native=node('div','Desktop Sidecar · CHECKING');p.append(native);
  void getDesktopStatus().then(s=>{native.textContent='Desktop Sidecar · '+s.runtime+(s.mcp_ready?' / STDIO READY':' / NOT CONNECTED');});
  p.append(action('Probe local ComfyUI :8188 · read-only',async()=>{
   feedback('Checking local Desktop connection only');
   const state=await probeComfyUi();
   result(state);
   feedback('ComfyUI · '+state.status+(state.reason?' / '+state.reason:''));
  }));
  const offline=node('div');offline.className='production-image-pair';
  for(const [label,id] of [['ComfyUI API prompt (.json)','productionComfyApiFile'],['ComfyUI object_info (.json)','productionComfyInfoFile']]){
   const l=node('label');l.className='production-field';const input=node('input');input.type='file';input.accept='.json,application/json';input.id=id;l.append(node('span',label),input);offline.append(l);
  }
  p.append(offline);
  p.append(action('Validate API prompt offline · no execution',async()=>{
   try{
    const report=await validateOfflineComfyFiles($('productionComfyApiFile')?.files?.[0],$('productionComfyInfoFile')?.files?.[0]);
    result(report);feedback(report.status+' · '+(report.valid?'structural check only; runtime NOT TESTED':report.errors.join('; ')),!report.valid);
   }catch(e){feedback('BLOCKED · '+e.message,true)}
  }));
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
const resultViewIds={summary:'productionSummary',issues:'productionIssues',json:'productionJson',history:'productionHistory'};
for(const [index,tab] of resultTabs.entries()){
 tab.id='productionResultTab'+index;tab.setAttribute('aria-controls',resultViewIds[tab.dataset.view]);
 $(resultViewIds[tab.dataset.view]).setAttribute('aria-labelledby',tab.id);
 tab.addEventListener('click',()=>setResultView(tab.dataset.view));
 tab.addEventListener('keydown',event=>{
  const keys=['ArrowRight','ArrowLeft','Home','End'];if(!keys.includes(event.key))return;
  event.preventDefault();
  const next=event.key==='Home'?0:event.key==='End'?resultTabs.length-1:
   (index+(event.key==='ArrowRight'?1:-1)+resultTabs.length)%resultTabs.length;
  setResultView(resultTabs[next].dataset.view);resultTabs[next].focus();
 });
}
$('productionCopyTask').addEventListener('click',async()=>{
 if(!$('productionTask').value){feedback('BLOCKED · no JSON result to copy',true);return;}
 try{await navigator.clipboard.writeText($('productionTask').value);feedback('JSON copied · local only');}
 catch{feedback('BLOCKED · clipboard unavailable',true);}
});
setResultView('summary');
for(const [name,label] of Object.entries(names)){const b=action(label,()=>{chosen=name;redraw();feedback('LAB · внешние интеграции отключены')});b.dataset.cabinet=name;$('productionCabinets').append(b);}
$('productionExportTask').addEventListener('click',()=>{if(!currentTask){feedback('BLOCKED · сначала сформируйте задание',true);return;}exportJson(currentTask.id+'.json',currentTask);feedback('GENERATED · exported metadata only')});
redraw();$('productionRoot').dataset.ready='true';
