const CACHE = 'ugadayka-bfea2d11';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-512-maskable.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isNav = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isNav) {
    // HTML: сеть сначала (свежая версия); кэшируем только успешный ответ
    e.respondWith(
      fetch(req).then((resp) => {
        if (resp.ok) {
          const c1 = resp.clone(), c2 = resp.clone();
          caches.open(CACHE).then((c) => { c.put('./index.html', c1); c.put('./', c2); }).catch(() => {});
        }
        return resp;
      }).catch(() => caches.match('./index.html').then((c) => c || caches.match(req)))
    );
    return;
  }
  // Статика: кэш сначала; при провале НЕ подсовываем HTML — пусть запрос честно падает
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((resp) => {
      if (resp.ok && req.url.startsWith(self.location.origin)) {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return resp;
    }))
  );
});
