const offlinePage = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#2547df">
  <title>Atak Buz Sporları · Bağlantı yok</title>
  <style>
    body{background:#f8fafc;color:#182847;font:1rem/1.5 system-ui;margin:0;min-height:100vh;display:grid;place-items:center;padding:1.25rem;box-sizing:border-box}
    main{max-width:26rem}a{color:#2547df}
  </style>
</head>
<body>
  <main>
    <h1>İnternet bağlantısı yok</h1>
    <p>Güncel dersler, paketler ve kulüp sohbeti için internete yeniden bağlan.</p>
    <a href="/">Atak Buz Sporları’nı yeniden aç</a>
  </main>
</body>
</html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Protected pages and API responses stay on the network and are never cached here.
  if (request.method !== 'GET' || request.mode !== 'navigate' ||
      url.origin !== self.location.origin || url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(fetch(request).catch(() => new Response(offlinePage, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })));
});

const pushPaths = new Set(['/chat', '/student', '/student/payments']);

self.addEventListener('push', (event) => {
  let data;
  try { data = event.data?.json(); } catch { data = {}; }
  const url = pushPaths.has(data?.url) ? data.url : '/';
  event.waitUntil(self.registration.showNotification('Atak Buz Sporları', {
    body: typeof data?.body === 'string' ? data.body : 'Kulübünden yeni bir bildirim var.',
    icon: '/pwa/icon-192.png',
    tag: typeof data?.tag === 'string' ? data.tag : undefined,
    data: { url },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = event.notification.data?.url;
  event.waitUntil((async () => {
    const target = new URL(pushPaths.has(path) ? path : '/', self.location.origin);
    if (pushPaths.has(path)) target.searchParams.set('from', 'notification');
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = clients.find((client) => new URL(client.url).pathname === target.pathname);
    if (existing) {
      await existing.navigate(target.href);
      return existing.focus();
    }
    return self.clients.openWindow(target.href);
  })());
});
