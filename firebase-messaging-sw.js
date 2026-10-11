/* Service worker notifikasi v5 — satu folder dengan index.html (HTTPS) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let p = {};
  try { p = event.data ? event.data.json() : {}; } catch (e) { p = {}; }
  const d = p.data || p;
  const n = p.notification || {};
  const title = d.title || n.title || 'Pesan baru';
  const body = d.body || n.body || '';
  const key = d.key || d.tag || ('push_' + Date.now());
  const chat = d.chat || '';
  /* Jangan tampil kalau website sedang terbuka di layar; tampil terus kalau sudah keluar */
  event.waitUntil((async () => {
    try {
      const cl = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (cl.some(c => c.visibilityState === 'visible')) return;
    } catch (e) {}
    await self.registration.showNotification(title, {
    body,
    tag: key,
    icon: './icon-192.png',
    badge: './badge-96.png',
    image: './notif-banner.png',
    vibrate: [180, 80, 180],
    renotify: false,
    silent: false,
    requireInteraction: false,
    actions: [{ action: 'open', title: 'Buka chat' }],
    data: { chat },
    timestamp: Date.now()
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const chat = (event.notification.data && event.notification.data.chat) || '';
  event.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      if ('focus' in c) { await c.focus(); if (chat) c.postMessage({ type: 'open-chat', chat }); return; }
    }
    const url = new URL('./', self.registration.scope);
    if (chat) url.searchParams.set('openchat', chat);
    await self.clients.openWindow(url.href);
  })());
});

/* Langganan push berubah/kedaluwarsa: minta halaman daftar ulang */
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(self.clients.matchAll({ includeUncontrolled: true }).then(l => l.forEach(c => c.postMessage({ type: 'resubscribe' }))));
});
