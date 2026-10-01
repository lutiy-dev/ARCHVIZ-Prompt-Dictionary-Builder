(() => {
  let pending;
  const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const refresh = () => {
    const button = document.getElementById('installApp');
    if (button) button.hidden = Boolean(installed());
  };
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); pending = event; refresh();
  });
  window.addEventListener('appinstalled', () => {
    pending = undefined; refresh();
    document.getElementById('installApp').hidden = true;
    document.getElementById('installHelp').hidden = true;
  });
  document.addEventListener('DOMContentLoaded', () => {
    refresh();
    document.getElementById('installApp').addEventListener('click', async () => {
      const help = document.getElementById('installHelp');
      if (pending) {
        const event = pending; pending = undefined;
        try { await event.prompt(); await event.userChoice; }
        catch { help.hidden = false; help.textContent = 'Откройте меню браузера и выберите установку Prompt Studio.'; }
      } else {
        help.hidden = false;
        help.textContent = 'Chrome / Edge: меню браузера → Установить ARCHVIZ Prompt Studio. Safari: Поделиться → На экран «Домой». Если установка ещё недоступна, обновите страницу после первой загрузки.';
      }
    });
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('./sw.js', {scope: './', updateViaCache: 'none'})
        .catch(error => console.warn('Prompt Studio PWA registration failed', error));
    }
  });
})();
