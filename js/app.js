/* Logika utama aplikasi chat */
import { app, db, firebaseConfig, ref, push, onValue, set, update, get, remove, query, limitToLast, orderByKey, startAfter, increment, runTransaction, onChildAdded, onChildChanged, onChildRemoved } from "./database.js";
/* Jembatan untuk youtube.js (skrip non-modul): akses database dan identitas pengguna */
window.__ngobrolFB = { db, ref, get, set, onValue, getMyId: () => myId, getMyName: () => myName };



let myName = "";

let myId = "";

let currentChat = null;

let currentChatAlias = "";

let msgUnsub = null;
const msgCache = {};

let userUnsub = null;

let chatsUnsub = null;

let contactsUnsub = null;

let blockedUnsub = null;

let usersCache = {};

let contactsCache = {};

let blockedCache = {};

let chatMeta = {};

let mediaRecorder = null;

let audioChunks = [];

let recInterval = null;

let recSeconds = 0;

let isRecording = false;

let selectedKeys = new Set();

let longPressTimer = null;

let longPressFired = false;

let currentMenuChatId = null;

let currentMenuChatName = "";

let cancelRecording = false;

let replyTo = null;

let contactsLoaded = false;

let groupsCache = {};

let groupsUnsub = null;

let newGroupMembers = [];

let currentInfoGid = null;

let currentMsgsAll = [];

let giQuery = '';

let blockedByOther = false;

let blockedByUnsub = null;

let stickBottomOnce = false;

let usersSubscribed = false;

let metaUnsubs = {};



const HIDE_KEY = 'chat_hidden_msgs';

const DELETED_CHATS_KEY = 'chat_deleted_chats';

const PHOTO_PREFIX = 'photo_cache_';

let hiddenMsgs = {};

let deletedChats = {};

try { hiddenMsgs = JSON.parse(localStorage.getItem(HIDE_KEY) || '{}'); } catch(e){ hiddenMsgs = {}; }

try { deletedChats = JSON.parse(localStorage.getItem(DELETED_CHATS_KEY) || '{}'); } catch(e){ deletedChats = {}; }



function saveHidden() { localStorage.setItem(HIDE_KEY, JSON.stringify(hiddenMsgs)); }

function saveDeletedChats() { localStorage.setItem(DELETED_CHATS_KEY, JSON.stringify(deletedChats)); }

function isHidden(chatId, msgKey) { return hiddenMsgs[chatId] && hiddenMsgs[chatId].includes(msgKey); }

function markHidden(chatId, msgKeys) {

  if (!hiddenMsgs[chatId]) hiddenMsgs[chatId] = [];

  msgKeys.forEach(k => { if (!hiddenMsgs[chatId].includes(k)) hiddenMsgs[chatId].push(k); });

  saveHidden();

}

function getCachedPhoto(id) {

  try { return localStorage.getItem(PHOTO_PREFIX + id) || ""; } catch(e) { return ""; }

}

function setCachedPhoto(id, url) {

  try {

    if (url) localStorage.setItem(PHOTO_PREFIX + id, url);

    else localStorage.removeItem(PHOTO_PREFIX + id);

  } catch(e) {}

}



const $ = id => document.getElementById(id);

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const initials = n => (n||'?').trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase();

const fmtTime = ts => {

  if (!ts) return '';

  const d = new Date(ts);

  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');

};

const fmtTimeShort = ts => {

  if (!ts) return '';

  const d = new Date(ts);

  const today = new Date();

  const yest = new Date(); yest.setDate(today.getDate()-1);

  const sameDay = (a,b) => a.toDateString() === b.toDateString();

  if (sameDay(d, today)) return fmtTime(ts);

  if (sameDay(d, yest)) return 'Kemarin';

  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

  return d.getDate() + ' ' + months[d.getMonth()];

};

const fmtDay = ts => {

  if (!ts) return '';

  const d = new Date(ts);

  const today = new Date();

  const yest = new Date(); yest.setDate(today.getDate()-1);

  const sameDay = (a,b) => a.toDateString() === b.toDateString();

  if (sameDay(d, today)) return 'Hari ini';

  if (sameDay(d, yest)) return 'Kemarin';

  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();

};

const fmtDur = sec => {

  sec = Math.max(0, Math.round(sec));

  const m = Math.floor(sec/60);

  const s = sec % 60;

  return m + ':' + s.toString().padStart(2,'0');

};

const convId = (a, b) => [a, b].sort().join('__');
/* ============= NOTIFIKASI PUSH + HAPUS AKUN ============= */
const VAPID_KEY = "BP-syyj65j30ycik8ANkVoZwbOq3sxQa8Vho-TPQ1Ub8jWYzVmUlqPWQKIYU5ixPZePbYAibjrb-ODMLb0nrgtU";
const FCM_SDK_URL = "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging.js";
const SW_URL = "./firebase-messaging-sw.js";
const NOTIF_ICON = "./icon-192.png";
const NOTIF_BADGE = "./badge-96.png";
let notifUnsubs = {};
let seenNotif = new Set();
let swReg = null;
let fcmMod = null;
let fcmMessaging = null;
let fcmFgBound = false;
let pendingOpenChat = null;
let lastNotifError = '';
let lastPushError = '';
/* ---- service worker ---- */
async function getSwReg() {
  if (swReg) return swReg;
  if (!('serviceWorker' in navigator)) throw new Error('Service worker tidak didukung');
  try {
    swReg = await navigator.serviceWorker.register(SW_URL, { updateViaCache: 'none' });
    try { swReg.update(); } catch (e) {}
    await navigator.serviceWorker.ready;
  } catch (e) {
    swReg = null;
    lastNotifError = 'Service worker gagal dimuat. Pastikan firebase-messaging-sw.js satu folder dengan index.html';
    throw e;
  }
  return swReg;
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === 'resubscribe' && myId) enablePush({ ask: false });
    if (d.type === 'open-chat' && d.chat) { pendingOpenChat = d.chat; tryOpenPendingChat(); }
    if (d.type === 'who-views' && e.ports && e.ports[0]) { try { e.ports[0].postMessage({ viewing: isViewingChat(d.chat) }); } catch (_) {} }
  });
}
if ('serviceWorker' in navigator && window.isSecureContext) { getSwReg().catch(() => {}); }
function tryOpenPendingChat() {
  if (!pendingOpenChat || !myId) return;
  const id = pendingOpenChat;
  const ready = isGroupId(id) ? !!groupsCache[id] : (contactsCache[id] !== undefined);
  if (!ready) return;
  pendingOpenChat = null;
  switchPane('paneChats');
  openChat(id);
}
/* Notifikasi HANYA boleh ditahan bila chat tersebut sedang terbuka dan terlihat di layar */
function isViewingChat(chatId) {
  return document.visibilityState === 'visible' && !!chatId && currentChat === chatId && $('chatView').classList.contains('active');
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

/* ---- tampilkan notifikasi (dipakai oleh listener realtime & pesan FCM) ---- */
async function showIncoming({ chat, key, title, body }) {
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
  let shown = false;
  if ('Notification' in window && Notification.permission === 'granted') {
    const nImg = await makeNotifImage(title, body);
    const opts = { body, tag: key, icon: NOTIF_ICON, badge: NOTIF_BADGE, lang: 'id', ...(nImg ? { image: nImg } : {}), data: { chat }, timestamp: Date.now(),
                   renotify: false, vibrate: [200, 100, 200] };
    try {
      const reg = swReg || await getSwReg();
      await reg.showNotification(title, opts);
      shown = true;
    } catch (e) {
      lastNotifError = (e && e.message) || String(e);
      console.warn('showNotification gagal', e);
      try { const n = new Notification(title, { body, tag: key, icon: NOTIF_ICON }); shown = !!n; } catch (e2) {}
    }
  }
  if (document.visibilityState === 'visible') showToast(title + ': ' + body);
  return shown;
}
const imgLabel = m => (m && m.viewOnce ? 'Foto sekali lihat' : 'Foto');
function previewOf(v) {
  if (v.type === 'image') return imgLabel(v);
  if (v.type === 'audio') return 'Pesan suara';
  return String(v.text || '').slice(0, 120);
}
function rememberSeen(key) {
  seenNotif.add(key);
  if (seenNotif.size > 600) { const it = seenNotif.values(); for (let i = 0; i < 200; i++) seenNotif.delete(it.next().value); }
}
/* Pesan masuk dari listener realtime. TIDAK memeriksa hiddenMsgs / deletedChats,
   jadi notifikasi tetap muncul walau riwayat chat sudah dihapus. */
function onIncomingMessage(chatId, key, v, isGroup) {
  if (!v || v.deleted || v.from === myId) return;
  if (seenNotif.has(key)) return;
  rememberSeen(key);
  if (blockedCache[v.from]) return;
  if (isViewingChat(chatId)) return;
  const title = isGroup ? groupName(chatId) : displayName(chatId);
  const body = isGroup ? (displayName(v.from) + ': ' + previewOf(v)) : previewOf(v);
  showIncoming({ chat: chatId, key, title, body });
}
function attachNotifListener(path, chatId, isGroup) {
  if (notifUnsubs[chatId]) return;
  let cancelled = false, unsub = null, baseline = null, guardTs = false;
  notifUnsubs[chatId] = () => { cancelled = true; if (unsub) { try { unsub(); } catch (e) {} } };
  const attach = () => {
    if (cancelled) return;
    /* baseline ada -> dengarkan SEMUA pesan sesudahnya (bukan hanya 1 terakhir) supaya pesan beruntun tidak terlewat */
    const q = baseline ? query(ref(db, path), orderByKey(), startAfter(baseline))
            : (baseline === '' ? query(ref(db, path), orderByKey()) : query(ref(db, path), limitToLast(1)));
    unsub = onChildAdded(q, (s) => {
      const k = s.key, v = s.val();
      if (!v) return;
      if (baseline && k <= baseline) return;
      if (guardTs && (v.ts || 0) < Date.now() - 60000) return;
      onIncomingMessage(chatId, k, v, isGroup);
    });
  };
  get(query(ref(db, path), limitToLast(1)))
    .then(snap => { baseline = ''; snap.forEach(c => { baseline = c.key; }); attach(); })
    .catch(() => { guardTs = true; attach(); });
}
function syncNotifListeners() {
  if (!myId) return;
  const want = {};
  Object.keys(contactsCache).forEach(id => { if (id && id !== myId) want[id] = 'chats/' + convId(myId, id); });
  Object.keys(groupsCache).forEach(gid => { want[gid] = 'groupChats/' + gid; });
  Object.keys(notifUnsubs).forEach(id => { if (!want[id]) { notifUnsubs[id](); delete notifUnsubs[id]; } });
  Object.keys(want).forEach(id => attachNotifListener(want[id], id, isGroupId(id)));
  tryOpenPendingChat();
}
/* ---- FCM: daftar token supaya notifikasi sampai walau aplikasi ditutup ---- */
const tokKey = t => { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; return 't' + h.toString(36) + t.length.toString(36); };
async function registerPushToken(token) {
  const key = tokKey(token);
  await set(ref(db, 'fcmTokens/' + myId + '/' + key), { token, ts: Date.now() });
  try { localStorage.setItem('fcm_tok_ref', JSON.stringify({ id: myId, key })); } catch (e) {}
}
async function enablePush(opts) {
  opts = opts || {};
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !window.isSecureContext) { updateNotifStatus(); return false; }
  let perm = Notification.permission;
  if (perm === 'default' && opts.ask) { try { perm = await Notification.requestPermission(); } catch (e) {} }
  if (perm !== 'granted') { updateNotifStatus(); return false; }
  try {
    const reg = await getSwReg();
    fcmMod = fcmMod || await import(FCM_SDK_URL);
    if (!(await fcmMod.isSupported())) { updateNotifStatus(); return true; }
    fcmMessaging = fcmMessaging || fcmMod.getMessaging(app);
    const gt = () => fcmMod.getToken(fcmMessaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    let token;
    try { token = await gt(); }
    catch (e1) { try { const sub = await reg.pushManager.getSubscription(); if (sub) await sub.unsubscribe(); } catch (_) {} token = await gt(); }
    lastPushError = '';
    if (token && myId) await registerPushToken(token);
    if (!fcmFgBound) {
      fcmFgBound = true;
      fcmMod.onMessage(fcmMessaging, (payload) => {
        const d = (payload && payload.data) || {};
        if (!d.key || !d.chat || seenNotif.has(d.key)) return;
        rememberSeen(d.key);
        if (isViewingChat(d.chat)) return;
        showIncoming({ chat: d.chat, key: d.key, title: d.title || 'Pesan baru', body: d.body || '' });
      });
    }
  } catch (e) { lastPushError = (e && e.message) || String(e); console.warn('Daftar push gagal:', e); }
  updateNotifStatus();
  return true;
}
async function forgetThisDevicePush() {
  try {
    const r = JSON.parse(localStorage.getItem('fcm_tok_ref') || 'null');
    if (r && r.id && r.key) await remove(ref(db, 'fcmTokens/' + r.id + '/' + r.key));
    localStorage.removeItem('fcm_tok_ref');
  } catch (e) {}
  try { if (fcmMod && fcmMessaging) await fcmMod.deleteToken(fcmMessaging); } catch (e) {}
}
function updateNotifStatus() {
  const el = $('notifStatusText');
  if (!el) return;
  let t;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) t = 'Browser ini tidak mendukung notifikasi.';
  else if (!window.isSecureContext) t = 'Notifikasi memerlukan koneksi HTTPS.';
  else if (Notification.permission === 'granted' && lastPushError) t = 'Push bermasalah: ' + lastPushError + '. Ketuk untuk mencoba lagi.';
  else if (Notification.permission === 'granted') t = (lastNotifError ? 'Bermasalah: ' + lastNotifError : 'Aktif. Ketuk untuk mengirim tes.');
  else if (Notification.permission === 'denied') t = 'Diblokir. Ketuk untuk melihat cara mengaktifkan.';
  else t = 'Belum aktif. Ketuk untuk mengaktifkan.';
  el.textContent = t;
}
$('notifSettings').addEventListener('click', async () => {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || nsEnv().inapp) { openNotifSheet(true); return; }
  if (!window.isSecureContext) { showToast('Buka aplikasi lewat HTTPS atau localhost agar notifikasi aktif'); return; }
  if (Notification.permission !== 'granted') { openNotifSheet(true); return; }
  await enablePush({ ask: false });
  const shown = await showIncoming({ chat: '', key: 'test_' + Date.now(), title: (myName || 'Chat App'), body: 'Notifikasi aktif. Tes berhasil.' });
  updateNotifStatus();
  if (!shown) showToast(lastNotifError || 'Notifikasi tidak bisa ditampilkan. Cek izin notifikasi browser');
});
function startNotifSystem() {
  try {
    const p = new URLSearchParams(location.search).get('openchat');
    if (p) { pendingOpenChat = p; history.replaceState(null, '', location.pathname + location.hash); }
  } catch (e) {}
  updateNotifStatus();
  if ('serviceWorker' in navigator && window.isSecureContext) getSwReg().catch(() => {});
  if ('Notification' in window && Notification.permission === 'granted') enablePush({ ask: false });
  else showNotifSheetNow();
  /* Bila pengguna mengubah izin lewat setelan browser, langsung terbaca tanpa muat ulang */
  try {
    if (navigator.permissions && navigator.permissions.query && !window._nsPermBound) {
      window._nsPermBound = true;
      navigator.permissions.query({ name: 'notifications' }).then(ps => {
        ps.onchange = () => {
          updateNotifStatus();
          if (nsPerm() === 'granted') {
            enablePush({ ask: false });
            if ($('notifSheet').classList.contains('show')) { renderNotifSheet('done'); setTimeout(() => closeNotifSheet(false), 1800); }
            showToast('Notifikasi aktif');
          } else if (nsPerm() === 'denied' && $('notifSheet').classList.contains('show') && $('notifSheet').dataset.state === 'ask') {
            renderNotifSheet('denied');
          }
        };
      }).catch(() => {});
    }
  } catch (e) {}
}
/* Sheet izin tampil LANGSUNG (tanpa jeda) setiap aplikasi dibuka / kembali ke layar selama izin belum diberikan */
function showNotifSheetNow() {
  if (!myId) return;
  const env = nsEnv();
  if (env.inapp || env.needInstall) { if (!(env.needInstall && nsPerm() === 'granted')) { openNotifSheet(false); } return; }
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !window.isSecureContext) return;
  if (Notification.permission === 'granted') return;
  openNotifSheet(false);
}
window.addEventListener('online', () => { if (myId && 'Notification' in window && Notification.permission === 'granted') enablePush({ ask: false }); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !myId) return;
  if (!('Notification' in window)) { showNotifSheetNow(); return; }
  if (Notification.permission === 'granted') {
    if ($('notifSheet').classList.contains('show') && $('notifSheet').dataset.state !== 'done') closeNotifSheet(false);
    enablePush({ ask: false });
    updateNotifStatus();
  } else {
    showNotifSheetNow();
  }
});
/* ---- Sheet izin notifikasi ---- */
const NS_SNOOZE_KEY = 'notif_sheet_snooze';
let nsBusy = false;
/* ---- Deteksi browser/HP supaya petunjuk aktivasi sesuai ---- */
function nsEnv() {
  const ua = navigator.userAgent || '';
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let standalone = false;
  try { standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) {}
  const inapp = /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|Telegram|TikTok|Snapchat|Twitter|; wv\)|GSA\//i.test(ua);
  let br = 'chrome';
  if (/SamsungBrowser/i.test(ua)) br = 'samsung';
  else if (/Firefox|FxiOS/i.test(ua)) br = 'firefox';
  else if (/EdgA|EdgiOS|Edg\//.test(ua)) br = 'edge';
  else if (/OPR|Opera/.test(ua)) br = 'opera';
  else if (ios && !/CriOS/.test(ua)) br = 'safari';
  else if (/Safari/.test(ua) && !/Chrome|CriOS/.test(ua)) br = 'safari';
  return { ios, standalone, inapp, br, needInstall: ios && !standalone };
}
const nsPerm = () => ('Notification' in window ? Notification.permission : 'unsupported');
function nsSteps(variant, env) {
  const S = (t, d) => ({ t, d });
  if (variant === 'inapp') return [
    S('Buka melalui browser utama', 'Ketuk menu (⋮) lalu pilih "Buka di Chrome" atau "Buka di browser", atau salin tautan di bawah.'),
    S('Masuk kembali', 'Gunakan nama pengguna dan ID akun yang sama.'),
    S('Izinkan notifikasi', 'Pilih "Izinkan" pada jendela izin yang muncul.')
  ];
  if (variant === 'install') return [
    S('Ketuk tombol Bagikan', 'Ikon kotak dengan panah ke atas pada Safari (iOS 16.4 atau lebih baru).'),
    S('Pilih "Tambah ke Layar Utama"', 'Kemudian ketuk "Tambah".'),
    S('Buka dari Layar Utama', 'Setelah itu, ketuk "Aktifkan Notifikasi" di dalam aplikasi.')
  ];
  if (env.ios) return [
    S('Buka Setelan iPhone', 'Masuk ke menu Notifikasi.'),
    S('Pilih aplikasi ini', 'Cari nama aplikasi yang tersimpan di Layar Utama.'),
    S('Aktifkan "Izinkan Notifikasi"', 'Kembali ke aplikasi, lalu ketuk "Saya Sudah Mengaktifkan".')
  ];
  if (env.br === 'samsung') return [
    S('Buka menu (≡) lalu Setelan', 'Pada Samsung Internet.'),
    S('Situs dan unduhan > Izin > Notifikasi', 'Cari situs ini, lalu ubah menjadi "Izinkan".'),
    S('Kembali ke aplikasi', 'Ketuk "Saya Sudah Mengaktifkan". Pastikan juga notifikasi Samsung Internet aktif di Setelan HP.')
  ];
  if (env.br === 'firefox') return [
    S('Ketuk ikon gembok di bilah alamat', 'Kemudian pilih "Izin situs".'),
    S('Ubah Notifikasi menjadi "Izinkan"', 'Hapus status "Diblokir".'),
    S('Kembali ke aplikasi', 'Ketuk "Saya Sudah Mengaktifkan"; halaman akan dimuat ulang bila diperlukan.')
  ];
  return [
    S('Ketuk ikon di samping alamat situs', 'Ikon gembok atau ikon setelan pada bilah alamat.'),
    S('Buka Izin > Notifikasi', 'Ubah pilihan dari "Diblokir" menjadi "Izinkan".'),
    S('Kembali ke aplikasi', 'Ketuk "Saya Sudah Mengaktifkan". Bila belum berhasil, periksa Setelan HP > Aplikasi > Browser > Notifikasi.')
  ];
}
/* Nama pada kartu contoh notifikasi selalu sama dengan nama akun yang sedang masuk */
function syncPvName() {
  try {
    const pv = document.querySelector('.ns-pv-name'); if (!pv) return;
    const el = $('settingsName');
    const n = (typeof myName !== 'undefined' && myName) || (el && el.textContent.trim() !== '' && el.textContent.trim() !== 'User' ? el.textContent.trim() : '');
    pv.textContent = n || 'Nama Pengguna';
  } catch (e) {}
}
try { new MutationObserver(syncPvName).observe($('settingsName'), { childList: true, characterData: true, subtree: true }); } catch (e) {}
syncPvName();
function renderNotifSheet(state, variant) {
  const sh = $('notifSheet');
  syncPvName();
  sh.dataset.state = state;
  sh.dataset.variant = variant || '';
  const inner = sh.querySelector('.ns-sheet'); if (inner) { inner.dataset.state = state; inner.dataset.variant = variant || ''; }
  const env = nsEnv();
  const T = {
    ask:    { title: 'Aktifkan Notifikasi', sub: 'Terima pemberitahuan setiap ada pesan baru, termasuk saat aplikasi sedang tertutup.', btn: 'Aktifkan Notifikasi' },
    denied: { title: 'Notifikasi Diblokir', sub: 'Izin notifikasi untuk situs ini ditolak oleh browser. Untuk mengaktifkannya kembali, ikuti langkah berikut.', btn: 'Saya Sudah Mengaktifkan' },
    done:   { title: 'Notifikasi Aktif', sub: 'Pesan baru kini akan langsung muncul di layar perangkat Anda.', btn: 'Selesai' }
  }[state];
  if (variant === 'inapp') { T.title = 'Buka di Browser Utama'; T.sub = 'Browser bawaan aplikasi lain (Telegram, Instagram, dan sejenisnya) tidak mendukung notifikasi. Silakan buka aplikasi ini melalui Chrome atau browser utama Anda.'; T.btn = 'Mengerti'; }
  if (variant === 'install') { T.title = 'Tambahkan ke Layar Utama'; T.sub = 'Pada iPhone dan iPad, notifikasi hanya tersedia setelah aplikasi ditambahkan ke Layar Utama.'; T.btn = 'Mengerti'; }
  const later = $('nsLater');
  if (later) { if (variant === 'inapp') { later.textContent = 'Salin Tautan'; later.style.display = 'block'; } else { later.textContent = 'Nanti Saja'; later.style.display = ''; } }
  $('nsTitle').textContent = T.title;
  $('nsSub').textContent = T.sub;
  $('nsAllow').textContent = T.btn;
  $('nsAllow').disabled = false;
  if (state === 'denied') {
    $('notifSheet').querySelector('.ns-steps').innerHTML = nsSteps(variant, env).map(x =>
      '<li><div class="ns-li-ico"></div><div><b>' + esc(x.t) + '</b><span>' + esc(x.d) + '</span></div></li>').join('');
  }
}
function openNotifSheet(force) {
  syncPvName();
  const env = nsEnv();
  if (env.inapp) { renderNotifSheet('denied', 'inapp'); $('notifSheet').classList.add('show'); return; }
  if (env.needInstall && !('Notification' in window && Notification.permission === 'granted')) { renderNotifSheet('denied', 'install'); $('notifSheet').classList.add('show'); return; }
  if (!('Notification' in window) || !('serviceWorker' in navigator)) { showToast('Browser ini belum mendukung notifikasi. Silakan gunakan Chrome atau Firefox.'); return; }
  if (!window.isSecureContext) { showToast('Buka aplikasi lewat HTTPS atau localhost agar notifikasi aktif'); return; }
  const p = Notification.permission;
  if (p === 'granted' && !force) return;
  renderNotifSheet(p === 'denied' ? 'denied' : (p === 'granted' ? 'done' : 'ask'));
  $('notifSheet').classList.add('show');
}
function closeNotifSheet(snooze) {
  $('notifSheet').classList.remove('show');
  if (snooze) { try { localStorage.setItem(NS_SNOOZE_KEY, String(Date.now())); } catch (e) {} }
}
async function onNsAllow() {
  const st = $('notifSheet').dataset.state;
  const vr = $('notifSheet').dataset.variant || '';
  if (st === 'denied' && !vr && 'Notification' in window) {
    /* pengguna bilang sudah mengaktifkan: cek lagi, kalau belum terbaca muat ulang halaman */
    if (Notification.permission === 'granted') { await enablePush({ ask: false }); renderNotifSheet('done'); updateNotifStatus(); setTimeout(() => closeNotifSheet(false), 1800); }
    else if (Notification.permission === 'default') { renderNotifSheet('ask'); }
    else { showToast('Memuat ulang untuk membaca izin baru...'); setTimeout(() => location.reload(), 600); }
    return;
  }
  if (st !== 'ask') { closeNotifSheet(false); return; }
  if (nsBusy) return;
  nsBusy = true;
  $('nsAllow').disabled = true;
  $('nsAllow').textContent = 'Menunggu izin...';
  try { await enablePush({ ask: true }); } catch (e) {}
  nsBusy = false;
  const p = Notification.permission;
  if (p === 'granted') {
    renderNotifSheet('done');
    showIncoming({ chat: '', key: 'test_' + Date.now(), title: (myName || 'Chat App'), body: 'Notifikasi aktif. Pesan baru akan muncul seperti ini.' });
    setTimeout(() => { if ($('notifSheet').dataset.state === 'done') closeNotifSheet(false); }, 2200);
  } else if (p === 'denied') {
    renderNotifSheet('denied');
  } else {
    renderNotifSheet('ask');
    showToast('Pilih "Izinkan" pada jendela izin yang muncul');
  }
  updateNotifStatus();
}
$('nsAllow').addEventListener('click', onNsAllow);
$('nsLater').addEventListener('click', async () => {
  if ($('notifSheet').dataset.variant === 'inapp') {
    try { await navigator.clipboard.writeText(location.href.split('#')[0]); showToast('Tautan disalin. Tempel di Chrome atau browser utama Anda.'); }
    catch (e) { showToast('Salin tautan dari bilah alamat lalu buka di Chrome.'); }
    return;
  }
  closeNotifSheet(false);
});
$('notifSheet').addEventListener('click', (e) => { if (e.target === $('notifSheet')) closeNotifSheet(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('notifSheet').classList.contains('show')) closeNotifSheet(false); });

/* ---- HAPUS AKUN PERMANEN ---- */
async function listMyChatIds() {
  const ids = new Set();
  Object.keys(contactsCache).forEach(c => ids.add(convId(myId, c)));
  Object.keys(chatMeta).forEach(c => ids.add(convId(myId, c)));
  try {
    const r = await fetch(firebaseConfig.databaseURL + '/chats.json?shallow=true');
    if (r.ok) {
      const j = await r.json();
      Object.keys(j || {}).forEach(k => { const p = k.split('__'); if (p.length === 2 && p.includes(myId)) ids.add(k); });
    }
  } catch (e) {}
  return Array.from(ids);
}
function openDeleteAccount() {
  $('delAccInput').value = '';
  $('delAccConfirmBtn').disabled = true;
  $('delAccConfirmBtn').textContent = 'Hapus Akun';
  $('deleteAccountModal').classList.add('show');
  setTimeout(() => $('delAccInput').focus(), 150);
}
function closeDeleteAccount() { $('deleteAccountModal').classList.remove('show'); }
$('deleteAccountSettings').addEventListener('click', openDeleteAccount);
$('closeDelAcc').addEventListener('click', closeDeleteAccount);
$('cancelDelAcc').addEventListener('click', closeDeleteAccount);
$('deleteAccountModal').addEventListener('click', (e) => { if (e.target === $('deleteAccountModal')) closeDeleteAccount(); });
$('delAccInput').addEventListener('input', () => {
  $('delAccConfirmBtn').disabled = $('delAccInput').value.trim().toUpperCase() !== 'HAPUS';
});
$('delAccConfirmBtn').addEventListener('click', async () => {
  if ($('delAccInput').value.trim().toUpperCase() !== 'HAPUS') return;
  $('delAccConfirmBtn').disabled = true;
  $('cancelDelAcc').disabled = true;
  $('delAccConfirmBtn').textContent = 'Menghapus...';
  try {
    await deleteMyAccount();
  } catch (err) {
    console.error(err);
    showToast('Gagal menghapus akun: ' + (err && err.message ? err.message : err));
    $('delAccConfirmBtn').disabled = false;
    $('delAccConfirmBtn').textContent = 'Hapus Akun';
    $('cancelDelAcc').disabled = false;
  }
});
async function deleteMyAccount() {
  const id = myId;
  if (!id) throw new Error('Belum masuk');
  const updates = {};
  /* 1) grup: keluar; pembuat memindahkan kepemilikan; grup kosong dihapus */
  Object.keys(groupsCache).forEach(gid => {
    const g = groupsCache[gid];
    if (!g) return;
    const members = g.members || {};
    const rest = Object.keys(members).filter(x => x !== id).sort();
    if (rest.length === 0) {
      updates['groups/' + gid] = null;
      updates['groupChats/' + gid] = null;
      if (g.invite) updates['invites/' + g.invite] = null;
    } else {
      updates['groups/' + gid + '/members/' + id] = null;
      if (g.createdBy === id) updates['groups/' + gid + '/createdBy'] = rest.find(x => members[x] === 'admin') || rest[0];
    }
  });
  /* 2) semua chat pribadi + jejak di akun lawan bicara */
  const partners = new Set(Object.keys(contactsCache));
  const cids = await listMyChatIds();
  cids.forEach(cid => {
    updates['chats/' + cid] = null;
    cid.split('__').forEach(p => { if (p && p !== id) partners.add(p); });
  });
  partners.forEach(p => {
    updates['unread/' + p + '/' + id] = null;
    updates['contacts/' + p + '/' + id] = null;
    updates['blocked/' + p + '/' + id] = null;
  });
  /* 3) data milik sendiri */
  ['contacts', 'blocked', 'fcmTokens', 'unread'].forEach(n => { updates[n + '/' + id] = null; });
  try {
    const us = await get(ref(db, 'usernames/' + nameKey(myName)));
    if (us.exists() && String(us.val()) === id) updates['usernames/' + nameKey(myName)] = null;
  } catch (e) {}
  updates['users/' + id] = null;
  await update(ref(db), updates);
  /* 4) hentikan semua penulisan otomatis (online/lastSeen) lalu bersihkan perangkat ini */
  myId = '';
  try { await remove(ref(db, 'users/' + id)); } catch (e) {}
  try { if (fcmMod && fcmMessaging) await fcmMod.deleteToken(fcmMessaging); } catch (e) {}
  try { localStorage.clear(); } catch (e) {}
  try { await clearSession(); } catch (e) {}
  closeDeleteAccount();
  showToast('Akun berhasil dihapus permanen');
  setTimeout(() => location.reload(), 1400);
}




function showToast(msg, action) {
  const t = $('toast');
  t.textContent = msg;
  if (action && action.label && typeof action.fn === 'function') {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'toast-act'; b.textContent = action.label;
    b.addEventListener('click', () => { clearTimeout(window._toastTimer); t.classList.remove('show'); action.fn(); });
    t.appendChild(b);
  }
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { t.classList.remove('show'); }, action ? 4800 : 2400);
}



window.showToast = showToast;
function generateId() {

  const rand = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');   /* 10 angka acak */

  return '08' + rand;   /* ID = 08 + 10 angka (12 angka), disimpan PERSIS seperti ini di database */
}
/* Semua ID berformat 08xxxxxxxxxx, di layar maupun di database. */
function canonId(x) { return String(x == null ? '' : x).replace(/\D/g, ''); }
function dispId(id) { return String(id == null ? '' : id); }
async function resolveUserId(typed) {
  return canonId(String(typed || '').replace(/\D/g, ''));
}



const GROUP_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

function renderGroupAvatar(el) {

  if (!el) return;

  el.classList.add('group-avatar');

  el.style.backgroundImage = '';

  el.style.color = '';

  el.style.fontSize = '';

  el.innerHTML = GROUP_SVG;

}

function renderAvatar(el, name, photoUrl) {

  if (!el) return;

  el.classList.remove('group-avatar');

  const url = photoUrl || "";

  if (url) {

    el.style.backgroundImage = `url('${url}')`;

    el.style.backgroundSize = 'cover';

    el.style.backgroundPosition = 'center';

    el.style.color = 'transparent';

    el.style.fontSize = '0';

    el.textContent = '';

  } else {

    el.style.backgroundImage = '';

    el.style.color = '';

    el.style.fontSize = '';

    el.textContent = initials(name);

  }

}



function getPhotoFor(uid) {

  if (usersCache[uid]) return usersCache[uid].photo || "";

  return getCachedPhoto(uid);

}



/* ============= CONFIRM DIALOG ============= */

const CONFIRM_ICONS = {

  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',

  userx: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>',

  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'

};

let confirmResolver = null;

function confirmDialog({ title, message, messageHtml = '', okText = 'OK', icon = 'trash', danger = true }) {

  return new Promise(resolve => {

    if (confirmResolver) confirmResolver(false);

    confirmResolver = resolve;

    $('confirmTitle').textContent = title;

    if (messageHtml) $('confirmMsg').innerHTML = messageHtml; else $('confirmMsg').textContent = message || '';

    $('confirmIcon').innerHTML = CONFIRM_ICONS[icon] || CONFIRM_ICONS.trash;

    $('confirmIcon').classList.toggle('danger', !!danger);

    $('confirmOkBtn').textContent = okText;

    $('confirmOkBtn').classList.toggle('danger', !!danger);

    $('confirmModal').classList.add('show');

  });

}

function closeConfirm(result) {

  $('confirmModal').classList.remove('show');

  const r = confirmResolver;

  confirmResolver = null;

  if (r) r(result);

}

$('confirmMsg').addEventListener('click', async (e) => {

  const btn = e.target.closest('.confirm-copy');

  if (!btn) return;

  const val = btn.dataset.copy || '';

  let ok = false;

  try { await navigator.clipboard.writeText(val); ok = true; } catch (err) {

    try {

      const ta = document.createElement('textarea');

      ta.value = val; ta.style.position = 'fixed'; ta.style.opacity = '0';

      document.body.appendChild(ta); ta.select();

      ok = document.execCommand('copy');

      document.body.removeChild(ta);

    } catch (e2) { ok = false; }

  }

  if (ok) {

    btn.classList.add('done');

    btn.querySelector('span').textContent = 'ID tersalin';

    setTimeout(() => { btn.classList.remove('done'); const sp = btn.querySelector('span'); if (sp) sp.textContent = 'Salin ID'; }, 2000);

  } else { showToast('Gagal menyalin. Salin ID secara manual'); }

});

$('confirmOkBtn').addEventListener('click', () => closeConfirm(true));

$('confirmCancelBtn').addEventListener('click', () => closeConfirm(false));

$('confirmModal').addEventListener('click', (e) => { if (e.target === $('confirmModal')) closeConfirm(false); });



/* ============= LOGIN ============= */

let loginMode = 'register';

function setLoginMode(mode) {

  loginMode = mode;

  $('loginIdWrap').style.display = mode === 'verify' ? 'block' : 'none';

  $('loginSubtitle').textContent = mode === 'verify'

    ? 'Nama ini sudah terdaftar. Masukkan ID akun Anda untuk masuk kembali, atau gunakan nama lain untuk mendaftar.'

    : 'Masukkan nama pengguna Anda. ID akun akan dibuat secara otomatis.';

  setLogin(false);

}

function setLogin(loading) {

  const b = $('loginBtn');

  b.disabled = loading;

  b.classList.toggle('loading', loading);

  b.querySelector('.btn-label').textContent = loading ? 'Memproses...' : (loginMode === 'verify' ? 'Masuk' : 'Daftar Sekarang');

}

/* Nama unik: indeks usernames/{nama-huruf-kecil} = ID pemilik */

const nameKey = n => String(n).trim().toLowerCase().replace(/\s+/g, ' ')

  .replace(/[.$#\[\]\/]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());

async function claimName(name, id) {

  const r = await runTransaction(ref(db, 'usernames/' + nameKey(name)), cur => (cur === null || String(cur) === id) ? id : undefined);

  return r.committed;

}

$('usernameInput').addEventListener('input', () => {

  if (loginMode === 'verify') { $('loginIdInput').value = ''; setLoginMode('register'); }

});

$('loginIdInput').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });

$('loginBtn').addEventListener('click', async () => {

  const name = $('usernameInput').value.trim();

  if (!name) { showToast('Silakan masukkan nama pengguna'); return; }

  if (name.length < 2) { showToast('Nama minimal terdiri dari 2 karakter'); return; }

  if (name.length > 12) { showToast('Nama melebihi batas karakter'); return; }

  setLogin(true);

  try {

    const ownerSnap = await get(ref(db, 'usernames/' + nameKey(name)));

    if (ownerSnap.exists()) {

      const ownerId = String(ownerSnap.val());

      if (loginMode !== 'verify') {

        setLoginMode('verify');

        showToast('Nama sudah terdaftar. Masukkan ID Anda untuk masuk');

        setTimeout(() => $('loginIdInput').focus(), 100);

        return;

      }

      const typed = $('loginIdInput').value.trim();

      if (!typed) { showToast('Silakan masukkan ID akun'); setLogin(false); return; }

      if (typed !== ownerId && canonId(typed) !== ownerId) { showToast('ID tidak sesuai dengan nama pengguna'); setLogin(false); return; }

      const us = await get(ref(db, 'users/' + ownerId));

      myId = ownerId;

      myName = (us.exists() && us.val() && us.val().name) || name;

      saveSession();

        showToast('Selamat datang kembali, ' + myName);

      enterApp();

      return;

    }

    let newId = null;

    for (let i = 0; i < 5; i++) {

      const candidate = generateId();

      const snap = await get(ref(db, 'users/' + candidate));

      if (!snap.exists()) { newId = candidate; break; }

    }

    if (!newId) {

      showToast('Gagal membuat ID. Silakan coba lagi');

      setLogin(false);

      return;

    }

    if (!(await claimName(name, newId))) {

      setLoginMode('verify');

      showToast('Nama sudah terdaftar. Masukkan ID atau gunakan nama lain');

      return;

    }

    myId = newId;

    myName = name;

    await set(ref(db, 'users/' + myId), { name: myName, online: true, lastSeen: Date.now(), photo: "", role: 'user' });

    saveSession();

    $('myIdValue').textContent = dispId(myId);

    $('myIdModal').classList.add('show');

    enterApp();

  } catch (err) {

    console.error(err);

    showToast('Gagal masuk: ' + err.message);

    setLogin(false);

  }

});

$('usernameInput').addEventListener('keypress', e => {

  if (e.key === 'Enter') $('loginBtn').click();

});



$('closeMyIdModal').addEventListener('click', () => $('myIdModal').classList.remove('show'));

$('okMyIdModal').addEventListener('click', () => $('myIdModal').classList.remove('show'));

$('myIdModal').addEventListener('click', (e) => {

  if (e.target === $('myIdModal')) $('myIdModal').classList.remove('show');

});

$('copyMyIdBtn').addEventListener('click', async () => {

  try {

    await navigator.clipboard.writeText(myId);

    showToast('ID berhasil disalin');

  } catch (err) { showToast('ID: ' + myId); }

});



function enterApp() {

  $('loginScreen').style.display = 'none';

  $('app').style.display = 'block';

  $('settingsName').textContent = myName;

  $('settingsMyIdText').textContent = dispId(myId);

  const cachedMyPhoto = getCachedPhoto(myId);

  renderAvatar($('settingsAvatar'), myName, cachedMyPhoto);


  update(ref(db, 'users/' + myId), { name: myName, online: true, lastSeen: Date.now() })

    .then(() => { get(ref(db, 'users/' + myId + '/role')).then(r => { if (!r.exists()) set(ref(db, 'users/' + myId + '/role'), 'user').catch(() => {}); }).catch(() => {}); loadContacts(); loadChatMeta(); loadGroups(); loadMyProfile(); startNotifSystem(); claimName(myName, myId).catch(() => {}); setTimeout(handleDeepLink, 400); })

    .catch(err => {

      console.error(err);

      showToast('Gagal terhubung ke server: ' + err.message);

    });

}



function loadMyProfile() {

  onValue(ref(db, 'users/' + myId), snap => {

    const d = snap.val() || {};

    if (d.name && d.name !== myName) {

      myName = d.name;

      saveSession();

      $('settingsName').textContent = myName;

    }

    const photo = d.photo || "";

    if (photo) setCachedPhoto(myId, photo);

    renderAvatar($('settingsAvatar'), myName, photo);


  });

}



function doLogout() {

  if (myId) {

    update(ref(db, 'users/' + myId), { name: myName, online: false, lastSeen: Date.now() }).catch(()=>{});

  }

  Promise.race([forgetThisDevicePush(), new Promise(r => setTimeout(r, 1500))]).then(() => clearSession()).finally(() => setTimeout(() => location.reload(), 200));

}

$('logoutSettings').addEventListener('click', async () => {

  const ok = await confirmDialog({ title: 'Keluar dari akun?', messageHtml: '<p>Pastikan Anda telah menyimpan ID akun Anda:</p><span class="confirm-id">' + esc(dispId(myId)) + '</span><button type="button" class="confirm-copy" id="confirmCopyBtn" data-copy="' + esc(dispId(myId)) + '">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg><span>Salin ID</span></button>' + '<p>Untuk masuk kembali, gunakan nama dan ID akun yang sama.</p>', okText: 'Keluar', icon: 'logout' });

  if (ok) doLogout();

});



/* ============= SESSION (login permanen) =============

   Sesi disimpan di 3 tempat sekaligus (localStorage, cookie, IndexedDB) supaya

   tidak hilang sendiri. Hanya terhapus saat tombol Keluar ditekan, atau saat

   data browser/HP memang direset. */

const SESSION_KEY = 'chat_session_v1';

function idbOpen() {

  return new Promise((resolve, reject) => {

    try {

      const rq = indexedDB.open('chat_app_db', 1);

      rq.onupgradeneeded = () => rq.result.createObjectStore('kv');

      rq.onsuccess = () => resolve(rq.result);

      rq.onerror = () => reject(rq.error);

    } catch (e) { reject(e); }

  });

}

async function idbSet(k, v) {

  const d = await idbOpen();

  return new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); });

}

async function idbGet(k) {

  const d = await idbOpen();

  return new Promise((res, rej) => { const t = d.transaction('kv', 'readonly'); const r = t.objectStore('kv').get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

}

async function idbDel(k) {

  const d = await idbOpen();

  return new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); });

}

function saveSession() {

  if (!myId || !myName) return;

  const v = JSON.stringify({ id: myId, name: myName });

  try { localStorage.setItem('chat_myName', myName); localStorage.setItem('chat_myId', myId); localStorage.setItem(SESSION_KEY, v); } catch (e) {}

  try { document.cookie = SESSION_KEY + '=' + encodeURIComponent(v) + '; max-age=315360000; path=/; SameSite=Lax'; } catch (e) {}

  idbSet(SESSION_KEY, v).catch(() => {});

}

async function clearSession() {

  try { localStorage.removeItem('chat_myName'); localStorage.removeItem('chat_myId'); localStorage.removeItem(SESSION_KEY); } catch (e) {}

  try { document.cookie = SESSION_KEY + '=; max-age=0; path=/'; } catch (e) {}

  try { await idbDel(SESSION_KEY); } catch (e) {}

}

function parseSession(raw) {

  try { const o = JSON.parse(raw); if (o && o.id && o.name) return { id: String(o.id), name: String(o.name) }; } catch (e) {}

  return null;

}

async function readSession() {

  try {

    const n = localStorage.getItem('chat_myName'), i = localStorage.getItem('chat_myId');

    if (n && i) return { id: i, name: n };

    const r = parseSession(localStorage.getItem(SESSION_KEY)); if (r) return r;

  } catch (e) {}

  try {

    const m = document.cookie.match(new RegExp('(?:^|; )' + SESSION_KEY + '=([^;]*)'));

    if (m) { const r = parseSession(decodeURIComponent(m[1])); if (r) return r; }

  } catch (e) {}

  try { const r = parseSession(await idbGet(SESSION_KEY)); if (r) return r; } catch (e) {}

  return null;

}

(async function bootSession() {

  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}

  const sess = await readSession();

  if (sess) { myName = sess.name; myId = sess.id; saveSession(); enterApp(); }

  else { $('loginScreen').style.display = 'flex'; }

})();



function switchPane(paneId) {

  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === paneId));

  document.querySelectorAll('.bottom-tab').forEach(t => t.classList.toggle('active', t.dataset.pane === paneId));

}

document.querySelectorAll('.bottom-tab').forEach(tab => {

  tab.addEventListener('click', () => switchPane(tab.dataset.pane));

});



/* ============= PROFILE PHOTO ============= */

function resizeImage(file, size) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Gagal membaca file'));

    reader.onload = () => {

      const img = new Image();

      img.onerror = () => reject(new Error('File bukan gambar yang valid'));

      img.onload = () => {

        try {

          const side = Math.min(img.width, img.height);

          const sx = (img.width - side) / 2;

          const sy = (img.height - side) / 2;

          const canvas = document.createElement('canvas');

          canvas.width = size; canvas.height = size;

          const ctx = canvas.getContext('2d');

          ctx.fillStyle = '#fff';

          ctx.fillRect(0, 0, size, size);

          ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

          resolve(canvas.toDataURL('image/jpeg', 0.82));

        } catch (err) { reject(err); }

      };

      img.src = reader.result;

    };

    reader.readAsDataURL(file);

  });

}

$('settingsAvatarWrap').addEventListener('click', () => $('photoInput').click());

$('photoInput').addEventListener('change', async (e) => {

  const file = e.target.files[0];

  e.target.value = '';

  if (!file) return;

  if (!file.type.startsWith('image/')) { showToast('Pilih berkas gambar'); return; }

  try {

    const dataUrl = await resizeImage(file, 256);

    await update(ref(db, 'users/' + myId), { photo: dataUrl });

    setCachedPhoto(myId, dataUrl);

    if (usersCache[myId]) usersCache[myId].photo = dataUrl;

    renderAvatar($('settingsAvatar'), myName, dataUrl);


    showToast('Foto profil berhasil diperbarui');

  } catch (err) { showToast('Gagal memperbarui foto: ' + err.message); }

});



/* ============= EDIT NAME ============= */

const openEditName = () => {

  $('editNameInput').value = myName;

  $('editNameModal').classList.add('show');

  setTimeout(() => $('editNameInput').focus(), 100);

};

$('settingsName').addEventListener('click', openEditName);

function closeEditNameModal() { $('editNameModal').classList.remove('show'); }

$('closeEditName').addEventListener('click', closeEditNameModal);

$('cancelEditName').addEventListener('click', closeEditNameModal);

$('editNameModal').addEventListener('click', (e) => {

  if (e.target === $('editNameModal')) closeEditNameModal();

});

$('confirmEditName').addEventListener('click', async () => {

  const newName = $('editNameInput').value.trim();

  if (!newName) { showToast('Silakan masukkan nama'); return; }

  if (newName.length < 2) { showToast('Nama minimal terdiri dari 2 karakter'); return; }

  if (newName.length > 12) { showToast('Nama melebihi batas karakter'); return; }

  if (newName === myName) { closeEditNameModal(); return; }

  $('confirmEditName').disabled = true;

  $('confirmEditName').textContent = 'Menyimpan...';

  try {

    const oldKey = nameKey(myName), newKey = nameKey(newName);

    if (oldKey !== newKey && !(await claimName(newName, myId))) {

      showToast('Nama "' + newName + '" sudah digunakan. Silakan pilih nama lain');

      return;

    }

    await update(ref(db, 'users/' + myId), { name: newName });

    if (oldKey !== newKey) {

      try {

        const o = await get(ref(db, 'usernames/' + oldKey));

        if (o.exists() && String(o.val()) === myId) await remove(ref(db, 'usernames/' + oldKey));

      } catch (e) {}

    }

    myName = newName;

    saveSession();

    $('settingsName').textContent = myName;

    closeEditNameModal();

    showToast('Nama berhasil diperbarui');

  } catch (err) { showToast('Gagal menyimpan: ' + err.message); }

  finally {

    $('confirmEditName').disabled = false;

    $('confirmEditName').textContent = 'Simpan';

  }

});



/* ============= LOAD DATA ============= */

function loadContacts() {

  if (contactsUnsub) contactsUnsub();

  contactsUnsub = onValue(ref(db, 'contacts/' + myId), snap => {

    const prevContacts = contactsCache;

    contactsCache = snap.val() || {};

    if (contactsLoaded) {

      let changed = false;

      Object.keys(contactsCache).forEach(cid => {

        if (!prevContacts[cid] && deletedChats[cid]) { delete deletedChats[cid]; changed = true; }

      });

      if (changed) saveDeletedChats();

    }

    contactsLoaded = true;

    if (currentChat && prevContacts[currentChat] && !contactsCache[currentChat]) {

      exitSelectionMode();

      clearReply();

      $('chatView').classList.remove('active');

      currentChat = null;

      currentChatAlias = "";

      if (msgUnsub) { msgUnsub(); msgUnsub = null; }

      showToast('Kontak ini telah menghapus percakapan');

    }

    syncMetaListeners();

    loadBlocked();

    loadUsersCache();
    syncNotifListeners();

  });

}

/* ---- Jumlah pesan belum dibaca: unread/<idSaya>/<idChat> = angka. Naik saat lawan bicara mengirim, dihapus saat chat dibuka ---- */
let unreadCache = {};
let unreadUnsub = null;
function unreadCount(id) { const n = Number(unreadCache[id]) || 0; return n > 0 ? n : 0; }
function unreadBadgeHtml(id) {
  const n = unreadCount(id);
  if (!n || blockedCache[id]) return '';
  return '<span class="unread-badge">1</span>';
}
function clearUnreadFor(chatId) {
  if (!myId || !chatId || !unreadCache[chatId]) return;
  delete unreadCache[chatId];
  set(ref(db, 'unread/' + myId + '/' + chatId), null).catch(() => {});
  queueChatListRender();
}
function updateAppBadge() {
  try {
    let total = 0;
    Object.keys(unreadCache).forEach(k => { if (!blockedCache[k] && unreadCount(k)) total += 1; });
    if (navigator.setAppBadge) { if (total > 0) navigator.setAppBadge(total); else navigator.clearAppBadge(); }
  } catch (e) {}
}
function loadUnread() {
  if (unreadUnsub) { try { unreadUnsub(); } catch (e) {} }
  unreadUnsub = onValue(ref(db, 'unread/' + myId), snap => {
    unreadCache = snap.val() || {};
    Object.keys(unreadCache).forEach(k => {
      const n = Number(unreadCache[k]) || 0;
      if (n <= 0) { delete unreadCache[k]; set(ref(db, 'unread/' + myId + '/' + k), null).catch(() => {}); }
      else if (isViewingChat(k)) clearUnreadFor(k);   /* sedang membuka chat itu: langsung dianggap terbaca */
    });
    queueChatListRender();
    updateAppBadge();
  });
}
function loadBlocked() {
  loadArchived();
  loadUnread();
  if (blockedUnsub) blockedUnsub();

  blockedUnsub = onValue(ref(db, 'blocked/' + myId), snap => {

    blockedCache = snap.val() || {};

    updateBlockedCount();

    updateBlockedBanner();

    renderContactList();

    renderChatList();

  });

}

function updateBlockedCount() {

  $('blockedCountText').textContent = Object.keys(blockedCache).length + ' kontak';

}

function onUsersRendered() {

  renderContactList();

  renderChatList();

  if (currentChat && !isGroupId(currentChat)) {

    renderAvatar($('chatAvatar'), currentChatAlias, getPhotoFor(currentChat));

  }

  if (currentChat && isGroupId(currentChat)) $('chatStatus').textContent = groupMembersLabel(currentChat);

}

let usersRenderQueued = false;

function queueUsersRender() {

  if (usersRenderQueued) return;

  usersRenderQueued = true;

  requestAnimationFrame(() => { usersRenderQueued = false; onUsersRendered(); });

}

/* Hanya proses user yang BERUBAH, dan hanya render ulang bila nama/foto/online berubah.

   (Dulu seluruh daftar user + semua foto diproses ulang setiap detak 30 detik → layar tersendat.) */

function loadUsersCache() {

  if (usersSubscribed) return;

  usersSubscribed = true;

  const uref = ref(db, 'users');

  const handle = (snap) => {

    const uid = snap.key, v = snap.val() || {};

    const prev = usersCache[uid];

    usersCache[uid] = v;

    const photo = v.photo || '';

    if (!prev || (prev.photo || '') !== photo) {

      if (getCachedPhoto(uid) !== photo) setCachedPhoto(uid, photo);

    }

    if (!prev || prev.name !== v.name || (prev.photo || '') !== photo || !!prev.online !== !!v.online) queueUsersRender();

  };

  onChildAdded(uref, handle);

  onChildChanged(uref, handle);

  onChildRemoved(uref, (snap) => { delete usersCache[snap.key]; queueUsersRender(); });

}

let chatListQueued = false;

function queueChatListRender() {

  if (chatListQueued) return;

  chatListQueued = true;

  requestAnimationFrame(() => { chatListQueued = false; renderChatList(); });

}

function loadChatMeta() { syncMetaListeners(); }

/* Dengarkan hanya 1 pesan terakhir per kontak (bukan seluruh node 'chats' milik semua orang) */

function syncMetaListeners() {

  if (!myId) return;

  const ids = new Set(Object.keys(contactsCache).filter(id => id && id !== myId));

  Object.keys(metaUnsubs).forEach(id => {

    if (!ids.has(id)) { try { metaUnsubs[id](); } catch (e) {} delete metaUnsubs[id]; delete chatMeta[id]; }

  });

  ids.forEach(id => {

    if (metaUnsubs[id]) return;

    const cid = convId(myId, id);

    metaUnsubs[id] = onValue(query(ref(db, 'chats/' + cid), limitToLast(1)), snap => {

      let last = null;

      snap.forEach(c => { const v = c.val(); if (v) last = { key: c.key, ...v }; });

      if (last && (isHidden(cid, last.key) || (last.hiddenFor && last.hiddenFor[myId]))) last = null;

      chatMeta[id] = last;

      queueChatListRender();

    });

  });

}

function displayName(idUser) {
  if (contactsCache[idUser]) return contactsCache[idUser];

  if (usersCache[idUser] && usersCache[idUser].name) return usersCache[idUser].name;
  return dispId(idUser);

}



/* ============= GROUP HELPERS ============= */

const isGroupId = id => typeof id === 'string' && id.indexOf('g_') === 0;

const chatKey = id => isGroupId(id) ? 'group_' + id : convId(myId, id);

const chatPath = id => isGroupId(id) ? 'groupChats/' + id : 'chats/' + convId(myId, id);

const groupName = gid => (groupsCache[gid] && groupsCache[gid].name) || 'Grup';

function groupMembersLabel(gid) {

  const g = groupsCache[gid];

  if (!g || !g.members) return '';

  return Object.keys(g.members).sort((a, b) => (a === myId ? -1 : b === myId ? 1 : 0))

    .map(id => id === myId ? 'Anda' : displayName(id)).join(', ');

}

const SENDER_COLORS = ['#d4380d','#08979c','#531dab','#c41d7f','#096dd9','#389e0d','#d46b08','#1d39c4'];

function senderColor(id) {

  let h = 0;

  String(id).split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) >>> 0; });

  return SENDER_COLORS[h % SENDER_COLORS.length];

}

function closeCurrentChatView() {

  exitSelectionMode();

  clearReply();

  $('chatView').classList.remove('active');

  currentChat = null;

  currentChatAlias = "";

  if (msgUnsub) { msgUnsub(); msgUnsub = null; }

}

function loadGroups() {

  if (groupsUnsub) groupsUnsub();

  groupsUnsub = onValue(ref(db, 'groups'), snap => {

    const next = {};

    snap.forEach(child => {

      const v = child.val();

      if (v && v.members && v.members[myId]) next[child.key] = v;

    });

    groupsCache = next;
    syncNotifListeners();

    if (currentChat && isGroupId(currentChat)) {

      if (!groupsCache[currentChat]) {

        closeCurrentChatView();

        $('groupInfoModal').classList.remove('show');

        showToast('Grup telah dibubarkan atau Anda bukan lagi anggota');

      } else {

        currentChatAlias = groupName(currentChat);

        $('chatName').textContent = currentChatAlias;

        $('chatStatus').textContent = groupMembersLabel(currentChat);

      }

    }

    if ($('groupInfoModal').classList.contains('show')) renderGroupInfo();

    renderChatList();

  });

}




/* ============= ARSIP (Diarsipkan) =============
   Disimpan per akun di perangkat ini (localStorage), sama seperti penanda "hapus percakapan".
   archivedCache = { idChat: waktuDiarsipkan }. Tidak perlu mengubah Rules database. */
let archivedCache = {};
let keepArchived = true;
function archStoreKey() { return 'chat_archived_' + (myId || ''); }
function archKeepKey() { return 'chat_archive_keep_' + (myId || ''); }
function loadArchived() {
  archivedCache = {};
  keepArchived = true;
  try { const v = JSON.parse(localStorage.getItem(archStoreKey()) || '{}'); if (v && typeof v === 'object') archivedCache = v; } catch (e) {}
  try { keepArchived = localStorage.getItem(archKeepKey()) !== '0'; } catch (e) {}
}
function saveArchived() { try { localStorage.setItem(archStoreKey(), JSON.stringify(archivedCache)); } catch (e) {} }
function isArchived(id) { return !!archivedCache[id]; }
function setArchived(ids, on) {
  const list = Array.isArray(ids) ? ids : [ids];
  const now = Date.now();
  list.forEach(id => { if (on) archivedCache[id] = now; else delete archivedCache[id]; });
  saveArchived();
  renderChatList();
}
function lastTsOf(id) {
  if (isGroupId(id)) { const g = groupsCache[id]; return g ? ((g.last && g.last.ts) || 0) : 0; }
  return chatMeta[id] ? (chatMeta[id].ts || 0) : 0;
}
/* bila pengaturan "tetap diarsipkan" mati, chat yang menerima pesan baru keluar dari arsip */
function pruneArchived() {
  if (keepArchived) return;
  let changed = false;
  Object.keys(archivedCache).forEach(id => {
    const t = lastTsOf(id);
    if (t && t > archivedCache[id] && !(chatMeta[id] && chatMeta[id].from === myId && !isGroupId(id))) { delete archivedCache[id]; changed = true; }
  });
  if (changed) saveArchived();
}
function archiveWithUndo(id) {
  setArchived(id, true);
  showToast('1 chat diarsipkan', { label: 'Urungkan', fn: () => setArchived(id, false) });
}
function openArchivedView() {
  $('archMore').classList.remove('show');
  $('archivedView').classList.add('active');
  renderArchivedList();
}
function closeArchivedView() {
  $('archMore').classList.remove('show');
  $('archivedView').classList.remove('active');
}
function renderArchivedList() {
  const list = $('archivedList');
  const ids = Object.keys(archivedCache).filter(id => isGroupId(id) ? (groupsCache[id] && groupsCache[id].members && groupsCache[id].members[myId]) : (!!chatMeta[id] || !!contactsCache[id]));
  const entries = ids.map(id => ({ id, ts: lastTsOf(id) || archivedCache[id] || 0, name: isGroupId(id) ? (groupsCache[id].name || 'Grup') : displayName(id) }));
  entries.sort((a, b) => (b.ts - a.ts) || a.name.localeCompare(b.name));
  const keepScroll = list.scrollTop;
  list.innerHTML = '';
  if (!entries.length) {
    list.innerHTML = '<div class="arch-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="5" rx="1.2"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg><h3>Tidak ada chat diarsipkan</h3><p>Tekan lama sebuah percakapan di daftar chat, lalu pilih <b>Arsipkan obrolan</b>.</p></div>';
    return;
  }
  archListMode = true;
  try { entries.forEach(en => list.appendChild(isGroupId(en.id) ? buildGroupRow(en.id) : buildChatRow(en.id))); }
  finally { archListMode = false; }
  list.scrollTop = keepScroll;
}
let archListMode = false;
function buildArchiveRow(unreadChats) {
  const row = document.createElement('div');
  row.className = 'archive-row';
  row.id = 'archiveRow';
  row.setAttribute('role', 'button');
  row.tabIndex = 0;
  row.innerHTML = '<div class="archive-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="5" rx="1.2"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M12 11.5v6"/><polyline points="9.2 14.6 12 17.4 14.8 14.6"/></svg></div><span class="archive-label">Diarsipkan</span>' + (unreadChats > 0 ? '<span class="archive-count">' + unreadChats + '</span>' : '');
  row.addEventListener('click', openArchivedView);
  row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openArchivedView(); } });
  return row;
}
$('archBack').addEventListener('click', closeArchivedView);
$('archMoreBtn').addEventListener('click', (e) => { e.stopPropagation(); $('archMore').classList.toggle('show'); });
$('archivedView').addEventListener('click', (e) => { if (!e.target.closest('#archMore') && !e.target.closest('#archMoreBtn')) $('archMore').classList.remove('show'); });
$('archUnarchiveAll').addEventListener('click', async () => {
  $('archMore').classList.remove('show');
  const ids = Object.keys(archivedCache);
  if (!ids.length) { showToast('Tidak ada chat diarsipkan'); return; }
  const ok = await confirmDialog({ title: 'Keluarkan semua dari arsip?', message: ids.length + ' percakapan akan kembali ke daftar chat.', okText: 'Keluarkan', icon: 'trash', danger: false });
  if (!ok) return;
  setArchived(ids, false);
  showToast(ids.length + ' chat dikeluarkan dari arsip');
});
$('menuArchive').addEventListener('click', () => {
  $('chatMenu').classList.remove('show');
  const id = currentMenuChatId;
  if (!id) return;
  if (isArchived(id)) { setArchived(id, false); showToast('Chat dikeluarkan dari arsip'); }
  else archiveWithUndo(id);
});
$('menuGroupInfo').addEventListener('click', () => {
  $('chatMenu').classList.remove('show');
  if (currentMenuChatId) openGroupInfo(currentMenuChatId);
});
/* menu tekan-lama: opsi khusus kontak disembunyikan untuk grup */
function prepareChatMenu(id, name) {
  const grp = isGroupId(id);
  currentMenuChatId = id;
  currentMenuChatName = name;
  ['menuRename', 'menuShareContact', 'menuDeleteChat', 'menuBlock', 'menuDeleteContact'].forEach(k => { const el = $(k); if (el) el.style.display = grp ? 'none' : ''; });
  $('menuGroupInfo').style.display = grp ? '' : 'none';
  $('menuArchiveText').textContent = isArchived(id) ? 'Keluarkan dari arsip' : 'Arsipkan obrolan';
  $('chatMenuTitle').textContent = name;
  $('chatMenuSub').textContent = 'Pilih tindakan';
  if (!grp) $('menuBlockText').textContent = blockedCache[id] ? 'Buka blokir' : 'Blokir kontak';
  $('chatMenu').classList.add('show');
}

/* ============= RENDER CHAT LIST ============= */

function renderChatList() {

  const list = $('chatList');

  const q = ($('searchChats').value || '').trim().toLowerCase();

  const allIds = new Set();

  Object.keys(contactsCache).forEach(id => allIds.add(id));

  Object.keys(chatMeta).forEach(id => allIds.add(id));

  let arr = Array.from(allIds).filter(id => {

    if (!id || id === myId) return false;

    if (deletedChats[id]) {

      const last = chatMeta[id];

      if (!last) return false;

      if ((last.ts || 0) <= deletedChats[id]) return false;

      delete deletedChats[id];

      saveDeletedChats();

    }

    return true;

  });

  arr.sort((a,b) => {

    const ta = chatMeta[a] ? (chatMeta[a].ts||0) : 0;

    const tb = chatMeta[b] ? (chatMeta[b].ts||0) : 0;

    if (ta && tb) return tb - ta;

    if (ta) return -1;

    if (tb) return 1;

    return displayName(a).localeCompare(displayName(b));

  });

  if (q) arr = arr.filter(id => displayName(id).toLowerCase().includes(q) || id.toLowerCase().includes(q) || dispId(id).includes(q));
  const entries = arr.map(id => ({ kind: 'user', id, ts: chatMeta[id] ? (chatMeta[id].ts || 0) : 0, name: displayName(id) }));

  Object.keys(groupsCache).forEach(gid => {

    const g = groupsCache[gid];

    if (!g || !g.members || !g.members[myId]) return;

    const gname = g.name || 'Grup';

    if (q && !gname.toLowerCase().includes(q)) return;

    entries.push({ kind: 'group', id: gid, ts: (g.last && g.last.ts) || g.createdAt || 0, name: gname });

  });

    entries.sort((a, b) => (b.ts - a.ts) || a.name.localeCompare(b.name));

  pruneArchived();
  const archivedTotal = Object.keys(archivedCache).filter(id => isGroupId(id) ? (groupsCache[id] && groupsCache[id].members && groupsCache[id].members[myId]) : (!!chatMeta[id] || !!contactsCache[id])).length;
  const archivedUnread = Object.keys(archivedCache).filter(id => unreadCount(id) && !blockedCache[id]).length;
  /* saat mencari, chat yang diarsipkan ikut tampil (diberi label); selain itu disembunyikan dari daftar utama */
  if (!q) { for (let i = entries.length - 1; i >= 0; i--) if (isArchived(entries[i].id)) entries.splice(i, 1); }

  list.innerHTML = '';

  if (!q && archivedTotal > 0) list.appendChild(buildArchiveRow(archivedUnread));

  if (entries.length === 0 && !q && archivedTotal > 0) {
    const hint = document.createElement('div');
    hint.className = 'all-archived-hint';
    hint.textContent = 'Semua percakapan Anda ada di Diarsipkan.';
    list.appendChild(hint);
    if ($('archivedView').classList.contains('active')) renderArchivedList();
    return;
  }

  if (entries.length === 0) {

    list.innerHTML = `

      <div class="empty-state">

        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">

          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>

        </svg>

        <h3>Belum Ada Percakapan</h3>

        <p>Mulai percakapan pertama Anda dengan menambahkan kontak melalui tombol <b>+</b> di sudut kanan bawah.</p>

        <button class="btn-primary" id="emptyAddContactBtn">Tambah Kontak</button>

      </div>`;

    const btn = $('emptyAddContactBtn');

    if (btn) btn.addEventListener('click', openAddContactModal);

    return;

  }

    entries.forEach(en => list.appendChild(en.kind === 'group' ? buildGroupRow(en.id) : buildChatRow(en.id)));
  if ($('archivedView').classList.contains('active')) renderArchivedList();
}



function buildChatRow(idUser) {

  const u = usersCache[idUser] || { name: idUser, online: false };

  const last = chatMeta[idUser];

  const name = displayName(idUser);

  const row = document.createElement('div');

  row.className = 'chat-row';

  if (blockedCache[idUser]) row.classList.add('blocked');
  if (unreadCount(idUser) && !blockedCache[idUser]) row.classList.add('has-unread');
  row.dataset.name = idUser;

  let preview = 'Ketuk untuk mulai chat';

  let previewIcon = '';

  if (blockedCache[idUser]) preview = 'Anda memblokir kontak ini';

  else if (last) {

    if (last.deleted) preview = 'Pesan ini telah dihapus';

    else if (last.type === 'image') {
      preview = imgLabel(last);

      previewIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

    } else if (last.type === 'audio') {

      preview = 'Pesan suara';

      previewIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>`;

    } else {

      preview = (last.from === myId ? 'Anda: ' : '') + (last.text || '');

    }

  }

  const checkMark = last && last.from === myId && !last.deleted ?

    `<svg viewBox="0 0 16 15" fill="${last.readAt ? '#34b7f1' : '#8a9a95'}" width="16" height="16" style="flex-shrink:0;"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/></svg>` : '';

  let statusHtml = '';

  if (blockedCache[idUser]) statusHtml = '<span style="color:#d32f2f;font-size:12px;font-weight:500;">diblokir</span>';

  else if (u && u.online) statusHtml = '<span style="color:#25d366;font-size:12px;font-weight:500;display:flex;align-items:center;gap:4px;"><span class="online-dot"></span>online</span>';

  row.innerHTML = `

    <div class="avatar-lg">${initials(name)}</div>

    <div class="chat-row-body">

      <div class="chat-row-top">

        <span class="chat-row-name">${esc(name)}</span>

        <span class="chat-row-time">${last ? fmtTimeShort(last.ts) : ''}</span>

      </div>

      <div class="chat-row-bottom">

                <span class="chat-row-preview">${checkMark}${previewIcon}${esc(preview)}</span>
        ${(!archListMode && isArchived(idUser)) ? '<span class="arch-tag">Diarsipkan</span>' : ''}${statusHtml}${unreadBadgeHtml(idUser)}
      </div>

    </div>

  `;

  renderAvatar(row.querySelector('.avatar-lg'), name, getPhotoFor(idUser));

  attachChatRowMenu(row, idUser, name);

  return row;

}



function buildGroupRow(gid) {

  const g = groupsCache[gid] || {};

    let last = g.last || null;
  { const jt = joinedAtOf(gid); if (last && jt && (last.ts || 0) < jt) last = null; }
  const name = g.name || 'Grup';

  const row = document.createElement('div');

  row.className = 'chat-row';
  if (unreadCount(gid)) row.classList.add('has-unread');
  row.dataset.name = gid;

  let preview = joinedAtOf(gid) ? 'Anda bergabung' : 'Grup dibuat';

  let previewIcon = '';

  if (last) {

    const who = last.from === myId ? 'Anda: ' : displayName(last.from) + ': ';

    if (last.deleted) preview = 'Pesan ini telah dihapus';

    else if (last.type === 'image') {
      preview = who + imgLabel(last);

      previewIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

    } else if (last.type === 'audio') {

      preview = who + 'Pesan suara';

      previewIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>`;

    } else preview = who + (last.text || '');

  }

  row.innerHTML = `

    <div class="avatar-lg"></div>

    <div class="chat-row-body">

      <div class="chat-row-top">

        <span class="chat-row-name">${esc(name)}</span>

        <span class="chat-row-time">${last ? fmtTimeShort(last.ts) : fmtTimeShort(g.createdAt)}</span>

      </div>

      <div class="chat-row-bottom">

                <span class="chat-row-preview">${previewIcon}${esc(preview)}</span>
        ${(!archListMode && isArchived(gid)) ? '<span class="arch-tag">Diarsipkan</span>' : ''}${unreadBadgeHtml(gid)}
      </div>
    </div>
  `;
  renderGroupAvatar(row.querySelector('.avatar-lg'));

  attachChatRowMenu(row, gid, name);

  return row;

}



function attachChatRowMenu(row, idUser, name) {

  let pressTimer = null;

  let fired = false;

    const openMenu = () => prepareChatMenu(idUser, name);

  row.addEventListener('contextmenu', (e) => { e.preventDefault(); openMenu(); });

  row.addEventListener('mousedown', (e) => {

    if (e.button !== 0) return;

    fired = false;

    pressTimer = setTimeout(() => { fired = true; openMenu(); }, 600);

  });

  row.addEventListener('mouseup', () => clearTimeout(pressTimer));

  row.addEventListener('mouseleave', () => clearTimeout(pressTimer));

  row.addEventListener('touchstart', () => {

    fired = false;

    pressTimer = setTimeout(() => {

      fired = true;

      if (navigator.vibrate) navigator.vibrate(30);

      openMenu();

    }, 500);

  }, { passive: true });

  const cancel = () => clearTimeout(pressTimer);

  row.addEventListener('touchend', cancel);

  row.addEventListener('touchmove', cancel);

  row.addEventListener('touchcancel', cancel);

  row.addEventListener('click', (e) => {

    if (fired) { e.preventDefault(); e.stopPropagation(); return; }

    openChat(idUser);

  });

}



$('menuCancel').addEventListener('click', () => $('chatMenu').classList.remove('show'));

$('chatMenu').addEventListener('click', (e) => {

  if (e.target === $('chatMenu')) $('chatMenu').classList.remove('show');

});



$('menuDeleteChat').addEventListener('click', async () => {
  $('chatMenu').classList.remove('show');
  if (!currentMenuChatId) return;
  const target = currentMenuChatId;
  const ok = await confirmDialog({ title: 'Hapus percakapan?', message: 'Seluruh pesan dengan "' + currentMenuChatName + '" (teks, foto, dan pesan suara) akan dihapus permanen dari database untuk kedua pihak. Tindakan ini tidak dapat dibatalkan.', okText: 'Hapus', icon: 'trash' });
  if (!ok) return;
  const cid = convId(myId, target);
  const cref = ref(db, 'chats/' + cid);
  let purged = false, errMsg = '';
  try {
    /* 1) hapus seluruh node percakapan di Firebase (satu operasi, termasuk foto/suara/hiddenFor/readAt) */
    await remove(cref);
    /* 2) verifikasi benar-benar sudah kosong; bila masih ada, hapus ulang pesan per pesan */
    let snap = await get(cref);
    if (snap.exists()) {
      const up = {};
      snap.forEach(c => { up['chats/' + cid + '/' + c.key] = null; });
      up['chats/' + cid] = null;
      await update(ref(db), up);
      snap = await get(cref);
    }
    purged = !snap.exists();
    if (!purged) errMsg = 'data masih tersisa di server';
  } catch (err) {
    console.error(err);
    errMsg = err && err.message ? err.message : 'gagal terhubung ke server';
  }
  try { await update(ref(db), { ['unread/' + myId + '/' + target]: null, ['unread/' + target + '/' + myId]: null }); } catch (e) {}
  delete unreadCache[target];
  /* bersihkan jejak di perangkat ini */
  delete hiddenMsgs[cid];
  saveHidden();
  deletedChats[target] = Date.now();
  saveDeletedChats();
  delete chatMeta[target];
  if (currentChat === target) {
    try { exitSelectionMode(); clearReply(); } catch (e) {}
    $('chatView').classList.remove('active');
    currentChat = null;
    currentChatAlias = "";
    if (msgUnsub) { msgUnsub(); msgUnsub = null; }
  }
  renderChatList();
  if (purged) showToast('Percakapan dihapus permanen dari database');
  else showToast('Gagal menghapus di server: ' + errMsg + '. Periksa Rules database.');
});
$('menuBlock').addEventListener('click', async () => {

  $('chatMenu').classList.remove('show');

  if (!currentMenuChatId) return;

  const isBlocked = !!blockedCache[currentMenuChatId];

  try {

    if (isBlocked) {

      await remove(ref(db, 'blocked/' + myId + '/' + currentMenuChatId));

      showToast('Blokir kontak dibuka');

    } else {

      await set(ref(db, 'blocked/' + myId + '/' + currentMenuChatId), Date.now());

      showToast('Kontak diblokir');

    }

  } catch (err) { showToast('Gagal: ' + err.message); }

});



/* ============= RENDER CONTACT LIST ============= */

function renderContactList() {

  const list = $('contactList');

  const q = ($('searchContacts').value || '').trim().toLowerCase();

  const ids = Object.keys(contactsCache).filter(id => id && id !== myId);

  const filtered = ids.filter(id => {

    if (!q) return true;

    const name = displayName(id).toLowerCase();

    return name.includes(q) || id.toLowerCase().includes(q) || dispId(id).includes(q);

  });

  if (filtered.length === 0) {

    list.innerHTML = `

      <div class="empty-state">

        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">

          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>

          <circle cx="9" cy="7" r="4"/>

          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>

          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>

        </svg>

        <h3>Belum Ada Kontak</h3>

        <p>Tambahkan kontak menggunakan ID numeriknya</p>

        <button class="btn-primary" id="emptyAddContactBtn2">Tambah Kontak</button>

      </div>`;

    const btn = $('emptyAddContactBtn2');

    if (btn) btn.addEventListener('click', openAddContactModal);

    return;

  }

  const groups = {};

  filtered.forEach(id => {

    const name = displayName(id);

    const letter = (name[0] || '#').toUpperCase();

    if (!groups[letter]) groups[letter] = [];

    groups[letter].push(id);

  });

  const letters = Object.keys(groups).sort();

  list.innerHTML = '';

  letters.forEach(letter => {

    const header = document.createElement('div');

    header.className = 'contact-section-header';

    header.textContent = letter;

    list.appendChild(header);

    groups[letter].sort((a,b) => displayName(a).localeCompare(displayName(b))).forEach(id => {

      const u = usersCache[id] || { online: false };

      const name = displayName(id);

      const isBlocked = !!blockedCache[id];

      const row = document.createElement('div');

      row.className = 'contact-row';

      row.innerHTML = `

        <div class="avatar-md">${initials(name)}</div>

        <div class="contact-info">

          <h4>${esc(name)}</h4>

          <p>${isBlocked ? '<span style="color:#d32f2f;">diblokir</span>' : (u.online ? '<span class="online-dot"></span>online' : 'offline')} · ID: ${esc(dispId(id))}</p>

        </div>

      `;

      renderAvatar(row.querySelector('.avatar-md'), name, getPhotoFor(id));

      row.onclick = () => openChat(id);

      list.appendChild(row);

    });

  });

}



$('searchChats').addEventListener('input', renderChatList);

$('searchContacts').addEventListener('input', renderContactList);



/* ============= ADD CONTACT ============= */

function openAddContactModal() {

  $('contactAliasInput').value = '';

  $('contactIdInput').value = '';

  $('addContactModal').classList.add('show');

  setTimeout(() => $('contactAliasInput').focus(), 100);

}

function closeAddContactModal() { $('addContactModal').classList.remove('show'); }



$('newChatFab').addEventListener('click', () => $('newMenu').classList.add('show'));

$('newMenuCancel').addEventListener('click', () => $('newMenu').classList.remove('show'));

$('newMenu').addEventListener('click', (e) => { if (e.target === $('newMenu')) $('newMenu').classList.remove('show'); });

$('newMenuContact').addEventListener('click', () => { $('newMenu').classList.remove('show'); openAddContactModal(); });

$('newMenuGroup').addEventListener('click', () => { $('newMenu').classList.remove('show'); openGroupModal(); });

$('closeAddContact').addEventListener('click', closeAddContactModal);

$('cancelAddContact').addEventListener('click', closeAddContactModal);

$('addContactModal').addEventListener('click', (e) => {

  if (e.target === $('addContactModal')) closeAddContactModal();

});

$('contactIdInput').addEventListener('input', (e) => {

  e.target.value = e.target.value.replace(/\D/g, '');

});



$('contactAliasInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('contactIdInput').focus(); } });
$('contactIdInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('confirmAddContact').click(); } });

$('confirmAddContact').addEventListener('click', async () => {

  const id = await resolveUserId($('contactIdInput').value.trim());

  const alias = $('contactAliasInput').value.trim();

  if (!id) { showToast('Silakan masukkan ID'); return; }

  if (!alias) { showToast('Silakan masukkan nama kontak'); return; }

  if (id === myId) { showToast('Anda tidak dapat menambahkan diri sendiri'); return; }

  $('confirmAddContact').disabled = true;

  $('confirmAddContact').textContent = 'Menyimpan...';

  try {

    const snap = await get(ref(db, 'users/' + id));

    if (!snap.exists()) {

      showToast('ID "' + dispId(id) + '" tidak ditemukan');

      $('confirmAddContact').disabled = false;

      $('confirmAddContact').textContent = 'Tambah';

      return;

    }

    await set(ref(db, 'contacts/' + myId + '/' + id), alias);

    try {

      const back = await get(ref(db, 'contacts/' + id + '/' + myId));

      if (!back.exists()) await set(ref(db, 'contacts/' + id + '/' + myId), myName);

    } catch (e) { console.error(e); }

    contactsCache[id] = alias;

    if (deletedChats[id]) { delete deletedChats[id]; saveDeletedChats(); }

    renderContactList();

    renderChatList();

    closeAddContactModal();

    showToast('Kontak "' + alias + '" ditambahkan');

  } catch (err) { showToast('Gagal menyimpan: ' + err.message); }

  finally {

    $('confirmAddContact').disabled = false;

    $('confirmAddContact').textContent = 'Tambah';

  }

});



/* ============= EDIT / DELETE CONTACT ============= */

let editContactTarget = null;

function openEditContact(id) {

  if (!id) return;

  editContactTarget = id;

  $('editContactInput').value = displayName(id) === id ? '' : displayName(id);

  $('editContactId').textContent = dispId(id);

  $('editContactModal').classList.add('show');

  setTimeout(() => $('editContactInput').focus(), 100);

}

function closeEditContact() { $('editContactModal').classList.remove('show'); }

$('chatAvatar').addEventListener('click', () => {

  if (!currentChat) return;

  if (isGroupId(currentChat)) { openGroupInfo(currentChat); return; }

    prepareChatMenu(currentChat, currentChatAlias);
});

$('menuRename').addEventListener('click', () => {

  $('chatMenu').classList.remove('show');

  openEditContact(currentMenuChatId);

});

$('closeEditContact').addEventListener('click', closeEditContact);

$('cancelEditContact').addEventListener('click', closeEditContact);

$('editContactModal').addEventListener('click', (e) => {

  if (e.target === $('editContactModal')) closeEditContact();

});

$('confirmEditContact').addEventListener('click', async () => {

  const alias = $('editContactInput').value.trim();

  if (!alias) { showToast('Silakan masukkan nama kontak'); return; }

  const target = editContactTarget;

  if (!target) return;

  $('confirmEditContact').disabled = true;

  try {

    await set(ref(db, 'contacts/' + myId + '/' + target), alias);

    contactsCache[target] = alias;

    if (currentChat === target) {

      currentChatAlias = alias;

      $('chatName').textContent = alias;

      renderAvatar($('chatAvatar'), alias, getPhotoFor(target));

    }

    renderContactList();

    renderChatList();

    closeEditContact();

    showToast('Nama kontak berhasil diperbarui');

  } catch (err) { showToast('Gagal menyimpan: ' + err.message); }

  finally { $('confirmEditContact').disabled = false; }

});



async function deleteContactPermanently(idUser) {

  const name = displayName(idUser);

  const ok = await confirmDialog({ title: 'Hapus kontak permanen?', message: '"' + name + '" beserta seluruh percakapan akan turut terhapus dari akun kontak tersebut. Tindakan ini tidak dapat dibatalkan.', okText: 'Hapus', icon: 'userx' });

  if (!ok) return;

  const cid = convId(myId, idUser);

  const updates = {};

  updates['contacts/' + myId + '/' + idUser] = null;

  updates['contacts/' + idUser + '/' + myId] = null;

  updates['blocked/' + myId + '/' + idUser] = null;

  updates['chats/' + cid] = null;
  updates['unread/' + myId + '/' + idUser] = null;
  updates['unread/' + idUser + '/' + myId] = null;
  try {
    await update(ref(db), updates);
  } catch (err) {
    showToast('Gagal menghapus: ' + err.message);

    return;

  }

  delete hiddenMsgs[cid];

  saveHidden();

  deletedChats[idUser] = Date.now();

  saveDeletedChats();

  delete contactsCache[idUser];

  delete blockedCache[idUser];

  delete chatMeta[idUser];

  if (currentChat === idUser) {

    exitSelectionMode();

    clearReply();

    $('chatView').classList.remove('active');

    currentChat = null;

    currentChatAlias = "";

    if (msgUnsub) { msgUnsub(); msgUnsub = null; }

  }

  updateBlockedCount();

  renderContactList();

  renderChatList();

  showToast('Kontak berhasil dihapus permanen');

}

$('deleteContactBtn').addEventListener('click', async () => {

  const id = editContactTarget;

  if (!id) return;

  closeEditContact();

  await deleteContactPermanently(id);

});

$('menuDeleteContact').addEventListener('click', async () => {

  $('chatMenu').classList.remove('show');

  if (!currentMenuChatId) return;

  await deleteContactPermanently(currentMenuChatId);

});



/* ============= GROUP: CREATE & INFO ============= */

const TRASH_X_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';



const ICON_CROWN = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7zm2.6 13h12.8v2H5.6v-2z"/></svg>';

const ICON_SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9-4.8-.8-8-4.5-8-9V6l8-3z"/><polyline points="9 12 11 14 15 10"/></svg>';

function buildMemberRow(id, opts) {

  opts = opts || {};

  const row = document.createElement('div');

  row.className = 'member-row';

  const isMe = id === myId;

  const name = isMe ? 'Anda' : displayName(id);

  let badge = '';

  if (opts.tag === 'Pembuat') badge = `<span class="role-badge creator">${ICON_CROWN}Pembuat</span>`;

  else if (opts.tag === 'Admin') badge = `<span class="role-badge admin">${ICON_SHIELD}Admin</span>`;

  row.innerHTML = `

    <div class="avatar-md">${initials(name)}</div>

    <div class="m-body">

      <div class="m-name-line"><span class="m-name">${esc(name)}</span>${badge}</div>

      <div class="m-id">ID ${esc(dispId(id))}</div>

    </div>`;

  renderAvatar(row.querySelector('.avatar-md'), name, getPhotoFor(id));

  if (opts.onAction) {

    const ab = document.createElement('button');

    ab.type = 'button';

    ab.className = 'member-admin-btn' + (opts.actionRevoke ? ' revoke' : '');

    ab.title = opts.actionTitle || opts.actionLabel;

    ab.textContent = opts.actionLabel;

    ab.addEventListener('click', opts.onAction);

    row.appendChild(ab);

  }

  if (opts.onRemove) {

    const btn = document.createElement('button');

    btn.type = 'button';

    btn.className = 'member-remove';

    btn.title = 'Hapus';

    btn.innerHTML = TRASH_X_SVG;

    btn.addEventListener('click', opts.onRemove);

    row.appendChild(btn);

  }

  return row;

}



function renderGroupMemberChips() {

  $('groupMemberCountTitle').textContent = 'Anggota (' + (newGroupMembers.length + 1) + ')';

  const box = $('groupMemberList');

  box.innerHTML = '';

  box.appendChild(buildMemberRow(myId, { tag: 'Pembuat' }));

  newGroupMembers.forEach(id => {

    box.appendChild(buildMemberRow(id, { onRemove: () => {

      newGroupMembers = newGroupMembers.filter(x => x !== id);

      renderGroupMemberChips();

    } }));

  });

}



function openGroupModal() {

  $('groupNameInput').value = '';

  $('groupMemberIdInput').value = '';

  newGroupMembers = [];

  renderGroupMemberChips();

  $('groupModal').classList.add('show');

  setTimeout(() => $('groupNameInput').focus(), 100);

}

function closeGroupModal() { $('groupModal').classList.remove('show'); }

$('closeGroupModal').addEventListener('click', closeGroupModal);

$('cancelGroupModal').addEventListener('click', closeGroupModal);

$('groupModal').addEventListener('click', (e) => { if (e.target === $('groupModal')) closeGroupModal(); });

$('groupMemberIdInput').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });

$('groupInfoIdInput').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });



async function checkUserExists(id) {

  const snap = await get(ref(db, 'users/' + id));

  if (snap.exists() && snap.val() && snap.val().name) usersCache[id] = Object.assign({}, usersCache[id] || {}, snap.val());

  return snap.exists();

}



async function addMemberToDraft() {

  const id = await resolveUserId($('groupMemberIdInput').value.trim());

  if (!id) { showToast('Silakan masukkan ID kontak'); return; }

  if (id === myId) { showToast('ID Anda sudah otomatis terdaftar'); return; }

  if (newGroupMembers.includes(id)) { showToast('ID sudah ada dalam daftar'); return; }

  $('groupMemberAddBtn').disabled = true;

  try {

    if (!(await checkUserExists(id))) { showToast('ID "' + dispId(id) + '" tidak ditemukan'); return; }

    newGroupMembers.push(id);

    $('groupMemberIdInput').value = '';

    renderGroupMemberChips();

  } catch (err) { showToast('Gagal: ' + err.message); }

  finally { $('groupMemberAddBtn').disabled = false; }

}

$('groupMemberAddBtn').addEventListener('click', addMemberToDraft);

$('groupMemberIdInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') addMemberToDraft(); });



$('confirmGroupModal').addEventListener('click', async () => {

  const name = $('groupNameInput').value.trim();

  if (!name) { showToast('Silakan masukkan nama grup'); return; }

  const gid = 'g_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const members = {};

  members[myId] = true;

  newGroupMembers.forEach(id => { members[id] = true; });

  const data = { name, createdBy: myId, createdAt: Date.now(), members };

  $('confirmGroupModal').disabled = true;

  $('confirmGroupModal').textContent = 'Membuat...';

  try {

    await set(ref(db, 'groups/' + gid), data);

    groupsCache[gid] = data;

    closeGroupModal();

    switchPane('paneChats');

    renderChatList();

    showToast('Grup "' + name + '" dibuat');

    openChat(gid);

  } catch (err) { showToast('Gagal membuat grup: ' + err.message); }

  finally {

    $('confirmGroupModal').disabled = false;

    $('confirmGroupModal').textContent = 'Buat';

  }

});



function openGroupInfo(gid) {

  if (!groupsCache[gid]) return;

  currentInfoGid = gid;

  $('groupInfoIdInput').value = '';

  giQuery = ''; $('groupInfoSearch').value = ''; $('groupInfoSearchClear').classList.remove('show');

  renderGroupInfo();

  $('groupInfoModal').classList.add('show');

}

function closeGroupInfo() { $('groupInfoModal').classList.remove('show'); currentInfoGid = null; }

function renderGroupInfo() {

  const g = currentInfoGid ? groupsCache[currentInfoGid] : null;

  if (!g) { closeGroupInfo(); return; }

  const members = g.members || {};

  const iAmCreator = g.createdBy === myId;

  const roleOrder = id => id === g.createdBy ? 0 : (members[id] === 'admin' ? 1 : 2);

  const ids = Object.keys(members).sort((a, b) => {

    const d = roleOrder(a) - roleOrder(b);

    return d !== 0 ? d : (a === myId ? -1 : b === myId ? 1 : displayName(a).localeCompare(displayName(b)));

  });

  renderGroupAvatar($('groupInfoAvatar'));

  $('groupInfoTitle').textContent = g.name || 'Info Grup';

  const creatorName = g.createdBy === myId ? 'Anda' : displayName(g.createdBy);

  let created = '';

  if (g.createdAt) {

    try { created = new Date(g.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) {}

  }

  $('groupInfoSub').textContent = 'Grup · ' + ids.length + ' anggota' + (created ? ' · dibuat ' + created : '') + (g.createdBy ? ' oleh ' + creatorName : '');

  const q = giQuery.trim().toLowerCase();

  const shown = q ? ids.filter(id => ((id === myId ? 'anda' : displayName(id)).toLowerCase().includes(q)) || id.includes(q) || dispId(id).includes(q)) : ids;

  $('groupInfoCount').textContent = q ? 'Anggota (' + shown.length + ' dari ' + ids.length + ')' : 'Anggota (' + ids.length + ')';

  $('groupInfoAddSection').style.display = iAmCreator ? '' : 'none';

  $('groupInviteSection').style.display = iAmCreator ? '' : 'none';

  if (iAmCreator) renderInviteSection(currentInfoGid, g);

      $('leaveGroupBtn').style.display = iAmCreator ? 'none' : '';
  $('clearGroupBtn').style.display = isGroupMod(currentInfoGid) ? '' : 'none';

  $('disbandGroupBtn').style.display = iAmCreator ? '' : 'none';

  const box = $('groupInfoList');

  box.innerHTML = '';

  if (shown.length === 0) box.innerHTML = '<div class="gi-empty">Tidak ada anggota yang cocok</div>';

  shown.forEach(id => {

    const isCreator = id === g.createdBy;

    const isAdmin = !isCreator && members[id] === 'admin';

    const opts = {};

    if (isCreator) opts.tag = 'Pembuat';

    else if (isAdmin) opts.tag = 'Admin';

    if (iAmCreator && !isCreator) {

      opts.actionLabel = isAdmin ? 'Cabut admin' : 'Jadikan admin';

      opts.actionRevoke = isAdmin;

      opts.onAction = () => setGroupAdmin(currentInfoGid, id, !isAdmin);

    }

    box.appendChild(buildMemberRow(id, opts));

  });

}

$('groupInfoSearch').addEventListener('input', (e) => {

  giQuery = e.target.value;

  $('groupInfoSearchClear').classList.toggle('show', !!giQuery);

  renderGroupInfo();

});

$('groupInfoSearchClear').addEventListener('click', () => {

  giQuery = ''; $('groupInfoSearch').value = '';

  $('groupInfoSearchClear').classList.remove('show');

  renderGroupInfo(); $('groupInfoSearch').focus();

});

$('closeGroupInfo').addEventListener('click', closeGroupInfo);

$('closeGroupInfoBtn').addEventListener('click', closeGroupInfo);

$('groupInfoModal').addEventListener('click', (e) => { if (e.target === $('groupInfoModal')) closeGroupInfo(); });



async function addMemberToGroup() {

  const gid = currentInfoGid;

  const g = gid ? groupsCache[gid] : null;

  if (!g) return;

  if (g.createdBy !== myId) { showToast('Hanya pembuat grup yang dapat menambah anggota'); return; }

  const id = await resolveUserId($('groupInfoIdInput').value.trim());

  if (!id) { showToast('Silakan masukkan ID kontak'); return; }

  if (g.members && g.members[id]) { showToast('Kontak sudah menjadi anggota grup'); return; }

  $('groupInfoAddBtn').disabled = true;

  try {

    if (!(await checkUserExists(id))) { showToast('ID "' + dispId(id) + '" tidak ditemukan'); return; }

    await update(ref(db, 'groups/' + gid), { ['members/' + id]: true, ['joined/' + id]: Date.now() });

    $('groupInfoIdInput').value = '';

    showToast('Anggota berhasil ditambahkan');

  } catch (err) { showToast('Gagal: ' + err.message); }

  finally { $('groupInfoAddBtn').disabled = false; }

}

async function setGroupAdmin(gid, id, makeAdmin) {

  const g = gid ? groupsCache[gid] : null;

  if (!g || g.createdBy !== myId) { showToast('Hanya pembuat grup yang dapat mengatur admin'); return; }

  if (!g.members || !g.members[id] || id === g.createdBy) return;

  try {

    await update(ref(db, 'groups/' + gid + '/members'), { [id]: makeAdmin ? 'admin' : true });

    showToast(makeAdmin ? displayName(id) + ' dijadikan admin' : 'Admin dihapus dari ' + displayName(id));

  } catch (err) { showToast('Gagal: ' + err.message); }

}

$('groupInfoAddBtn').addEventListener('click', addMemberToGroup);

$('groupInfoIdInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') addMemberToGroup(); });



async function leaveGroup(gid) {

  const g = groupsCache[gid];

  if (!g) return;

  const ok = await confirmDialog({ title: 'Keluar dari grup?', message: 'Anda tidak akan lagi menerima pesan dari "' + (g.name || 'grup') + '" lagi.', okText: 'Keluar', icon: 'logout' });

  if (!ok) return;

  const remaining = Object.keys(g.members || {}).filter(x => x !== myId);

  const updates = {};

  if (remaining.length === 0) {

    updates['groups/' + gid] = null;

    updates['groupChats/' + gid] = null;

    if (g.invite) updates['invites/' + g.invite] = null;

  } else {
    updates['groups/' + gid + '/members/' + myId] = null;
    updates['groups/' + gid + '/joined/' + myId] = null;
  }
  updates['unread/' + myId + '/' + gid] = null;
  try {
    await update(ref(db), updates);
  } catch (err) { showToast('Gagal keluar: ' + err.message); return; }

  delete groupsCache[gid];

  delete hiddenMsgs['group_' + gid];

  saveHidden();

  if (currentChat === gid) closeCurrentChatView();

  closeGroupInfo();

  renderChatList();

  showToast('Anda telah keluar dari grup');

}

$('leaveGroupBtn').addEventListener('click', () => { if (currentInfoGid) leaveGroup(currentInfoGid); });



async function disbandGroup(gid) {

  const g = groupsCache[gid];

  if (!g) return;

  if (g.createdBy !== myId) { showToast('Hanya pembuat grup yang dapat membubarkan grup'); return; }

  const ok = await confirmDialog({ title: 'Bubarkan grup?', message: 'Grup "' + (g.name || 'grup') + '" dan seluruh pesannya akan dihapus untuk semua anggota. Tindakan ini tidak dapat dibatalkan.', okText: 'Bubarkan', icon: 'trash' });

  if (!ok) return;

  const updates = {};

  updates['groups/' + gid] = null;

  updates['groupChats/' + gid] = null;
  if (g.invite) updates['invites/' + g.invite] = null;
  Object.keys(g.members || {}).forEach(u => { updates['unread/' + u + '/' + gid] = null; });
  try {
    await update(ref(db), updates);
  } catch (err) { showToast('Gagal membubarkan: ' + err.message); return; }

  delete groupsCache[gid];

  delete hiddenMsgs['group_' + gid];

  saveHidden();

  if (currentChat === gid) closeCurrentChatView();

  closeGroupInfo();

  renderChatList();

  showToast('Grup berhasil dibubarkan');

}

$('disbandGroupBtn').addEventListener('click', () => { if (currentInfoGid) disbandGroup(currentInfoGid); });



/* ============= BLOCKED ============= */

$('blockedListBtn').addEventListener('click', () => {

  const body = $('blockedBody');

  const ids = Object.keys(blockedCache);

  if (ids.length === 0) {

    body.innerHTML = `<div style="padding:40px 20px; text-align:center; color:#8696a0; font-size:14px;">Belum ada kontak yang diblokir</div>`;

  } else {

    body.innerHTML = '';

    ids.forEach(id => {

      const name = displayName(id);

      const row = document.createElement('div');

      row.style.cssText = 'display:flex; align-items:center; gap:14px; padding:14px 20px; border-bottom:1px solid #f0f0f0;';

      row.innerHTML = `

        <div class="avatar-md">${initials(name)}</div>

        <div style="flex:1; min-width:0;">

          <div style="color:#000; font-size:15px;">${esc(name)}</div>

          <div style="color:#667781; font-size:12px;">ID: ${esc(dispId(id))}</div>

        </div>

        <button style="background:transparent; border:1px solid #075e54; color:#075e54; padding:6px 12px; border-radius:3px; font-size:12px; cursor:pointer; font-family:inherit; font-weight:500; text-transform:uppercase; letter-spacing:0.5px;">Buka</button>

      `;

      renderAvatar(row.querySelector('.avatar-md'), name, getPhotoFor(id));

      row.querySelector('button').addEventListener('click', async () => {

        try {

          await remove(ref(db, 'blocked/' + myId + '/' + id));

          showToast('Blokir kontak dibuka');

          $('blockedModal').classList.remove('show');

        } catch (err) { showToast('Gagal: ' + err.message); }

      });

      body.appendChild(row);

    });

  }

  $('blockedModal').classList.add('show');

});

$('closeBlockedModal').addEventListener('click', () => $('blockedModal').classList.remove('show'));

$('closeBlockedBtn').addEventListener('click', () => $('blockedModal').classList.remove('show'));

$('blockedModal').addEventListener('click', (e) => {

  if (e.target === $('blockedModal')) $('blockedModal').classList.remove('show');

});



/* ============= OPEN CHAT ============= */

function openChat(idUser) {

  exitSelectionMode();

  clearReply();

  const isGroup = isGroupId(idUser);

  if (isGroup && !groupsCache[idUser]) { showToast('Grup tidak ditemukan'); return; }

  currentChat = idUser;

  currentChatAlias = isGroup ? groupName(idUser) : displayName(idUser);

  $('chatView').classList.add('active');

  $('chatName').textContent = currentChatAlias;

  if (isGroup) {

    renderGroupAvatar($('chatAvatar'));

    $('chatStatus').textContent = groupMembersLabel(idUser);

  } else {

    renderAvatar($('chatAvatar'), currentChatAlias, getPhotoFor(idUser));

    $('chatStatus').textContent = usersCache[idUser] && usersCache[idUser].online ? 'online' : 'offline';

  }

  updateBlockedBanner();

  resetInputState();

  if (msgUnsub) { msgUnsub(); msgUnsub = null; }

  currentMsgsAll = [];
  /* Bersihkan tampilan chat sebelumnya SEKETIKA agar pesan kontak lain tidak sempat muncul */
  {
    const box0 = $('messages');
    box0.innerHTML = '';
    renderCache.map.clear();
    renderCache.seps.clear();
    renderCache.chat = idUser;
    try { vnResetObserver(); } catch (e) {}
    const cached = msgCache[chatKey(idUser)];
    if (cached && cached.length) { currentMsgsAll = cached; stickBottomOnce = true; renderMessages(visibleMsgs()); }
  }

  if (blockedByUnsub) { blockedByUnsub(); blockedByUnsub = null; }

  blockedByOther = false;

  if (!isGroup) blockedByUnsub = onValue(ref(db, 'blocked/' + idUser + '/' + myId), sn => { blockedByOther = sn.exists(); });

  const id = chatKey(idUser);

  const msgQuery = query(ref(db, chatPath(idUser)), limitToLast(100));
  msgUnsub = onValue(msgQuery, snap => {
    if (currentChat !== idUser) return;

    const msgs = [];

    snap.forEach(child => {

      const v = child.val();

      if (v) msgs.push({ key: child.key, ...v });

    });

    msgs.sort((a,b) => (a.ts||0) - (b.ts||0));

    currentMsgsAll = msgs;
    msgCache[id] = msgs;
    renderMessages(visibleMsgs());
    markCurrentRead();

  }, err => showToast('Gagal memuat pesan: ' + err.message));

}



/* Waktu bergabung saya di grup: pesan sebelum itu tidak ditampilkan (anggota lama tanpa catatan melihat semuanya) */
function joinedAtOf(gid) {
  const g = groupsCache[gid];
  return (g && g.joined && Number(g.joined[myId])) || 0;
}
function visibleMsgs() {

  if (!currentChat) return [];

  const id = chatKey(currentChat);

  const jt = isGroupId(currentChat) ? joinedAtOf(currentChat) : 0;
  return currentMsgsAll.filter(m => !isHidden(id, m.key) && !(m.hiddenFor && m.hiddenFor[myId]) && !(jt && (m.ts || 0) < jt));

}

function rerenderCurrent() { if (currentChat) renderMessages(visibleMsgs()); }



function updateActionButton() {

  if (isRecording) {

    $('micBtn').style.display = 'none';

    $('sendBtn').style.display = 'none';

    return;

  }

  const has = !!getInputText();

  $('sendBtn').style.display = has ? 'flex' : 'none';

  $('micBtn').style.display = has ? 'none' : 'flex';

}



function resetInputState() {

  $('inputField').style.display = 'flex';

  $('attachBtn').style.display = 'flex';

  $('recordingState').classList.remove('show');

  $('inputField').classList.remove('focused');

  updateActionButton();

}



function updateBlockedBanner() {

  if (currentChat && blockedCache[currentChat]) {

    $('blockedBanner').classList.add('show');

  } else {

    $('blockedBanner').classList.remove('show');

  }

}



$('backBtn').addEventListener('click', () => {

  exitSelectionMode();

  clearReply();

  $('chatView').classList.remove('active');

  currentChat = null;

  currentChatAlias = "";

  if (msgUnsub) { msgUnsub(); msgUnsub = null; }

});



/* ============= REPLY ============= */

function clearReply() {

  replyTo = null;

  $('replyPreview').classList.remove('show');

}

$('replyCloseBtn').addEventListener('click', clearReply);



function setReply(msg) {

  replyTo = {

    key: msg.key,

    from: msg.from,

    text: msg.viewOnce ? 'Foto sekali lihat' : (msg.text || ''),
    type: msg.type || 'text',
    deleted: !!msg.deleted
  };

  $('replyPreviewName').textContent = msg.from === myId ? 'Anda' : displayName(msg.from);

  let txt = '';

  if (msg.deleted) txt = 'Pesan ini telah dihapus';

  else if (msg.type === 'image') txt = imgLabel(msg);

  else if (msg.type === 'audio') txt = 'Pesan suara';

  else txt = msg.text || '';

  $('replyPreviewText').textContent = txt;

  $('replyPreview').classList.add('show');

  setTimeout(() => msgInput.focus(), 100);

}



/* ============= RENDER MESSAGES ============= */

function svgCheck(read) {

  return `<svg class="tick${read ? ' read' : ''}" viewBox="0 0 16 15" fill="currentColor"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/></svg>`;

}



/* Cache DOM per pesan: pesan yang tidak berubah TIDAK dibangun ulang

   (inilah yang bikin layar "stuck" saat memilih pesan sebelumnya). */

const renderCache = { chat: null, map: new Map(), seps: new Map() };



function isReadMsg(m) {
  if (!m || m.from !== myId) return false;
    if (currentChat && isGroupId(currentChat)) {
    /* Grup: biru HANYA jika pesan ini membalas pesan seseorang dan orang itu sudah melihatnya */
    const to = m.replyTo && m.replyTo.from;
    if (!to || to === myId) return false;
    const g = groupsCache[currentChat];
    if (!g || !g.members || !g.members[to]) return false;
    return !!(m.readBy && m.readBy[to]);
  }
  return !!m.readAt;
}
/* Admin dan pembuat grup */
function isGroupMod(gid) {
  const g = gid && typeof gid === 'string' ? groupsCache[gid] : null;
  if (!g || !g.members) return false;
  return g.createdBy === myId || g.members[myId] === 'admin';
}
/* Tandai pesan masuk sebagai dibaca HANYA saat chat terbuka dan website terlihat di layar */
function markCurrentRead() {
  if (!currentChat || !myId || document.visibilityState !== 'visible') return;
  if (isViewingChat(currentChat)) clearUnreadFor(currentChat);
  const grp = isGroupId(currentChat), base = chatPath(currentChat), ts = Date.now(), up = {};
  currentMsgsAll.forEach(m => {
    if (!m || !m.key || m.from === myId || m.deleted) return;
    if (grp) { if (!(m.readBy && m.readBy[myId])) up[base + '/' + m.key + '/readBy/' + myId] = ts; }
    else if (!m.readAt) up[base + '/' + m.key + '/readAt'] = ts;
  });
  if (Object.keys(up).length) update(ref(db), up).catch(() => {});
}
document.addEventListener('visibilitychange', markCurrentRead);
window.addEventListener('focus', markCurrentRead);
function msgSig(m) {

  const isSent = m.from === myId;

  let sig = [m.ts, m.deleted ? 1 : 0, m.type || 'text', m.text || '', m.from, m.duration || 0,

             m.data ? m.data.length : 0].join('|');
  if (m.viewOnce) sig += '|vo' + (m.data ? 1 : 0) + (m.viewedAt || 0) + (m.viewedBy ? Object.keys(m.viewedBy).length : 0) + (voSeen(m.key) ? 1 : 0);

  if (m.replyTo) sig += '|r' + m.replyTo.key + (m.replyTo.deleted ? 1 : 0) + (m.replyTo.text || '');

  if (!isSent && currentChat && isGroupId(currentChat)) sig += '|n' + displayName(m.from);

  if (isSent) sig += '|rd' + (isReadMsg(m) ? 1 : 0);
  if (m.type === 'audio') sig += '|p' + String(getPhotoFor(isSent ? myId : m.from) || '').length + (isSent ? myName : displayName(m.from));

  return sig;

}



function buildMsgWrap(m) {

  const box = $('messages');

    const isSent = m.from === myId;

    const wrap = document.createElement('div');

    wrap.className = 'msg-wrap ' + (isSent ? 'sent' : 'received');

    const replyIcon = document.createElement('div');

    replyIcon.className = 'msg-reply-icon';

    replyIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>`;

    wrap.appendChild(replyIcon);



    const div = document.createElement('div');

    div.className = 'msg ' + (isSent ? 'sent' : 'received');

    div.dataset.key = m.key;

    div.dataset.from = m.from;

    div.dataset.deleted = m.deleted ? '1' : '0';

    div.dataset.type = m.type || 'text';

    if (selectedKeys.has(m.key)) { div.classList.add('selected'); wrap.classList.add('selected'); }

    if (!isSent && currentChat && isGroupId(currentChat)) {

      const sn = document.createElement('span');

      sn.className = 'sender-name';

      sn.style.color = senderColor(m.from);

      sn.textContent = displayName(m.from);

      div.appendChild(sn);

    }



    if (m.replyTo) {

      const q = document.createElement('div');

      q.className = 'reply-quote';

      const qFrom = m.replyTo.from === myId ? 'Anda' : displayName(m.replyTo.from);

      let qTxt = '';

      if (m.replyTo.deleted) qTxt = 'Pesan ini telah dihapus';

      else if (m.replyTo.type === 'image') qTxt = m.replyTo.text || 'Foto';

      else if (m.replyTo.type === 'audio') qTxt = 'Pesan suara';

      else qTxt = m.replyTo.text || '';

      q.innerHTML = `<span class="reply-name">${esc(qFrom)}</span><span class="reply-text">${esc(qTxt)}</span>`;

      q.onclick = (e) => {

        if (selectedKeys.size > 0 || Date.now() < suppressClickUntil) return;

        e.stopPropagation();

        const target = box.querySelector(`.msg[data-key="${m.replyTo.key}"]`);

        if (target) {

          target.scrollIntoView({ behavior: 'smooth', block: 'center' });

          const oldBg = target.style.backgroundColor;

          target.style.backgroundColor = 'rgba(0,168,132,0.2)';

          setTimeout(() => { target.style.backgroundColor = oldBg; }, 800);

        }

      };

      div.appendChild(q);

    }



    if (m.deleted) {

      div.classList.add('deleted');

      const span = document.createElement('span');

      span.className = 'text-content';

      span.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>${isSent ? 'Anda menghapus pesan ini' : 'Pesan ini telah dihapus'}`;

      div.appendChild(span);

    } else if (m.type === 'image' && m.viewOnce) {
      div.appendChild(buildViewOnce(m, isSent));
    } else if (m.type === 'image') {
      const img = document.createElement('img');

      img.className = 'chat-img';

      img.src = m.data;

      img.onclick = (e) => {

        if (selectedKeys.size > 0 || Date.now() < suppressClickUntil) return;

        e.stopPropagation();

        viewImage(m.data);

      };

      div.appendChild(img);

    } else if (m.type === 'audio') {

      div.appendChild(buildVNPlayer(m, isSent));

    } else {

      const CV = window.ChatVideo;
      const vcard = CV ? CV.card(m.text || '') : null;
      if (vcard) div.appendChild(vcard);
      const span = document.createElement('span');
      span.className = 'text-content';
      if (CV) CV.linkify(span, m.text || ''); else span.textContent = m.text || '';
      div.appendChild(span);

    }

    const time = document.createElement('span');

    time.className = 'time';

    time.innerHTML = fmtTime(m.ts) + (isSent && !m.deleted ? svgCheck(isReadMsg(m)) : '');

    const vnFoot = div.querySelector('.vn-foot');

    if (vnFoot) vnFoot.appendChild(time); else div.appendChild(time);



    attachSwipeAndLongPress(wrap, div, m);

    wrap.appendChild(div);

  return wrap;

}



function renderMessages(msgs) {

  const box = $('messages');

  const scrollBottom = stickBottomOnce || box.scrollHeight - box.scrollTop - box.clientHeight < 120;

  stickBottomOnce = false;

  if (renderCache.chat !== currentChat) {

    box.innerHTML = '';

    renderCache.map.clear();

    renderCache.seps.clear();

    renderCache.chat = currentChat;

    vnResetObserver();

  }

  const desired = [];

  const keepKeys = new Set();

  const keepSeps = new Set();

  let lastDay = '';

  msgs.forEach(m => {

    const day = fmtDay(m.ts);

    if (day && day !== lastDay) {

      let sep = renderCache.seps.get(day);

      if (!sep) {

        sep = document.createElement('div');

        sep.className = 'date-sep';

        sep.textContent = day;

        renderCache.seps.set(day, sep);

      }

      desired.push(sep);

      keepSeps.add(day);

      lastDay = day;

    }

    const sig = msgSig(m);

    let ent = renderCache.map.get(m.key);

    if (!ent || ent.sig !== sig) {

      const wrap = buildMsgWrap(m);

      if (ent && ent.wrap.parentNode === box) box.replaceChild(wrap, ent.wrap);

      ent = { wrap, sig };

      renderCache.map.set(m.key, ent);

    }

    keepKeys.add(m.key);

    desired.push(ent.wrap);

  });

  renderCache.map.forEach((ent, k) => { if (!keepKeys.has(k)) { ent.wrap.remove(); renderCache.map.delete(k); } });

  renderCache.seps.forEach((el, d) => { if (!keepSeps.has(d)) { el.remove(); renderCache.seps.delete(d); } });

  // susun urutan tanpa memindahkan node yang sudah di tempat yang benar (audio tidak terputus)

  let cur = box.firstChild;

  for (const n of desired) {

    if (n === cur) cur = cur.nextSibling;

    else box.insertBefore(n, cur);

  }

  while (cur) { const nx = cur.nextSibling; box.removeChild(cur); cur = nx; }

  if (scrollBottom) box.scrollTop = box.scrollHeight;

}



/* ============= SWIPE + LONG PRESS ============= */

let suppressClickUntil = 0;

let lastTouchTs = 0;



function attachSwipeAndLongPress(wrap, msgEl, msg) {

  let startX = 0, startY = 0, currentX = 0;

  let tracking = false, isScrolling = false, moved = false;

  let longPressTimer = null, longPressFired = false;

  const SWIPE_THRESHOLD = 60;

  const MAX_SWIPE = 80;

  const LONG_PRESS_MS = 300;



  function resetTransform() {

    msgEl.style.transition = 'transform 0.2s cubic-bezier(0.4,0,0.2,1)';

    msgEl.style.transform = 'translateX(0)';

    wrap.classList.remove('swiping');

  }



  function onStart(clientX, clientY) {

    startX = clientX; startY = clientY; currentX = 0;

    tracking = true; isScrolling = false; moved = false; longPressFired = false;

    msgEl.style.transition = 'none';

    clearTimeout(longPressTimer);

    if (selectedKeys.size === 0) {

      longPressTimer = setTimeout(() => {

        if (tracking && !isScrolling && !moved) {

          longPressFired = true;

          if (navigator.vibrate) navigator.vibrate(25);

          selectSingle(msg.key, msgEl);

        }

      }, LONG_PRESS_MS);

    }

  }



  function onMove(clientX, clientY) {

    if (!tracking) return;

    const dx = clientX - startX;

    const dy = clientY - startY;

    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) { moved = true; clearTimeout(longPressTimer); }

    if (!isScrolling && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {

      isScrolling = true;

      resetTransform();

      return;

    }

    if (isScrolling) return;

    if (selectedKeys.size > 0 || longPressFired) return;

    if (dx < 0) {

      currentX = Math.max(dx, -MAX_SWIPE);

      msgEl.style.transform = 'translateX(' + currentX + 'px)';

      wrap.classList.add('swiping');

    } else if (currentX < 0) {

      currentX = Math.min(0, dx);

      msgEl.style.transform = 'translateX(' + currentX + 'px)';

      if (currentX === 0) wrap.classList.remove('swiping');

    }

  }



  function onEnd() {

    if (!tracking) return;

    tracking = false;

    clearTimeout(longPressTimer);

    if (longPressFired) {

      suppressClickUntil = Date.now() + 300;

      resetTransform();

      return;

    }

    /* Mode pilih: ketukan di mana saja pada baris langsung memilih/membatalkan — tanpa menunggu 'click' */

    if (selectedKeys.size > 0) {

      resetTransform();

      if (!moved && !isScrolling) {

        suppressClickUntil = Date.now() + 350;

        toggleSelect(msg.key, msgEl);

      }

      return;

    }

    if (currentX <= -SWIPE_THRESHOLD) {

      suppressClickUntil = Date.now() + 300;

      msgEl.style.transition = 'transform 0.25s cubic-bezier(0.4,0,0.2,1)';

      msgEl.style.transform = 'translateX(0)';

      wrap.classList.remove('swiping');

      setTimeout(() => {

        setReply(msg);

        if (navigator.vibrate) navigator.vibrate(15);

      }, 150);

    } else {

      resetTransform();

    }

  }



  wrap.addEventListener('touchstart', (e) => {

    lastTouchTs = Date.now();

    const t = e.touches[0];

    onStart(t.clientX, t.clientY);

  }, { passive: true });

  wrap.addEventListener('touchmove', (e) => {

    const t = e.touches[0];

    onMove(t.clientX, t.clientY);

  }, { passive: true });

  wrap.addEventListener('touchend', () => {

    lastTouchTs = Date.now();

    onEnd();

  });

  wrap.addEventListener('touchcancel', () => {

    lastTouchTs = Date.now();

    if (longPressFired) suppressClickUntil = Date.now() + 300;

    tracking = false;

    clearTimeout(longPressTimer);

    resetTransform();

  });



  wrap.addEventListener('mousedown', (e) => {

    if (e.button !== 0) return;

    if (Date.now() - lastTouchTs < 1000) return;

    if (e.target.tagName === 'AUDIO' || e.target.tagName === 'VIDEO') return;

    onStart(e.clientX, e.clientY);

    const onMouseMove = (ev) => onMove(ev.clientX, ev.clientY);

    const onMouseUp = () => {

      document.removeEventListener('mousemove', onMouseMove);

      document.removeEventListener('mouseup', onMouseUp);

      onEnd();

    };

    document.addEventListener('mousemove', onMouseMove);

    document.addEventListener('mouseup', onMouseUp);

  });



  /* cadangan bila ada klik tanpa sentuhan (mis. keyboard/aksesibilitas) */

  wrap.addEventListener('click', (e) => {

    if (Date.now() < suppressClickUntil) { e.stopPropagation(); return; }

    if (selectedKeys.size > 0) {

      e.stopPropagation();

      toggleSelect(msg.key, msgEl);

    }

  });



  wrap.addEventListener('contextmenu', (e) => {

    e.preventDefault();

    e.stopPropagation();

    if (selectedKeys.size === 0) {

      longPressFired = true;

      selectSingle(msg.key, msgEl);

    }

  });

}



/* Pilih 1 pesan → masuk selection mode (header langsung berubah) */

function selectSingle(key, el) {

  if (!selectedKeys.has(key)) {

    selectedKeys.add(key);

    if (el) { el.classList.add('selected'); if (el.parentNode) el.parentNode.classList.add('selected'); }

    updateSelectionUI();

  }

}



function toggleSelect(key, el) {

  const w = el.parentNode;

  if (selectedKeys.has(key)) {

    selectedKeys.delete(key);

    el.classList.remove('selected');

    if (w) w.classList.remove('selected');

  } else {

    selectedKeys.add(key);

    el.classList.add('selected');

    if (w) w.classList.add('selected');

  }

  if (selectedKeys.size === 0) exitSelectionMode();

  else updateSelectionUI();

}



function updateSelectionUI() {

  const header = $('chatHeader');

  if (selectedKeys.size > 0) {

    header.classList.add('selecting');

    $('selectCount').textContent = selectedKeys.size + ' dipilih';

  } else {

    header.classList.remove('selecting');

  }

}



function exitSelectionMode() {

  selectedKeys.clear();

  document.querySelectorAll('.msg.selected, .msg-wrap.selected').forEach(el => el.classList.remove('selected'));

  $('chatHeader').classList.remove('selecting');

}



$('cancelSelectBtn').addEventListener('click', () => exitSelectionMode());



/* ============= DELETE MODAL ============= */

function showDeleteModal() {

  const selectedEls = Array.from(document.querySelectorAll('.msg.selected'));

    const allMine = selectedEls.length > 0 && selectedEls.every(el => el.dataset.from === myId);
  const canAll = allMine || (isGroupMod(currentChat) && selectedEls.length > 0);


  const n = selectedEls.length;

  $('deleteTitle').textContent = n === 1 ? 'Hapus pesan?' : 'Hapus ' + n + ' pesan?';

    $('deleteSub').textContent = canAll ? (allMine ? 'Pilih cara menghapus ' + (n === 1 ? 'pesan ini' : 'pesan ini') : 'Sebagai admin, Anda dapat menghapus pesan anggota untuk semua orang') : 'Pesan hanya disembunyikan dari percakapan Anda';


    $('actDeleteAll').style.display = canAll ? 'flex' : 'none';


  $('deleteModal').classList.add('show');

}

function hideDeleteModal() { $('deleteModal').classList.remove('show'); }



$('deleteSelectedBtn').addEventListener('click', () => {

  if (selectedKeys.size === 0) return;

  showDeleteModal();

});

$('actCancel').addEventListener('click', () => hideDeleteModal());



/* Setelah node pesan terakhir di grup dihapus, perbarui ringkasan 'last' agar tidak menunjuk pesan yang sudah tidak ada */

async function fixGroupLast(gid) {

  const g = groupsCache[gid];

  if (!g || !g.last) return;

  const snap = await get(query(ref(db, 'groupChats/' + gid), limitToLast(1)));

  let latest = null;

  snap.forEach(c => { const v = c.val(); if (v) latest = { key: c.key, ...v }; });

  if (!latest) { await remove(ref(db, 'groups/' + gid + '/last')); return; }

  if (g.last.key === latest.key && !latest.deleted) return;

  await update(ref(db, 'groups/' + gid + '/last'), {

    key: latest.key, from: latest.from, ts: latest.ts || 0,

    type: latest.deleted ? 'deleted' : (latest.type || 'text'),

    text: latest.type === 'text' && !latest.deleted ? String(latest.text || '').slice(0, 80) : '',
    viewOnce: !!latest.viewOnce,
    deleted: !!latest.deleted
  });

}



/* HAPUS UNTUK SAYA

   - disembunyikan langsung di layar, dan ditandai di Firebase (hiddenFor/<id>) agar ikut di semua perangkat

   - node pesan DIHAPUS PERMANEN dari Firebase bila: pesan itu sudah "Pesan ini telah dihapus",

     atau semua peserta chat sudah menghapusnya (sehingga lawan chat tidak kehilangan pesannya lebih dulu) */

$('actDeleteMe').addEventListener('click', async () => {

  hideDeleteModal();

  if (!currentChat || selectedKeys.size === 0) return;

  const target = currentChat;

  const id = chatKey(target);

  const keys = Array.from(selectedKeys);

  markHidden(id, keys);        // hilang dari layar seketika

  exitSelectionMode();

  rerenderCurrent();



  const group = isGroupId(target) ? groupsCache[target] : null;

  const participants = group && group.members ? Object.keys(group.members) : [myId, target];

  const results = await Promise.all(keys.map(async k => {

    try {

      const mref = ref(db, chatPath(target) + '/' + k);

      const snap = await get(mref);

      if (!snap.exists()) return true;

      const v = snap.val() || {};

      const hidden = Object.assign({}, v.hiddenFor || {});

      hidden[myId] = true;

      if (v.deleted || participants.every(p => hidden[p])) await remove(mref);

      else await update(mref, { ['hiddenFor/' + myId]: true });

      return true;

    } catch (err) { return false; }

  }));

  const failed = results.filter(ok => !ok).length;

  if (group) { try { await fixGroupLast(target); } catch (e) {} }

  if (failed) showToast(failed + ' pesan hanya terhapus di perangkat ini (sinkronisasi ke server gagal)');

  else showToast(keys.length > 1 ? keys.length + ' pesan dihapus' : 'Pesan dihapus');

});



/* HAPUS UNTUK SEMUA ORANG

   - node pesan DIHAPUS PERMANEN dari Firebase (tidak ada penanda/sisa isi). Satu update atomik.

   - kutipan balasan yang mengacu ke pesan itu juga dibersihkan, supaya isinya tidak tertinggal di pesan lain. */

$('actDeleteAll').addEventListener('click', async () => {

  hideDeleteModal();

  if (!currentChat || selectedKeys.size === 0) return;

  const target = currentChat;

  const keys = Array.from(selectedKeys);

  const keySet = new Set(keys);

  const base = chatPath(target);

  const updates = {};

  keys.forEach(k => { updates[base + '/' + k] = null; });
  {
    const dec = {};
    keys.forEach(k => {
      const m = currentMsgsAll.find(x => x.key === k);
            if (!m || m.deleted) return;
      if (m.from !== myId && !(isGroupId(target) && isGroupMod(target))) return;
      if (isGroupId(target)) {
        const mem = Object.keys((groupsCache[target] && groupsCache[target].members) || {}).filter(u => u !== m.from);
        mem.forEach(u => { if (!(m.readBy && m.readBy[u])) dec['unread/' + u + '/' + target] = (dec['unread/' + u + '/' + target] || 0) - 1; });
      } else if (!m.readAt) {
        dec['unread/' + target + '/' + myId] = (dec['unread/' + target + '/' + myId] || 0) - 1;
      }
    });
    Object.keys(dec).forEach(pth => { updates[pth] = increment(dec[pth]); });
  }
  currentMsgsAll.forEach(m => {

    if (!keySet.has(m.key) && m.replyTo && keySet.has(m.replyTo.key)) {

      updates[base + '/' + m.key + '/replyTo'] = { key: m.replyTo.key, from: m.replyTo.from || '', type: 'deleted', deleted: true };

    }

  });

  exitSelectionMode();

  try {

    await update(ref(db), updates);

    if (isGroupId(target) && groupsCache[target] && groupsCache[target].last && keySet.has(groupsCache[target].last.key)) {

      try { await fixGroupLast(target); } catch (e) {}

    }

    showToast(keys.length > 1 ? keys.length + ' pesan dihapus permanen' : 'Pesan dihapus permanen');

  } catch (err) {

    showToast('Gagal menghapus dari server: ' + err.message);

  }

});



$('deleteModal').addEventListener('click', (e) => {

  if (e.target === $('deleteModal')) hideDeleteModal();

});



/* ============= VN PLAYER ============= */

const VN_PLAY_ICO = '<svg class="ico-play" viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 4.9v14.2a1.1 1.1 0 0 0 1.68.93l11.4-7.1a1.1 1.1 0 0 0 0-1.86L8.18 3.97A1.1 1.1 0 0 0 6.5 4.9z"/></svg>';

const VN_PAUSE_ICO = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5.5" y="4" width="4.6" height="16" rx="1.4"/><rect x="13.9" y="4" width="4.6" height="16" rx="1.4"/></svg>';

const VN_MIC_ICO = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>';

function vnDataToBlobUrl(d) {

  try {

    if (!d || d.slice(0, 5) !== 'data:') return null;

    const i = d.indexOf(',');

    const meta = d.slice(5, i);

    if (meta.indexOf(';base64') === -1) return null;

    const mime = (meta.split(';')[0] || 'audio/webm');

    const bin = atob(d.slice(i + 1));

    const u8 = new Uint8Array(bin.length);

    for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);

    return URL.createObjectURL(new Blob([u8], { type: mime }));

  } catch (e) { return null; }

}

const fmtElapsed = sec => {

  sec = Math.max(0, Math.floor(sec + 0.0001));

  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');

};



/* ---- gelombang suara: garis pendek-panjang seperti WhatsApp ---- */

const VN_BARS = 32;

const VN_BAR_MIN = 3, VN_BAR_MAX = 28;

const vnPeaksCache = new Map();

let vnIO = null;

const vnQueue = [];

let vnBusy = false;

function vnSeedPeaks(seed, n) {

  let h = 2166136261;

  const str = String(seed);

  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }

  const out = [];

  let prev = 0.5;

  for (let i = 0; i < n; i++) {

    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;

    const r = ((h >>> 0) % 1000) / 1000;

    let v = 0.12 + 0.88 * r;

    v = v * 0.72 + prev * 0.28;

    prev = v;

    out.push(v);

  }

  return out;

}

function vnBarH(p) { return (VN_BAR_MIN + Math.max(0, Math.min(1, p)) * (VN_BAR_MAX - VN_BAR_MIN)).toFixed(1) + 'px'; }

function vnDataToU8(d) {

  try {

    if (!d || d.slice(0, 5) !== 'data:') return null;

    const i = d.indexOf(',');

    if (d.slice(5, i).indexOf(';base64') === -1) return null;

    const bin = atob(d.slice(i + 1));

    const u8 = new Uint8Array(bin.length);

    for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);

    return u8;

  } catch (e) { return null; }

}

/* baca puncak suara asli dari rekaman agar garisnya mengikuti suara */

async function vnDecode(data) {

  const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;

  if (!Ctx) return null;

  const u8 = vnDataToU8(data);

  if (!u8) return null;

  const ctx = new Ctx(1, 1, 44100);

  const buf = await new Promise((res, rej) => {

    const pr = ctx.decodeAudioData(u8.buffer, res, rej);

    if (pr && pr.catch) pr.catch(rej);

  });

  const ch = buf.getChannelData(0);

  const n = VN_BARS, seg = Math.max(1, Math.floor(ch.length / n));

  const stride = Math.max(1, Math.floor(seg / 400));

  const raw = [];

  let max = 0;

  for (let i = 0; i < n; i++) {

    let sum = 0, c = 0;

    const from = i * seg, to = Math.min(ch.length, from + seg);

    for (let j = from; j < to; j += stride) { sum += Math.abs(ch[j]); c++; }

    const v = c ? sum / c : 0;

    raw.push(v);

    if (v > max) max = v;

  }

  const peaks = max > 0 ? raw.map(v => Math.max(0.1, Math.pow(v / max, 0.7))) : null;

  return { peaks, duration: buf.duration };

}

async function vnPump() {

  vnBusy = true;

  while (vnQueue.length) {

    const job = vnQueue.shift();

    try { const r = await vnDecode(job.data); if (r) job.done(r); } catch (e) {}

    await new Promise(r => setTimeout(r, 30));

  }

  vnBusy = false;

}

function vnEnqueue(job) { vnQueue.push(job); if (!vnBusy) vnPump(); }

function vnResetObserver() {

  if (vnIO) { try { vnIO.disconnect(); } catch (e) {} vnIO = null; }

  vnQueue.length = 0;

}

function vnWatch(el, job) {

  if (typeof IntersectionObserver === 'undefined') { vnEnqueue(job); return; }

  if (!vnIO) {

    vnIO = new IntersectionObserver(entries => {

      entries.forEach(en => {

        if (!en.isIntersecting) return;

        if (vnIO) vnIO.unobserve(en.target);

        const j = en.target.__vnJob;

        en.target.__vnJob = null;

        if (j) vnEnqueue(j);

      });

    }, { root: $('messages'), rootMargin: '300px' });

  }

  el.__vnJob = job;

  vnIO.observe(el);

}



function buildVNPlayer(m, isSent) {

  const wrap = document.createElement('div');

  wrap.className = 'vn-player' + (isSent ? ' sent-vn' : '');



  /* ---- kiri: foto + ikon mic (chip kecepatan menggantikan foto saat diputar) ---- */

  const avWrap = document.createElement('div');

  avWrap.className = 'vn-avatar-wrap';

  const avatar = document.createElement('div');

  avatar.className = 'vn-avatar';

  const authorId = isSent ? myId : m.from;

  renderAvatar(avatar, isSent ? myName : displayName(m.from), getPhotoFor(authorId));

  const mic = document.createElement('div');

  mic.className = 'vn-mic';

  mic.innerHTML = VN_MIC_ICO;

  const speedBtn = document.createElement('button');

  speedBtn.type = 'button';

  speedBtn.className = 'vn-speed';

  speedBtn.textContent = '1x';

  speedBtn.title = 'Kecepatan putar';

  avWrap.appendChild(avatar);

  avWrap.appendChild(mic);

  avWrap.appendChild(speedBtn);



  /* ---- kanan: [putar][titik + gelombang] lalu [durasi ........ jam] ---- */

  const main = document.createElement('div');

  main.className = 'vn-main';

  const row = document.createElement('div');

  row.className = 'vn-row';



  const playBtn = document.createElement('button');

  playBtn.className = 'vn-play';

  playBtn.type = 'button';

  playBtn.setAttribute('aria-label', 'Putar pesan suara');

  playBtn.innerHTML = VN_PLAY_ICO;



  /* gelombang suara (garis pendek-panjang): lapisan dasar + lapisan terisi saat diputar */

  const wave = document.createElement('div');

  wave.className = 'vn-wave';

  const baseLayer = document.createElement('div');

  baseLayer.className = 'vn-bars';

  const fillLayer = document.createElement('div');

  fillLayer.className = 'vn-bars fill';

  const peaks0 = vnPeaksCache.get(m.key) || vnSeedPeaks(m.key || m.ts || 'vn', VN_BARS);

  for (let i = 0; i < VN_BARS; i++) {

    const b1 = document.createElement('i'); b1.style.height = vnBarH(peaks0[i]); baseLayer.appendChild(b1);

    const b2 = document.createElement('i'); b2.style.height = vnBarH(peaks0[i]); fillLayer.appendChild(b2);

  }

  const knob = document.createElement('div');

  knob.className = 'vn-knob';

  wave.appendChild(baseLayer);

  wave.appendChild(fillLayer);

  wave.appendChild(knob);

  const setPeaks = (pk) => {

    const bs = baseLayer.children, fs = fillLayer.children;

    for (let i = 0; i < VN_BARS && i < pk.length; i++) { const h = vnBarH(pk[i]); bs[i].style.height = h; fs[i].style.height = h; }

  };

  row.appendChild(playBtn);

  row.appendChild(wave);



  const foot = document.createElement('div');

  foot.className = 'vn-foot';

  const timeWrap = document.createElement('div');

  timeWrap.className = 'vn-time-wrap';

  let dot = null;

  if (!isSent) { dot = document.createElement('span'); dot.className = 'vn-dot'; timeWrap.appendChild(dot); }

  const dur = document.createElement('span');

  dur.className = 'vn-time';

  dur.textContent = fmtDur(m.duration || 0);

  timeWrap.appendChild(dur);

  foot.appendChild(timeWrap);   // jam + centang ditambahkan ke sini oleh buildMsgWrap



  main.appendChild(row);

  main.appendChild(foot);



  const audio = document.createElement('audio');

  audio.preload = 'none';



  wrap.appendChild(avWrap);

  wrap.appendChild(main);

  wrap.appendChild(audio);



  let duration = m.duration || 0;

  if (!vnPeaksCache.has(m.key) && m.data) {

    vnWatch(wave, { data: m.data, done: (r) => {

      if (r.peaks) { vnPeaksCache.set(m.key, r.peaks); setPeaks(r.peaks); }

      if (!m.duration && r.duration && isFinite(r.duration)) {

        duration = r.duration;

        if (audio.paused && !audio.currentTime) dur.textContent = fmtDur(duration);

      }

    } });

  }

  const blocked = () => selectedKeys.size > 0 || Date.now() < suppressClickUntil;



  /* ---- sumber audio: data-URI besar → Blob URL (lebih lancar, tidak putus-putus) ---- */

  let srcReady = false;

  const ensureSrc = () => {

    if (srcReady) return;

    srcReady = true;

    audio.src = vnDataToBlobUrl(m.data) || m.data;

  };

  if (!duration) { audio.preload = 'metadata'; ensureSrc(); }



  const setPlaying = (on) => {

    playBtn.innerHTML = on ? VN_PAUSE_ICO : VN_PLAY_ICO;

    wrap.classList.toggle('playing', on);

  };



  /* ---- gerakan: waktu yang ditampilkan TIDAK PERNAH mundur (anti maju-mundur) ---- */

  let waveW = 0;

  const measure = () => { waveW = wave.clientWidth; };

  if (typeof ResizeObserver !== 'undefined') { try { new ResizeObserver(measure).observe(wave); } catch (e) {} }

  const paint = (f) => {

    f = Math.max(0, Math.min(1, f || 0));

    fillLayer.style.clipPath = 'inset(0 ' + ((1 - f) * 100).toFixed(2) + '% 0 0)';

    knob.style.left = (f * 100).toFixed(2) + '%';

  };

  let lastShownSec = -1;

  const showTime = (t) => {

    const sec = Math.floor(t + 0.0001);

    if (sec === lastShownSec) return;

    lastShownSec = sec;

    dur.textContent = fmtElapsed(t);

  };

  let raf = 0, shownT = 0, baseT = 0, baseNow = 0, lastCT = -1, dragging = false, dragT = 0;

  const resetClock = () => { lastCT = -1; };

  const tick = () => {

    raf = 0;

    if (audio.paused || audio.ended) return;

    if (!dragging && duration) {

      const ct = audio.currentTime, now = performance.now();

      if (ct !== lastCT) { lastCT = ct; baseT = ct; baseNow = now; }

      let est = baseT + ((now - baseNow) / 1000) * audio.playbackRate;

      est = Math.min(est, ct + 0.3, duration);

      if (est > shownT) shownT = est;            // hanya maju

      else if (shownT - ct > 0.6) shownT = ct;   // koreksi hanya bila selisih besar

      paint(shownT / duration);

      showTime(shownT);

    }

    raf = requestAnimationFrame(tick);

  };

  const startLoop = () => { if (!raf) raf = requestAnimationFrame(tick); };

  const stopLoop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };



  audio.addEventListener('loadedmetadata', () => {

    if (!m.duration && audio.duration === Infinity) {

      // webm hasil rekaman sering tanpa durasi → paksa browser menghitungnya

      const fix = () => { audio.removeEventListener('timeupdate', fix); audio.currentTime = 0; if (isFinite(audio.duration)) duration = audio.duration; };

      audio.addEventListener('timeupdate', fix);

      audio.currentTime = 1e101;

    } else if (audio.duration && isFinite(audio.duration) && !m.duration) {

      duration = audio.duration;

      if (audio.paused && !audio.currentTime) dur.textContent = fmtDur(duration);

    }

  });

  audio.addEventListener('play', () => {

    setPlaying(true);

    wrap.classList.add('active', 'played');

    if (dot) { dot.remove(); dot = null; }

    shownT = audio.currentTime || 0;

    resetClock(); startLoop();

  });

  audio.addEventListener('pause', () => {

    setPlaying(false); stopLoop();

    if (!dragging) { shownT = audio.currentTime || shownT; if (duration) paint(shownT / duration); showTime(shownT); }

  });

  audio.addEventListener('seeked', () => { if (!dragging) { shownT = audio.currentTime; resetClock(); } });

  audio.addEventListener('ended', () => {

    stopLoop(); setPlaying(false); resetClock();

    shownT = 0; lastShownSec = -1;

    paint(0);

    wrap.classList.remove('active');

    speedIdx = 0; audio.playbackRate = 1; speedBtn.textContent = '1x'; speedBtn.classList.remove('on');

    dur.textContent = fmtDur(m.duration || duration);

  });

  let triedData = false;

  audio.addEventListener('error', () => {

    const cur = audio.currentSrc || audio.src || '';

    if (!triedData && /^blob:/.test(cur) && m.data) {      // coba lagi langsung dari data aslinya

      triedData = true;

      audio.src = m.data;

      const pr = audio.play();

      if (pr && pr.catch) pr.catch(() => {});

      return;

    }

    showToast('Pesan suara tidak dapat diputar'); setPlaying(false); stopLoop();

  });



  playBtn.onclick = (e) => {

    if (blocked()) return;

    e.stopPropagation();

    if (audio.paused) {

      document.querySelectorAll('audio').forEach(a => { if (a !== audio) a.pause(); });

      ensureSrc();

      const pr = audio.play();

      if (pr && pr.catch) pr.catch(err => showToast('Tidak dapat memutar: ' + err.message));

    } else {

      audio.pause();

    }

  };



  const seekTo = (f) => {

    f = Math.max(0, Math.min(1, f));

    const d = duration || audio.duration;

    if (!d || !isFinite(d)) return;

    const t = f * d;

    const apply = () => { audio.currentTime = t; shownT = t; resetClock(); lastShownSec = -1; paint(f); showTime(t); };

    ensureSrc();

    if (audio.readyState >= 1) apply();

    else { audio.preload = 'metadata'; audio.addEventListener('loadedmetadata', apply, { once: true }); }

  };

  const fracFromX = (x) => { const r = wave.getBoundingClientRect(); return r.width ? Math.max(0, Math.min(1, (x - r.left) / r.width)) : 0; };

  wave.addEventListener('click', (e) => {

    if (blocked()) return;

    e.stopPropagation();

    seekTo(fracFromX(e.clientX));

  });

  let dragF = 0;

  const dragMove = (x) => {

    dragF = fracFromX(x);

    paint(dragF);

    const d = duration || audio.duration;

    if (d && isFinite(d)) showTime(dragF * d);

  };

  const dragEnd = () => { if (!dragging) return; dragging = false; seekTo(dragF); };

  knob.addEventListener('touchstart', (e) => {

    if (selectedKeys.size > 0) return;

    e.stopPropagation();

    dragging = true; dragF = fracFromX(e.touches[0].clientX);

  }, { passive: true });

  knob.addEventListener('touchmove', (e) => { if (dragging) dragMove(e.touches[0].clientX); }, { passive: true });

  knob.addEventListener('touchend', dragEnd);

  knob.addEventListener('touchcancel', () => { dragging = false; });

  knob.addEventListener('mousedown', (e) => {

    if (selectedKeys.size > 0 || e.button !== 0) return;

    e.stopPropagation(); e.preventDefault();

    dragging = true; dragF = fracFromX(e.clientX);

    const mv = (ev) => dragMove(ev.clientX);

    const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); dragEnd(); };

    document.addEventListener('mousemove', mv);

    document.addEventListener('mouseup', up);

  });



  const SPEEDS = [1, 1.5, 2];

  let speedIdx = 0;

  speedBtn.onclick = (e) => {

    if (blocked()) return;

    e.stopPropagation();

    speedIdx = (speedIdx + 1) % SPEEDS.length;

    audio.playbackRate = SPEEDS[speedIdx];

    resetClock();

    speedBtn.textContent = SPEEDS[speedIdx] + 'x';

    speedBtn.classList.toggle('on', speedIdx !== 0);

  };



  return wrap;

}



window.viewImage = (src) => {

  if (selectedKeys.size > 0) return;

  $('imgViewerSrc').src = src;

  $('imgViewer').style.display = 'flex';

};

$('imgViewer').addEventListener('click', () => $('imgViewer').style.display = 'none');



/* ============= FOTO SEKALI LIHAT ============= */
const VO_KEY = 'chat_vo_seen';
let voSeenMap = {};
try { voSeenMap = JSON.parse(localStorage.getItem(VO_KEY) || '{}'); } catch (e) { voSeenMap = {}; }
function voSeen(key) { return !!(key && voSeenMap[key]); }
function voMark(key) { voSeenMap[key] = 1; try { localStorage.setItem(VO_KEY, JSON.stringify(voSeenMap)); } catch (e) {} }
let pendingViewOnce = false;
function voBase() { return isGroupId(currentChat) ? 'groupChats/' + currentChat : 'chats/' + convId(myId, currentChat); }
function buildViewOnce(m, isSent) {
  const wrap = document.createElement('div');
  const icon = n => '<div class="vo-ico">' + n + '</div>';
  const grp = isGroupId(currentChat);
  const others = grp && groupsCache[currentChat] && groupsCache[currentChat].members ? Object.keys(groupsCache[currentChat].members).filter(u => u !== m.from) : [];
  const viewedN = m.viewedBy ? Object.keys(m.viewedBy).length : 0;
  const gone = !m.data;
  if (isSent) {
    const opened = grp ? viewedN > 0 : (!!m.viewedAt || gone);
    wrap.className = 'vo-bubble used';
    wrap.innerHTML = icon('1') + '<div class="vo-txt"><b>Foto sekali lihat</b><span>' + (opened ? (grp ? 'Dibuka oleh ' + viewedN + ' dari ' + others.length : 'Dibuka') : 'Terkirim, belum dibuka') + '</span></div>';
    return wrap;
  }
  const used = gone || voSeen(m.key) || !!m.viewedAt || !!(m.viewedBy && m.viewedBy[myId]);
  if (used) {
    wrap.className = 'vo-bubble used';
    wrap.innerHTML = icon('✓') + '<div class="vo-txt"><b>Foto sekali lihat</b><span>Sudah dibuka</span></div>';
    return wrap;
  }
  wrap.className = 'vo-bubble';
  wrap.innerHTML = icon('1') + '<div class="vo-txt"><b>Foto sekali lihat</b><span>Ketuk untuk membuka</span></div>';
  wrap.onclick = (e) => {
    if (selectedKeys.size > 0 || Date.now() < suppressClickUntil) return;
    e.stopPropagation();
    openViewOnce(m);
  };
  return wrap;
}
let voCurrent = null;
function openViewOnce(m) {
  if (!m || !m.data || voSeen(m.key)) { showToast('Foto ini sudah dibuka'); return; }
  voCurrent = { key: m.key, base: voBase(), grp: isGroupId(currentChat), gid: currentChat, from: m.from };
  const c = voCurrent;
  const img = $('voImg');
  img.onload = () => { consumeViewOnce(c); };
  img.src = m.data;
  $('voViewer').style.display = 'flex';
}
async function consumeViewOnce(c) {
  if (!c || c.done) return;
  c.done = true;
  voMark(c.key);   /* kunci lokal dulu: tidak bisa dibuka lagi di perangkat ini walau database gagal */
  try {
    const up = {};
    if (!c.grp) {
      up[c.base + '/' + c.key + '/data'] = null;
      up[c.base + '/' + c.key + '/viewedAt'] = Date.now();
    } else {
      up[c.base + '/' + c.key + '/viewedBy/' + myId] = Date.now();
      const mem = groupsCache[c.gid] && groupsCache[c.gid].members ? Object.keys(groupsCache[c.gid].members).filter(u => u !== c.from) : [];
      const vb = (await get(ref(db, c.base + '/' + c.key + '/viewedBy'))).val() || {};
      vb[myId] = 1;
      if (mem.length && mem.every(u => vb[u])) up[c.base + '/' + c.key + '/data'] = null;   /* semua penerima sudah lihat: hapus fotonya */
    }
    await update(ref(db), up);
  } catch (e) { console.warn('Tandai sekali-lihat gagal:', e); }
}
function closeViewOnce() {
  $('voViewer').style.display = 'none';
  $('voImg').removeAttribute('src');
  voCurrent = null;
  try { rerenderCurrent(); } catch (e) {}
}
$('voClose').addEventListener('click', closeViewOnce);
$('voViewer').addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && $('voViewer').style.display === 'flex') closeViewOnce(); });
window.addEventListener('blur', () => { if ($('voViewer').style.display === 'flex') closeViewOnce(); });
function pickPhoto(once) { pendingViewOnce = !!once; $('voChooser').classList.remove('show'); $('fileInput').click(); }
$('voOptNormal').addEventListener('click', () => pickPhoto(false));
$('voOptOnce').addEventListener('click', () => pickPhoto(true));
$('voOptCancel').addEventListener('click', () => $('voChooser').classList.remove('show'));
$('voChooser').addEventListener('click', e => { if (e.target === $('voChooser')) $('voChooser').classList.remove('show'); });

/* ============= SEND ============= */

async function sendGroupMessage(payload) {

  const gid = currentChat;

  const g = groupsCache[gid];

  if (!g || !g.members || !g.members[myId]) { showToast('Anda bukan anggota grup ini'); return false; }

  try {

    const msg = { from: myId, ts: Date.now(), ...payload };

    if (replyTo) {

      msg.replyTo = {

        key: replyTo.key,

        from: replyTo.from,

        text: replyTo.text || '',

        type: replyTo.type || 'text',

        deleted: !!replyTo.deleted

      };

      clearReply();

    }

    const key = push(ref(db, 'groupChats/' + gid)).key;

    const last = { key, from: myId, ts: msg.ts, type: msg.type || 'text', text: msg.type === 'text' ? String(msg.text || '').slice(0, 80) : '', viewOnce: !!msg.viewOnce };

    const updates = {};

    updates['groupChats/' + gid + '/' + key] = msg;

    updates['groups/' + gid + '/last'] = last;
    Object.keys(g.members).forEach(u => { if (u !== myId) updates['unread/' + u + '/' + gid] = increment(1); });
        await update(ref(db), updates);
    return true;
  } catch (err) { showToast('Gagal mengirim: ' + err.message); return false; }
}
async function sendMessage(payload) {

  stickBottomOnce = true;

  if (!currentChat) { showToast('Silakan pilih kontak terlebih dahulu'); return false; }

  if (isGroupId(currentChat)) return sendGroupMessage(payload);

  if (blockedCache[currentChat]) { showToast('Buka blokir kontak untuk mengirim pesan'); return false; }

  if (blockedByOther) { showToast('Anda diblokir oleh kontak ini'); return false; }

  const to = currentChat;
  const id = convId(myId, currentChat);
  try {
    const msg = { from: myId, ts: Date.now(), ...payload };

    if (replyTo) {

      msg.replyTo = {

        key: replyTo.key,

        from: replyTo.from,

        text: replyTo.text,

        type: replyTo.type,

        deleted: replyTo.deleted

      };

      clearReply();

    }

    const mkey = push(ref(db, 'chats/' + id)).key;
    const ups = {};
    ups['chats/' + id + '/' + mkey] = msg;
    ups['unread/' + to + '/' + myId] = increment(1);
    await update(ref(db), ups);
    return true;

  } catch (err) { showToast('Gagal mengirim: ' + err.message); return false; }

}



/* ============= INPUT ============= */

const msgInput = $('msgInput');

const inputField = $('inputField');



function getInputText() {

  return (msgInput.innerText || msgInput.textContent || '').replace(/\u00a0/g, ' ').trim();

}

function clearInput() {

  msgInput.innerHTML = '';

  msgInput.style.height = 'auto';

  msgInput.style.height = '24px';

  updateActionButton();

}

function autoResize() {

  msgInput.style.height = 'auto';

  const h = Math.min(msgInput.scrollHeight, 120);

  msgInput.style.height = Math.max(h, 24) + 'px';

}



msgInput.addEventListener('input', () => { autoResize(); updateActionButton(); });

$('sendBtn').addEventListener('mousedown', (e) => e.preventDefault());

msgInput.addEventListener('focus', () => {

  inputField.classList.add('focused');

  autoResize();

});

msgInput.addEventListener('blur', () => {

  inputField.classList.remove('focused');

});

msgInput.addEventListener('keydown', (e) => {

  if (e.key === 'Enter' && !e.shiftKey) {

    e.preventDefault();

    $('sendBtn').click();

  }

});

msgInput.addEventListener('paste', (e) => {

  e.preventDefault();

  const text = (e.clipboardData || window.clipboardData).getData('text');

  document.execCommand('insertText', false, text);

});



$('sendBtn').addEventListener('click', async (e) => {

  e.preventDefault();

  if (isRecording) return;

  const text = getInputText();

  if (!text) return;

  clearInput();

  await sendMessage({ type: 'text', text });

});



$('attachBtn').addEventListener('click', () => {

  if (currentChat && blockedCache[currentChat]) { showToast('Buka blokir kontak untuk mengirim pesan'); return; }

  $('voChooser').classList.add('show');
});
async function compressImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = url; });
    let max = 1280, q = 0.72, out = '';
    for (let n = 0; n < 6; n++) {
      const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * r); c.height = Math.round(img.naturalHeight * r);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      out = c.toDataURL('image/jpeg', q);
      if (out.length < 170000) break;
      max = Math.round(max * 0.8); q = Math.max(0.5, q - 0.05);
    }
    return out;
  } finally { URL.revokeObjectURL(url); }
}
$('fileInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) { showToast('Ukuran gambar maksimal 20 MB'); return; }
  showToast('Mengirim foto...');
  try {
    const data = await compressImage(file);
    const vo = pendingViewOnce; pendingViewOnce = false;
    const pl = vo ? { type: 'image', data, viewOnce: true } : { type: 'image', data };
    let ok = await sendMessage(pl);
    if (!ok) ok = await sendMessage(pl);
    if (ok) showToast(vo ? 'Foto sekali lihat terkirim' : 'Foto berhasil dikirim');
  } catch (err) { showToast('Gambar tidak bisa diproses'); }
});

function buildRecWave() {

  const wave = $('recWave');

  wave.innerHTML = '';

  for (let i = 0; i < 26; i++) {

    const bar = document.createElement('div');

    bar.className = 'rec-bar';

    bar.style.animationDelay = (i * 0.05) + 's';

    wave.appendChild(bar);

  }

}

buildRecWave();



$('micBtn').addEventListener('click', async () => {

  if (!currentChat) { showToast('Silakan pilih kontak terlebih dahulu'); return; }

  if (blockedCache[currentChat]) { showToast('Buka blokir kontak untuk mengirim pesan'); return; }

  if (!isRecording) await startRecording();

});



$('cancelRecBtn').addEventListener('click', () => {

  cancelRecording = true;

  stopRecording(false);

});

$('sendRecBtn').addEventListener('click', () => {

  cancelRecording = false;

  stopRecording(true);

});



async function startRecording() {

  try {

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    let mimeType = 'audio/webm';

    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';

    mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

    audioChunks = [];

    cancelRecording = false;

    mediaRecorder.ondataavailable = e => {

      if (e.data && e.data.size > 0) audioChunks.push(e.data);

    };

    mediaRecorder.onstop = async () => {

      stream.getTracks().forEach(t => t.stop());

      if (cancelRecording) { audioChunks = []; resetInputState(); return; }

      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });

      if (blob.size < 200) { showToast('Durasi rekaman terlalu singkat'); resetInputState(); return; }

      if (blob.size > 600 * 1024) { showToast('Ukuran rekaman terlalu besar. Silakan rekam dengan durasi lebih singkat'); resetInputState(); return; }

      const reader = new FileReader();

      reader.onload = async ev => {

        const ok = await sendMessage({ type: 'audio', data: ev.target.result, duration: recSeconds });

        if (ok) showToast('Pesan suara berhasil dikirim');

        resetInputState();

      };

      reader.readAsDataURL(blob);

    };

    mediaRecorder.start();

    isRecording = true;

    recSeconds = 0;

    $('recTime').textContent = '0:00';

    $('inputField').style.display = 'none';

    $('attachBtn').style.display = 'none';

    $('recordingState').classList.add('show');

    updateActionButton();

    recInterval = setInterval(() => {

      recSeconds++;

      $('recTime').textContent = fmtDur(recSeconds);

      if (recSeconds >= 60) { cancelRecording = false; stopRecording(true); }

    }, 1000);

  } catch (err) {

    showToast('Tidak dapat mengakses mikrofon. Periksa izin aplikasi');

    resetInputState();

  }

}

function stopRecording(send) {

  if (!isRecording) return;

  isRecording = false;

  clearInterval(recInterval);

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {

    if (!send) { cancelRecording = true; audioChunks = []; }

    mediaRecorder.stop();

  }

}



/* ============= LINK: BAGIKAN, UNDANG GRUP, TAMBAH KONTAK ============= */

const APP_NAME = (document.title || 'Chat App');

const ICO_G = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

const ICO_U = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>';

const baseUrl = () => location.href.split('#')[0].replace(/index\.html$/, '');

const groupLink = code => baseUrl() + '#join=' + code;

const contactLink = id => baseUrl() + '#add=' + dispId(id);

function genInviteCode() {

  const a = new Uint8Array(10);

  crypto.getRandomValues(a);

  return Array.from(a, b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');

}

async function copyText(t) {

  try { await navigator.clipboard.writeText(t); return true; }

  catch (e) {

    try {

      const ta = document.createElement('textarea');

      ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';

      document.body.appendChild(ta); ta.select();

      const ok = document.execCommand('copy'); ta.remove(); return ok;

    } catch (e2) { return false; }

  }

}



/* --- modal bagikan --- */

let shareData = null;

function openShare(d) {

  shareData = d;

  $('shareTitle').textContent = d.title;

  $('shareSub').textContent = d.sub || '';

  $('shareLinkText').textContent = d.link;

  const av = $('shareAvatar');

  if (d.kind === 'group') renderGroupAvatar(av); else renderAvatar(av, d.name || '?', d.photo || '');

  $('shareName').textContent = d.name || '';

  $('shareMeta').textContent = d.meta || '';

  $('shareNote').textContent = d.note || '';

  $('shareNative').style.display = navigator.share ? 'flex' : 'none';

  $('shareModal').classList.add('show');

}

function closeShare() { $('shareModal').classList.remove('show'); }

async function doCopyShare() {

  if (!shareData) return;

  showToast((await copyText(shareData.link)) ? 'Tautan berhasil disalin' : 'Gagal menyalin. Silakan salin secara manual');

}

$('shareCopy').addEventListener('click', doCopyShare);

$('shareLinkBox').addEventListener('click', doCopyShare);

$('shareNative').addEventListener('click', async () => {

  if (!shareData) return;

  try { await navigator.share({ title: (shareData.name ? shareData.name + ' di ' + APP_NAME : shareData.title), text: shareData.text, url: shareData.link }); } catch (e) {}

});

$('shareWa').addEventListener('click', () => {

  if (!shareData) return;

  window.open('https://wa.me/?text=' + encodeURIComponent((shareData.wa || shareData.text) + '\n\n' + shareData.link), '_blank', 'noopener');

});

$('shareClose').addEventListener('click', closeShare);

$('shareDone').addEventListener('click', closeShare);

$('shareModal').addEventListener('click', (e) => { if (e.target === $('shareModal')) closeShare(); });



$('shareMyContact').addEventListener('click', () => {

  openShare({ kind: 'user', title: 'Bagikan Kontak Saya', sub: 'Undang teman lewat satu link',

    name: myName, photo: getPhotoFor(myId), meta: 'ID ' + myId,

    note: 'Siapa pun yang membuka link ini dapat menambahkan Anda sebagai kontak.',

    link: contactLink(myId),

    text: 'Halo! Saya ' + myName + '. Yuk mengobrol di ' + APP_NAME + '.\n\nTambahkan saya sebagai kontak lewat link berikut:',

    wa: 'Halo! Saya *' + myName + '*. Yuk mengobrol di *' + APP_NAME + '*.\n\nTambahkan saya sebagai kontak lewat link berikut:' });

});

$('menuShareContact').addEventListener('click', () => {

  $('chatMenu').classList.remove('show');

  const id = currentMenuChatId;

  if (!id || isGroupId(id)) return;

  const nm = displayName(id);

  openShare({ kind: 'user', title: 'Bagikan kontak', sub: 'Kirim kontak ini kepada teman Anda',

    name: nm, photo: getPhotoFor(id), meta: 'ID ' + id,

    note: 'Siapa pun yang membuka link ini dapat menambahkan kontak ini.',

    link: contactLink(id),

    text: 'Berikut kontak ' + nm + ' di ' + APP_NAME + '.\n\nTambahkan lewat link berikut:',

    wa: 'Berikut kontak *' + nm + '* di *' + APP_NAME + '*.\n\nTambahkan lewat link berikut:' });

});



/* --- link undangan grup (khusus pembuat) --- */

function shareGroupLink(gid) {

  const g = groupsCache[gid];

  if (!g || !g.invite) return;

  const cnt = Object.keys(g.members || {}).length;

  openShare({ kind: 'group', title: 'Link undangan grup', sub: 'Ajak teman bergabung ke grup',

    name: g.name || 'Grup', meta: cnt + ' anggota',

    note: 'Siapa pun yang memiliki link ini dapat bergabung ke grup.',

    link: groupLink(g.invite),

    text: 'Anda diundang bergabung ke grup "' + (g.name || 'Grup') + '" di ' + APP_NAME + '.\n\nBergabung melalui tautan berikut:',

    wa: 'Anda diundang bergabung ke grup *' + (g.name || 'Grup') + '* di *' + APP_NAME + '*.\n\nBergabung melalui tautan berikut:' });

}

async function makeInvite(gid) {

  const g = groupsCache[gid];

  if (!g || g.createdBy !== myId) { showToast('Hanya pembuat grup yang dapat mengatur tautan'); return; }

  const code = genInviteCode();

  const updates = {};

  updates['invites/' + code] = gid;

  updates['groups/' + gid + '/invite'] = code;

  if (g.invite) updates['invites/' + g.invite] = null;

  await update(ref(db), updates);

}

async function revokeInvite(gid) {

  const g = groupsCache[gid];

  if (!g || g.createdBy !== myId || !g.invite) return;

  const updates = {};

  updates['invites/' + g.invite] = null;

  updates['groups/' + gid + '/invite'] = null;

  await update(ref(db), updates);

}

function renderInviteSection(gid, g) {

  const box = $('giInviteBody');

  if (!g.invite) {

    box.innerHTML = '<button class="gi-inv-create" id="giInvCreate" type="button">Buat link undangan</button>';

    $('giInvCreate').onclick = async () => {

      $('giInvCreate').disabled = true;

      try { await makeInvite(gid); showToast('Tautan undangan berhasil dibuat'); } catch (err) { showToast('Gagal: ' + err.message); }

    };

    return;

  }

  box.innerHTML = '<div class="gi-inv-link">' + esc(groupLink(g.invite)) + '</div>' +

    '<div class="gi-inv-row"><button class="main" id="giInvShare" type="button">Bagikan</button>' +

    '<button id="giInvCopy" type="button">Salin</button><button id="giInvReset" type="button">Atur ulang</button></div>' +

    '<button class="gi-inv-off" id="giInvOff" type="button">Matikan link</button>';

  $('giInvShare').onclick = () => shareGroupLink(gid);

  $('giInvCopy').onclick = async () => showToast((await copyText(groupLink(g.invite))) ? 'Tautan berhasil disalin' : 'Gagal menyalin tautan');

  $('giInvReset').onclick = async () => {

    const ok = await confirmDialog({ title: 'Atur ulang tautan?', message: 'Tautan lama tidak akan berlaku lagi dan akan diganti dengan tautan baru.', okText: 'Atur Ulang', icon: 'logout', danger: false });

    if (!ok) return;

    try { await makeInvite(gid); showToast('Tautan baru berhasil dibuat'); } catch (err) { showToast('Gagal: ' + err.message); }

  };

  $('giInvOff').onclick = async () => {

    const ok = await confirmDialog({ title: 'Nonaktifkan tautan undangan?', message: 'Tautan ini tidak dapat lagi digunakan untuk bergabung. Anda dapat membuat tautan baru kapan saja.', okText: 'Nonaktifkan', icon: 'trash' });

    if (!ok) return;

    try { await revokeInvite(gid); showToast('Tautan undangan dinonaktifkan'); } catch (err) { showToast('Gagal: ' + err.message); }

  };

}



/* --- dialog konfirmasi saat membuka link --- */

let deepOnOk = null;

function closeDeep() { $('deepModal').classList.remove('show'); deepOnOk = null; }

function showDeep(cfg) {

  $('deepIco').innerHTML = cfg.kind === 'group' ? ICO_G : ICO_U;

  $('deepTitle').textContent = cfg.title;

  $('deepSub').textContent = cfg.sub || '';

  const av = $('deepAvatar');

  if (cfg.kind === 'group') renderGroupAvatar(av); else renderAvatar(av, cfg.name, cfg.photo || '');

  $('deepName').textContent = cfg.name;

  $('deepMeta').textContent = cfg.meta || '';

  $('deepAliasWrap').style.display = cfg.kind === 'user' ? 'block' : 'none';

  $('deepAlias').value = cfg.alias || '';

  $('deepOk').textContent = cfg.okText;

  deepOnOk = cfg.onOk;

  $('deepModal').classList.add('show');

}

$('deepOk').addEventListener('click', async () => {

  if (!deepOnOk) return;

  const needAlias = $('deepAliasWrap').style.display !== 'none';

  const alias = $('deepAlias').value.trim();

  if (needAlias && !alias) { showToast('Silakan masukkan nama kontak'); return; }

  const btn = $('deepOk'), label = btn.textContent;

  btn.disabled = true; btn.textContent = 'Memproses...';

  try { await deepOnOk(alias); } catch (err) { showToast('Gagal: ' + err.message); }

  finally { btn.disabled = false; btn.textContent = label; }

});

$('deepCancel').addEventListener('click', closeDeep);

$('deepClose').addEventListener('click', closeDeep);

$('deepModal').addEventListener('click', (e) => { if (e.target === $('deepModal')) closeDeep(); });



async function openJoinPreview(code) {

  try {

    const cs = await get(ref(db, 'invites/' + code));

    if (!cs.exists()) { showToast('Tautan undangan tidak valid atau telah dinonaktifkan'); return; }

    const gid = String(cs.val());

    const gs = await get(ref(db, 'groups/' + gid));

    if (!gs.exists()) { showToast('Grup tidak lagi tersedia'); return; }

    const g = gs.val() || {};

    if (g.invite !== code) { showToast('Tautan undangan ini sudah tidak berlaku'); return; }

    if (g.members && g.members[myId]) {

      showToast('Anda sudah menjadi anggota grup ini');

      groupsCache[gid] = groupsCache[gid] || g;

      switchPane('paneChats'); openChat(gid);

      return;

    }

    let creator = displayName(g.createdBy);

    try { const us = await get(ref(db, 'users/' + g.createdBy)); if (us.exists() && us.val().name) creator = us.val().name; } catch (e) {}

    const count = Object.keys(g.members || {}).length;

    showDeep({ kind: 'group', title: 'Undangan Grup', sub: 'Anda diundang bergabung melalui tautan', name: g.name || 'Grup',

      meta: count + ' anggota · dibuat oleh ' + creator, okText: 'Gabung',

      onOk: async () => {

        await update(ref(db, 'groups/' + gid), { ['members/' + myId]: true, ['joined/' + myId]: Date.now() });

        groupsCache[gid] = Object.assign({}, g, { members: Object.assign({}, g.members || {}, { [myId]: true }) });

        closeDeep(); switchPane('paneChats'); renderChatList(); openChat(gid);

        showToast('Anda telah bergabung ke "' + (g.name || 'Grup') + '"');

      } });

  } catch (err) { showToast('Gagal membuka tautan: ' + err.message); }

}

async function openAddPreview(id) {
  id = await resolveUserId(id);
  try {

    if (id === myId) { showToast('Ini adalah tautan kontak Anda sendiri'); return; }

    const us = await get(ref(db, 'users/' + id));

    if (!us.exists()) { showToast('Pengguna tidak ditemukan'); return; }

    const u = us.val() || {};

    usersCache[id] = Object.assign({}, usersCache[id] || {}, u);

    const cs = await get(ref(db, 'contacts/' + myId + '/' + id));

    if (cs.exists()) {

      contactsCache[id] = cs.val();

      showToast('Kontak ini sudah ada di daftar Anda');

      switchPane('paneChats'); openChat(id);

      return;

    }

    showDeep({ kind: 'user', title: 'Tambah kontak', sub: 'Kontak ini dibagikan lewat link', name: u.name || dispId(id), photo: u.photo || '',

      meta: 'ID ' + id, alias: u.name || '', okText: 'Tambah',

      onOk: async (alias) => {

        await set(ref(db, 'contacts/' + myId + '/' + id), alias);

        try {

          const back = await get(ref(db, 'contacts/' + id + '/' + myId));

          if (!back.exists()) await set(ref(db, 'contacts/' + id + '/' + myId), myName);

        } catch (e) {}

        contactsCache[id] = alias;

        if (deletedChats[id]) { delete deletedChats[id]; saveDeletedChats(); }

        renderContactList(); renderChatList();

        closeDeep(); switchPane('paneChats'); openChat(id);

        showToast('Kontak "' + alias + '" ditambahkan');

      } });

  } catch (err) { showToast('Gagal membuka tautan: ' + err.message); }

}

function parseDeepLink() {

  const h = location.hash || '';

  let m;

  if ((m = h.match(/^#join=([A-Za-z0-9]{6,40})$/))) return { type: 'join', code: m[1] };

  if ((m = h.match(/^#add=(\d{6,20})$/))) return { type: 'add', id: m[1] };

  return null;

}

function handleDeepLink() {

  if (!myId) return;

  const d = parseDeepLink();

  if (!d) return;

  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}

  if (d.type === 'join') openJoinPreview(d.code); else openAddPreview(d.id);

}

window.addEventListener('hashchange', () => { if (myId && $('app').style.display === 'block') handleDeepLink(); });







$('copyIdBtn').addEventListener('click', async (e) => {

  e.stopPropagation();

  try {

    await navigator.clipboard.writeText(dispId(myId));
    showToast('ID berhasil disalin');
  } catch (err) { showToast('ID Anda: ' + dispId(myId)); }

});



$('settingsIdRow').addEventListener('click', () => $('copyIdBtn').click());



window.addEventListener('beforeunload', () => {

  if (myId) {

    try { update(ref(db, 'users/' + myId), { name: myName, online: false, lastSeen: Date.now() }); } catch(e){}

  }

});

setInterval(() => {

  if (myId) update(ref(db, 'users/' + myId), { name: myName, online: true, lastSeen: Date.now() }).catch(()=>{});

}, 30000);


$('clearGroupBtn').addEventListener('click', async () => {
  const gid = currentInfoGid, g = groupsCache[gid];
  if (!g || !isGroupMod(gid)) { showToast('Hanya admin dan pembuat grup yang dapat menghapus semua pesan'); return; }
  const ok = await confirmDialog({ title: 'Hapus semua pesan?', message: 'Seluruh pesan di grup "' + (g.name || 'grup') + '" akan dihapus permanen untuk semua anggota.', okText: 'Hapus semua' });
  if (!ok) return;
  const updates = {};
  updates['groupChats/' + gid] = null;
  updates['groups/' + gid + '/last'] = null;
  Object.keys(g.members || {}).forEach(u => { updates['unread/' + u + '/' + gid] = null; });
  try {
    await update(ref(db), updates);
    msgCache['group_' + gid] = [];
    if (currentChat === gid) { currentMsgsAll = []; rerenderCurrent(); }
    showToast('Semua pesan grup dihapus');
  } catch (err) { showToast('Gagal menghapus: ' + err.message); }
});

/* ============= TOMBOL BACK (HP / browser) =============
   Back menutup layer paling atas dulu: viewer, popup, menu, chat, arsip, lalu kembali ke tab Chat.
   Baru di tab Chat (paling dasar) back dua kali untuk keluar. */
(function setupBackNav() {
  const open = id => { const el = $(id); return !!el && el.classList.contains('show'); };
  const shown = id => { const el = $(id); return !!el && el.style.display === 'flex'; };
  const hide = id => { const el = $(id); if (el) el.classList.remove('show'); };
  const OVERLAY_CLOSERS = {
    deleteAccountModal: () => closeDeleteAccount(),
    addContactModal: () => closeAddContactModal(),
    editNameModal: () => closeEditNameModal(),
    editContactModal: () => closeEditContact(),
    groupModal: () => closeGroupModal(),
    groupInfoModal: () => closeGroupInfo(),
    shareModal: () => closeShare()
  };
  /* Menutup satu layer teratas. Mengembalikan true kalau ada yang ditutup. */
  function closeTopLayer() {
    if (shown('voViewer')) { closeViewOnce(); return true; }
    if (shown('imgViewer')) { $('imgViewer').style.display = 'none'; return true; }
    const yAdm = $('ytAdmin');
    if (yAdm && yAdm.classList.contains('open')) { yAdm.classList.remove('open'); return true; }
    const yPl = $('ytPlayer');
    if (yPl && yPl.classList.contains('open')) { const x = $('ytClose'); if (x) x.click(); else yPl.classList.remove('open'); return true; }
    if (open('confirmModal')) { closeConfirm(false); return true; }
    if (open('deleteModal')) { hideDeleteModal(); return true; }
    if (open('deepModal')) { closeDeep(); return true; }
    if (open('notifSheet')) { closeNotifSheet(false); return true; }
    if (open('voChooser')) { hide('voChooser'); return true; }
    if (open('chatMenu')) { hide('chatMenu'); return true; }
    if (open('newMenu')) { hide('newMenu'); return true; }
    const ov = Array.from(document.querySelectorAll('.modal-overlay.show')).pop();
    if (ov) { const fn = OVERLAY_CLOSERS[ov.id]; if (fn) fn(); else ov.classList.remove('show'); return true; }
    if (open('archMore')) { hide('archMore'); return true; }
    if (selectedKeys.size > 0) { exitSelectionMode(); return true; }
    if ($('chatView').classList.contains('active')) { $('backBtn').click(); return true; }
    if ($('archivedView').classList.contains('active')) { closeArchivedView(); return true; }
    const pane = document.querySelector('.tab-pane.active');
    if (pane && pane.id !== 'paneChats' && $('app') && $('app').style.display !== 'none') { switchPane('paneChats'); return true; }
    return false;
  }
  /* Satu entri riwayat "penjaga" selalu ada di depan, jadi back ditangkap app dulu sebelum keluar. */
  function arm() { try { history.pushState({ obrolaGuard: 1 }, '', location.href); } catch (e) {} }
  let lastRootBack = 0;
  window.addEventListener('popstate', () => {
    let closed = false;
    try { closed = closeTopLayer(); } catch (e) { console.warn('Back:', e); }
    if (closed) { arm(); return; }
    const now = Date.now();
    if (now - lastRootBack < 2000) { lastRootBack = 0; history.back(); return; }
    lastRootBack = now;
    showToast('Tekan sekali lagi untuk keluar');
    arm();
  });
  arm();
})();

