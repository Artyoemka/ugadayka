const CACHE = 'ugadayka-0f0ee78d';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-512-maskable.png', './favicon.ico', './en/', './en/index.html', './en/manifest.json'];
self.addEventListener('install', (e) => {
  // Каждый ресурс добавляем независимо: отсутствие одного не валит установку
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ASSETS.map((a) => c.add(a).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isNav = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isNav) {
    // Язык-зависимый ключ: /en/* живёт отдельно от русской версии
    let home = './index.html', root = './';
    try { if (new URL(req.url).pathname.startsWith('/en')) { home = './en/index.html'; root = './en/'; } } catch {}
    e.respondWith(
      fetch(req).then((resp) => {
        if (resp.ok) {
          const c1 = resp.clone(), c2 = resp.clone();
          caches.open(CACHE).then((c) => { c.put(home, c1); c.put(root, c2); }).catch(() => {});
        }
        return resp;
      }).catch(() => caches.match(home).then((c) => c || caches.match(req)))
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
