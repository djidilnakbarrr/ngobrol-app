/* Cloud Functions: kirim push FCM tiap ada pesan baru (chat pribadi & grup).
   Notifikasi tetap sampai walau aplikasi ditutup / riwayat chat dihapus di HP. */
const { onValueCreated } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.database();

const REGION = 'asia-southeast1';
const INSTANCE = 'hrsof14-default-rtdb';
/* minInstances:1 = fungsi selalu "hangat", tidak ada cold start (inilah penyebab utama notifikasi telat).
   Kalau mau gratis/hemat, ubah jadi 0 — tapi notifikasi bisa telat beberapa detik. */
/* retry:true = bila pengiriman gagal sementara (jaringan/FCM sibuk), Firebase otomatis mencoba lagi sehingga tidak ada notifikasi yang hilang.
   Tag notifikasi = key pesan, jadi percobaan ulang tidak membuat notifikasi dobel. */
const opt = (ref) => ({ ref, instance: INSTANCE, region: REGION, minInstances: 1, memory: '256MiB', retry: true });

const one = (path) => db.ref(path).once('value');
/* ID berformat 08xxxxxxxxxx */
const disp = (id) => String(id);

function preview(m) {
  if (m.type === 'image') return 'Foto';
  if (m.type === 'audio') return 'Pesan suara';
  return String(m.text || '').slice(0, 120);
}

async function tokensOf(uid) {
  const v = (await one('fcmTokens/' + uid)).val() || {};
  return Object.entries(v)
    .map(([k, x]) => ({ k, token: x && x.token }))
    .filter((x) => x.token);
}

const TRANSIENT = new Set([
  'messaging/internal-error', 'messaging/server-unavailable', 'messaging/unavailable',
  'messaging/message-rate-exceeded', 'messaging/device-message-rate-exceeded', 'messaging/quota-exceeded',
]);

async function send(uid, tokens, data) {
  if (!tokens.length) return;
  const res = await admin.messaging().sendEachForMulticast({
    tokens: tokens.map((t) => t.token),
    data,
    android: { priority: 'high', ttl: 86400000 },
    apns: { headers: { 'apns-priority': '10' } },
    webpush: { headers: { Urgency: 'high', TTL: '86400' } },
  });
  const del = {};
  let transient = false;
  res.responses.forEach((r, i) => {
    if (r.success) return;
    const c = r.error && r.error.code;
    if (c === 'messaging/registration-token-not-registered' ||
        c === 'messaging/invalid-registration-token') {
      del['fcmTokens/' + uid + '/' + tokens[i].k] = null;
    } else if (TRANSIENT.has(c)) {
      transient = true;
    } else {
      console.error('FCM gagal', uid, c);
    }
  });
  if (Object.keys(del).length) await db.ref().update(del);
  /* lempar error agar Firebase mengulang pengiriman (hanya untuk kegagalan sementara) */
  if (transient) throw new Error('FCM gagal sementara, akan dicoba ulang');
}

exports.notifyDirect = onValueCreated(opt('/chats/{cid}/{key}'), async (event) => {
  const m = event.data.val();
  if (!m || m.deleted || !m.from) return;
  const from = String(m.from);
  const ids = event.params.cid.split('__');
  if (ids.length !== 2 || !ids.includes(from)) return;
  const to = ids.find((x) => x !== from);
  if (!to) return;
  const [blocked, alias, sender, tokens] = await Promise.all([
    one('blocked/' + to + '/' + from),
    one('contacts/' + to + '/' + from),
    one('users/' + from + '/name'),
    tokensOf(to),
  ]);
  if (blocked.exists() || !tokens.length) return;
  const title = (alias.val() && String(alias.val())) || sender.val() || disp(from);
  await send(to, tokens, {
    title: String(title), body: preview(m), chat: from,
    key: event.params.key, tag: event.params.key,
  });
});

exports.notifyGroup = onValueCreated(opt('/groupChats/{gid}/{key}'), async (event) => {
  const m = event.data.val();
  if (!m || m.deleted || !m.from) return;
  const gid = event.params.gid;
  const from = String(m.from);
  const [gSnap, nameSnap] = await Promise.all([one('groups/' + gid), one('users/' + from + '/name')]);
  const g = gSnap.val();
  if (!g || !g.members) return;
  const senderName = nameSnap.val() || disp(from);
  const recipients = Object.keys(g.members).filter((u) => u !== from);
  await Promise.all(recipients.map(async (uid) => {
    const [blocked, alias, tokens] = await Promise.all([
      one('blocked/' + uid + '/' + from),
      one('contacts/' + uid + '/' + from),
      tokensOf(uid),
    ]);
    if (blocked.exists() || !tokens.length) return;
    const who = (alias.val() && String(alias.val())) || senderName;
    await send(uid, tokens, {
      title: String(g.name || 'Grup'), body: who + ': ' + preview(m), chat: gid,
      key: event.params.key, tag: event.params.key,
    });
  }));
});
