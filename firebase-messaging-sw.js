/* Service worker notifikasi v6 — satu folder dengan index.html (HTTPS) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

/* Apakah ada layar yang sedang TERLIHAT dan sedang membuka chat ini? (hanya itu yang boleh tidak diberi notifikasi) */
async function isViewingChat(chat) {
  if (!chat) return false;
  let cl = [];
  try { cl = await self.clients.matchAll({ type: 'window', includeUncontrolled: true }); } catch (e) { return false; }
  const vis = cl.filter(c => c.visibilityState === 'visible');
  if (!vis.length) return false;
  const answers = await Promise.all(vis.map(c => new Promise(res => {
    try {
      const ch = new MessageChannel();
      const t = setTimeout(() => res(false), 500);   /* tidak menjawab = tetap tampilkan notifikasi */
      ch.port1.onmessage = (e) => { clearTimeout(t); res(!!(e.data && e.data.viewing)); };
      c.postMessage({ type: 'who-views', chat }, [ch.port2]);
    } catch (e) { res(false); }
  })));
  return answers.some(Boolean);
}

self.addEventListener('push', (event) => {
  let p = {};
  try { p = event.data ? event.data.json() : {}; } catch (e) { p = {}; }
  const d = p.data || p;
  const n = p.notification || {};
  const title = d.title || n.title || 'Pesan baru';
  const body = d.body || n.body || '';
  const key = d.key || d.tag || ('push_' + Date.now());
  const chat = d.chat || '';
  event.waitUntil((async () => {
    /* Satu-satunya alasan menahan notifikasi: chat ini sedang dibuka & terlihat di layar */
    if (await isViewingChat(chat)) return;
    const full = {
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
    };
    try {
      await self.registration.showNotification(title, full);
    } catch (e1) {
      /* Cadangan: opsi minimal agar notifikasi TETAP muncul walau gambar/aksi ditolak perangkat */
      try { await self.registration.showNotification(title, { body, tag: key, icon: './icon-192.png', data: { chat } }); }
      catch (e2) { await self.registration.showNotification(title, { body, data: { chat } }); }
    }
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
