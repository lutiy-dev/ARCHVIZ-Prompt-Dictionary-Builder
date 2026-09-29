// Capture the browser's one-shot install offer before the application module loads.
window.promptStudioInstall={deferred:null};
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  window.promptStudioInstall.deferred=event;
  window.dispatchEvent(new Event('promptstudioinstallready'));
});
