/* Service worker notifikasi v8 — satu folder dengan index.html (HTTPS) */
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

/* Gambar besar notifikasi: isi pesan ditulis besar & tebal agar mudah dibaca (dibuat otomatis per pesan) */
async function makeNotifImage(title, body) {
  try {
    body = String(body || '').replace(/\s+/g, ' ').trim();
    if (!body || typeof OffscreenCanvas === 'undefined') return '';
    title = String(title || '').trim();
    const W = 1200, H = 600, P = 72;
    const c = new OffscreenCanvas(W, H);
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#14ab95'); bg.addColorStop(0.55, '#0a7a6c'); bg.addColorStop(1, '#054a42');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,0.07)';
    g.beginPath(); g.arc(W - 90, 70, 250, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(120, H + 40, 200, 0, Math.PI * 2); g.fill();
    const FONT = '"Inter","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
    const maxW = W - P * 2;
    /* nama pengirim */
    let name = title;
    g.font = '600 42px ' + FONT;
    while (name.length > 1 && g.measureText(name).width > maxW) name = name.slice(0, -1);
    if (name !== title) name = name.trimEnd() + '…';
    g.fillStyle = 'rgba(255,255,255,0.82)'; g.textBaseline = 'alphabetic';
    g.fillText(name, P, P + 38);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(P, P + 62, 72, 5);
    /* isi pesan: huruf sebesar mungkin yang masih muat */
    const top = P + 118, bottom = H - P + 10;
    const wrap = (size) => {
      g.font = '700 ' + size + 'px ' + FONT;
      const lines = []; let cur = '';
      for (let w of body.split(' ')) {
        while (g.measureText(w).width > maxW) {
          let k = w.length; while (k > 1 && g.measureText(w.slice(0, k)).width > maxW) k--;
          if (cur) { lines.push(cur); cur = ''; }
          lines.push(w.slice(0, k)); w = w.slice(k);
        }
        const t = cur ? cur + ' ' + w : w;
        if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
      }
      if (cur) lines.push(cur);
      return lines;
    };
    let size = 92, lines = wrap(size);
    while (size > 46 && lines.length * size * 1.22 > bottom - top) { size -= 4; lines = wrap(size); }
    const lh = size * 1.22, maxLines = Math.max(1, Math.floor((bottom - top) / lh));
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let last = lines[maxLines - 1];
      while (last.length > 1 && g.measureText(last + '…').width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last.trimEnd() + '…';
    }
    g.font = '700 ' + size + 'px ' + FONT; g.fillStyle = '#ffffff';
    lines.forEach((ln, i) => g.fillText(ln, P, top + size * 0.92 + i * lh));
    const blob = await c.convertToBlob({ type: 'image/jpeg', quality: 0.88 });
    const buf = new Uint8Array(await blob.arrayBuffer());
    let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return 'data:image/jpeg;base64,' + btoa(bin);
  } catch (e) { return ''; }
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
    const img = await makeNotifImage(title, body);
    const full = {
      body,
      tag: key,
      icon: './icon-192.png',
      badge: './badge-96.png',
      lang: 'id',
      ...(img ? { image: img } : {}),
      vibrate: [180, 80, 180],
      renotify: true,
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
