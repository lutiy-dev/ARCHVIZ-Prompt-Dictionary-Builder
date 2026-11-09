
const standard=document.getElementById('standardMode'),video=document.getElementById('videoDirectorRoot');
const a=document.getElementById('vdTabStandard'),b=document.getElementById('vdTabVideo');
function show(mode){
 const isVideo=mode==='video';
 standard.hidden=isVideo;video.hidden=!isVideo;
 a.classList.toggle('active',!isVideo);b.classList.toggle('active',isVideo);
 a.setAttribute('aria-pressed',String(!isVideo));b.setAttribute('aria-pressed',String(isVideo));
}
a.addEventListener('click',()=>show('standard'));
b.addEventListener('click',()=>show('video'));
show('standard');
b.dataset.ready='true';
