/* Fitur Gemini AI: obrolan dengan Gemini. API key TIDAK disimpan di file ini.
   Admin mengatur kunci langsung dari aplikasi (ikon kunci di header Gemini); kunci disimpan di database
   Firebase pada config/gemini, sama seperti pengaturan YouTube. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';
  var MODELS = [
    { id: 'gemini-3.5-flash-lite', name: 'Flash Lite', sub: 'Hemat kuota' }
  ];
  var DEFAULT_MODEL = MODELS[0].id;
  var SYSTEM = 'Kamu adalah Gemini, asisten AI di dalam aplikasi obrolan Ngobrol. Jawab dengan bahasa yang dipakai pengguna (default Bahasa Indonesia), ramah, jelas, dan ringkas. Gunakan daftar atau blok kode hanya bila membantu. Pengguna bisa melampirkan foto dan file; isi file teks, ZIP, dan dokumen diberikan sebagai teks. Bila ada lampiran, jawab berdasarkan isinya.';
    var MAX_SEND = 24;      /* jumlah pesan terakhir yang dikirim sebagai konteks */

  var I = {
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 9h14M5 15h9"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 01-12.2 7.6L3.5 21l1.5-4.9A8.5 8.5 0 1121 12z"/></svg>',
    compose: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H6.5A2.5 2.5 0 004 6.5v11A2.5 2.5 0 006.5 20h11a2.5 2.5 0 002.5-2.5V13"/><path d="M18.4 3.6a1.9 1.9 0 112.7 2.7L12 15.4 8.2 16.2l.8-3.8z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="gmG{n}" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4285f4"/><stop offset=".55" stop-color="#9b72cb"/><stop offset="1" stop-color="#d96570"/></linearGradient></defs><path fill="url(#gmG{n})" d="M12 1.5c.6 5.6 1.9 7.9 4 9.5 1.6 1.2 3.7 1.8 6.5 2.5-2.8.7-4.9 1.3-6.5 2.5-2.1 1.6-3.4 3.9-4 9.5-.6-5.6-1.9-7.9-4-9.5C6.4 14.3 4.3 13.7 1.5 13c2.8-.7 4.9-1.3 6.5-2.5 2.1-1.6 3.4-3.9 4-9z"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2M16 7l3 3M14 9l2 2"/></svg>',
    photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.6"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 012-2h9"/></svg>',
    retry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v9M6.3 6.8a8 8 0 1011.4 0"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 5.1A10.5 10.5 0 0112 5c6.5 0 10.5 7 10.5 7a17 17 0 01-3.2 3.9M6.6 6.6A16.5 16.5 0 001.5 12S5.5 19 12 19c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 004.2 4.2"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg>',
    okc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M8 12.5l3 3 5-6"/></svg>',
    regen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0115.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 01-15.5 6.2L3 16M3 21v-5h5"/></svg>'
  };
  var gradN = 0;
  function spark() { gradN++; return I.spark.replace(/\{n\}/g, String(gradN)); }


  /* ---------- Status ---------- */
  var KEYS = [], OFF = [], PRIMARY = '', MODEL = DEFAULT_MODEL, META = null;
  var admin = { is: false };
  var tmpBad = {};        /* kunci gagal sementara (sesi ini): { kunci: { until, kind } } */
  var msgs = [];          /* { role: 'user' | 'model', text, err } */
  var busy = false, ctrl = null, synced = false, myId = '';
  var reveal = false;
  var unsubCfg = null;    /* berhenti berlangganan config/gemini */
  var loaded = false;     /* true setelah daftar kunci benar-benar terbaca dari database */
  var svcBusy = false;

  /* Sakelar global Gemini (js/gemini-gate.js). Bila tidak termuat, Gemini dianggap aktif. */
  function gmOn() { return !window.GMGate || window.GMGate.isEnabled(); }
  function gateKnown() { return !window.GMGate || window.GMGate.isKnown(); }
  function offErr() { return { kind: 'off', message: 'Gemini sedang dinonaktifkan oleh admin.' }; }

  /* ---------- Banyak API key: sama seperti YouTube ----------
     Hanya SATU kunci yang dipakai (kunci utama, atau kunci aktif yang menetap). Kunci siaga tidak disentuh sama sekali
     (kuotanya utuh). Hanya bila kunci yang dipakai limit harian atau ditolak, aplikasi pindah ke kunci berikutnya dan
     menetap di sana. Status limit disimpan di perangkat dan reset otomatis saat hari kuota baru (tengah malam Pasifik). */
  var EXH = 'gm:exhausted', ACT = 'gm:active';
  var memExh = { day: '', model: '', keys: {} };   /* kuota Gemini dihitung per model: status limit hanya berlaku untuk model yang sama */
  var memAct = { day: '', key: '' };
  function pacificDay() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function resetText() {
    try {
      var now = new Date();
      var pt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(now);
      var g = function (t) { for (var i = 0; i < pt.length; i++) if (pt[i].type === t) return +pt[i].value; return 0; };
      var since = ((g('hour') % 24) * 3600 + g('minute') * 60 + g('second')) * 1000;
      var at = new Date(now.getTime() + 86400000 - since);
      var time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).format(at).replace(':', '.');
      var tz = ''; try { new Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' }).formatToParts(at).forEach(function (x) { if (x.type === 'timeZoneName') tz = ' ' + x.value; }); } catch (e) { /* tanpa zona */ }
      var same = at.getDate() === now.getDate() && at.getMonth() === now.getMonth();
      return (same ? 'hari ini' : 'besok') + ' sekitar pukul ' + time + tz;
    } catch (e) { return 'otomatis besok'; }
  }
  function exhLoad() {
    var day = pacificDay(), out = {}, k;
    if (memExh.day === day && memExh.model === MODEL) for (k in memExh.keys) out[k] = 1;
    try { var o = JSON.parse(localStorage.getItem(EXH) || '{}'); if (o && o.day === day && o.model === MODEL && o.keys) for (k in o.keys) out[k] = 1; } catch (e) { /* diabaikan */ }
    return out;
  }
  function markExhausted(k) {
    var day = pacificDay();
    if (memExh.day !== day || memExh.model !== MODEL) memExh = { day: day, model: MODEL, keys: {} };
    memExh.keys[k] = 1;
    try { localStorage.setItem(EXH, JSON.stringify({ day: day, model: MODEL, keys: exhLoad() })); } catch (e) { /* diabaikan */ }
    keysChanged();
  }
  function actLoad() {
    var day = pacificDay();
    if (memAct.day === day && memAct.key) return memAct.key;
    try { var o = JSON.parse(localStorage.getItem(ACT) || '{}'); if (o && o.day === day && o.key) return o.key; } catch (e) { /* diabaikan */ }
    return '';
  }
  function actSave(k) {
    memAct = { day: pacificDay(), key: k };
    try { localStorage.setItem(ACT, JSON.stringify(memAct)); } catch (e) { /* diabaikan */ }
  }
  /* 'off' | 'limit' | 'bad' | 'ok' */
  function keyState(k) {
    if (OFF.indexOf(k) !== -1) return 'off';
    if (exhLoad()[k]) return 'limit';
    var t = tmpBad[k]; if (t && t.until > Date.now()) return 'bad';
    return 'ok';
  }
  function activeKeys() { return KEYS.filter(function (k) { return OFF.indexOf(k) === -1; }); }
  function allOff() { return KEYS.length > 0 && KEYS.every(function (k) { return OFF.indexOf(k) !== -1; }); }
  function usableKeys() { return KEYS.filter(function (k) { return keyState(k) === 'ok'; }); }
  /* Urutan percobaan: yang sehat dulu (kunci utama atau kunci yang menetap di depan), yang sempat bermasalah paling akhir.
     Kunci limit dan nonaktif tidak pernah dicoba. */
  function tryOrder() {
    var good = [], bad = [], act = actLoad();
    KEYS.forEach(function (k) { var st = keyState(k); if (st === 'ok') good.push(k); else if (st === 'bad') bad.push(k); });
    var first = good.indexOf(PRIMARY) !== -1 ? PRIMARY : act;
    var i = good.indexOf(first);
    if (i > 0) { good.splice(i, 1); good.unshift(first); }
    return good.concat(bad);
  }
  function currentKey() { return allOff() ? '' : (tryOrder()[0] || ''); }
  function pickPrimary(list, off, except) {
    var on = list.filter(function (k) { return k !== except && off.indexOf(k) === -1; });
    var ok = on.filter(function (k) { return !exhLoad()[k]; });
    return (ok[0] || on[0] || '');
  }
  /* Kunci utama = pilihan admin selama aktif dan belum limit; bila tidak, kunci yang sedang dipakai menggantikannya */
  function mainKey() {
    var pOn = !!PRIMARY && OFF.indexOf(PRIMARY) === -1;
    if (pOn && keyState(PRIMARY) !== 'limit') return PRIMARY;
    var cur = allOff() ? '' : currentKey();
    if (cur) return cur;
    return pOn ? PRIMARY : pickPrimary(KEYS, OFF, PRIMARY);
  }
  /* Admin: simpan kunci utama pengganti ke database bila kunci utama limit/nonaktif dan ada kunci sehat. Hanya kolom "primary" ditulis. */
  var autoSig = '';
  function autoMain() {
    try {
      var b = window.__ngobrolFB;
      if (!b || !admin.is || !loaded || !gmOn() || !KEYS.length) return;
      var want = mainKey();
      if (!want || want === PRIMARY || KEYS.indexOf(want) === -1 || OFF.indexOf(want) !== -1 || keyState(want) !== 'ok') return;
      if (PRIMARY && OFF.indexOf(PRIMARY) === -1 && keyState(PRIMARY) !== 'limit') return;
      var sig = want + '|' + KEYS.length + '|' + OFF.length;
      if (autoSig === sig) return;
      autoSig = sig;
      b.set(b.ref(b.db, 'config/gemini/primary'), want).catch(function () { /* tanpa izin atau offline: dicoba lagi saat keadaan berubah */ });
    } catch (e) { /* diabaikan */ }
  }
  function keysChanged() {
    try { if ($('gmAdmin') && $('gmAdmin').classList.contains('open')) renderAdmin(); } catch (e) { /* panel belum siap */ }
    autoMain();
  }
  /* Alasan bila tidak ada kunci yang bisa dipakai saat ini */
  function noUsableError() {
    var on = activeKeys();
    if (!KEYS.length) return { kind: 'nokey', message: 'API key belum diatur.' };
    if (!on.length) return { kind: 'nokey', message: 'Semua API key dinonaktifkan.' };
    if (on.some(function (k) { return keyState(k) === 'limit'; })) return { kind: 'limit', message: '' };
    var t = tmpBad[on[0]];
    return { kind: t && t.kind === 'invalid' ? 'invalid' : 'rate', message: '' };
  }
  function maskKey(k) { return k && k.length > 10 ? k.slice(0, 4) + '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' + k.slice(-4) : ''; }

  /* ---------- Util ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* Markdown ringan yang aman: kode, judul, daftar, tebal, miring */
  function md(src) {
    var blocks = [];
    src = String(src).replace(/```([\w+-]*)\n?([\s\S]*?)```/g, function (_, lang, c) {
      blocks.push('<div class="gm-code"><div class="gm-code-h"><span>' + esc(lang || 'Kode') + '</span><button type="button" data-gm="copycode">' + I.copy + 'Salin</button></div><pre><code>' + esc(c.replace(/\n$/, '')) + '</code></pre></div>');
      return '\u0000' + (blocks.length - 1) + '\u0000';
    });
    function inline(t) {
      t = esc(t);
      t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
      t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
      t = t.replace(/(^|[^*\w])\*([^*\s][^*]*)\*(?!\*)/g, '$1<i>$2</i>');
      return t;
    }
    var out = [], list = null, nextNumber = 1, hasNumbered = false;
    function close() { if (list) { out.push('</' + list + '>'); list = null; } }
    src.split(/\r?\n/).forEach(function (l) {
      var m;
      if (/^\u0000\d+\u0000$/.test(l.trim())) { close(); out.push(l.trim()); return; }
      if ((m = l.match(/^\s*[-*•]\s+(.*)/))) {
        if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; }
        out.push('<li>' + inline(m[1]) + '</li>'); return;
      }
      if ((m = l.match(/^\s*(\d+)[.)]\s+(.*)/))) {
        // A numbered list may be interrupted by paragraphs or bullet points.
        // Preserve the numbering across those interruptions, including when
        // the model mistakenly starts a later fragment at 1 again.
        var supplied = parseInt(m[1], 10);
        if (!hasNumbered) { nextNumber = supplied > 0 ? supplied : 1; hasNumbered = true; }
        if (list !== 'ol') { close(); out.push('<ol start="' + nextNumber + '">'); list = 'ol'; }
        out.push('<li>' + inline(m[2]) + '</li>');
        nextNumber++;
        return;
      }
      close();
      if ((m = l.match(/^#{1,6}\s+(.*)/))) {
        out.push('<h4>' + inline(m[1]) + '</h4>');
        nextNumber = 1; hasNumbered = false;
        return;
      }
      if (!l.trim()) return;
      out.push('<p>' + inline(l) + '</p>');
    });
    close();
    return out.join('').replace(/\u0000(\d+)\u0000/g, function (_, i) { return blocks[+i] || ''; });
  }

  /* Pop-up notifikasi dihapus: fungsi dibiarkan kosong agar pemanggil lama tetap aman. */
  function toast() {}
  function copyText(t) {
    function done() { toast('Disalin'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
    function fallback() {
      try { var a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); done(); } catch (e) { toast('Gagal menyalin'); }
    }
  }

  /* ---------- Penyimpanan riwayat (banyak obrolan, per akun, di perangkat) ---------- */
  var chats = [], curId = '', showAll = false, ctxId = '', srchQ = '', runTok = 0, dlgAct = null, pressT = 0, pressX = 0, pressY = 0, longFired = false, ctxAt = 0;
  /* ---------- Penyimpanan IndexedDB: foto asli dan salinan cadangan riwayat (kuota jauh lebih besar dari localStorage) ---------- */
  var idbP = null;
  function idbOpen() {
    if (idbP) return idbP;
    idbP = new Promise(function (res) {
      try {
        if (!window.indexedDB) { res(null); return; }
        var rq = indexedDB.open('ngobrolGeminiDB', 1);
        rq.onupgradeneeded = function () { var d = rq.result; if (!d.objectStoreNames.contains('img')) d.createObjectStore('img'); if (!d.objectStoreNames.contains('chats')) d.createObjectStore('chats'); };
        rq.onsuccess = function () { res(rq.result); };
        rq.onerror = function () { res(null); };
        rq.onblocked = function () { res(null); };
      } catch (e) { res(null); }
    });
    return idbP;
  }
  function idbDo(store, mode, fn) {
    return idbOpen().then(function (db) {
      if (!db) return null;
      return new Promise(function (res) {
        var done = false, t = setTimeout(function () { if (!done) { done = true; res(null); } }, 4000);
        function fin(v) { if (!done) { done = true; clearTimeout(t); res(v); } }
        try {
          var tx = db.transaction(store, mode), rq = fn(tx.objectStore(store));
          tx.oncomplete = function () { fin(rq && rq.result !== undefined ? rq.result : true); };
          tx.onerror = tx.onabort = function () { fin(null); };
        } catch (e) { fin(null); }
      });
    });
  }
  function idbPut(store, key, val) { return idbDo(store, 'readwrite', function (o) { return o.put(val, key); }); }
  function idbGet(store, key) { return idbDo(store, 'readonly', function (o) { return o.get(key); }).then(function (v) { return v === true ? null : v; }); }
  function idbDel(store, key) { return idbDo(store, 'readwrite', function (o) { return o.delete(key); }); }
  function idbClear(store) { return idbDo(store, 'readwrite', function (o) { return o.clear(); }); }
  function chatImgIds(list) {
    var ids = [];
    (list || []).forEach(function (c) { (c.msgs || []).forEach(function (m) { (m.files || []).forEach(function (f) { if (f && f.iid) ids.push(f.iid); }); }); });
    return ids;
  }
  function backupKeep(k, v) { return (k === '_parts' || k === 'full') ? undefined : v; }
  function backupChats() {
    var key = storeKey(), raw = '';
    try { raw = JSON.stringify(chats, backupKeep); } catch (e) { return; }
    idbPut('chats', key, raw);
  }
  /* Bila localStorage kehilangan sebagian obrolan, pulihkan dari salinan cadangan IndexedDB */
  function restoreBackup() {
    var key = storeKey();
    idbGet('chats', key).then(function (raw) {
      if (!raw || key !== storeKey()) return;
      var arr = parseChats(raw, '');
      var have = {}; chats.forEach(function (c) { have[c.id] = 1; });
      var miss = arr.filter(function (c) { return c && c.id && !have[c.id] && !deletedIds[c.id]; });
      var bk = {}, filled = false; arr.forEach(function (c) { if (c && c.id) bk[c.id] = c; });
      chats.forEach(function (c) {
        var b = bk[c.id]; if (!b || !b.msgs) return;
        (c.msgs || []).forEach(function (m, i) {
          var bm = b.msgs[i]; if (!m.files || !bm || !bm.files) return;
          m.files.forEach(function (f, j) {
            var bf = bm.files[j];
            if (f && bf && f.name === bf.name && !f.thumb && bf.thumb) { f.thumb = bf.thumb; if (bf.view && !f.view) f.view = bf.view; filled = true; }
            if (f && bf && !f.iid && bf.iid) { f.iid = bf.iid; filled = true; }
          });
        });
      });
      if (!miss.length) { if (filled) { renderDrawer(); if (msgs.length) render(); } return; }
      chats = mergeChats(chats, miss);
      chats.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
      persist(); renderDrawer();
    });
  }

  var HIST_SHOW = 7, deletedIds = {};   /* deletedIds: obrolan yang dihapus pengguna pada sesi ini, supaya tidak ikut digabung kembali */
  function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  /* ID akun diambil dari jembatan aplikasi; bila belum siap, dari sesi tersimpan di perangkat, agar kunci penyimpanan tidak pernah salah */
  function curUid() {
    var id = '';
    try { id = (window.__ngobrolFB && window.__ngobrolFB.getMyId && window.__ngobrolFB.getMyId()) || ''; } catch (e) { id = ''; }
    id = id || myId || '';
    if (!id) { try { id = localStorage.getItem('chat_myId') || ''; } catch (e) { id = ''; } }
    return String(id || '');
  }
  var TAMU_KEY = 'ngobrolGeminiChats_tamu';
  function storeKey() { return 'ngobrolGeminiChats_' + (curUid() || 'tamu'); }
  function oldKey() { return 'ngobrolGemini_' + (curUid() || 'tamu'); }
  /* Foto tidak pernah ditampilkan dengan nama file (mis. 162996.jpg): cukup "Foto" */
  function fileTitle(f) { return f && f.kind === 'image' ? 'Foto' : String((f && f.name) || ''); }
  /* Obrolan yang pesan pertamanya hanya foto (tanpa teks): judulnya dibuat otomatis dari isi foto, bukan "Foto" */
  function isPhotoOnly(list) {
    for (var i = 0; i < (list || []).length; i++) {
      var m = list[i];
      if (m && m.role === 'user' && (m.text || (m.files && m.files.length))) {
        return !String(m.text || '').trim() && !!(m.files && m.files.length) && m.files.every(function (f) { return f && f.kind === 'image'; });
      }
    }
    return false;
  }
  function chatTitle(c) {
    var list = (c && c.msgs) || [];
    if (isPhotoOnly(list)) return (c && c.ai) ? String(c.ai) : 'Obrolan foto';
    var t = titleOf(list);
    return t === 'Obrolan baru' && c && c.title ? String(c.title).replace(/\.(jpe?g|png|webp|gif|heic|heif)$/i, '') || 'Obrolan foto' : t;
  }
  function cleanAiTitle(t) {
    t = String(t || '').split(/\r?\n/)[0].replace(/[*_`#>"\u201c\u201d\u2018\u2019]/g, '').replace(/^\s*(judul|title)\s*[:\-]\s*/i, '').replace(/[.!?:;,\s]+$/g, '').replace(/\s+/g, ' ').trim();
    if (t.length > 40) t = t.slice(0, 40).replace(/\s+\S*$/, '').trim();
    return t.length >= 3 ? t : '';
  }
  var titleBusy = {}, titleFail = {};
  /* Minta Gemini membuat judul pendek dari jawaban atas foto. Gagal = diam-diam, judul sementara tetap dipakai dan dicoba lagi nanti. */
  function autoTitle(cid) {
    var c = null; chats.forEach(function (x) { if (x.id === cid) c = x; });
    if (!c || c.ai || titleBusy[cid] || !isPhotoOnly(c.msgs) || !gmOn()) return;
    if (titleFail[cid] && Date.now() - titleFail[cid] < 60000) return;
    var reply = ''; (c.msgs || []).some(function (m) { if (m.role === 'model' && !m.err && m.text) { reply = String(m.text); return true; } return false; });
    if (!reply) return;
    var key = tryOrder()[0]; if (!key) return;
    titleBusy[cid] = 1;
    var body = {
      contents: [{ role: 'user', parts: [{ text: 'Buat judul obrolan yang sangat singkat (2 sampai 5 kata, bahasa Indonesia, tanpa tanda kutip, tanpa titik) yang menggambarkan isi foto yang dibahas pada jawaban di bawah ini. Tulis judulnya saja.\n\nJawaban:\n' + reply.replace(/\s+/g, ' ').slice(0, 1500) }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 256 }
    };
    callGemini(key, body, undefined).then(function (j) {
      var t = cleanAiTitle(extractText(j));
      if (!t) throw new Error('kosong');
      var cc = null; chats.forEach(function (x) { if (x.id === cid) cc = x; });
      if (!cc || deletedIds[cid]) return;
      cc.ai = t; persist(); renderDrawer();
    }).catch(function () { titleFail[cid] = Date.now(); }).then(function () { delete titleBusy[cid]; });
  }
  /* Obrolan foto lama yang masih bernama "Obrolan foto": lengkapi judulnya satu per satu saat laci dibuka */
  function backfillTitles() {
    if (!gmOn()) return;
    var n = 0;
    chats.forEach(function (c) { if (n < 3 && !c.ai && isPhotoOnly(c.msgs) && !titleBusy[c.id] && !(titleFail[c.id] && Date.now() - titleFail[c.id] < 60000)) { n++; setTimeout(function () { autoTitle(c.id); }, n * 700); } });
  }
  function titleOf(list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].role === 'user') { var t = String(list[i].text || (list[i].files && list[i].files[0] && fileTitle(list[i].files[0])) || '').replace(/\s+/g, ' ').trim(); if (!t) continue; return t.length > 48 ? t.slice(0, 48).trim() + '\u2026' : t; }
    }
    return 'Obrolan baru';
  }
  function parseChats(raw, key) {
    try {
      var v = JSON.parse(raw || 'null');
      if (Array.isArray(v)) return v.filter(function (c) { return c && c.id && Array.isArray(c.msgs) && c.msgs.length; });
      if (v == null) return [];
    } catch (e) { /* data rusak: salinannya diamankan di bawah */ }
    if (key && raw) { try { localStorage.setItem(key + '_rusak', raw); } catch (e2) { /* abaikan */ } }
    return [];
  }
  function readStored() { try { return parseChats(localStorage.getItem(storeKey()), storeKey()); } catch (e) { return []; } }
  /* Gabungkan dua daftar obrolan: daftar pertama menang bila ID sama; obrolan yang dihapus pengguna tidak dimasukkan lagi */
  function mergeChats(base, extra) {
    var seen = {}, out = [];
    (base || []).forEach(function (c) { if (c && c.id && !deletedIds[c.id] && !seen[c.id]) { seen[c.id] = 1; out.push(c); } });
    (extra || []).forEach(function (c) { if (c && c.id && !deletedIds[c.id] && !seen[c.id]) { seen[c.id] = 1; out.push(c); } });
    return out;
  }
  function loadHist() {
    var mem = chats, migrated = false;
    chats = mergeChats(readStored(), mem);          /* yang ada di memori tapi belum tersimpan tidak ikut hilang */
    if (curUid()) {
      try {                                          /* pindahkan obrolan yang tersimpan saat ID belum terbaca */
        var tm = parseChats(localStorage.getItem(TAMU_KEY), '');
        if (tm.length) { chats = mergeChats(chats, tm); migrated = true; }
      } catch (e) { /* abaikan */ }
    }
    if (!chats.length) {
      try {
        var o = JSON.parse(localStorage.getItem(oldKey()) || '[]');
        o = Array.isArray(o) ? o.filter(function (m) { return m && m.text; }) : [];
        if (o.length) chats = [{ id: uid(), title: titleOf(o), ts: o[o.length - 1].ts || Date.now(), msgs: o }];
      } catch (e) { /* abaikan */ }
    }
    chats.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    /* Selalu mulai dari obrolan baru; obrolan lama hanya terbuka bila dipilih dari riwayat. */
    curId = uid(); msgs = [];
    if (migrated && persist()) { try { localStorage.removeItem(TAMU_KEY); } catch (e) { /* abaikan */ } }
    restoreBackup();
  }
  /* Pratinjau besar foto ikut disimpan agar bisa dilihat lagi setelah aplikasi dibuka ulang, dibatasi supaya penyimpanan tidak penuh */
  var VIEW_BUDGET = 1500000;
  function viewFilter(allow) {
    return function (k, v) {
      if (k === '_parts' || k === 'full') return undefined;
      if ((k === 'view' || k === 'thumb') && this && this.iid && this.mini) return undefined;
      if (k === 'view') return (allow && allow.has(this)) ? v : undefined;
      return v;
    };
  }
  function bareFilter(k, v) { return (k === '_parts' || k === 'full' || k === 'view' || k === 'thumb') ? undefined : v; }
  /* Menulis riwayat TANPA menimpa obrolan lain yang sudah tersimpan: selalu digabung dulu dengan isi penyimpanan.
     Bila penyimpanan penuh, pratinjau besar dibuang dulu, lalu gambar kecil; teks obrolan tidak pernah dibuang. Mengembalikan true bila tersimpan. */
  function persist() {
    var key = storeKey(), list = [], allow = new Set(), used = 0, saved = false;
    try { chats = mergeChats(chats, readStored()); chats.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }); } catch (e) { /* abaikan */ }
    try {
      chats.forEach(function (c) { (c.msgs || []).forEach(function (m) { (m.files || []).forEach(function (f) { if (f && typeof f.view === 'string' && f.view) list.push({ f: f, ts: m.ts || 0 }); }); }); });
      list.sort(function (a, b) { return b.ts - a.ts; });
      list.forEach(function (it) { if (used + it.f.view.length <= VIEW_BUDGET) { used += it.f.view.length; allow.add(it.f); } });
    } catch (e) { allow = new Set(); }
    [viewFilter(allow), viewFilter(null), bareFilter].some(function (flt) {
      try { localStorage.setItem(key, JSON.stringify(chats, flt)); saved = true; } catch (e) { /* penuh: coba bentuk yang lebih kecil */ }
      return saved;
    });
    backupChats();
    return saved;
  }
  function saveHist() {
    if (!curId) curId = uid();
    var clean = msgs.filter(function (m) { return !m.err; }), idx = -1;   /* tanpa batas: pesan hanya terhapus lewat tombol hapus */
    chats.forEach(function (c, i) { if (c.id === curId) idx = i; });
    if (!clean.length) { if (idx !== -1) chats.splice(idx, 1); }
    else {
      var c = { id: curId, title: titleOf(clean), ts: clean[clean.length - 1].ts || Date.now(), msgs: clean };
      if (idx !== -1 && chats[idx].ai) c.ai = chats[idx].ai;
      if (idx === -1) chats.unshift(c); else chats[idx] = c;
      chats.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    }
    persist();
    renderDrawer();
  }

  /* ---------- Laci samping (riwayat) ---------- */
  function renderDrawer() {
    var hist = $('gmHist'); if (!hist) return;
    var q = srchQ.trim().toLowerCase();
    var list = chats.filter(function (c) { return !q || chatTitle(c).toLowerCase().indexOf(q) !== -1; });
    var shown = (showAll || q) ? list : list.slice(0, HIST_SHOW);
    var h = shown.map(function (c) {
      return '<div class="gm-hi' + (c.id === curId ? ' on' : '') + (ctxId === c.id ? ' press' : '') + '" data-id="' + c.id + '"><button type="button" class="gm-hi-t" data-h="open" data-id="' + c.id + '"><span>' + esc(chatTitle(c)) + '</span></button></div>';
    }).join('');
    if (!list.length) h = '<div class="gm-hempty">' + (q ? 'Tidak ada obrolan yang cocok.' : 'Belum ada riwayat obrolan.') + '</div>';
    if (!q && list.length > HIST_SHOW) h += '<button type="button" class="gm-more" data-h="more">' + (showAll ? 'Ringkas' : 'Lihat semua\u2026') + '</button>';
    hist.innerHTML = h;
    var nm = ''; try { nm = String((window.__ngobrolFB && window.__ngobrolFB.getMyName && window.__ngobrolFB.getMyName()) || '').trim(); } catch (e) { nm = ''; }
    $('gmAvatar').textContent = nm ? nm.charAt(0).toUpperCase() : 'G';
    $('gmClearAll').hidden = !chats.length;
    $('gmKeyBtn').hidden = !admin.is;
  }
  function openDrawer() { renderDrawer(); backfillTitles(); $('gmPanel').classList.add('drawer-open'); $('gmDrawer').setAttribute('aria-hidden', 'false'); }
  function closeDrawer() { if ($('gmCtxBg')) { hideCtx(); hideDlg(); } $('gmPanel').classList.remove('drawer-open'); $('gmDrawer').setAttribute('aria-hidden', 'true'); }
  function toggleSearch() {
    var w = $('gmSrchWrap'), on = w.hidden;
    w.hidden = !on;
    if (on) { $('gmSrchIn').focus(); } else { $('gmSrchIn').value = ''; srchQ = ''; renderDrawer(); }
  }

  /* ---------- Tampilan obrolan ---------- */
  function updDown() { var b = $('gmBody'), d = $('gmDown'); if (b && d) d.classList.toggle('show', b.scrollHeight - b.scrollTop - b.clientHeight > 180); }
  function scrollEnd(smooth) { var b = $('gmBody'); if (!b) return; if (!smooth) b.style.scrollBehavior = 'auto'; b.scrollTop = b.scrollHeight; b.style.scrollBehavior = ''; updDown(); }

  function fmtTime(ts) { try { return ts ? new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : ''; } catch (e) { return ''; } }
  function stateBox(title, text, btn) {
    return '<div class="gm-state"><div class="gm-orb">' + spark() + '</div><h3>' + title + '</h3><p>' + text + '</p>' + (btn || '') + '</div>';
  }
  function aiHead() { return ''; }

  function render() {
    var b = $('gmBody'), has = KEYS.length > 0, on = activeKeys().length > 0;
    var pill = $('gmPill');
    if (!gmOn()) {
      pill.classList.add('off'); pill.classList.remove('btn');
      $('gmPillT').textContent = 'Nonaktif';
      $('gmKeyBtn').hidden = true;
      $('gmInput').disabled = true; $('gmInput').placeholder = 'Gemini dinonaktifkan';
      updSend();
      b.innerHTML = '<div class="gm-off-card"><div class="gm-off-ico">' + spark() + '<span class="gm-off-pw">' + I.power + '</span></div>' +
        '<h3>Gemini sedang dinonaktifkan</h3>' +
        '<p>Layanan Gemini dinonaktifkan oleh admin dan tidak dapat digunakan untuk sementara. Silakan coba lagi nanti.</p>' +
        (admin.is ? '<button type="button" class="gm-btn primary" data-gm="svc">' + I.power + 'Atur layanan Gemini</button>' : '') +
        '<button type="button" class="gm-btn" data-gm="back">Kembali ke Ngobrol</button></div>';
      return;
    }
    pill.classList.toggle('off', !on);
    pill.classList.toggle('btn', !!admin.is);
    $('gmPillT').textContent = on ? modelName() : 'Belum aktif';
    $('gmKeyBtn').hidden = !admin.is;
    updSend();
    renderDrawer();
    $('gmInput').disabled = !on;
    $('gmInput').placeholder = on ? 'Tanya Gemini' : 'Gemini belum aktif';

    if (!synced) { b.innerHTML = stateBox('Memuat', 'Menyiapkan Gemini untuk Anda.'); return; }
    if (!on) {
      b.innerHTML = has
        ? stateBox('Semua API key nonaktif', admin.is ? 'Aktifkan salah satu kunci lewat pengaturan API key.' : 'Gemini sedang dinonaktifkan. Silakan hubungi admin aplikasi.', admin.is ? '<button type="button" class="gm-btn primary" data-gm="admin">' + I.key + 'Atur API key</button>' : '')
        : stateBox('Gemini belum aktif', admin.is ? 'Tambahkan API key Gemini untuk mulai memakai fitur ini. Kunci disimpan di database dan dipakai oleh semua pengguna.' : 'API key Gemini belum diatur. Silakan hubungi admin aplikasi.', admin.is ? '<button type="button" class="gm-btn primary" data-gm="admin">' + I.key + 'Tambah API key</button>' : '');
      return;
    }
    if (!msgs.length) {
      b.innerHTML = '<div class="gm-welcome"><div class="gm-orb">' + spark() + '</div><h2>Apa yang bisa saya bantu?</h2></div>';
      return;
    }
    var h = '', last = -1;
    msgs.forEach(function (m, i) { if (m.role !== 'user') last = i; });
    msgs.forEach(function (m, i) {
      if (m.role === 'user') {
        h += '<div class="gm-msg me">' + attHtml(m.files, i) + (m.text ? '<div class="gm-ub">' + esc(m.text) + '</div>' : '') + '<span class="gm-time">' + fmtTime(m.ts) + '</span></div>';
      } else if (m.err) {
        h += '<div class="gm-msg">' + aiHead(m.ts) + '<div class="gm-ai-body err">' + I.alert + '<span>' + esc(m.text) + '</span></div><div class="gm-acts"><button type="button" class="gm-act" data-gm="retry">' + I.retry + 'Coba lagi</button></div></div>';
      } else {
        h += '<div class="gm-msg">' + aiHead(m.ts) + '<div class="gm-ai-body">' + md(m.text) + '</div><div class="gm-acts"><button type="button" class="gm-act" data-gm="copy" data-i="' + i + '">' + I.copy + 'Salin</button>' +
          (i === last && !busy ? '<button type="button" class="gm-act" data-gm="regen">' + I.regen + 'Buat ulang</button>' : '') + '</div></div>';
      }
    });
    if (busy) h += '<div class="gm-msg" id="gmTyping">' + aiHead() + '<div class="gm-ai-body"><span class="gm-typing"><i></i><i></i><i></i></span></div></div>';
    b.innerHTML = h;
    upgradeInline();
  }

  function modelName() { for (var i = 0; i < MODELS.length; i++) if (MODELS[i].id === MODEL) return 'Gemini ' + MODELS[i].name; return 'Gemini'; }

  /* ---------- Panggilan API ---------- */
  function buildContents() {
    var list = msgs.filter(function (m) { return !m.err && (m.text || (m.files && m.files.length)); }).slice(-MAX_SEND), out = [], budget = LIM.inline, keep = {}, i;
    /* lampiran terbaru dikirim utuh; yang lama (atau melebihi batas ukuran) cukup disebut namanya */
    for (i = list.length - 1; i >= 0; i--) {
      var pm = list[i];
      if (pm.role === 'user' && pm._parts && pm._parts.length) { var sz = partsSize(pm._parts); if (sz <= budget) { budget -= sz; keep[i] = 1; } }
    }
    list.forEach(function (m, i) {
      var role = m.role === 'user' ? 'user' : 'model', parts = [];
      if (role === 'user' && m.files && m.files.length) {
        if (keep[i]) parts = m._parts.slice();
        else parts.push({ text: '[Lampiran sebelumnya: ' + m.files.map(function (f) { return f.name; }).join(', ') + ' (isinya tidak lagi tersedia)]' });
      }
      var t = m.text || (role === 'user' && keep[i] ? 'Tolong lihat lampiran ini lalu jelaskan isinya.' : '');
      if (t) parts.push({ text: t });
      if (!parts.length) return;
      if (out.length && out[out.length - 1].role === role) out[out.length - 1].parts = out[out.length - 1].parts.concat(parts);
      else out.push({ role: role, parts: parts });
    });
    while (out.length && out[0].role !== 'user') out.shift();
    return out;
  }

  var BASE = 'https://generativelanguage.googleapis.com/v1beta/';
  var OVR = {};   /* model hasil deteksi otomatis: { pilihan admin: id model yang benar-benar tersedia } */

  /* Golongkan galat Gemini: limit (kuota harian habis), rate (batas per menit), invalid (kunci ditolak), model, error */
  function classify(status, j) {
    var err = (j && j.error) || {}, msg = err.message || ('HTTP ' + status), low = String(msg).toLowerCase(), kind = 'error', retry = 0;
    var blob = low;
    try { blob += ' ' + JSON.stringify(err.details || []).toLowerCase(); } catch (e) { /* diabaikan */ }
    try {
      (err.details || []).forEach(function (d) {
        var m = d && d.retryDelay && /^([\d.]+)s$/.exec(String(d.retryDelay));
        if (m) retry = Math.max(retry, +m[1]);
      });
    } catch (e) { /* diabaikan */ }
    var exhausted = status === 429 || err.status === 'RESOURCE_EXHAUSTED' || low.indexOf('quota') !== -1 || low.indexOf('rate limit') !== -1;
    if (exhausted) {
      if (/perday|per day|daily|per_day/.test(blob)) kind = 'limit';                         /* kuota harian habis */
      else if (/perminute|per minute|per_minute|rate limit/.test(blob)) kind = 'rate';       /* terlalu cepat */
      else kind = 'rate?';                                                                   /* belum jelas: coba lagi lalu anggap limit sementara */
    }
    else if (status === 400 && (low.indexOf('api key') !== -1 || low.indexOf('api_key') !== -1)) kind = 'invalid';
    else if (status === 401 || status === 403) kind = 'invalid';
    else if (status === 404) kind = 'model';
    return { kind: kind, message: msg, status: status, retry: retry };
  }

  /* Satu permintaan. Mengembalikan JSON, atau melempar { kind, message, status } */
  function callGemini(key, body, signal, model) {
    if (!gmOn()) return Promise.reject(offErr());
    var m = model || OVR[MODEL] || MODEL;
    return fetch(ENDPOINT + encodeURIComponent(m) + ':generateContent', {
      method: 'POST', signal: signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.ok) return j;
        throw classify(r.status, j);
      });
    });
  }

  /* Daftar model yang benar-benar bisa dipakai oleh kunci ini */
  function listModels(key, signal) {
    if (!gmOn()) return Promise.reject(offErr());
    return fetch(BASE + 'models?pageSize=200', { signal: signal, headers: { 'x-goog-api-key': key } }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw classify(r.status, j);
        return (j.models || []).filter(function (m) { return (m.supportedGenerationMethods || []).indexOf('generateContent') !== -1; })
          .map(function (m) { return String(m.name || '').replace(/^models\//, ''); });
      });
    });
  }
  /* Model dikunci ke keluarga Flash Lite; tidak pernah fallback ke Pro atau Flash biasa. */
  function tierOf(id) { return /flash-lite/.test(String(id || '')) ? 'lite' : 'unsupported'; }
  function pickModel(ids, tier) {
    var bad = /image|tts|live|audio|embed|robot|computer|native|imagen|veo|lyria|omni|banana|gemma|learnlm|aqa|exp|thinking|customtools|vision/;
    var c = ids.filter(function (id) { return /^gemini-/.test(id) && !bad.test(id) && tier === 'lite' && /flash-lite/.test(id); });
    function ver(id) { var m = id.match(/^gemini-(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; }
    c.sort(function (a, b) {
      var pa = /preview/.test(a) ? 1 : 0, pb = /preview/.test(b) ? 1 : 0, la = /latest/.test(a) ? 1 : 0, lb = /latest/.test(b) ? 1 : 0;
      return (pa - pb) || (ver(b) - ver(a)) || (lb - la) || a.length - b.length;
    });
    return c[0] || '';
  }
  /* Cari model pengganti yang tersedia untuk pilihan admin saat ini */
  function resolveModel(key, signal) {
    return listModels(key, signal).then(function (ids) {
      var pick = pickModel(ids, tierOf(MODEL));
      if (!pick) throw { kind: 'model', message: 'Tidak ada model Gemini yang bisa dipakai oleh kunci ini.' };
      OVR[MODEL] = pick;
      return pick;
    });
  }

  function extractText(j) {
    var c = j && j.candidates && j.candidates[0];
    if (!c) {
      var br = j && j.promptFeedback && j.promptFeedback.blockReason;
      throw { kind: 'blocked', message: br ? 'Permintaan ditolak oleh filter keamanan Gemini.' : 'Gemini tidak memberi jawaban.' };
    }
    var t = (c.content && c.content.parts || []).map(function (p) { return p.text || ''; }).join('').trim();
    if (!t) throw { kind: 'blocked', message: c.finishReason === 'SAFETY' ? 'Jawaban ditahan oleh filter keamanan Gemini.' : 'Gemini tidak memberi jawaban. Coba ubah pertanyaan Anda.' };
    return t;
  }

  function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  /* Pakai satu kunci saja. Hanya bila kunci itu limit harian atau ditolak, pindah ke kunci berikutnya dan menetap di sana.
     Kunci siaga yang lain tidak disentuh. Batas per menit bukan kuota habis: coba lagi kunci YANG SAMA setelah jeda singkat. */
  function ask() {
    if (!gmOn()) return Promise.reject(offErr());
    var pool = tryOrder();
    if (!pool.length) return Promise.reject(noUsableError());
    var body = { systemInstruction: { parts: [{ text: SYSTEM }] }, contents: buildContents(), generationConfig: { temperature: 0.8, maxOutputTokens: 8192 } };
    var lastErr = null, retries = {}, tried = {};
    function attempt(i) {
      if (i >= pool.length) {
        /* daftar habis: cek kunci yang belum dicoba (mis. ditambah admin saat permintaan berjalan) */
        var more = tryOrder().filter(function (x) { return !tried[x] && pool.indexOf(x) === -1; });
        if (more.length) { pool = pool.concat(more); return attempt(i); }
        return Promise.reject(lastErr || noUsableError());
      }
      if (!gmOn()) return Promise.reject(offErr());
      var k = pool[i], st = keyState(k);
      if (st === 'off' || st === 'limit') return attempt(i + 1);   /* berubah saat permintaan lain berjalan */
      tried[k] = 1;
      return callGemini(k, body, ctrl.signal).catch(function (e) {
        if (e && e.kind === 'model') return resolveModel(k, ctrl.signal).then(function (m) { return callGemini(k, body, ctrl.signal, m); });
        throw e;
      }).then(function (j) {
        var t = extractText(j);
        var moved = actLoad() !== k;
        if (moved) actSave(k);
        var wasBad = !!tmpBad[k]; delete tmpBad[k];
        if (moved || wasBad) keysChanged();
        return t;
      }, function (e) {
        if (!e || !e.kind || e.kind === 'error' || e.kind === 'model' || e.kind === 'blocked' || e.kind === 'off') throw e;   /* jaringan atau galat non-kunci: jangan ganti kunci */
        if (e.kind === 'rate' || e.kind === 'rate?') {
          var n = retries[k] = (retries[k] || 0) + 1;
          if (n <= 2) return wait(Math.min(8000, e.retry ? Math.ceil(e.retry * 1000) + 300 : 1500 * n)).then(function () { return attempt(i); });
          if (e.kind === 'rate') { lastErr = { kind: 'rate', message: '' }; throw lastErr; }   /* batas per menit: kunci tetap sehat, kunci siaga tidak disentuh */
          /* tetap gagal tanpa kejelasan: anggap limit sementara (10 menit) lalu pindah */
          tmpBad[k] = { until: Date.now() + 600000, kind: 'limit' }; lastErr = { kind: 'limit', message: '' }; keysChanged();
          return attempt(i + 1);
        }
        lastErr = e;
        if (e.kind === 'limit') markExhausted(k);
        else { tmpBad[k] = { until: Date.now() + 600000, kind: 'invalid' }; keysChanged(); }
        return attempt(i + 1);
      });
    }
    return Promise.resolve().then(function () { return attempt(0); });
  }

  function errText(e) {
    if (!e) return 'Terjadi kesalahan. Coba lagi.';
    if (e.name === 'AbortError') return '';
    switch (e.kind) {
      case 'rate': return 'Terlalu banyak permintaan ke Gemini. Tunggu sebentar lalu coba lagi.';
      case 'limit': return 'Kuota Gemini sedang habis. Coba lagi nanti' + (admin.is ? ', atau tambahkan API key lain lewat ikon kunci.' : '.');
      case 'invalid': return admin.is ? 'API key Gemini tidak valid. Perbarui lewat ikon kunci di kanan atas.' : 'API key Gemini bermasalah. Silakan hubungi admin aplikasi.';
      case 'model': return admin.is ? 'Model Gemini tidak tersedia untuk kunci ini' + (e.message ? ' (' + e.message + ')' : '') + '. Coba model lain lewat ikon kunci.' : 'Model Gemini sedang tidak tersedia. Silakan hubungi admin aplikasi.';
      case 'nokey': return 'Gemini belum aktif. Silakan hubungi admin aplikasi.';
      case 'off': return 'Gemini sedang dinonaktifkan oleh admin.';
      case 'blocked': return e.message;
      default: return (e.message && e.message.indexOf('Failed to fetch') === -1 ? 'Gagal menghubungi Gemini: ' + e.message : 'Tidak bisa terhubung ke Gemini. Periksa koneksi internet Anda.');
    }
  }

  function updSend() {
    var s = $('gmSend'), has = !!$('gmInput').value.trim() || pending.length > 0, on = gmOn() && activeKeys().length > 0;
    s.hidden = !(busy || (has && on));
    s.classList.toggle('stop', busy);
    s.innerHTML = busy ? I.stop : I.send;
    s.setAttribute('aria-label', busy ? 'Hentikan' : 'Kirim');
    s.disabled = busy ? false : (!on || pendingLoading());
    var pl = $('gmPlus'); if (pl) pl.disabled = !on;
  }
  function setBusy(v) { busy = v; updSend(); }

  function run() {
    if (!gmOn()) return;
    var tok = ++runTok;
    ctrl = typeof AbortController !== 'undefined' ? new AbortController() : { signal: undefined, abort: function () {} };
    setBusy(true); render(); scrollEnd(true);
    ask().then(function (t) { if (tok !== runTok) return; var cid = curId; msgs.push({ role: 'model', text: t, ts: Date.now() }); saveHist(); autoTitle(cid); },
      function (e) { if (tok !== runTok) return; var t = errText(e); if (t) msgs.push({ role: 'model', text: t, err: true, ts: Date.now() }); })
      .then(function () { if (tok !== runTok) return; ctrl = null; setBusy(false); render(); scrollEnd(true); });
  }

  function send(text) {
    text = String(text || '').trim();
    if (busy || !gmOn() || !activeKeys().length) return;
    if (pendingLoading()) { toast('Tunggu sebentar, lampiran sedang diproses.'); return; }
    var ready = pendingReady();
    if (!text && !ready.length) return;
    var m = { role: 'user', text: text, ts: Date.now() };
    if (ready.length) {
      m.files = ready.map(function (x) {
        var iid = x.full ? 'i' + uid() : '';
        var fo = { name: x.name, size: x.size, kind: x.kind, label: x.label, thumb: x.thumb || '', view: x.view || '', full: x.full || '', mini: x.mini || '', ar: x.ar || 0, iid: iid };
        if (iid) idbPut('img', iid, x.full).then(function (ok) { if (!ok) { fo.iid = ''; delete inlCache[iid]; persist(); } });   /* gagal menyimpan foto asli: thumbnail tetap disimpan di riwayat */
        return fo;
      });
      m._parts = ready.reduce(function (a, x) { return a.concat(x.parts); }, []);
    }
    msgs.push(m); saveHist();
    pending = []; renderTray();
    $('gmInput').value = ''; fit(); updSend();
    run();
  }
  function retry() {
    if (busy || !gmOn()) return;
    while (msgs.length && msgs[msgs.length - 1].err) msgs.pop();
    tmpBad = {};
    run();
  }
  function regen() {
    if (busy || !gmOn()) return;
    while (msgs.length && msgs[msgs.length - 1].role !== 'user') msgs.pop();
    saveHist(); tmpBad = {};
    run();
  }
  function stopRun() { runTok++; if (busy && ctrl) ctrl.abort(); ctrl = null; busy = false; }
  function newChat() {
    stopRun();
    if (msgs.length) saveHist();
    curId = uid(); msgs = []; pending = []; renderTray(); closeDrawer(); closePop(); setBusy(false); render(); scrollEnd(false);
  }
  function openChat(id) {
    var c = null; chats.forEach(function (x) { if (x.id === id) c = x; });
    if (!c) return;
    stopRun();
    curId = c.id; msgs = c.msgs.slice(); pending = []; renderTray(); closeDrawer(); setBusy(false); render(); scrollEnd(false);
  }
  function delChat(id) {
    deletedIds[id] = 1;
    var goneImgs = chatImgIds(chats.filter(function (c) { return c.id === id; }));
    chats = chats.filter(function (c) { return c.id !== id; });
    persist();
    goneImgs.forEach(function (k) { idbDel('img', k); });
    if (id === curId) { stopRun(); curId = uid(); msgs = []; setBusy(false); render(); } else renderDrawer();
    toast('Obrolan dihapus');
  }
  function clearAll() {
    stopRun();
    var gone = readStored(); chats.forEach(function (c) { deletedIds[c.id] = 1; }); gone.forEach(function (c) { deletedIds[c.id] = 1; });
    chats = []; msgs = []; curId = uid();
    idbDel('chats', storeKey()); idbClear('img');
    try { localStorage.removeItem(storeKey()); localStorage.removeItem(oldKey()); localStorage.removeItem(TAMU_KEY); } catch (e) { /* abaikan */ }
    setBusy(false); render(); closeDrawer(); toast('Semua obrolan dihapus');
  }

  /* ---------- Menu tekan lama dan dialog konfirmasi ---------- */
  function showCtx(id, row) {
    var bg = $('gmCtxBg'), cx = $('gmCtx'), wrap = bg.parentNode.getBoundingClientRect(), r = row.getBoundingClientRect();
    ctxId = id; ctxAt = Date.now(); row.classList.add('press');
    try { var sel = window.getSelection && window.getSelection(); if (sel && sel.removeAllRanges) sel.removeAllRanges(); } catch (e) { /* abaikan */ }
    bg.hidden = false;
    var h = cx.offsetHeight || 72, top = r.bottom - wrap.top - 6;
    if (top + h > wrap.height - 12) top = r.top - wrap.top - h + 6;
    cx.style.top = Math.max(8, top) + 'px';
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* abaikan */ }
  }
  function hideCtx() {
    ctxId = ''; $('gmCtxBg').hidden = true;
    var p = document.querySelector('.gm-hi.press'); if (p) p.classList.remove('press');
  }
  function askDlg(title, text, act) {
    $('gmDlgT').textContent = title; $('gmDlgD').textContent = text; dlgAct = act; $('gmDlg').hidden = false;
  }
  function hideDlg() { $('gmDlg').hidden = true; dlgAct = null; }

  /* ---------- Lampiran: foto dan file ---------- */
  var MAX_FILES = 8;
  var LIM = { bin: 12 * 1048576, text: 5 * 1048576, zip: 40 * 1048576, inline: 15000000, textTotal: 600000, textOne: 150000 };
  var ZIP_TEXT_BUDGET = 300000, ZIP_ONE_MAX = 2 * 1048576, ZIP_ONE_CHARS = 100000;
  var pending = [];       /* lampiran yang belum dikirim: { id, name, size, kind, label, thumb, parts, loading } */

  var TEXT_EXT = {};
  ('txt md markdown csv tsv json jsonl ndjson ipynb xml html htm xhtml css scss sass less js mjs cjs jsx ts tsx vue svelte astro py pyw rb php java kt kts swift c h cc cpp cxx hpp cs go rs dart lua pl pm sh bash zsh fish bat cmd ps1 sql yml yaml toml ini cfg conf env log gradle properties tex srt vtt diff patch r scala vb asm tf proto graphql gql ejs hbs pug twig njk liquid webmanifest svg rst adoc gitignore gitattributes editorconfig dockerignore htaccess lock').split(' ').forEach(function (e) { TEXT_EXT[e] = 1; });
  var TEXT_NAMES = { dockerfile: 1, makefile: 1, license: 1, licence: 1, readme: 1, procfile: 1, gemfile: 1, rakefile: 1, changelog: 1, authors: 1, codeowners: 1 };
  var IMG_EXT = { jpg: 1, jpeg: 1, png: 1, webp: 1, gif: 1, bmp: 1, heic: 1, heif: 1, avif: 1, jfif: 1, tif: 1, tiff: 1 };
  var AUD = { mp3: 'audio/mp3', wav: 'audio/wav', aac: 'audio/aac', m4a: 'audio/mp4', ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', flac: 'audio/flac', aif: 'audio/aiff', aiff: 'audio/aiff' };
  var VID = { mp4: 'video/mp4', mpeg: 'video/mpeg', mpg: 'video/mpeg', mov: 'video/quicktime', avi: 'video/x-msvideo', flv: 'video/x-flv', webm: 'video/webm', wmv: 'video/x-ms-wmv', '3gp': 'video/3gpp', mkv: 'video/x-matroska' };
  var OFFICE = { docx: 1, pptx: 1, xlsx: 1 };
  var NO_EXT = { rar: 'RAR', '7z': '7Z', tar: 'TAR', gz: 'GZ', tgz: 'TGZ', bz2: 'BZ2', xz: 'XZ', doc: 'DOC', xls: 'XLS', ppt: 'PPT', exe: 'EXE', apk: 'APK', iso: 'ISO', dmg: 'DMG' };
  var ZIP_BIN = /\.(png|jpe?g|gif|webp|bmp|ico|icns|heic|avif|tiff?|psd|mp3|wav|aac|m4a|ogg|flac|mp4|mov|avi|mkv|webm|pdf|zip|rar|7z|gz|tgz|tar|bz2|xz|exe|dll|so|dylib|class|jar|war|bin|dat|o|a|obj|pyc|woff2?|ttf|otf|eot|doc|xls|ppt|docx|xlsx|pptx|odt|ods|db|sqlite|sqlite3|wasm|map|min\.js)$/i;
  var ZIP_JUNK = /(^|\/)(node_modules|\.git|__macosx|\.idea|\.vscode|dist|build|\.next|venv|\.venv|__pycache__)\/|(^|\/)(\.ds_store|thumbs\.db|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|npm-shrinkwrap\.json)$|(^|\/)\.env(\.|$)/i;

  function extOf(n) { var m = /\.([A-Za-z0-9]+)$/.exec(String(n || '')); return m ? m[1].toLowerCase() : ''; }
  function baseOf(n) { var p = String(n || '').split('/'); return p[p.length - 1].toLowerCase(); }
  function fmtSize(b) { b = +b || 0; return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(b < 10240 ? 1 : 0).replace('.', ',') + ' KB' : (b / 1048576).toFixed(1).replace('.', ',') + ' MB'; }
  function isTextName(name) { var e = extOf(name), b = baseOf(name); return !!(TEXT_EXT[e] || TEXT_NAMES[b] || TEXT_NAMES[b.replace(/\.[^.]*$/, '')] || (b.charAt(0) === '.' && !e)); }
  function hasNul(u8) { var n = Math.min(u8.length, 4000); for (var i = 0; i < n; i++) if (u8[i] === 0) return true; return false; }
  function decodeText(u8) {
    var t = new TextDecoder('utf-8').decode(u8);
    return t.charCodeAt(0) === 0xFEFF ? t.slice(1) : t;
  }
  function fail2(msg) { return Promise.reject({ message: msg }); }
  function readBuf(file) {
    if (file.arrayBuffer) return file.arrayBuffer();
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = function () { rej(new Error('Gagal membaca file')); }; r.readAsArrayBuffer(file); });
  }
  function readB64(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { var s = String(r.result || ''), i = s.indexOf(','); res(i === -1 ? '' : s.slice(i + 1)); };
      r.onerror = function () { rej({ message: 'Gagal membaca file ' + file.name }); };
      r.readAsDataURL(file);
    });
  }

  /* --- foto: diperkecil dan dikompres agar ringan dikirim --- */
  function loadImg(file) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () { URL.revokeObjectURL(u); res(im); };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('decode')); };
      im.src = u;
    });
  }
  function scaled(im, max, q) {
    var w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
    if (!w || !h) throw new Error('decode');
    var r = Math.min(1, max / Math.max(w, h)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * r)); c.height = Math.max(1, Math.round(h * r));
    var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
    var d = c.toDataURL('image/jpeg', q);
    if (d.indexOf('data:image/jpeg') !== 0) throw new Error('decode');
    return d;
  }
  function imageFile(file) {
    var ext = extOf(file.name), type = (file.type || '').toLowerCase();
    return loadImg(file).then(function (im) {
      var big = scaled(im, 1600, 0.85), th = scaled(im, 720, 0.8), vw = th;
      try { vw = scaled(im, 1100, 0.78); } catch (e) { vw = th; }
      var mini = ''; try { mini = scaled(im, 96, 0.6); } catch (e) { mini = ''; }
      var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, ar = (iw && ih) ? Math.round(iw / ih * 10000) / 10000 : 0;
      return { kind: 'image', label: 'Foto', thumb: th, view: vw, full: big, mini: mini, ar: ar, parts: [{ inlineData: { mimeType: 'image/jpeg', data: big.split(',')[1] } }] };
    }, function () {
      /* browser tidak bisa membuka gambarnya (mis. HEIC): kirim apa adanya bila Gemini mendukung dan ukurannya wajar */
      var mime = (ext === 'heic' || type === 'image/heic') ? 'image/heic' : (ext === 'heif' || type === 'image/heif') ? 'image/heif' : '';
      if (!mime) return fail2('Foto ' + file.name + ' tidak bisa dibuka. Gunakan JPG atau PNG.');
      if (file.size > LIM.bin) return fail2('Foto terlalu besar (maksimal ' + fmtSize(LIM.bin) + ').');
      return readB64(file).then(function (b) { return { kind: 'image', label: 'Foto', thumb: '', parts: [{ inlineData: { mimeType: mime, data: b } }] }; });
    });
  }

  function binFile(file, mime, kind, label) {
    if (file.size > LIM.bin) return fail2(label + ' terlalu besar (maksimal ' + fmtSize(LIM.bin) + ').');
    if (!file.size) return fail2('File ' + file.name + ' kosong.');
    return readB64(file).then(function (b) { return { kind: kind, label: label, thumb: '', parts: [{ inlineData: { mimeType: mime, data: b } }] }; });
  }

  function textPart(name, body, cut) {
    return { text: '[Lampiran: ' + name + ']\n' + body + (cut ? '\n…(isi dipotong karena terlalu panjang)' : '') + '\n[Akhir lampiran: ' + name + ']' };
  }
  function textFile(file) {
    if (file.size > LIM.text) return fail2('File teks terlalu besar (maksimal ' + fmtSize(LIM.text) + ').');
    if (!file.size) return fail2('File ' + file.name + ' kosong.');
    return readBuf(file).then(function (buf) {
      var u8 = new Uint8Array(buf);
      if (hasNul(u8)) return fail2('File ' + file.name + ' bukan teks dan format ini belum bisa dibaca Gemini.');
      var t = decodeText(u8), cut = t.length > LIM.textOne;
      if (cut) t = t.slice(0, LIM.textOne);
      return { kind: 'text', label: (extOf(file.name) || 'Teks').toUpperCase(), thumb: '', parts: [textPart(file.name, t, cut)] };
    });
  }

  /* --- ZIP: dibaca langsung di perangkat (tanpa pustaka luar) --- */
  function u16(v, o) { return v.getUint16(o, true); }
  function u32(v, o) { return v.getUint32(o, true); }
  function u64(v, o) { return v.getUint32(o, true) + v.getUint32(o + 4, true) * 4294967296; }
  function readZip(buf) {
    var v = new DataView(buf), n = buf.byteLength, eocd = -1, i;
    for (i = n - 22; i >= Math.max(0, n - 22 - 65535); i--) if (u32(v, i) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('bukan zip');
    var count = u16(v, eocd + 10), cdSize = u32(v, eocd + 12), cdOff = u32(v, eocd + 16);
    if (count === 0xFFFF || cdOff === 0xFFFFFFFF || cdSize === 0xFFFFFFFF) {
      var loc = eocd - 20;
      if (loc >= 0 && u32(v, loc) === 0x07064b50) {
        var z = u64(v, loc + 8);
        if (z + 56 <= n && u32(v, z) === 0x06064b50) { count = u64(v, z + 32); cdOff = u64(v, z + 48); }
      }
    }
    var out = [], p = cdOff, td = new TextDecoder('utf-8');
    for (i = 0; i < count && p + 46 <= n; i++) {
      if (u32(v, p) !== 0x02014b50) break;
      var flags = u16(v, p + 8), method = u16(v, p + 10), cs = u32(v, p + 20), us = u32(v, p + 24), nl = u16(v, p + 28), el = u16(v, p + 30), cl = u16(v, p + 32), lo = u32(v, p + 42);
      if (p + 46 + nl + el > n) break;
      var name = td.decode(new Uint8Array(buf, p + 46, nl)), q = p + 46 + nl, end = q + el;
      while (q + 4 <= end) {
        var id = u16(v, q), sz = u16(v, q + 2);
        if (id === 1) { var r = q + 4; if (us === 0xFFFFFFFF) { us = u64(v, r); r += 8; } if (cs === 0xFFFFFFFF) { cs = u64(v, r); r += 8; } if (lo === 0xFFFFFFFF) lo = u64(v, r); }
        q += 4 + sz;
      }
      out.push({ name: name.replace(/\\/g, '/'), flags: flags, method: method, cs: cs, us: us, lo: lo });
      p += 46 + nl + el + cl;
    }
    return out;
  }
  function entryBytes(buf, e) {
    try {
      var v = new DataView(buf), o = e.lo;
      if (o + 30 > buf.byteLength || u32(v, o) !== 0x04034b50) return Promise.reject(new Error('rusak'));
      var s = o + 30 + u16(v, o + 26) + u16(v, o + 28), data = new Uint8Array(buf, s, e.cs);
      if (e.method === 0) return Promise.resolve(data);
      if (e.method === 8 && typeof DecompressionStream !== 'undefined' && typeof Blob !== 'undefined' && Blob.prototype.stream) {
        return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function (b) { return new Uint8Array(b); });
      }
    } catch (err) { return Promise.reject(err); }
    return Promise.reject(new Error('metode tidak didukung'));
  }
  function readEntries(buf, ents, budget, perChars) {
    /* baca isi teks entri dengan urutan kecil dulu agar lebih banyak berkas muat */
    var chain = Promise.resolve();
    ents.slice().sort(function (a, b) { return a.us - b.us; }).forEach(function (e) {
      chain = chain.then(function () {
        if (budget <= 0) { e.skip = 'melebihi batas'; return; }
        return entryBytes(buf, e).then(function (u8) {
          if (hasNul(u8)) { e.skip = 'biner'; return; }
          var t = decodeText(u8), lim = Math.min(perChars, budget);
          if (t.length > lim) { t = t.slice(0, lim) + '\n…(dipotong)'; }
          budget -= t.length; e.text = t;
        }).catch(function () { e.skip = 'gagal dibaca'; });
      });
    });
    return chain;
  }
  function zipFile(file) {
    if (file.size > LIM.zip) return fail2('ZIP terlalu besar (maksimal ' + fmtSize(LIM.zip) + ').');
    return readBuf(file).then(function (buf) {
      var ents;
      try { ents = readZip(buf); } catch (e) { return fail2('ZIP tidak bisa dibaca: file rusak atau tidak lengkap.'); }
      var files = ents.filter(function (e) { return !/\/$/.test(e.name); });
      if (!files.length) return fail2('ZIP ini kosong.');
      var cand = [];
      files.forEach(function (e) {
        var low = e.name.toLowerCase();
        if (ZIP_JUNK.test(low)) { e.skip = 'diabaikan'; return; }
        if (e.flags & 1) { e.skip = 'terenkripsi'; return; }
        if (!isTextName(low) && ZIP_BIN.test(low)) { e.skip = 'biner'; return; }
        if (e.us > ZIP_ONE_MAX) { e.skip = 'terlalu besar'; return; }
        cand.push(e);
      });
      return readEntries(buf, cand, ZIP_TEXT_BUDGET, ZIP_ONE_CHARS).then(function () {
        var list = files.slice(0, 250).map(function (e) { return '- ' + e.name + ' (' + fmtSize(e.us) + ')' + (e.skip ? ' [' + e.skip + ']' : ''); }).join('\n');
        if (files.length > 250) list += '\n…dan ' + (files.length - 250) + ' berkas lainnya';
        var body = files.filter(function (e) { return e.text != null; }).map(function (e) { return '=== ' + e.name + ' ===\n' + e.text; }).join('\n\n');
        var read = files.filter(function (e) { return e.text != null; }).length;
        var t = '[Lampiran ZIP: ' + file.name + ', ' + files.length + ' berkas, ' + read + ' berkas teks terbaca]\nDaftar berkas:\n' + list + (body ? '\n\nIsi berkas teks:\n' + body : '\n\n(Tidak ada berkas teks yang bisa dibaca.)') + '\n[Akhir lampiran ZIP]';
        return { kind: 'zip', label: 'ZIP', thumb: '', parts: [{ text: t }] };
      });
    });
  }

  /* --- Word, PowerPoint, Excel (docx, pptx, xlsx) --- */
  function xmlDoc(u8) { return new DOMParser().parseFromString(decodeText(u8), 'application/xml'); }
  function paraText(p, tag, br) {
    var out = '', walk = function (n) {
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType !== 1) continue;
        if (c.nodeName === tag) out += c.textContent;
        else if (c.nodeName === 'w:tab') out += '\t';
        else if (c.nodeName === br) out += '\n';
        else walk(c);
      }
    };
    walk(p); return out;
  }
  function colIdx(ref) { var m = /^([A-Z]+)/.exec(ref || ''), n = 0; if (!m) return -1; for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64); return n - 1; }
  function officeFile(file) {
    var ext = extOf(file.name);
    if (file.size > LIM.zip) return fail2('File terlalu besar (maksimal ' + fmtSize(LIM.zip) + ').');
    return readBuf(file).then(function (buf) {
      var ents;
      try { ents = readZip(buf); } catch (e) { return fail2('Dokumen ' + file.name + ' tidak bisa dibaca (rusak atau terkunci).'); }
      var byName = {}; ents.forEach(function (e) { byName[e.name] = e; });
      function get(n) { return byName[n] ? entryBytes(buf, byName[n]).then(xmlDoc) : Promise.resolve(null); }
      var job;
      if (ext === 'docx') {
        job = get('word/document.xml').then(function (d) {
          if (!d) throw new Error('x');
          var ps = d.getElementsByTagName('w:p'), out = [];
          for (var i = 0; i < ps.length; i++) out.push(paraText(ps[i], 'w:t', 'w:br'));
          return out.join('\n');
        });
      } else if (ext === 'pptx') {
        var slides = ents.map(function (e) { var m = /^ppt\/slides\/slide(\d+)\.xml$/.exec(e.name); return m ? { n: +m[1], e: e } : null; }).filter(Boolean).sort(function (a, b) { return a.n - b.n; });
        if (!slides.length) return fail2('Isi presentasi ' + file.name + ' tidak ditemukan.');
        job = slides.reduce(function (pr, s) {
          return pr.then(function (acc) {
            return entryBytes(buf, s.e).then(xmlDoc).then(function (d) {
              var ps = d.getElementsByTagName('a:p'), out = [];
              for (var i = 0; i < ps.length; i++) { var t = paraText(ps[i], 'a:t', 'a:br'); if (t.trim()) out.push(t); }
              acc.push('--- Slide ' + s.n + ' ---\n' + out.join('\n')); return acc;
            });
          });
        }, Promise.resolve([])).then(function (a) { return a.join('\n\n'); });
      } else {
        var sheets = ents.map(function (e) { var m = /^xl\/worksheets\/sheet(\d+)\.xml$/.exec(e.name); return m ? { n: +m[1], e: e } : null; }).filter(Boolean).sort(function (a, b) { return a.n - b.n; });
        if (!sheets.length) return fail2('Isi spreadsheet ' + file.name + ' tidak ditemukan.');
        job = get('xl/sharedStrings.xml').then(function (sd) {
          var shared = [];
          if (sd) { var sis = sd.getElementsByTagName('si'); for (var i = 0; i < sis.length; i++) { var ts = sis[i].getElementsByTagName('t'), s = ''; for (var j = 0; j < ts.length; j++) s += ts[j].textContent; shared.push(s); } }
          return sheets.reduce(function (pr, sh) {
            return pr.then(function (acc) {
              return entryBytes(buf, sh.e).then(xmlDoc).then(function (d) {
                var rows = d.getElementsByTagName('row'), out = [];
                for (var i = 0; i < rows.length; i++) {
                  var cells = rows[i].getElementsByTagName('c'), line = [];
                  for (var j = 0; j < cells.length; j++) {
                    var c = cells[j], t = c.getAttribute('t'), vEl = c.getElementsByTagName('v')[0], val = '';
                    if (t === 'inlineStr') { var ie = c.getElementsByTagName('t')[0]; val = ie ? ie.textContent : ''; }
                    else if (vEl) { val = t === 's' ? (shared[+vEl.textContent] || '') : vEl.textContent; }
                    var ci = colIdx(c.getAttribute('r')); if (ci < 0) ci = line.length;
                    while (line.length < ci) line.push('');
                    line[ci] = val;
                  }
                  if (line.length) out.push(line.join('\t'));
                }
                acc.push('--- Lembar ' + sh.n + ' ---\n' + out.join('\n')); return acc;
              });
            });
          }, Promise.resolve([])).then(function (a) { return a.join('\n\n'); });
        });
      }
      return job.then(function (t) {
        t = String(t || '').trim();
        if (!t) return fail2('Dokumen ' + file.name + ' tidak berisi teks yang bisa dibaca.');
        var cut = t.length > LIM.textOne; if (cut) t = t.slice(0, LIM.textOne);
        return { kind: 'doc', label: ext.toUpperCase(), thumb: '', parts: [textPart(file.name, t, cut)] };
      }, function (e) { return fail2((e && e.message && e.message !== 'x') ? e.message : 'Dokumen ' + file.name + ' tidak bisa dibaca (rusak, terkunci, atau formatnya tidak dikenal).'); });
    });
  }

  /* Format tidak dikenal: dicoba sebagai teks, jika bukan teks ditolak dengan pesan jelas */
  function sniffFile(file) {
    var ext = extOf(file.name);
    if (NO_EXT[ext]) return fail2('Format ' + NO_EXT[ext] + ' belum didukung. Ubah ke ZIP, PDF, atau teks lalu kirim lagi.');
    if (!file.size) return fail2('File ' + file.name + ' kosong.');
    if (file.size > LIM.text) return fail2('Format file ini belum didukung Gemini.');
    return readBuf(file.slice(0, 8000)).then(function (b) {
      var u8 = new Uint8Array(b);
      if (hasNul(u8)) return fail2('Format ' + (ext ? '.' + ext : 'file ini') + ' belum didukung Gemini.');
      return textFile(file);
    });
  }

  function processFile(file) {
    var ext = extOf(file.name), type = (file.type || '').toLowerCase();
    if (type === 'image/svg+xml' || ext === 'svg') return textFile(file);
    if (/^image\//.test(type) || IMG_EXT[ext]) return imageFile(file);
    if (ext === 'zip' || type === 'application/zip' || type === 'application/x-zip-compressed' || type === 'application/x-zip') return zipFile(file);
    if (OFFICE[ext]) return officeFile(file);
    if (ext === 'pdf' || type === 'application/pdf') return binFile(file, 'application/pdf', 'pdf', 'PDF');
    if (AUD[ext] || /^audio\//.test(type)) return binFile(file, AUD[ext] || type, 'audio', 'Audio');
    if (VID[ext] || /^video\//.test(type)) return binFile(file, VID[ext] || type, 'video', 'Video');
    if (isTextName(file.name) || /^text\//.test(type) || /json|xml|javascript|x-sh/.test(type)) return textFile(file);
    return sniffFile(file);
  }

  function partsSize(parts) { var n = 0; (parts || []).forEach(function (p) { n += p.inlineData ? p.inlineData.data.length : (p.text ? p.text.length : 0); }); return n; }
  function pendingReady() { return pending.filter(function (x) { return !x.loading; }); }
  function pendingLoading() { return pending.some(function (x) { return x.loading; }); }
  function canAttach() { return gmOn() && activeKeys().length > 0 && synced; }

  function iconFor(kind) { return kind === 'image' ? I.photo : I.file; }
  var KIND_LABEL = { image: 'Foto', zip: 'ZIP', pdf: 'PDF', audio: 'Audio', video: 'Video', text: 'Teks', doc: 'Dokumen' };
  function safeThumb(t) { return /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(String(t || '')) ? t : ''; }

  function safePv(u) { return /^blob:/.test(String(u || '')) ? u : ''; }
  function renderTray() {
    var t = $('gmTray'); if (!t) return;
    if (!pending.length) { t.hidden = true; t.innerHTML = ''; return; }
    t.hidden = false;
    t.innerHTML = pending.map(function (x) {
      var th = safeThumb(x.thumb), isImg = x.kind === 'image';
      var src = th || (x.loading ? safePv(x.pv) : '');
      var inner;
      if (src) inner = '<img alt="Foto" src="' + src + '"' + (x.loading ? '' : ' data-gmv="p:' + x.id + '"') + '>';
      else if (isImg) inner = '<span class="gm-ph">' + I.photo + '</span>';          /* foto yang pratinjaunya belum/tidak bisa tampil: ikon foto, tanpa nama file */
      else inner = '<span class="gm-fi">' + iconFor(x.kind) + '</span><span class="gm-fn"><b>' + esc(fileTitle(x)) + '</b><small>' + (x.loading ? 'Memproses…' : esc((x.label || KIND_LABEL[x.kind] || 'File') + ' • ' + fmtSize(x.size))) + '</small></span>';
      var spin = (x.loading && isImg) ? '<span class="gm-sp" role="status" aria-label="Memproses foto"></span>' : '';
      return '<div class="gm-pc' + (x.loading ? ' load' : '') + (isImg ? ' img' : '') + '" data-id="' + x.id + '">' + inner + spin +
        '<button type="button" class="gm-px" data-rm="' + x.id + '" aria-label="' + (isImg ? 'Hapus foto' : 'Hapus lampiran ' + esc(fileTitle(x))) + '">' + I.close + '</button></div>';
    }).join('');
    t.scrollLeft = t.scrollWidth;
  }
  function clearPending() { pending = []; renderTray(); updSend(); }

  function addFiles(list) {
    var files = Array.prototype.slice.call(list || []);
    if (!files.length) return;
    if (!canAttach()) { toast('Gemini belum aktif, lampiran tidak bisa ditambahkan.', true); return; }
    var room = MAX_FILES - pending.length;
    if (room <= 0) { toast('Maksimal ' + MAX_FILES + ' lampiran per pesan.', true); return; }
    if (files.length > room) { toast('Hanya ' + room + ' lampiran pertama yang ditambahkan.', true); files = files.slice(0, room); }
    files.forEach(function (f) {
      var it = { id: uid(), name: f.name || 'file', size: f.size || 0, kind: 'file', label: '', thumb: '', parts: [], loading: true };
      /* Foto langsung tampil sebagai gambar kecil dengan putaran loading, tanpa nama file */
      if (/^image\//i.test(f.type || '') || IMG_EXT[extOf(f.name)]) {
        it.kind = 'image';
        try { it.pv = URL.createObjectURL(f); } catch (e) { it.pv = ''; }
      }
      pending.push(it);
      Promise.resolve().then(function () { return processFile(f); }).then(function (r) {
        var used = 0; pending.forEach(function (x) { if (x !== it && !x.loading) used += partsSize(x.parts); });
        var add = partsSize(r.parts), txt = r.parts.length && r.parts[0].text != null;
        if (!txt && used + add > LIM.inline) throw { message: 'Total lampiran terlalu besar. Kirim sebagian dulu.' };
        if (txt) { var tu = 0; pending.forEach(function (x) { if (x !== it && !x.loading && x.parts[0] && x.parts[0].text != null) tu += x.parts[0].text.length; }); if (tu + add > LIM.textTotal) throw { message: 'Total teks lampiran terlalu panjang. Kirim sebagian dulu.' }; }
        it.parts = r.parts; it.kind = r.kind; it.label = r.label; it.thumb = r.thumb || ''; it.view = r.view || ''; it.full = r.full || ''; it.mini = r.mini || ''; it.ar = r.ar || 0; it.loading = false;
      }).catch(function (e) {
        pending = pending.filter(function (x) { return x !== it; });
        toast((e && e.message) || 'File tidak bisa dibaca.', true);
      }).then(function () { if (it.pv) { var u = it.pv; it.pv = ''; renderTray(); try { URL.revokeObjectURL(u); } catch (e) { /* abaikan */ } } else renderTray(); updSend(); });
    });
    renderTray(); updSend();
  }

  /* Pratinjau di dalam obrolan memakai foto asli (dari memori atau IndexedDB) agar tajam, thumbnail hanya sementara */
  var inlCache = {};
  function dataToBlobUrl(d) {
    var m = /^data:(image\/jpeg);base64,(.+)$/.exec(String(d || '')); if (!m) return '';
    try { var bin = atob(m[2]), n = bin.length, u = new Uint8Array(n), i; for (i = 0; i < n; i++) u[i] = bin.charCodeAt(i); return URL.createObjectURL(new Blob([u], { type: m[1] })); } catch (e) { return ''; }
  }
  var PH_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  function phBox(ar) {
    ar = +ar > 0.05 && +ar < 20 ? +ar : 0.75;
    var mw = Math.min(240, Math.round((window.innerWidth || 360) * 0.64)), h = Math.min(340, mw / ar), w = h * ar;
    return [Math.round(w), Math.round(h)];
  }
  function inlineSrc(f) {
    if (f && f.iid && inlCache[f.iid]) return inlCache[f.iid];
    return safeThumb(f && f.thumb);
  }
  function upgradeInline() {
    msgs.forEach(function (m, mi) {
      (m.files || []).forEach(function (f, fi) {
        if (!f || !f.iid || inlCache[f.iid]) return;
        function apply(d) {
          var u = safeImg(d) ? dataToBlobUrl(d) : ''; if (!u) return;
          inlCache[f.iid] = u;
          if (msgs[mi] !== m) return;
          var el = document.querySelector('#gmBody img[data-gmv="m:' + mi + ':' + fi + '"]'); if (el) { el.src = u; el.classList.remove('ph'); el.style.width = ''; el.style.height = ''; }
        }
        if (safeImg(f.full)) apply(f.full); else idbGet('img', f.iid).then(apply);
      });
    });
  }

  function attHtml(files, mi) {
    if (!files || !files.length) return '';
    return '<div class="gm-atts">' + files.map(function (f, fi) {
      var th = inlineSrc(f);
      if (th) return '<div class="gm-att img"><img alt="Foto" src="' + th + '" data-gmv="m:' + mi + ':' + fi + '"></div>';
      if (f.kind === 'image' && f.iid) {
        var mn = safeThumb(f.mini), box = phBox(f.ar);
        return '<div class="gm-att img"><img class="ph" alt="Foto" src="' + (mn || PH_GIF) + '" style="width:' + box[0] + 'px;height:' + box[1] + 'px" data-gmv="m:' + mi + ':' + fi + '"></div>';
      }
      return '<div class="gm-att file"><span class="gm-fi">' + iconFor(f.kind) + '</span><span class="gm-fn"><b>' + esc(fileTitle(f)) + '</b><small>' + esc((f.label || KIND_LABEL[f.kind] || 'File') + ' • ' + fmtSize(f.size)) + '</small></span></div>';
    }).join('') + '</div>';
  }

  /* ---------- Penampil gambar layar penuh (zoom cubit, geser, ketuk dua kali) ---------- */
  var iv = null, ivS = { s: 1, x: 0, y: 0 }, ivPtr = {}, ivPinch = null, ivStart = { x: 0, y: 0 }, ivMoved = false, ivLastTap = 0, ivLastX = 0, ivLastY = 0;
  function safeImg(t) { t = String(t || ''); return t.indexOf('data:image/jpeg;base64,') === 0 ? t : ''; }
  function ivApply() {
    var im = $('gmIvImg'); if (im) im.style.transform = 'translate(' + ivS.x + 'px,' + ivS.y + 'px) scale(' + ivS.s + ')';
    if (iv) {
      var z = ivS.s > 1.01;                              /* saat diperbesar, tombol disembunyikan otomatis */
      iv.classList.toggle('zoomed', z);
      if (z) { var mn = $('gmIvMenu'); if (mn && !mn.hidden) ivMenu(false); }
    }
  }
  function ivClamp() {
    var st = $('gmIvStage'), im = $('gmIvImg'); if (!st || !im) return;
    if (ivS.s <= 1) { ivS.s = 1; ivS.x = 0; ivS.y = 0; return; }
    var ar = (im.naturalWidth && im.naturalHeight) ? im.naturalWidth / im.naturalHeight : 1, rw = Math.min(im.clientWidth || st.clientWidth, (im.clientHeight || st.clientHeight) * ar), rh = rw / ar;
    var mx = Math.max(0, (rw * ivS.s - st.clientWidth) / 2), my = Math.max(0, (rh * ivS.s - st.clientHeight) / 2);
    ivS.x = Math.min(mx, Math.max(-mx, ivS.x)); ivS.y = Math.min(my, Math.max(-my, ivS.y));
  }
  function ivZoomAt(cx, cy, ns) {
    var st = $('gmIvStage'); if (!st) return;
    ns = Math.min(6, Math.max(1, ns));
    var r = st.getBoundingClientRect(), px = cx - (r.left + r.width / 2), py = cy - (r.top + r.height / 2), k = ns / ivS.s;
    ivS.x = px - (px - ivS.x) * k; ivS.y = py - (py - ivS.y) * k; ivS.s = ns;
    ivClamp(); ivApply();
  }
  function ivPts() { return Object.keys(ivPtr).map(function (k) { return ivPtr[k]; }); }
  function ivDist() { var p = ivPts(); return p.length < 2 ? 0 : Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); }
  function ivCenter() { var p = ivPts(); return p.length < 2 ? { x: 0, y: 0 } : { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 }; }
  var ivCur = { src: '', name: '' };
  function ivBlob() {
    var m = /^data:(image\/jpeg);base64,(.+)$/.exec(ivCur.src || ''); if (!m) return null;
    try { var bin = atob(m[2]), n = bin.length, u = new Uint8Array(n), i; for (i = 0; i < n; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: m[1] }); } catch (e) { return null; }
  }
  function ivFileName() {
    var n = String(ivCur.file || ivCur.name || 'gambar').replace(/[\\\/:*?"<>|]+/g, '_').replace(/\.[A-Za-z0-9]{1,5}$/, '') || 'gambar';
    return n + '.jpg';
  }
  function ivMenu(show) {
    var mn = $('gmIvMenu'), bt = $('gmIvMore'); if (!mn || !bt) return;
    if (show) {
      var im = $('gmIvImg'), b = ivBlob(), kb = b ? Math.max(1, Math.round(b.size / 1024)) : 0;
      $('gmIvInfo').textContent = (ivCur.name || 'Gambar') + (im && im.naturalWidth ? ' \u2022 ' + im.naturalWidth + ' \u00d7 ' + im.naturalHeight : '') + (kb ? ' \u2022 ' + (kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB') : '');
      var can = false; try { can = !!(b && navigator.share && navigator.canShare && navigator.canShare({ files: [new File([b], ivFileName(), { type: 'image/jpeg' })] })); } catch (e) { can = false; }
      $('gmIvShare').hidden = !can;
    }
    mn.hidden = !show; bt.setAttribute('aria-expanded', show ? 'true' : 'false');
  }
  function ivDownload() {
    var b = ivBlob(); if (!b) return;
    try {
      var u = URL.createObjectURL(b), a = document.createElement('a');
      a.href = u; a.download = ivFileName(); a.rel = 'noopener'; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { a.remove(); URL.revokeObjectURL(u); } catch (e) { /* abaikan */ } }, 4000);
    } catch (e) { /* abaikan */ }
  }
  function ivShare() {
    var b = ivBlob(); if (!b) return;
    try { navigator.share({ files: [new File([b], ivFileName(), { type: 'image/jpeg' })] }).catch(function () { /* dibatalkan */ }); } catch (e) { /* abaikan */ }
  }
  var ivHoldT = 0, ivHeld = false;
  function ivHoldClear() { if (ivHoldT) { clearTimeout(ivHoldT); ivHoldT = 0; } }
  function ivHoldEnd() { ivHoldClear(); ivHeld = false; if (iv) iv.classList.remove('hold'); }
  function ivHoldStart() {
    ivHoldClear();
    ivHoldT = setTimeout(function () {
      ivHoldT = 0;
      if (!iv || !iv.classList.contains('open') || Object.keys(ivPtr).length !== 1 || ivMoved) return;
      ivHeld = true; ivMenu(false); iv.classList.add('hold');
    }, 350);
  }
  var ivFs = false;
  function ivEnterFs() {
    try {
      var el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen;
      if (rq && !(document.fullscreenElement || document.webkitFullscreenElement)) { var r = rq.call(el); ivFs = true; if (r && r.catch) r.catch(function () { ivFs = false; }); }
    } catch (e) { ivFs = false; }
  }
  function ivExitFs() {
    ivFs = false;
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) { var r = (document.exitFullscreen || document.webkitExitFullscreen).call(document); if (r && r.catch) r.catch(function () { /* abaikan */ }); }
    } catch (e) { /* abaikan */ }
  }
  function ivOnFs() {
    if (ivFs && iv && iv.classList.contains('open') && !(document.fullscreenElement || document.webkitFullscreenElement)) ivClose();   /* keluar layar penuh lewat tombol kembali = tutup penampil */
  }
  document.addEventListener('fullscreenchange', ivOnFs);
  document.addEventListener('webkitfullscreenchange', ivOnFs);
  function ivClose() {
    if (!iv) return;
    ivHoldEnd();
    ivMenu(false);
    ivExitFs();
    iv.classList.remove('open');
    var im = $('gmIvImg'); if (im) { im.onerror = null; im.removeAttribute('src'); }
    ivS = { s: 1, x: 0, y: 0 }; ivPtr = {}; ivPinch = null; ivApply();
  }
  function ivBuild() {
    if (iv) return iv;
    iv = document.createElement('div');
    iv.id = 'gmImgView'; iv.setAttribute('role', 'dialog'); iv.setAttribute('aria-modal', 'true'); iv.setAttribute('aria-label', 'Lihat gambar');
    iv.innerHTML = '<div class="gm-iv-stage" id="gmIvStage"><img id="gmIvImg" alt="" draggable="false"></div>' +
      '<div class="gm-iv-bar"><button type="button" class="gm-iv-btn" id="gmIvX" aria-label="Tutup gambar">' + I.close + '</button>' +
      '<div class="gm-iv-right"><button type="button" class="gm-iv-btn" id="gmIvMore" aria-label="Opsi gambar" aria-haspopup="true" aria-expanded="false">' + I.dots + '</button>' +
      '<button type="button" class="gm-iv-btn" id="gmIvDl" aria-label="Unduh gambar">' + I.dl + '</button></div></div>' +
      '<div class="gm-iv-menu" id="gmIvMenu" hidden><div class="gm-iv-info" id="gmIvInfo"></div><button type="button" class="gm-iv-mi" id="gmIvShare">' + I.share + '<span>Bagikan</span></button></div>';
    document.body.appendChild(iv);
    var st = $('gmIvStage');
    $('gmIvX').addEventListener('click', ivClose);
    $('gmIvMore').addEventListener('click', function (e) { e.stopPropagation(); ivMenu(!$('gmIvMenu').hidden ? false : true); });
    $('gmIvDl').addEventListener('click', function (e) { e.stopPropagation(); ivDownload(); });
    $('gmIvShare').addEventListener('click', function (e) { e.stopPropagation(); ivMenu(false); ivShare(); });
    iv.addEventListener('pointerdown', function (e) { if ($('gmIvMenu').hidden) return; if (!e.target.closest('#gmIvMenu') && !e.target.closest('#gmIvMore')) ivMenu(false); });
    st.addEventListener('pointerdown', function (e) {
      ivPtr[e.pointerId] = { x: e.clientX, y: e.clientY };
      try { st.setPointerCapture(e.pointerId); } catch (x) { /* abaikan */ }
      if (Object.keys(ivPtr).length === 1) { ivMoved = false; ivStart = { x: e.clientX, y: e.clientY }; ivHoldStart(); }
      if (Object.keys(ivPtr).length === 2) { ivPinch = { d: ivDist() || 1, s: ivS.s }; ivMoved = true; ivHoldEnd(); }
    });
    st.addEventListener('pointermove', function (e) {
      var p = ivPtr[e.pointerId]; if (!p) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (Object.keys(ivPtr).length >= 2 && ivPinch) { var c = ivCenter(); ivZoomAt(c.x, c.y, ivPinch.s * ivDist() / ivPinch.d); ivMoved = true; return; }
      if (Math.abs(e.clientX - ivStart.x) + Math.abs(e.clientY - ivStart.y) > 8) { ivMoved = true; ivHoldEnd(); }
      if (ivS.s > 1) { ivS.x += dx; ivS.y += dy; ivClamp(); ivApply(); }
    });
    function up(e, cancel) {
      var had = ivPtr[e.pointerId]; delete ivPtr[e.pointerId];
      var n = Object.keys(ivPtr).length;
      if (n < 2) ivPinch = null;
      var wasHeld = ivHeld; ivHoldEnd();
      if (!had || cancel || n > 0 || ivMoved || wasHeld) return;
      var ir = $('gmIvImg').getBoundingClientRect();              /* pointer capture membuat target selalu stage, jadi cek lewat koordinat */
      if (e.clientX < ir.left || e.clientX > ir.right || e.clientY < ir.top || e.clientY > ir.bottom) { ivClose(); return; }  /* ketuk area gelap di luar gambar = tutup */
      var now = Date.now();
      if (now - ivLastTap < 320 && Math.abs(e.clientX - ivLastX) < 32 && Math.abs(e.clientY - ivLastY) < 32) {
        ivLastTap = 0;
        if (ivS.s > 1) { ivS.s = 1; ivS.x = 0; ivS.y = 0; ivApply(); } else ivZoomAt(e.clientX, e.clientY, 2.5);
      } else { ivLastTap = now; ivLastX = e.clientX; ivLastY = e.clientY; }
    }
    st.addEventListener('pointerup', function (e) { up(e, false); });
    st.addEventListener('pointercancel', function (e) { up(e, true); });
    st.addEventListener('wheel', function (e) { e.preventDefault(); ivZoomAt(e.clientX, e.clientY, ivS.s * (e.deltaY < 0 ? 1.18 : 1 / 1.18)); }, { passive: false });
    st.addEventListener('dblclick', function (e) { e.preventDefault(); });
    st.addEventListener('contextmenu', function (e) { e.preventDefault(); e.stopPropagation(); return false; });
    /* Cegah getar dan bunyi bawaan Android saat tekan lama: sentuhan di area foto tidak diteruskan ke perilaku bawaan browser */
    ['touchstart', 'touchmove', 'touchend'].forEach(function (t) { st.addEventListener(t, function (e) { if (e.cancelable) e.preventDefault(); }, { passive: false }); });
    ['selectstart', 'dragstart', 'gesturestart'].forEach(function (t) { st.addEventListener(t, function (e) { e.preventDefault(); }); });
    return iv;
  }
  function ivOpen(src, name, file) {
    src = safeImg(src);
    if (!src) { toast('Gambar tidak bisa dibuka.', true); return; }
    ivBuild();
    var im = $('gmIvImg');
    ivS = { s: 1, x: 0, y: 0 }; ivPtr = {}; ivPinch = null; ivLastTap = 0; ivApply();
    im.onerror = function () { ivClose(); toast('Gambar tidak bisa dibuka.', true); };
    ivHoldEnd(); ivCur = { src: src, name: name || '', file: file || name || '' }; ivMenu(false);
    im.alt = name || ''; im.src = src;
    iv.classList.add('open');
    ivEnterFs();
  }
  /* Buka foto asli (resolusi penuh) dari memori atau IndexedDB; thumbnail hanya cadangan terakhir */
  function openImgOf(f) {
    if (!f) return;
    var fb = safeImg(f.view) || safeImg(f.thumb) || safeImg(f.mini), full = safeImg(f.full);
    if (full) { ivOpen(full, 'Foto', f.name); return; }
    if (!f.iid) { ivOpen(fb, 'Foto', f.name); return; }
    idbGet('img', f.iid).then(function (d) { ivOpen(safeImg(d) || fb, 'Foto', f.name); });
  }
  function bindViewer() {
    var body = $('gmBody'), tray = $('gmTray');
    if (body) body.addEventListener('click', function (e) {
      var im = e.target && e.target.closest ? e.target.closest('img[data-gmv]') : null; if (!im) return;
      var k = String(im.getAttribute('data-gmv') || '').split(':'), m = msgs[+k[1]], f = m && m.files && m.files[+k[2]];
      if (!f) return;
      openImgOf(f);
    });
    if (tray) tray.addEventListener('click', function (e) {
      var im = e.target && e.target.closest ? e.target.closest('img[data-gmv]') : null; if (!im) return;
      var id = String(im.getAttribute('data-gmv') || '').slice(2), x = null;
      pending.forEach(function (it) { if (it.id === id) x = it; });
      if (x) openImgOf(x);
    });
  }

  /* ---------- Menu plus ---------- */
  function closePop() { var p = $('gmPop'); if (p) p.hidden = true; }
  function togglePop() { var p = $('gmPop'); p.hidden = !p.hidden; }
  function fit() { var t = $('gmInput'); t.style.height = '40px'; t.style.height = Math.min(Math.max(t.scrollHeight, 40), 140) + 'px'; }
  function syncSend() { updSend(); }

  /* ---------- Buka / tutup ---------- */
  function pin() {
    var vv = window.visualViewport, p = $('gmPanel');
    if (!vv || !p.classList.contains('open')) return;
    p.style.height = vv.height + 'px'; p.style.top = vv.offsetTop + 'px';
  }
  function open() {
    if (!gmOn()) {
      /* layar nonaktif: tanpa riwayat, tanpa obrolan, tanpa kolom ketik */
      msgs = []; chats = []; curId = '';
      closeDrawer(); closePop();
      $('gmPanel').classList.add('open');
      pin(); render();
      if (window.visualViewport) { window.visualViewport.addEventListener('resize', pin); window.visualViewport.addEventListener('scroll', pin); }
      return;
    }
    myId = (window.__ngobrolFB && window.__ngobrolFB.getMyId && window.__ngobrolFB.getMyId()) || myId;
    var liveId = busy ? curId : '', liveMsgs = busy ? msgs : null;
    loadHist();
    if (liveMsgs && liveMsgs.length) { curId = liveId; msgs = liveMsgs; }
    $('gmPanel').classList.add('open'); closeDrawer(); closePop();
    pin(); render(); scrollEnd(false);
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', pin); window.visualViewport.addEventListener('scroll', pin); }
  }
  function close() {
    var p = $('gmPanel'); p.classList.remove('open'); p.classList.remove('drawer-open'); p.style.height = ''; p.style.top = '';
    $('gmInput').blur();
    if (window.visualViewport) { window.visualViewport.removeEventListener('resize', pin); window.visualViewport.removeEventListener('scroll', pin); }
  }

  /* ---------- Sinkron database ---------- */
  function waitBridge() {
    return new Promise(function (res) {
      var delay = 150;
      (function p() {
        var b = window.__ngobrolFB;
        if (b && b.getMyId && b.getMyId()) return res(b);
        delay = Math.min(1000, Math.round(delay * 1.3));
        setTimeout(p, delay);
      })();
    });
  }
  function parseKeys(v) {
    var list = [];
    if (v.apiKey) list.push(v.apiKey);
    if (v.apiKeys && typeof v.apiKeys === 'object') Object.keys(v.apiKeys).forEach(function (i) { list.push(v.apiKeys[i]); });
    var seen = {};
    return list.map(function (x) { return String(x || '').trim(); }).filter(function (x) { if (x.length < 10 || seen[x]) return false; seen[x] = 1; return true; });
  }
  function resetCfg() {
    KEYS = []; OFF = []; PRIMARY = ''; META = null; tmpBad = {}; OVR = {}; loaded = false;
  }
  function applyConfig(v) {
    META = v;
    var list = parseKeys(v), off = [];
    if (v.keysOff && typeof v.keysOff === 'object') Object.keys(v.keysOff).forEach(function (i) { if (list.indexOf(v.keysOff[i]) !== -1) off.push(v.keysOff[i]); });
    var prim = typeof v.primary === 'string' && list.indexOf(v.primary.trim()) !== -1 ? v.primary.trim() : '';
    /* Model dikunci ke Gemini Flash Lite. Abaikan pilihan model lama yang tersimpan
       agar konfigurasi Pro/Flash terdahulu tidak dapat mengubah model aktif. */
    var model = DEFAULT_MODEL;
    var changed = list.join('|') !== KEYS.join('|') || off.join('|') !== OFF.join('|') || prim !== PRIMARY;
    if (changed) { tmpBad = {}; if (loaded) actSave(''); }   /* pengaturan diubah admin: mulai ulang pilihan kunci */
    if (model !== MODEL) { OVR = {}; tmpBad = {}; if (loaded) actSave(''); }
    KEYS = list; OFF = off; PRIMARY = prim; MODEL = model;
    loaded = true; synced = true;
    if ($('gmPanel').classList.contains('open')) render();
    if ($('gmAdmin').classList.contains('open')) renderAdmin();
    syncSend();
    autoMain();
  }
  /* Berlangganan daftar kunci. Hanya berjalan saat sakelar aktif dan sudah terkonfirmasi database. */
  function detachConfig() {
    if (unsubCfg) { try { unsubCfg(); } catch (e) { /* diabaikan */ } }
    unsubCfg = null;
  }
  function attachConfig() {
    var b = window.__ngobrolFB;
    if (unsubCfg || !b || !b.db || !b.ref || !b.onValue || !b.getMyId || !b.getMyId()) return;
    if (!gmOn() || !gateKnown()) return;
    myId = b.getMyId();
    function denied() {
      /* dibaca ditolak (mis. layanan baru saja dinonaktifkan): buang semua kunci dari memori */
      unsubCfg = null; resetCfg(); synced = true;
      if (gmOn()) { render(); if ($('gmAdmin').classList.contains('open')) renderAdmin(); }
    }
    try {
      var off = b.onValue(b.ref(b.db, 'config/gemini'), function (snap) {
        if (!gmOn()) return;
        applyConfig(snap.val() || {});
      }, denied);
      unsubCfg = typeof off === 'function' ? off : function () {};
    } catch (e) { denied(); }
  }
  /* Layanan dinonaktifkan: hentikan permintaan, tutup semua layar, dan buang kunci dari memori */
  function lockdown() {
    detachConfig();
    stopRun();
    resetCfg(); synced = false;
    msgs = []; chats = []; curId = ''; pending = [];
    try {
      renderTray(); closeDrawer(); closePop(); hideCtx(); hideDlg();
      $('gmInput').value = ''; fit();
      render();
      if ($('gmAdmin').classList.contains('open')) renderAdmin();
    } catch (e) { /* diabaikan */ }
    syncService();
  }
  function onGate() {
    syncService();
    if (!gmOn()) { lockdown(); return; }
    if ($('gmPanel').classList.contains('open')) { loadHist(); render(); }
    attachConfig();
  }
  function startSync() {
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* abaikan */ }
    waitBridge().then(function (b) {
      myId = b.getMyId();
      if (gmOn()) attachConfig(); else lockdown();
      b.onValue(b.ref(b.db, 'users/' + myId + '/role'), function (snap) {
        admin.is = snap.val() === 'admin';
        try { document.documentElement.classList.toggle('gm-adm', admin.is); } catch (e) { /* diabaikan */ }
        if (!admin.is) closeAdmin();
        syncService();
        if ($('gmPanel').classList.contains('open')) render();
        autoMain();
      }, function () {});
    });
  }

  /* ---------- Pengaturan admin ---------- */
  /* Pesan di panel admin: hanya penanda merah pada kolom input (sama seperti YouTube) */
  var msgTimer = 0;
  function admMsg(t, ok, keep) {
    var f = $('gmAdmField');
    clearTimeout(msgTimer);
    if (!t) { if (f) f.classList.remove('err'); return; }
    if (f) f.classList.toggle('err', !ok && $('gmPaneAdd').classList.contains('on'));
    if (!keep) msgTimer = setTimeout(function () { admMsg(''); }, t.length > 45 ? 4000 : 2000);
  }
  function setStatus(t, kind) { admMsg(t, kind !== 'bad'); }
  var MASK_OK = (function () { try { return !!(window.CSS && CSS.supports && CSS.supports('-webkit-text-security', 'disc')); } catch (e) { return false; } })();
  function setReveal(show) {
    var i = $('gmKeyInput'), b = $('gmEye');
    /* Teks biasa + penyamaran CSS agar browser tidak menawarkan "Simpan sandi". Cadangan: type=password */
    if (MASK_OK) { i.type = 'text'; i.classList.toggle('yt-secret', !show); } else { i.type = show ? 'text' : 'password'; i.classList.remove('yt-secret'); }
    b.innerHTML = show ? I.eye : I.eyeOff;
    b.setAttribute('aria-pressed', show ? 'true' : 'false');
    b.setAttribute('aria-label', show ? 'Sembunyikan kunci' : 'Tampilkan kunci');
    b.title = show ? 'Sembunyikan kunci' : 'Tampilkan kunci';
  }
  function isRevealed() { return $('gmEye').getAttribute('aria-pressed') === 'true'; }

  function saveConfig(next) {
    var b = window.__ngobrolFB;
    if (!b || !admin.is) return Promise.reject(new Error('Hanya admin yang dapat mengubah pengaturan Gemini.'));
    if (!gmOn()) return Promise.reject(new Error('Gemini sedang dinonaktifkan. Aktifkan layanan lebih dulu.'));
    if (!loaded) return Promise.reject(new Error('Data kunci belum selesai dimuat. Tunggu sebentar lalu coba lagi.'));
    var keys = next.keys, off = next.off.filter(function (k) { return keys.indexOf(k) !== -1; });
    var prim = keys.indexOf(next.primary) !== -1 ? next.primary : '';
    return b.set(b.ref(b.db, 'config/gemini'), {
      apiKey: keys[0] || '', apiKeys: keys, keysOff: off, primary: prim, model: next.model || DEFAULT_MODEL,
      updatedBy: b.getMyId(), updatedByName: b.getMyName ? b.getMyName() : '', updatedAt: Date.now()
    });
  }
  function cfg(over) { return Object.assign({ keys: KEYS.slice(), off: OFF.slice(), primary: PRIMARY, model: MODEL }, over || {}); }
  function fail(e) { admMsg(e && e.message ? e.message : 'Gagal menyimpan. Periksa koneksi dan aturan database.', false); }

  /* ---------- Sakelar layanan (admin) ---------- */
  function syncService() {
    var on = gmOn(), label = on ? 'Nonaktifkan Gemini' : 'Aktifkan Gemini';
    var text = on ? 'Aktif untuk semua pengguna' : 'Nonaktif untuk semua pengguna';
    ['gmSvcSw', 'setGmSw'].forEach(function (id) {
      var sw = $(id); if (!sw) return;
      sw.setAttribute('aria-checked', on ? 'true' : 'false');
      sw.setAttribute('aria-label', label);
      sw.disabled = !!svcBusy;
    });
    if ($('gmSvcState')) $('gmSvcState').textContent = text;
    if ($('setGmState')) $('setGmState').textContent = text;
    if ($('gmSvcIco')) $('gmSvcIco').innerHTML = on ? spark() : I.power;
    if ($('gmSvc')) $('gmSvc').classList.toggle('off', !on);
    if ($('gmAdCard')) $('gmAdCard').classList.toggle('svc-off', !on);
  }
  function svcError(e) {
    if (e && (e.code === 'PERMISSION_DENIED' || /permission[_ ]denied/i.test(String(e.message || '')))) {
      return 'Gagal disimpan: ditolak oleh aturan database. Tempel ulang Rules dari database.rules.youtube.json di Firebase lalu Publish.';
    }
    return 'Pengaturan gagal disimpan. Periksa koneksi internet.';
  }
  function setService(on) {
    if (svcBusy || locked || !admin.is || !window.GMGate) return;
    if (on === gmOn()) return;
    svcBusy = true; syncService();
    window.GMGate.set(on).then(function () {
      admMsg(on ? 'Gemini diaktifkan untuk semua pengguna.' : 'Gemini dinonaktifkan untuk semua pengguna.', true);
    }).catch(function (e) { admMsg(svcError(e), false); })
      .then(function () { svcBusy = false; syncService(); });
  }

  var STATE_LABEL = { using: 'Sedang dipakai', standby: 'Siaga', limit: 'LIMIT', bad: 'Bermasalah', off: 'Nonaktif' };
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  function stateNote(k, st) {
    if (st === 'using') return 'Semua permintaan Gemini lewat kunci ini.';
    if (st === 'standby') return 'Cadangan: belum dipakai, kuota masih utuh.';
    if (st === 'limit') return 'Kuota harian habis. Pulih ' + resetText() + '.';
    if (st === 'bad') { var t = tmpBad[k]; return t && t.kind === 'limit' ? 'Terlalu banyak permintaan. Dicoba lagi otomatis.' : 'Ditolak Google (kunci salah atau API belum aktif). Dicoba lagi otomatis.'; }
    return 'Dinonaktifkan. Tidak dipakai.';
  }
  function ago(iso) {
    var t = Date.parse(iso); if (!t) return '';
    var sec = Math.max(1, (Date.now() - t) / 1000);
    var u = [[31536000, 'tahun'], [2592000, 'bulan'], [604800, 'minggu'], [86400, 'hari'], [3600, 'jam'], [60, 'menit']];
    for (var i = 0; i < u.length; i++) if (sec >= u[i][0]) return Math.floor(sec / u[i][0]) + ' ' + u[i][1] + ' lalu';
    return 'baru saja';
  }
  var locked = false;   /* true selama ada penyimpanan berjalan: ketukan ganda diabaikan agar data tidak tertimpa */
  function setLocked(on) {
    locked = !!on;
    ['gmAddBtn', 'gmAdX', 'gmTabKeys', 'gmTabAdd'].forEach(function (i) { var el = $(i); if (el) el.disabled = on; });
    $('gmKeyList').classList.toggle('is-busy', !!on);
  }
  /* Jalankan satu penyimpanan: kunci dikunci selama berjalan, lalu pesan sukses atau galat */
  function act(make, okMsg) {
    if (locked) return;
    setLocked(true); admMsg('');
    var p; try { p = make(); } catch (e) { p = Promise.reject(e); }
    Promise.resolve(p).then(function () { if (okMsg) admMsg(okMsg, true); }).catch(fail).then(function () { setLocked(false); });
  }

  function renderAdmin() {
    var modelBox = $('gmModels'); if (modelBox) modelBox.innerHTML = ''; /* Model dikunci otomatis ke Gemini Flash Lite; pemilih tidak ditampilkan. */
    var n = KEYS.length, on = activeKeys().length;
    var lim = KEYS.filter(function (k) { return keyState(k) === 'limit'; }).length;
    $('gmStTotal').textContent = n; $('gmStOn').textContent = on; $('gmStLimit').textContent = lim;
    $('gmAdmCount').textContent = n + ' dari 10 terpakai'; $('gmTabCnt').textContent = n;
    var cur = currentKey(), main = mainKey();
    $('gmKeyList').innerHTML = n ? KEYS.map(function (k, i) {
      var st = keyState(k), isOn = OFF.indexOf(k) === -1;
      if (st === 'ok') st = k === cur ? 'using' : 'standby';
      return '<div class="yt-key-row st-' + st + (isOn ? '' : ' is-off') + '">' +
        '<div class="yt-key-top"><div class="yt-key-no">' + (i + 1) + '</div>' +
        '<div class="yt-key-info"><span class="yt-key-mask">' + esc(maskKey(k)) + '</span><span class="yt-key-badge ' + st + '">' + STATE_LABEL[st] + '</span>' +
        '<span class="yt-key-note">' + esc(stateNote(k, st)) + '</span></div>' +
        (k === main ? '<span class="yt-key-prim">' + CHECK + 'Utama</span>' : '<button type="button" class="yt-key-use" data-i="' + i + '" aria-label="Jadikan kunci ' + (i + 1) + ' sebagai kunci utama">Pakai</button>') + '</div>' +
        '<div class="yt-key-bar"><div class="yt-key-sw"><button type="button" class="yt-sw" role="switch" data-i="' + i + '" aria-checked="' + (isOn ? 'true' : 'false') + '" aria-label="' + (isOn ? 'Nonaktifkan' : 'Aktifkan') + ' kunci ' + (i + 1) + '"></button>' +
        '<span class="yt-key-swlbl">' + (isOn ? 'Kunci aktif' : 'Kunci nonaktif') + '</span></div>' +
        '<button type="button" class="yt-key-del" data-i="' + i + '" aria-label="Hapus kunci ' + (i + 1) + '">' + I.trash + '<span>Hapus</span></button></div></div>';
    }).join('') : '<div class="yt-key-empty">Belum ada API key.<br>Tempel kunci pertama Anda di bawah.</div>';
    var m = META || {}, meta = '';
    if (n && m.updatedAt) meta = 'Terakhir diubah oleh ' + (m.updatedByName || m.updatedBy || 'admin') + ', ' + ago(new Date(m.updatedAt).toISOString());
    $('gmAdmMeta').textContent = meta; $('gmAdmMeta').style.display = meta ? '' : 'none';
  }
  function setTab(t) {
    var add = t === 'add';
    $('gmTabKeys').setAttribute('aria-selected', add ? 'false' : 'true'); $('gmTabAdd').setAttribute('aria-selected', add ? 'true' : 'false');
    $('gmPaneKeys').classList.toggle('on', !add); $('gmPaneAdd').classList.toggle('on', add);
    $('gmAdActions').hidden = !add; $('gmAdCard').classList.toggle('has-actions', add);
    if ($('gmAdScroll')) $('gmAdScroll').scrollTop = 0;
    admMsg('');
  }
  /* Tempelkan panel persis pada area layar yang terlihat, agar tidak bergeser atau tertutup keyboard */
  var pinned = false;
  function pinApply() {
    var vv = window.visualViewport, el = $('gmAdmin'), card = $('gmAdCard');
    if (!vv || !el) return;
    el.style.left = vv.offsetLeft + 'px'; el.style.top = vv.offsetTop + 'px';
    el.style.width = vv.width + 'px'; el.style.height = vv.height + 'px';
    el.style.right = 'auto'; el.style.bottom = 'auto';
    card.classList.toggle('compact', vv.height < 560);
  }
  function pinOn() {
    var vv = window.visualViewport; if (!vv) return;
    if (!pinned) { pinned = true; vv.addEventListener('resize', pinApply); vv.addEventListener('scroll', pinApply); }
    pinApply();
  }
  function pinOff() {
    var vv = window.visualViewport, el = $('gmAdmin');
    if (vv && pinned) { vv.removeEventListener('resize', pinApply); vv.removeEventListener('scroll', pinApply); }
    pinned = false;
    if (el) ['left', 'top', 'width', 'height', 'right', 'bottom'].forEach(function (p) { el.style.removeProperty(p); });
    var c = $('gmAdCard'); if (c) c.classList.remove('compact');
  }
  function openAdmin() {
    if (!admin.is) return;
    syncService();
    $('gmKeyInput').value = ''; setReveal(false);
    renderAdmin(); setTab(KEYS.length ? 'keys' : 'add'); $('gmAdmin').classList.add('open'); pinOn();
  }
  function closeAdmin() { var a = $('gmAdmin'); if (a) a.classList.remove('open'); closeConfirm(); admMsg(''); pinOff(); }

  function addKey() {
    if (locked) return;
    var inp = $('gmKeyInput'), k = inp.value.trim().replace(/^["'`]+|["'`]+$/g, '').replace(/\s+/g, '');   /* buang tanda kutip bila tertempel */
    if (!k) { admMsg('Masukkan API key.'); return; }
    if (k.length < 20) { admMsg('Format API key tidak valid.'); return; }
    if (KEYS.indexOf(k) !== -1) { admMsg('Kunci ini sudah ada dalam daftar.'); return; }
    if (KEYS.length >= 10) { admMsg('Maksimal 10 API key.'); return; }
    setLocked(true); admMsg('Memeriksa kunci...', true, true);
    var okState = 'ok';
    listModels(k).catch(function (e) { if (e && (e.kind === 'limit' || e.kind === 'rate' || e.kind === 'rate?')) { if (e.kind === 'limit') okState = 'limit'; return null; } throw e; }).then(function (ids) {
      var model = MODEL;
      if (ids) {
        if (ids.indexOf(MODEL) === -1) {
          model = pickModel(ids, tierOf(MODEL));
          if (!model) throw { kind: 'model', message: 'Kunci valid, tetapi tidak ada model Gemini yang tersedia untuk kunci ini.' };
        }
        OVR[MODEL] = model;
      }
      /* uji generate sungguhan agar kunci benar-benar terbukti bisa dipakai */
      return callGemini(k, { contents: [{ role: 'user', parts: [{ text: 'Balas hanya: ok' }] }], generationConfig: { maxOutputTokens: 16 } }, undefined, model).then(function () { return model; }, function (e) {
        if (e && (e.kind === 'limit' || e.kind === 'rate' || e.kind === 'rate?')) { if (e.kind === 'limit') okState = 'limit'; return model; }
        throw e;
      });
    }).then(function (model) {
      var next = cfg({ keys: KEYS.concat([k]) });
      if (!mainKey()) next.primary = k;   /* belum ada kunci utama yang bisa dipakai: kunci baru jadi utama */
      return saveConfig(next).then(function () {
        if (okState === 'limit') markExhausted(k);
        inp.value = '';
        setTab('keys');
        admMsg(okState === 'limit' ? 'Kunci ditambahkan, tetapi kuota hari ini sudah habis. Akan dipakai lagi saat kuota pulih.' : 'Kunci berhasil ditambahkan.', true);
      });
    }).catch(function (e) {
      if (e && e.kind === 'invalid') admMsg('API key tidak valid.');
      else if (e && e.kind === 'model') admMsg('Model tidak tersedia. Coba pilih model lain.');
      else if (e && e.message && e.message.indexOf('Failed to fetch') !== -1) admMsg('Tidak bisa terhubung ke Google. Periksa koneksi internet.');
      else fail(e);
    }).then(function () { setLocked(false); });
  }

  function toggleKey(i) {
    if (locked) return;
    var k = KEYS[i]; if (k == null) return;
    var off = OFF.indexOf(k) === -1 ? OFF.concat([k]) : OFF.filter(function (x) { return x !== k; });
    var turnOff = off.indexOf(k) !== -1, np = PRIMARY, promoted = false;
    if (turnOff && k === PRIMARY) { np = pickPrimary(KEYS, off, k); promoted = !!np; }   /* kunci utama dinonaktifkan: kunci aktif berikutnya jadi utama */
    else if (!turnOff && !mainKey()) { np = k; promoted = true; }                          /* belum ada kunci utama: yang pertama diaktifkan jadi utama */
    act(function () { return saveConfig(cfg({ off: off, primary: np })); },
      'Kunci ' + (i + 1) + (turnOff ? ' dinonaktifkan.' : ' diaktifkan.') + (promoted && KEYS.indexOf(np) >= 0 ? ' Kunci ' + (KEYS.indexOf(np) + 1) + ' jadi utama.' : ''));
  }
  function setPrimary(i) {
    if (locked) return;
    var k = KEYS[i]; if (k == null || (k === PRIMARY && OFF.indexOf(k) === -1)) return;
    var wasOff = OFF.indexOf(k) !== -1, lim = keyState(k) === 'limit';
    act(function () { return saveConfig(cfg({ primary: k, off: OFF.filter(function (x) { return x !== k; }) })); },
      wasOff ? 'Kunci ' + (i + 1) + ' diaktifkan dan dijadikan utama.' : lim ? 'Kunci ' + (i + 1) + ' jadi utama, tetapi sedang limit.' : 'Kunci ' + (i + 1) + ' dijadikan utama.');
  }
  var pendingDel = null;
  function askDelete(i) {
    var k = KEYS[i]; if (k == null) return;
    pendingDel = k;
    $('gmCfIco').innerHTML = I.alert;
    $('gmCfKey').textContent = 'Kunci ' + (i + 1) + '  \u00b7  ' + maskKey(k);
    $('gmCfOk').disabled = false; $('gmCfNo').disabled = false;
    $('gmAdConfirm').classList.add('open');
    setTimeout(function () { $('gmCfNo').focus(); }, 40);
  }
  function closeConfirm() { pendingDel = null; var c = $('gmAdConfirm'); if (c) c.classList.remove('open'); }
  function doDelete() {
    var k = pendingDel; if (k == null || locked) return;
    setLocked(true);
    $('gmCfOk').disabled = true; $('gmCfNo').disabled = true; $('gmCfOk').textContent = 'Menghapus...';
    var rest = KEYS.filter(function (x) { return x !== k; });
    saveConfig(cfg({ keys: rest, primary: k === PRIMARY ? pickPrimary(rest, OFF, k) : PRIMARY }))
      .then(function () { closeConfirm(); admMsg('Kunci dihapus.', true); })
      .catch(function (e) { closeConfirm(); fail(e); })
      .then(function () { $('gmCfOk').textContent = 'Ya, hapus'; setLocked(false); });
  }

  /* ---------- Inisialisasi ---------- */
  function init() {
    if (!$('gmPanel') || !$('gmFab')) return;
    $('gmFab').innerHTML = spark();
    $('gmPillIc').innerHTML = spark();
    $('gmAdLogo').innerHTML = I.key;
    $('gmMenu').innerHTML = I.menu;
    $('gmNew').innerHTML = I.chat;
    $('gmSrchBtn').innerHTML = I.search;
    $('gmBack').insertAdjacentHTML('afterbegin', I.back);
    $('gmOffBack').innerHTML = I.back; $('gmOffBack').addEventListener('click', close);
    $('gmKeyBtn').insertAdjacentHTML('afterbegin', I.key);
    $('gmClearAll').insertAdjacentHTML('afterbegin', I.trash);
    $('gmNew2').insertAdjacentHTML('afterbegin', I.compose);
    $('gmPlus').innerHTML = I.plus;
    $('gmPopPhoto').insertAdjacentHTML('afterbegin', I.photo);
    $('gmPopCam').insertAdjacentHTML('afterbegin', I.camera);
    $('gmPopFile').insertAdjacentHTML('afterbegin', I.file);
    $('gmAdX').innerHTML = I.close;
    $('gmDown').innerHTML = I.down;
    updSend();
    $('gmBody').addEventListener('scroll', updDown, { passive: true });
    $('gmDown').addEventListener('click', function () { scrollEnd(true); });
    setReveal(false);

    $('gmFab').addEventListener('click', open);
    $('gmBack').addEventListener('click', close);
    $('gmMenu').addEventListener('click', openDrawer);
    $('gmScrim').addEventListener('click', closeDrawer);
    $('gmNew').addEventListener('click', newChat);
    $('gmNew2').addEventListener('click', newChat);
    $('gmPill').addEventListener('click', function () { if (admin.is) openAdmin(); });
    $('gmKeyBtn').addEventListener('click', function () { closeDrawer(); openAdmin(); });
    $('gmSrchBtn').addEventListener('click', toggleSearch);
    $('gmSrchIn').addEventListener('input', function () { srchQ = this.value; renderDrawer(); });
    $('gmClearAll').addEventListener('click', function () {
      askDlg('Hapus semua obrolan', 'Yakin ingin menghapus semua obrolan? Tindakan ini tidak dapat dibatalkan.', clearAll);
    });
    $('gmCtxBg').addEventListener('click', function (e) { if (e.target === this && Date.now() - ctxAt > 400) hideCtx(); });
    $('gmCtxDel').addEventListener('click', function () {
      var id = ctxId; hideCtx();
      if (id) askDlg('Hapus obrolan', 'Yakin ingin menghapus obrolan ini? Tindakan ini tidak dapat dibatalkan.', function () { delChat(id); });
    });
    $('gmDlgNo').addEventListener('click', hideDlg);
    $('gmDlg').addEventListener('click', function (e) { if (e.target === this) hideDlg(); });
    $('gmDlgYes').addEventListener('click', function () { var f = dlgAct; hideDlg(); if (f) f(); });
    ['gmDrawer', 'gmCtxBg', 'gmDlg'].forEach(function (id) {
      var el = $(id);
      el.addEventListener('selectstart', function (e) { if (!e.target.closest || !e.target.closest('input')) e.preventDefault(); });
      el.addEventListener('contextmenu', function (e) { if (!e.target.closest || !e.target.closest('input')) e.preventDefault(); });
    });
    var hist = $('gmHist');
    function rowOf(e) { return e.target.closest ? e.target.closest('.gm-hi') : null; }
    hist.addEventListener('pointerdown', function (e) {
      var row = rowOf(e); if (!row || (e.pointerType === 'mouse' && e.button !== 0)) return;
      longFired = false; pressX = e.clientX; pressY = e.clientY;
      clearTimeout(pressT);
      pressT = setTimeout(function () { longFired = true; showCtx(row.dataset.id, row); }, 450);
    });
    hist.addEventListener('pointermove', function (e) { if (pressT && (Math.abs(e.clientX - pressX) > 8 || Math.abs(e.clientY - pressY) > 8)) { clearTimeout(pressT); pressT = 0; } });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { hist.addEventListener(n, function () { clearTimeout(pressT); pressT = 0; }); });
    hist.addEventListener('scroll', function () { clearTimeout(pressT); pressT = 0; }, { passive: true });
    hist.addEventListener('contextmenu', function (e) {
      var row = rowOf(e); if (!row) return;
      e.preventDefault(); clearTimeout(pressT); pressT = 0; longFired = true; showCtx(row.dataset.id, row);
    });
    $('gmDrawer').addEventListener('click', function (e) {
      var t = e.target.closest('[data-h]'); if (!t) return;
      var a = t.dataset.h;
      if (longFired) { longFired = false; return; }
      if (a === 'open') openChat(t.dataset.id);
      else if (a === 'more') { showAll = !showAll; renderDrawer(); }
    });
    $('gmPlus').addEventListener('click', function (e) { e.stopPropagation(); togglePop(); });
    [['gmPopPhoto', 'gmFilePhoto'], ['gmPopCam', 'gmFileCam'], ['gmPopFile', 'gmFileAny']].forEach(function (pr) {
      var inp = $(pr[1]);
      $(pr[0]).addEventListener('click', function (e) { e.stopPropagation(); closePop(); if (!canAttach()) { toast('Gemini belum aktif, lampiran tidak bisa ditambahkan.', true); return; } inp.value = ''; inp.click(); });
      inp.addEventListener('change', function () { var fl = Array.prototype.slice.call(inp.files || []); inp.value = ''; addFiles(fl); });
    });
    $('gmTray').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-rm]') : null; if (!b) return;
      var id = b.getAttribute('data-rm'); pending = pending.filter(function (x) { return x.id !== id; }); renderTray(); updSend();
    });
    $('gmInput').addEventListener('paste', function (e) {
      var fl = e.clipboardData && e.clipboardData.files; if (fl && fl.length) { e.preventDefault(); addFiles(fl); }
    });
    var wrap = document.querySelector('#gmPanel .gm-wrap');
    if (wrap) {
      wrap.addEventListener('dragover', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') !== -1) e.preventDefault(); });
      wrap.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { e.preventDefault(); addFiles(e.dataTransfer.files); } });
    }
    document.addEventListener('click', function (e) { if (!e.target.closest('#gmPop')) closePop(); });
    $('gmAdX').addEventListener('click', closeAdmin);
    $('gmAdmin').addEventListener('click', function (e) { if (e.target === $('gmAdmin')) closeAdmin(); });
    $('gmEye').addEventListener('click', function () { setReveal(!isRevealed()); $('gmKeyInput').focus(); });
    setReveal(false);
    $('gmAddBtn').addEventListener('click', addKey);
    $('gmKeyInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addKey(); } });
    $('gmTabKeys').addEventListener('click', function () { setTab('keys'); });
    $('gmTabAdd').addEventListener('click', function () { setTab('add'); });
    $('gmKeyList').addEventListener('click', function (e) {
      var u = e.target.closest('.yt-key-use'); if (u) { setPrimary(+u.dataset.i); return; }
      var w = e.target.closest('.yt-sw'); if (w) { toggleKey(+w.dataset.i); return; }
      var d = e.target.closest('.yt-key-del'); if (d) askDelete(+d.dataset.i);
    });
    /* Tidak ada event pemilihan model: Gemini Flash Lite selalu digunakan. */
    $('gmAdConfirm').addEventListener('click', function (e) { if (e.target === $('gmAdConfirm')) closeConfirm(); });
    $('gmCfNo').addEventListener('click', closeConfirm);
    $('gmCfOk').addEventListener('click', doDelete);

    bindViewer();
    $('gmSend').addEventListener('click', function () {
      if (busy) { if (ctrl) ctrl.abort(); return; }
      if ($('gmInput').value.trim() || pending.length) send($('gmInput').value); else $('gmInput').focus();
    });
    $('gmInput').addEventListener('input', function () { fit(); syncSend(); });
    $('gmInput').addEventListener('keydown', function (e) {
      var touch = window.matchMedia && matchMedia('(pointer:coarse)').matches;
      if (e.key === 'Enter' && !e.shiftKey && !touch) { e.preventDefault(); send($('gmInput').value); }
    });
    $('gmBody').addEventListener('click', function (e) {
      var t = e.target.closest('[data-gm]'); if (!t) return;
      var a = t.dataset.gm;
      if (a === 'admin' || a === 'svc') openAdmin();
      else if (a === 'back') close();
      else if (a === 'retry') retry();
      else if (a === 'regen') regen();
      else if (a === 'copycode') { var c = t.closest('.gm-code'); if (c) copyText(c.querySelector('code').textContent); }
      else if (a === 'copy') { var m = msgs[+t.dataset.i]; if (m) copyText(m.text); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (iv && iv.classList.contains('open')) ivClose();
      else if (!$('gmPop').hidden) closePop();
      else if (!$('gmDlg').hidden) hideDlg();
      else if (!$('gmCtxBg').hidden) hideCtx();
      else if ($('gmAdConfirm').classList.contains('open')) closeConfirm();
      else if ($('gmAdmin').classList.contains('open')) closeAdmin();
      else if ($('gmPanel').classList.contains('drawer-open')) closeDrawer();
      else if ($('gmPanel').classList.contains('open')) close();
    });
    if ($('gmSvcSw')) $('gmSvcSw').addEventListener('click', function () { setService(!gmOn()); });
    if ($('setGmSw')) $('setGmSw').addEventListener('click', function (e) { e.stopPropagation(); setService(!gmOn()); });
    if ($('setGmKeys')) $('setGmKeys').addEventListener('click', openAdmin);
    if ($('setGmRow')) $('setGmRow').addEventListener('click', function (e) { if (!e.target.closest('#setGmSw')) setService(!gmOn()); });
    if (window.GMGate) window.GMGate.onChange(onGate);
    syncService();
    if (!gmOn()) lockdown();
    startSync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
