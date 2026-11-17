import {prepareTask,authorizeToolCall,integrationStatus,evaluateGeometryQC,appendHistory} from './core.mjs';
import {readHistory,addHistoryRecord,exportHistory} from './history-store.mjs';
import {compareImageFiles} from './image-qc.mjs';
import {getDesktopStatus,discoverComfyUi,probeComfyUiPort} from './desktop-bridge.mjs';
import {validateOfflineComfyFiles} from './offline-comfyui-check.mjs';
import {stageArtCandidate,decideArtCandidate} from './candidate-review.mjs';

const $=id=>document.getElementById(id);
const names={art_director:'AI Арт-директор',geometry_guardian:'Контроль геометрии',skills:'OVizLAB Skills',mcp_comfyui:'MCP / ComfyUI',history:'История Production'};
const initialHistory=readHistory(localStorage);
let chosen='art_director',currentTask=null,stagedCandidate=null,history=initialHistory.records;
let historyError=initialHistory.error;
const statusLabels={
 GENERATED:'Задание подготовлено',
 CANDIDATE_REVIEW_REQUIRED:'Требуется проверка предложения',
 ACCEPTED:'Рекомендации приняты',
 REJECTED:'Рекомендации отклонены',
 REVIEW_REQUIRED:'Требуется ручная проверка',
 BLOCKED:'Действие заблокировано',
 CONNECTED_UNVERIFIED:'Подключено · требуется проверка',
 DISCONNECTED:'Не подключено',
 NOT_VERIFIED:'Не проверено',
 NOT_TESTED:'Не протестировано',
 TESTED:'Протестировано',
 OFFLINE_VALIDATED_UNVERIFIED:'Структура проверена · runtime не подтверждён',
 SOURCE_DECLARED_NOT_FETCHED:'Источник указан · не загружен'
};
const factLabels={status:'Статус',task_id:'ID задачи',prompt_id:'ID промпта',node_count:'Количество нод',model_count:'Количество моделей',geometry_verified:'Геометрия проверена',runtime_tested:'Runtime протестирован',network_used:'Сеть использовалась',model_selection_verified:'Выбор моделей проверен',queue_allowed:'Запуск очереди разрешён',api_verified:'ComfyUI API подтверждён',port:'Порт'};
const beginnerTips={
 GENERATED:'Следующий шаг: проверьте содержимое задания. Если всё верно — подготовьте AI-кандидат для ручной проверки.',
 CANDIDATE_REVIEW_REQUIRED:'Следующий шаг: просмотрите предложение и риски. Примите или отклоните рекомендации — проект сам не изменится.',
 ACCEPTED:'Рекомендации приняты. Ничего не применено автоматически; следующий этап — отдельное выполнение через утверждённый workflow.',
 REJECTED:'Рекомендации отклонены. Можно скорректировать задание и подготовить новый вариант.',
 REVIEW_REQUIRED:'Нужна ручная проверка. Не считайте результат подтверждённым, пока не просмотрены исходник и кандидат.',
 BLOCKED:'Действие остановлено. Откройте вкладку «Проблемы» и устраните указанную причину.',
 CONNECTED_UNVERIFIED:'Связь найдена, но готовность моделей и workflow ещё не подтверждена. Проверьте JSON и object_info перед запуском.',
 DISCONNECTED:'Сначала подключите локальный сервис или проверьте, что он запущен.',
 NOT_VERIFIED:'Результат ещё не проверен. Выполните основной шаг в выбранном кабинете.',
 NOT_TESTED:'Подключение или структура найдены, но реальный запуск не проверен. Не считайте систему готовой к Production.',
 TESTED:'Runtime-проверка пройдена. Всё равно проверьте конкретный результат перед принятием.',
 OFFLINE_VALIDATED_UNVERIFIED:'JSON структурно совместим. Следующий шаг — проверить реальные ноды, модели и только затем разрешать запуск.',
 SOURCE_DECLARED_NOT_FETCHED:'Ссылка оформлена корректно, но содержимое Skill ещё не загружено и не проверено.'
};
function displayStatus(status){return statusLabels[status]||status.replaceAll('_',' ')}
function displayFact(key,value){
 if(typeof value==='boolean')return value?'Да':'Нет';
 if(key==='status'&&typeof value==='string')return displayStatus(value);
 return String(value);
}
const issueLabels={
 UNRELIABLE_METRICS:'Метрики введены некорректно или недостаточно надёжны.',
 NO_PROTECTED_REGION_EVIDENCE:'Не указаны проверенные и защищённые области изображения.',
 ALIGNMENT_UNCERTAIN:'Выравнивание исходника и AI-кандидата недостаточно точное.',
 CONTOUR_DIFFERENCE:'Обнаружено заметное различие контуров. Проверьте окна, кромки, проёмы и фасад вручную.',
 METRICS_WITHIN_PRELIMINARY_BOUNDS:'Предварительные метрики находятся в допустимых границах, но это не подтверждает геометрию.',
 MANUAL_ACCEPTANCE_REQUIRED:'Требуется ручное принятие результата.',
 INVALID_REQUEST:'Некорректный запрос.',
 NOT_ALLOWLISTED:'Действие не разрешено текущей политикой.',
 USER_APPROVAL_REQUIRED:'Требуется явное подтверждение пользователя.',
 EXECUTION_DISABLED:'Исполнение отключено.',
 NOT_CONNECTED:'Сервис не подключён.',
 ADAPTER_NOT_VERIFIED:'Адаптер не проверен.',
 RUNTIME_NOT_TESTED:'Реальный runtime не протестирован.'
};
function displayIssue(value){return issueLabels[value]||String(value).replaceAll('_',' ')}
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
 if(/^(Prepare task|Compare local image pixels|Validate API prompt offline)/.test(label))b.classList.add('production-primary');
 if(/^Accept recommendations/.test(label))b.classList.add('production-review');
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
 const statusLine=node('strong',displayStatus(status));statusLine.className='production-result-status';
 const explanation=node('p',data?.notice||data?.reason||'Технический результат. Выполните ручную проверку перед принятием.');
 const tip=node('p',beginnerTips[status]||beginnerTips.NOT_VERIFIED);tip.className='production-beginner-tip';
 summary.append(statusLine,explanation,tip);
 const safe=['status','task_id','prompt_id','node_count','model_count','geometry_verified','runtime_tested','network_used'];
 for(const key of safe){if(data?.[key]===undefined)continue;const item=node('div');item.className='production-result-fact';item.append(node('span',factLabels[key]||key),node('strong',displayFact(key,data[key])));summary.append(item);}
 const issues=$('productionIssues');issues.replaceChildren();
 const findings=[...(Array.isArray(data?.errors)?data.errors:[]),...(Array.isArray(data?.issues)?data.issues.map(x=>typeof x==='string'?x:JSON.stringify(x)):[]),...(Array.isArray(data?.reasons)?data.reasons:[])].map(displayIssue);
 if(data?.geometry_verified!==true)findings.push('Сохранение геометрии НЕ ПОДТВЕРЖДЕНО');
 if(data?.runtime_tested!==true)findings.push('Реальный runtime / модель НЕ ПРОТЕСТИРОВАНЫ');
 if(data?.status==='BLOCKED'&&typeof data?.reason==='string')findings.push(data.reason);
 if(!findings.length)findings.push('Ошибок не заявлено, но это не автоматический QC PASS.');
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
    $('productionExportTask').disabled=false;
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
  const p=panel('Контроль геометрии · Advisory QC','Локальное пиксельное сравнение и ручные метрики. Результат не доказывает сохранение архитектурной геометрии; автоматический PASS запрещён.');
  for(const [label,id,placeholder] of [['ID исходника','productionSource','original'],['ID AI-результата','productionResult','result'],['Ошибка выравнивания, px','productionAlignment','0'],['Расхождение контуров 0–1','productionContour','0'],['Проверенные области','productionRegions','0'],['Защищённые области','productionProtected','0']])p.append(field(label,id,placeholder));
  const files=node('div');files.className='production-image-pair';
  const imageInput=(title,id)=>{const row=node('label');row.className='production-field';const input=node('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.id=id;row.append(node('span',title),input);return row};
  files.append(imageInput('Исходный Corona render','productionOriginalFile'),imageInput('AI-кандидат','productionCandidateFile'));
  p.append(files);
  const previews=node('div');previews.className='production-image-pair production-image-previews';
  for(const [id,label] of [['productionOriginalFile','Исходник · Corona'],['productionCandidateFile','Кандидат · AI']]){
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
  p.append(action('Сравнить изображения локально · LAB',async()=>{
   const a=$('productionOriginalFile')?.files?.[0],b=$('productionCandidateFile')?.files?.[0];
   if(!a||!b){feedback('BLOCKED · выберите два изображения',true);return}
   try{
    feedback('Локальное сравнение изображений · без загрузки в облако');
    const comparison=await compareImageFiles(a,b);
    result(comparison.report);
    const previous=document.getElementById('productionDifferenceCanvas');previous?.remove();
    const overlay=comparison.canvas;overlay.id='productionDifferenceCanvas';overlay.setAttribute('aria-label','Red regions indicate changed pixels, not confirmed geometry defects');overlay.className='production-difference-canvas';
    p.append(node('p','Карта различий · красный показывает изменение пикселей. Окна, контуры и фасад проверьте вручную.'),overlay);
    feedback('REVIEW REQUIRED · различие пикселей не является доказательством изменения геометрии');
   }catch(e){feedback('BLOCKED · '+e.message,true)}
  }));
  p.append(action('Проверить метрики',()=>{try{
   const v=evaluateGeometryQC({source_id:$('productionSource').value.trim(),result_id:$('productionResult').value.trim(),alignment_error_px:Number($('productionAlignment').value),contour_mismatch_ratio:Number($('productionContour').value),reviewed_regions:Number($('productionRegions').value),protected_regions:Number($('productionProtected').value)});
   result(v);feedback('REVIEW REQUIRED · оценка не подтверждает сохранение геометрии');
  }catch(e){feedback('BLOCKED · '+e.message,true)}}));host.append(p);
 }else if(chosen==='skills'){
  const p=panel('OVizLAB Skills · Зафиксированный источник','Только проверка формы ссылки; фактическая загрузка и исполнение Skill не реализованы.');
  p.append(field('ID Skill','productionSkillId','archviz-geometry-guardian'),field('Репозиторий','productionRepo','lutiy-dev/GitHab-Skills'),field('Канонический путь','productionSkillPath','skills/archviz-geometry-guardian/SKILL.md'),field('Точный commit SHA','productionSkillSha','40 lowercase hex'));
  p.append(action('Проверить метаданные источника',()=>{const sha=$('productionSkillSha').value.trim();
   if(!/^[0-9a-f]{40}$/.test(sha)){feedback('BLOCKED · требуется точный commit SHA из 40 символов',true);return;}
   result({status:'SOURCE_DECLARED_NOT_FETCHED',skill_id:$('productionSkillId').value.trim(),repository:$('productionRepo').value.trim(),path:$('productionSkillPath').value.trim(),sha});
   feedback('NOT VERIFIED · метаданные проверены, источник не загружен');
  }));host.append(p);
 }else if(chosen==='mcp_comfyui'){
  const p=panel('MCP / ComfyUI · Готовность подключения','Web/PWA не запускает локальные процессы. Desktop имеет ограниченный read-only bridge; очередь генерации пока не подключена.');
  for(const name of ['OpenAI API','Local MCP','ComfyUI'])p.append(node('div',name+' · '+integrationStatus().status+' / НЕ ПОДКЛЮЧЕНО'));
  const native=node('div','Desktop Sidecar · ПРОВЕРКА');p.append(native);
  void getDesktopStatus().then(s=>{native.textContent='Desktop Sidecar · '+s.runtime+(s.mcp_ready?' / STDIO READY':' / NOT CONNECTED');});
  const endpoint=node('div','ComfyUI endpoint · AUTO / поиск…');endpoint.className='production-result-fact';p.append(endpoint);
  let discoveryRunning=false;
  const runDiscovery=async()=>{
   if(discoveryRunning)return;
   discoveryRunning=true;
   endpoint.textContent='ComfyUI endpoint · AUTO / searching…';
   feedback('Поиск локального ComfyUI и проверка read-only API');
   try{
    const state=await discoverComfyUi();
    endpoint.textContent='ComfyUI endpoint · '+(state.origin||'NOT FOUND');
    result(state);
    feedback('ComfyUI · '+state.status+(state.origin?' / '+state.origin:'')+(state.reason?' / '+state.reason:''));
   }finally{discoveryRunning=false}
  };
  p.append(action('Повторно найти локальный ComfyUI · read-only',runDiscovery));
  const manual=node('div');manual.className='production-image-pair';
  const portField=field('Порт localhost вручную','productionComfyPort','8000');
  const portInput=portField.querySelector('input');portInput.type='number';portInput.min='1';portInput.max='65535';portInput.value='8000';
  manual.append(portField);
  const manualButton=action('Проверить порт вручную · read-only',async()=>{
   const state=await probeComfyUiPort($('productionComfyPort').value);
   endpoint.textContent='ComfyUI endpoint · '+(state.origin||'NOT FOUND');
   result(state);
   feedback('ComfyUI · '+state.status+(state.origin?' / '+state.origin:'')+(state.reason?' / '+state.reason:''));
  });
  manual.append(manualButton);p.append(manual);
  const offline=node('div');offline.className='production-image-pair';
  for(const [label,id] of [['ComfyUI API prompt (.json)','productionComfyApiFile'],['ComfyUI object_info (.json)','productionComfyInfoFile']]){
   const l=node('label');l.className='production-field';const input=node('input');input.type='file';input.accept='.json,application/json';input.id=id;l.append(node('span',label),input);offline.append(l);
  }
  p.append(offline);
  p.append(action('Проверить API prompt offline · без запуска',async()=>{
   try{
    const report=await validateOfflineComfyFiles($('productionComfyApiFile')?.files?.[0],$('productionComfyInfoFile')?.files?.[0]);
    result(report);feedback(report.status+' · '+(report.valid?'structural check only; runtime NOT TESTED':report.errors.join('; ')),!report.valid);
   }catch(e){feedback('BLOCKED · '+e.message,true)}
  }));
  p.append(action('Проверить политику запуска · dry-run',()=>{
   const decision=authorizeToolCall({server_id:'comfyui',tool_id:'queue',effect:'execute'},{allow:[]});
   result(decision);feedback('Вызов инструмента запрещён · '+displayIssue(decision.reason));
  }));host.append(p);void runDiscovery();
 }else{
  const p=panel('История Production · Локально','История хранится только в данном браузере под отдельным ключом. Экспортируйте JSON для резервной копии.');
  if(historyError)p.append(node('p','BLOCKED: existing history cannot be safely read or overwritten: '+historyError));
  const pre=node('pre',JSON.stringify(history,null,2));pre.className='production-history';p.append(pre);
  p.append(action('Экспорт истории JSON',()=>{if(historyError){feedback('BLOCKED · history unreadable; original storage retained',true);return;}try{exportJson('archviz-production-history.json',JSON.parse(exportHistory(localStorage)))}catch(e){feedback('BLOCKED · '+e.message,true)}}));host.append(p);
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
 try{await navigator.clipboard.writeText($('productionTask').value);feedback('JSON скопирован · только локально');}
 catch{feedback('BLOCKED · буфер обмена недоступен',true);}
});
setResultView('summary');
for(const [name,label] of Object.entries(names)){const b=action(label,()=>{chosen=name;redraw();feedback('LAB · внешние интеграции отключены')});b.dataset.cabinet=name;$('productionCabinets').append(b);}
$('productionExportTask').disabled=true;
$('productionExportTask').addEventListener('click',()=>{if(!currentTask){feedback('BLOCKED · сначала сформируйте задание',true);return;}exportJson(currentTask.id+'.json',currentTask);feedback('GENERATED · экспортированы только метаданные')});
redraw();$('productionRoot').dataset.ready='true';
