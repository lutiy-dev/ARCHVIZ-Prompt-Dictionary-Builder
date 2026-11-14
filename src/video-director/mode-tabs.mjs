const standard=document.getElementById('standardMode');
const video=document.getElementById('videoDirectorRoot');
const production=document.getElementById('productionRoot');
const tabs={standard:document.getElementById('vdTabStandard'),video:document.getElementById('vdTabVideo'),production:document.getElementById('productionTab')};
function show(mode){
 standard.hidden=mode!=='standard';video.hidden=mode!=='video';production.hidden=mode!=='production';
 for(const [name,b] of Object.entries(tabs)){const active=mode===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))}
}
for(const [name,b] of Object.entries(tabs))b.addEventListener('click',()=>show(name));
show('standard');
tabs.video.dataset.ready='true';
