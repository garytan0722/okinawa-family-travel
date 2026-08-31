const CACHE_PREFIX = 'okinawa-road-book-';

export async function recoverApp({ cacheStorage, serviceWorker, appScopeUrl }) {
  let deletedCaches = 0;
  let unregisteredWorkers = 0;

  if (cacheStorage?.keys && cacheStorage?.delete) {
    const names = await cacheStorage.keys();
    const owned = names.filter((name) => name.startsWith(CACHE_PREFIX));
    const results = await Promise.all(owned.map((name) => cacheStorage.delete(name)));
    deletedCaches = results.filter(Boolean).length;
  }

  if (serviceWorker?.getRegistrations) {
    const registrations = await serviceWorker.getRegistrations();
    const owned = registrations.filter((registration) => registration.scope.startsWith(appScopeUrl));
    const results = await Promise.all(owned.map((registration) => registration.unregister()));
    unregisteredWorkers = results.filter((result) => result !== false).length;
  }

  return { deletedCaches, unregisteredWorkers };
}
