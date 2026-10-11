/* Service worker notifikasi v4 — taruh di folder yang SAMA dengan index.html (harus lewat HTTPS) */
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

  /* Tampilkan SEKETIKA: tanpa getNotifications(), tanpa await sebelum showNotification.
     Tag yang sama otomatis diganti (renotify:false) jadi tidak dobel dan tidak bunyi dua kali. */
  const show = () => self.registration.showNotification(title, {
    body,
    tag: key,
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    renotify: false,
    requireInteraction: false,
    data: { chat },
    timestamp: Date.now()
  });

  event.waitUntil(show());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const chat = (event.notification.data && event.notification.data.chat) || '';
  event.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      if ('focus' in c) {
        await c.focus();
        if (chat) c.postMessage({ type: 'open-chat', chat });
        return;
      }
    }
    const url = new URL('./', self.registration.scope);
    if (chat) url.searchParams.set('openchat', chat);
    await self.clients.openWindow(url.href);
  })());
});
