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
show('standard');
tabs.video.dataset.ready='true';
