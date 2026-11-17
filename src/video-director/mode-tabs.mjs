const standard=document.getElementById('standardMode');
const video=document.getElementById('videoDirectorRoot');
const production=document.getElementById('productionRoot');
const tabs={standard:document.getElementById('vdTabStandard'),video:document.getElementById('vdTabVideo'),production:document.getElementById('productionTab')};
function updateWorkspaceContext(mode){
 const label=document.getElementById('workspaceContext');if(!label)return;
 const modeName={standard:'Standard Prompt',video:'Video Director',production:'AI Production'}[mode];
 const project=document.getElementById('vdProjects');
 const projectName=mode==='video'&&project?.value?project.selectedOptions[0]?.textContent:null;
 label.textContent='WORKSPACE · '+modeName+' / '+(projectName||'LOCAL')+(mode==='production'?' / LAB':'');
}
function show(mode){
 standard.hidden=mode!=='standard';video.hidden=mode!=='video';production.hidden=mode!=='production';
 for(const [name,b] of Object.entries(tabs)){const active=mode===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))}
 updateWorkspaceContext(mode);
}
for(const [name,b] of Object.entries(tabs))b.addEventListener('click',()=>show(name));
const picker=document.getElementById('vdProjects');picker?.addEventListener('change',()=>updateWorkspaceContext('video'));
const videoTitle=document.getElementById('vdTitle');if(videoTitle){new MutationObserver(()=>{if(!video.hidden)updateWorkspaceContext('video')}).observe(videoTitle,{childList:true,characterData:true,subtree:true});}
// Presentation-only disclosure controls; editors, values and persistence stay untouched.
for(const id of ['vdReferences','vdCharacters','vdGlobalLayers','vdCameraPresets','vdLayerPresets']){
 const content=document.getElementById(id),section=content?.closest('section'),heading=section?.querySelector('h2');
 if(!content||!heading)continue;
 const toggle=document.createElement('button');toggle.type='button';toggle.className='vd-panel-disclosure';
 toggle.textContent='Свернуть';toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-controls',id);
 heading.append(toggle);
 toggle.addEventListener('click',()=>{
  const collapsed=toggle.getAttribute('aria-expanded')==='true';
  toggle.setAttribute('aria-expanded',String(!collapsed));
  toggle.textContent=collapsed?'Развернуть':'Свернуть';
  for(const child of section.children){if(child!==heading)child.hidden=collapsed;}
 });
}
show('standard');
tabs.video.dataset.ready='true';
