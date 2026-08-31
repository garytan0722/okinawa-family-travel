export async function installPwaUpdate(serviceWorker, reload) {
  const hadController = Boolean(serviceWorker.controller);
  let refreshing = false;

  if (hadController) {
    serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      reload();
    });
  }

  const registration = await serviceWorker.register('./sw.js?v=17', { updateViaCache: 'none' });
  await registration.update();
  return registration;
}
