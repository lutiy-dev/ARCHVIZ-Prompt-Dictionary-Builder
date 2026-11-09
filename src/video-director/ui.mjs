
import {emptyProject,shotTemplate,demonstration,PROFILE_IDS,PROFILE_LABELS,REFERENCE_ROLES,RETENTION_MODES,MOVEMENTS,LAYERS,validateProject,STORAGE_KEY} from './schema.mjs';
import {saveLayerPreset,applyLayerPreset} from './layer-presets.mjs';
import {readProjects,writeProjects,encode,importProject} from './store.mjs';
import {compileShot} from './compiler.mjs';
const $=id=>document.getElementById(id);
const el=(tag,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e;};
const option=(val,title)=>{const o=new Option(title,val);return o;};
const uuid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID().slice(0,8):String(Date.now());
const uniqueId=prefix=>prefix+'_'+uuid();
const storage={getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value)};
const message=t=>{$('vdNotice').textContent=t};
let projects=[],project=null,shotId=null,output=null;
const initial=readProjects(storage);
if(initial.error)message(initial.error);
projects=initial.projects;
function persist(){
 const now=new Date().toISOString();
 project.updated_at=now;project.created_at??=now;
 const revised=[...projects.filter(x=>x.id!==project.id),project];
 projects=writeProjects(storage,revised);refreshProjectPicker();
}
function safeRun(action){const before=project?structuredClone(project):null;const previous=[...projects];try{action()}catch(e){project=before;projects=previous;message('STOP: '+e.message);try{renderAll()}catch{/* invalid browser storage remains untouched */}}}
function bindText(node,value,cb){node.value=value??'';node.onchange=()=>safeRun(()=>{cb(node.value);persist();renderOutput()});}
function field(parent,title,value,cb,{tag='input',type='text',placeholder=''}={}){
 const label=el('label');label.className='vd-field';label.append(el('span',title));
 const node=el(tag);if(tag==='input')node.type=type;node.placeholder=placeholder;
 bindText(node,value,cb);label.append(node);parent.append(label);return node;
}
function selectField(parent,title,value,items,cb){
 const label=el('label');label.className='vd-field';label.append(el('span',title));const s=el('select');
 items.forEach(item=>s.append(option(item.value??item,item.label??item)));s.value=value??'';
 s.onchange=()=>safeRun(()=>{cb(s.value);persist();renderAll()});label.append(s);parent.append(label);return s;
}
function button(text,fn,css=''){const b=el('button',text);b.type='button';b.className='vd-action '+css;b.onclick=()=>safeRun(fn);return b}
function currentShot(){return project?.shots.find(s=>s.id===shotId)}
function refreshProjectPicker(){
 const select=$('vdProjects');select.replaceChildren(option('','— Выберите проект —'));
 for(const p of projects)select.append(option(p.id,p.name));
 select.value=project?.id||'';
}
function chooseProject(p){project=structuredClone(p);shotId=project.shots[0]?.id||null;renderAll();}
function renderAll(){refreshProjectPicker();if(!project){$('vdWorkspace').hidden=true;$('vdTitle').textContent='Создайте проект или загрузите сохранённый';return}
 $('vdWorkspace').hidden=false;$('vdTitle').textContent=project.name;
 const head=$('vdHeaderFields');head.replaceChildren();
 field(head,'Название проекта',project.name,v=>project.name=v);
 selectField(head,'Режим экспорта',project.target_profile,PROFILE_IDS.map(x=>({value:x,label:PROFILE_LABELS[x]})),v=>project.target_profile=v);
 field(head,'Общий FPS',project.settings.default_fps,v=>project.settings.default_fps=Number(v),{type:'number'});
 field(head,'Формат кадра',project.settings.default_aspect_ratio,v=>project.settings.default_aspect_ratio=v);
 renderGlobalLayers();renderLayerPresets();renderCameraPresets();renderReferences();renderCharacters();renderShots();renderOutput();
}

function renderRetention(body,layer){
 const panel=el('div');panel.className='vd-retention';panel.append(el('h4','Retention Rules / Сохранение свойств'));
 for(const [index,rule] of layer.retention.entries()){
  const row=el('div');row.className='vd-retention-row';
  selectField(row,'Reference',rule.ref_id,project.references.map(r=>({value:r.id,label:r.label+' · '+r.id})),v=>rule.ref_id=v);
  selectField(row,'Rule',rule.mode,RETENTION_MODES,v=>rule.mode=v);
  field(row,'Attributes (comma-separated)',rule.attributes.join(', '),v=>rule.attributes=v.split(',').map(s=>s.trim()).filter(Boolean));
  row.append(button('Remove Rule',()=>{layer.retention.splice(index,1);persist();renderAll()},'quiet'));
  panel.append(row);
 }
 panel.append(button('+ Retention Rule',()=>{
  const candidate=project.references.find(r=>!layer.retention.some(x=>x.ref_id===r.id));
  if(!candidate)throw Error('No unused reference; add another reference or edit existing rule');
  layer.retention.push({ref_id:candidate.id,mode:'partially_preserved',attributes:[]});
  persist();renderAll();
 }));
 body.append(panel);
}
function renderLayerPresets(){
 const host=$('vdLayerPresets');host.replaceChildren();
 const active=currentShot();
 for(const item of project.layer_presets??[]){
  const row=el('div');row.className='vd-actions';row.append(el('span',item.name+' · '+item.layer.type));
  row.append(button('Apply to shot',()=>{
   if(!active)throw Error('Select a shot');
   project=applyLayerPreset(project,active.id,item.id,uniqueId('layer'));
   persist();renderAll();
  }));
  row.append(button('Delete preset',()=>{
   if(!confirm('Удалить пользовательский пресет слоя?'))return;
   project.layer_presets=project.layer_presets.filter(x=>x.id!==item.id);
   persist();renderAll();
  },'quiet'));
  host.append(row);
 }
 if(!project.layer_presets?.length)host.append(el('p','Сохранённые пользовательские слои появятся здесь.'));
}
function renderGlobalLayers(){
 const host=$('vdGlobalLayers');host.replaceChildren();
 for(const l of project.global_layers){const d=el('details');d.className='vd-item';d.append(el('summary',l.type+(l.enabled?'':' · OFF')));const body=el('div');
  const label=el('label'),check=el('input');check.type='checkbox';check.checked=l.enabled;check.onchange=()=>safeRun(()=>{l.enabled=check.checked;persist();renderOutput()});label.append(check,el('span','Enabled'));body.append(label);
  field(body,'Project-wide instruction EN',l.instruction,v=>l.instruction=v,{tag:'textarea'});
  renderRetention(body,l);
  body.append(button('Remove',()=>{project.global_layers=project.global_layers.filter(x=>x.id!==l.id);persist();renderAll()},'quiet'));d.append(body);host.append(d);
 }
 host.append(button('+ Global Layer',()=>{project.global_layers.push({id:uniqueId('global'),type:'additional',enabled:true,scope:'project',instruction:'',parameters:{},retention:[],priority:30,version:1});persist();renderAll()}));
}
function renderCameraPresets(){
 const host=$('vdCameraPresets');host.replaceChildren();
 const shot=currentShot();
 for(const cp of project.camera_presets){const row=el('div');row.className='vd-actions';row.append(el('span',cp.name));
  row.append(button('Apply',()=>{if(!shot)throw Error('Select a shot');shot.camera=structuredClone(cp.camera);persist();renderAll()}));
  row.append(button('Delete',()=>{if(!confirm('Удалить camera preset?'))return;project.camera_presets=project.camera_presets.filter(x=>x.id!==cp.id);persist();renderAll()},'quiet'));host.append(row);
 }
 host.append(button('+ Save current camera',()=>{if(!shot)throw Error('Select a shot');const name=window.prompt('Название Camera Preset');if(!name?.trim())return;project.camera_presets.push({id:uniqueId('camera'),name:name.slice(0,120),camera:structuredClone(shot.camera)});persist();renderAll()}));
}
function renderReferences(){
 const host=$('vdReferences');host.replaceChildren();
 const table=el('div');table.className='vd-items';
 for(const r of project.references){
  const d=el('details');d.className='vd-item';const s=el('summary',r.label+' · '+r.role+' · '+r.asset.state);d.append(s);
  const body=el('div');body.className='vd-grid';
  field(body,'Label',r.label,v=>r.label=v);
  selectField(body,'Role',r.role,REFERENCE_ROLES,v=>{r.role=v;r.kind=v==='motion_reference'||v==='camera_reference'?'video':v==='audio_reference'?'audio':'image';},);
  field(body,'Description',r.description,v=>r.description=v);
  field(body,'Display filename (metadata only)',r.asset.display_name,v=>r.asset.display_name=v);
  selectField(body,'Connection state',r.asset.state,['DECLARED','LOCALLY_ATTACHED','EXTERNALLY_CONNECTED_NOT_VERIFIED'],v=>r.asset.state=v);
  body.append(button('Удалить reference',()=>{if(!confirm('Удалить reference? All dependent shots must be updated first.'))return;const copy=structuredClone(project);copy.references=copy.references.filter(x=>x.id!==r.id);validateProject(copy);project=copy;persist();renderAll();},'quiet'));
  d.append(body);table.append(d);
 }
 host.append(table);
 host.append(button('+ Reference',()=>{const id=uniqueId('ref');project.references.push({id,kind:'image',role:'style_reference',label:'New reference',description:'',asset:{display_name:'',state:'DECLARED'}});persist();renderAll()}));
}
function renderCharacters(){
 const host=$('vdCharacters');host.replaceChildren();
 for(const c of project.characters){
  const d=el('details');d.className='vd-item';d.append(el('summary',c.name+' · '+c.id));const body=el('div');body.className='vd-grid';
  field(body,'Name',c.name,v=>c.name=v);
  field(body,'Description',c.description,v=>c.description=v,{tag:'textarea'});
  selectField(body,'Identity reference',c.identity_ref||'',[{value:'',label:'No reference'},...project.references.filter(r=>r.role==='character_identity').map(r=>({value:r.id,label:r.label}))],v=>c.identity_ref=v||null);
  field(body,'Clothing',c.clothing,v=>c.clothing=v);
  field(body,'Notes',c.notes,v=>c.notes=v,{tag:'textarea'});
  body.append(button('Удалить персонажа',()=>{if(!confirm('Удалить персонажа?'))return;project.shots.forEach(s=>s.characters=s.characters.filter(id=>id!==c.id));project.characters=project.characters.filter(x=>x.id!==c.id);persist();renderAll()},'quiet'));
  d.append(body);host.append(d);
 }
 host.append(button('+ Персонаж',()=>{project.characters.push({id:uniqueId('actor'),name:'New character',description:'',identity_ref:null,clothing:'',notes:''});persist();renderAll()}));
}
function renderShots(){
 const list=$('vdShotList');list.replaceChildren();
 for(const s of project.shots){
  const b=button(s.name+' · '+s.duration_seconds+'s',()=>{shotId=s.id;renderShots();renderOutput()},shotId===s.id?'active':'');b.setAttribute('aria-pressed',String(shotId===s.id));list.append(b);
 }
 list.append(button('+ Шот',()=>{const s=shotTemplate(uniqueId('shot'),'New shot');project.shots.push(s);shotId=s.id;persist();renderAll()}));
 const s=currentShot(),host=$('vdShotFields');host.replaceChildren();if(!s)return;
 field(host,'Название шота',s.name,v=>s.name=v);
 field(host,'Длительность, сек.',s.duration_seconds,v=>s.duration_seconds=Number(v),{type:'number'});
 const options=role=>[{value:'',label:'Не назначен'},...project.references.filter(r=>r.role===role).map(r=>({value:r.id,label:r.label+' · '+r.id}))];
 selectField(host,'FIRST',s.first_frame_ref||'',options('first_frame'),v=>s.first_frame_ref=v||null);
 selectField(host,'LAST',s.last_frame_ref||'',options('last_frame'),v=>s.last_frame_ref=v||null);
 selectField(host,'Аниматик / движение',s.motion_ref||'',options('motion_reference'),v=>s.motion_ref=v||null);
 selectField(host,'Camera movement',s.camera.movement,MOVEMENTS,v=>s.camera.movement=v);
 field(host,'Lens (mm), optional',s.camera.lens_mm??'',v=>s.camera.lens_mm=v===''?null:Number(v),{type:'number'});
 field(host,'Camera speed',s.camera.speed,v=>s.camera.speed=v);
 field(host,'Camera notes',s.camera.notes,v=>s.camera.notes=v,{tag:'textarea'});
 field(host,'Освещение',s.lighting,v=>s.lighting=v,{tag:'textarea'});
 field(host,'Атмосфера',s.atmosphere,v=>s.atmosphere=v,{tag:'textarea'});
 field(host,'Action / Blocking (one instruction per line)',s.actions.join('\n'),v=>s.actions=v.split('\n').filter(x=>x.trim()),{tag:'textarea'});
 const cast=el('fieldset');cast.className='vd-cast';cast.append(el('legend','Персонажи этого шота'));
 for(const c of project.characters){const label=el('label'),check=el('input');check.type='checkbox';check.checked=s.characters.includes(c.id);check.onchange=()=>safeRun(()=>{s.characters=check.checked?[...s.characters,c.id]:s.characters.filter(x=>x!==c.id);persist();renderOutput()});label.append(check,el('span',c.name));cast.append(label);}
 host.append(cast);
 const layers=el('div');layers.className='vd-layers';layers.append(el('h3','Layers'));
 for(const l of s.layers){
  const d=el('details');d.className='vd-item';d.append(el('summary',l.type+(l.enabled?'':' · OFF')));
  const body=el('div');
  const label=el('label'),check=el('input');check.type='checkbox';check.checked=l.enabled;check.onchange=()=>safeRun(()=>{l.enabled=check.checked;persist();renderOutput()});label.append(check,el('span','Enabled'));body.append(label);
  field(body,'Instruction EN',l.instruction,v=>l.instruction=v,{tag:'textarea'});
  renderRetention(body,l);
  const tools=el('div');tools.className='vd-actions';
  tools.append(button('Duplicate layer',()=>{const copy=structuredClone(l);copy.id=uniqueId('layer');s.layers.push(copy);persist();renderAll()}));
  tools.append(button('Save preset',()=>{
   const name=window.prompt('Название пользовательского пресета');
   if(!name?.trim())return;
   project=saveLayerPreset(project,l,name.trim(),uniqueId('preset'));
   persist();renderAll();
  }));
  tools.append(button('Reset text',()=>{l.instruction='';persist();renderAll()}));
  tools.append(button('Remove',()=>{if(!confirm('Удалить слой?'))return;s.layers=s.layers.filter(x=>x.id!==l.id);persist();renderAll()},'quiet'));
  body.append(tools);d.append(body);layers.append(d);
 }
 layers.append(button('+ Custom Layer',()=>{s.layers.push({id:uniqueId('layer'),type:'additional',enabled:true,scope:'shot',instruction:'',parameters:{},retention:[],priority:50,version:1});persist();renderAll()}));
 host.append(layers);
 const actions=el('div');actions.className='vd-actions';
 actions.append(button('Дублировать шот',()=>{const copy=structuredClone(s);copy.id=uniqueId('shot');copy.name+=' · Copy';copy.layers.forEach(l=>l.id=uniqueId('layer'));project.shots.push(copy);shotId=copy.id;persist();renderAll()}));
 actions.append(button('↑',()=>moveShot(-1)),button('↓',()=>moveShot(1)));
 actions.append(button('Удалить шот',()=>{if(project.shots.length===1)throw Error('Keep at least one shot');if(!confirm('Удалить этот шот?'))return;project.shots=project.shots.filter(x=>x.id!==s.id);shotId=project.shots[0].id;persist();renderAll()},'quiet'));
 host.append(actions);
}
function moveShot(step){const i=project.shots.findIndex(s=>s.id===shotId),j=i+step;if(j<0||j>=project.shots.length)return;[project.shots[i],project.shots[j]]=[project.shots[j],project.shots[i]];persist();renderAll()}
function renderOutput(){
 if(!project)return;
 const s=currentShot();if(!s){$('vdPrompt').value='';return;}
 try{
  output=compileShot(project,s.id);
  $('vdPrompt').value=output.text;
  $('vdManifest').textContent=JSON.stringify({shot_id:s.id,model:output.profile,reference_map:output.manifest,documented_route:output.documented_route,adapter_verified:false,runtime_tested:false},null,2);
  const issues=$('vdIssues');issues.replaceChildren();
  if(!output.issues.length)issues.append(el('p','VALIDATED: no known conflicts'));
  for(const i of output.issues){const p=el('p',i.severity+' · '+i.code+' · '+i.message+' / '+i.action);p.className=i.severity==='ERROR'?'vd-error':'vd-warning';issues.append(p);}
  $('vdExportShot').disabled=!output.exportable;
  $('vdStatus').textContent=output.exportable?'COMPILATION PASS · NOT VIDEO-TESTED':'EXPORT BLOCKED · FIX ERRORS';
 }catch(e){output=null;$('vdStatus').textContent='VALIDATION FAILED';$('vdPrompt').value='';$('vdManifest').textContent='';$('vdIssues').textContent=e.message;$('vdExportShot').disabled=true;}
}
function download(name,content){const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function copy(text){if(!navigator.clipboard?.writeText)throw Error('Clipboard not available');navigator.clipboard.writeText(text).then(()=>message('Скопировано')).catch(()=>message('Копирование недоступно'))}
function init(){
 refreshProjectPicker();
 $('vdProjects').onchange=e=>{const p=projects.find(p=>p.id===e.target.value);if(p)chooseProject(p)};
 $('vdNew').onclick=()=>safeRun(()=>{const p=emptyProject(uniqueId('project'));projects=writeProjects(storage,[...projects,p]);chooseProject(p);message('Создан новый проект')});
 $('vdDemo').onclick=()=>safeRun(()=>{const p=demonstration();if(projects.some(x=>x.id===p.id)){p.id=uniqueId('demo')}projects=writeProjects(storage,[...projects,p]);chooseProject(p);shotId='shot_05';renderAll();message('Synthetic demo loaded. All references are metadata placeholders.')});
 $('vdSave').onclick=()=>safeRun(()=>{if(!project)throw Error('Select a project');persist();message('Проект сохранён в этом браузере')});
 $('vdDuplicate').onclick=()=>safeRun(()=>{if(!project)return;const p=structuredClone(project);p.id=uniqueId('project');p.name+=' · Copy';projects=writeProjects(storage,[...projects,p]);chooseProject(p);message('Создана копия проекта')});
 $('vdExport').onclick=()=>safeRun(()=>{if(!project)throw Error('Select a project');download(project.id+'.json',encode(project));message('JSON exported (metadata only)')});
 $('vdImport').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>2_000_000)throw Error('File exceeds 2 MB');const data=importProject(storage,await f.text());projects=data;chooseProject(data[data.length-1]);message('Проект импортирован')}catch(err){message('Import STOP: '+err.message)}finally{e.target.value=''}};
 $('vdCopy').onclick=()=>safeRun(()=>{if(output)copy(output.text)});
 $('vdCopyMap').onclick=()=>safeRun(()=>{if(output)copy($('vdManifest').textContent)});
 $('vdExportShot').onclick=()=>safeRun(()=>{if(!output?.exportable)throw Error('Fix validation errors first');download(output.shot_id+'-prompt.json',JSON.stringify({schema_version:1,prompt:output.text,reference_manifest:output.manifest,validation:output.issues,profile:output.profile,shot_id:output.shot_id,not_a_comfyui_workflow:true},null,2));message('Shot manifest exported')});
 renderAll();
 $('videoDirectorRoot').dataset.ready='true';
}
init();
