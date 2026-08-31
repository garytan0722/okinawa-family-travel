import { recoverApp } from './recovery.mjs?v=18';

const status = document.querySelector('#recovery-status');
const retry = document.querySelector('#recovery-retry');

async function runRecovery() {
  retry.hidden = true;
  status.textContent = '正在清除舊版網站快取…';
  try {
    const appScopeUrl = new URL('./', location.href).href;
    await recoverApp({
      cacheStorage: globalThis.caches,
      serviceWorker: navigator.serviceWorker,
      appScopeUrl,
    });
    status.textContent = '修復完成，正在重新開啟行程…';
    setTimeout(() => location.replace('./?recovered=18#/'), 350);
  } catch (error) {
    status.textContent = `自動修復未完成：${error.message}`;
    retry.hidden = false;
  }
}

retry.addEventListener('click', runRecovery);
runRecovery();
