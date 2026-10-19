/* Fitur YouTube: pencarian, video populer, dan pemutar. API key diambil dari database (diatur admin) */
(function () {
  'use strict';
  var CFG = window.YT_CONFIG || {};
  var API = 'https://www.googleapis.com/youtube/v3/';
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Ikon SVG ---------- */
  var I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    play: '<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M8.6 6.2v11.6L17.8 12z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/></svg>',
    trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="4"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15.5" cy="11" r=".6"/><circle cx="17.5" cy="13" r=".6"/></svg>',
    news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h13a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4z"/><path d="M19 9h2v9a2 2 0 0 1-2 2"/><line x1="8" y1="8" x2="15" y2="8"/><line x1="8" y1="12" x2="15" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>',
    sport: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/><path d="M5.6 5.6c3 2.4 3 10.4 0 12.8M18.4 5.6c-3 2.4-3 10.4 0 12.8"/></svg>',
    edu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="21"/><line x1="17" y1="3" x2="17" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2"/><path d="M17 6l3 3"/><path d="M14 9l2 2"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 1 1-2.1-9.4L23 10"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3.5"/><path d="M10 9.5v5l4.5-2.5z"/><line x1="4" y1="20" x2="20" y2="4"/></svg>',
    power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v9"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/></svg>',
    play2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3.5"/><path d="M10 9.5v5l4.5-2.5z"/></svg>'
  };

  var CATS = [
    { id: 'popular', label: 'Populer', icon: I.trend },
    { id: '10', label: 'Musik', icon: I.music, cat: '10' },
    { id: '20', label: 'Gaming', icon: I.game, cat: '20' },
    { id: '25', label: 'Berita', icon: I.news, cat: '25' },
    { id: '17', label: 'Olahraga', icon: I.sport, cat: '17' },
    { id: '27', label: 'Edukasi', icon: I.edu, cat: '27' },
    { id: '1', label: 'Film', icon: I.film, cat: '1' }
  ];

  var state = { mode: 'popular', cat: 'popular', query: '', token: '', loading: false, again: false, ready: false, keyKnown: false, current: null, pool: [], pos: 0, lastLoad: 0 };

  /* ---------- Utilitas ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hasKey() { return KEYS.length > 0; }
  /* Sakelar global YouTube (js/youtube-gate.js). Bila tidak termuat, YouTube dianggap aktif. */
  function ytOn() { return !window.YTGate || window.YTGate.isEnabled(); }
  function disabledError() { var e = new Error('YouTube dinonaktifkan.'); e.reason = 'disabled'; return e; }

  /* ---------- Banyak API key: otomatis pindah ke kunci lain saat kuota habis ---------- */
  var KEYS = [];            /* daftar kunci dari database */
  var OFF = [];             /* kunci yang dinonaktifkan admin */
  var PRIMARY = '';         /* kunci utama pilihan admin (kosong = otomatis dari atas) */
  var tmpBad = {};          /* kunci yang gagal sementara (sesi ini): { kunci: { until, reason } } */
  var memExh = { day: '', keys: {} };   /* cadangan di memori bila localStorage diblokir */
  var EXH = 'yt:exhausted';
  var ACT = 'yt:active';
  var memAct = { day: '', key: '' };   /* kunci yang sedang dipakai (cadangan di memori) */
  /* Kuota YouTube pulih tiap tengah malam waktu Pasifik (Los Angeles). Hari itu dipakai sebagai penanda. */
  function pacificDay() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  /* Jam kuota pulih, ditampilkan dalam waktu setempat perangkat */
  function resetText() {
    try {
      var now = new Date();
      var pt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(now);
      var g = function (t) { for (var i = 0; i < pt.length; i++) if (pt[i].type === t) return +pt[i].value; return 0; };
      var sinceMidnight = ((g('hour') % 24) * 3600 + g('minute') * 60 + g('second')) * 1000;
      var at = new Date(now.getTime() + 86400000 - sinceMidnight);
      var time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).format(at).replace(':', '.');
      var tz = ''; try { new Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' }).formatToParts(at).forEach(function (x) { if (x.type === 'timeZoneName') tz = ' ' + x.value; }); } catch (e) { /* tanpa zona */ }
      var sameDay = at.getDate() === now.getDate() && at.getMonth() === now.getMonth();
      return (sameDay ? 'hari ini' : 'besok') + ' sekitar pukul ' + time + tz;
    } catch (e) { return 'otomatis besok'; }
  }
  function exhLoad() {
    var day = pacificDay(), out = {}, k;
    if (memExh.day === day) for (k in memExh.keys) out[k] = 1;
    try { var o = JSON.parse(localStorage.getItem(EXH) || '{}'); if (o && o.day === day && o.keys) for (k in o.keys) out[k] = 1; } catch (e) { /* diabaikan */ }
    return out;
  }
  function markExhausted(k) {
    var day = pacificDay();
    if (memExh.day !== day) memExh = { day: day, keys: {} };
    memExh.keys[k] = 1;
    try { localStorage.setItem(EXH, JSON.stringify({ day: day, keys: exhLoad() })); } catch (e) { /* diabaikan */ }
    keysChanged();
  }
  /* Kunci yang sedang dipakai menetap sampai ia limit atau bermasalah; kunci lain tidak disentuh. Reset tiap hari kuota baru. */
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
  function keyState(k) {
    if (OFF.indexOf(k) !== -1) return 'off';
    if (exhLoad()[k]) return 'limit';
    var t = tmpBad[k]; if (t && t.until > Date.now()) return 'bad';
    return 'ok';
  }
  /* Kunci utama pengganti: kunci aktif pertama di daftar (yang belum limit didahulukan), selain 'except'. Kosong bila tak ada. */
  function pickPrimary(list, off, except) {
    var on = list.filter(function (k) { return k !== except && off.indexOf(k) === -1; });
    var ok = on.filter(function (k) { return !exhLoad()[k]; });
    return (ok[0] || on[0] || '');
  }
  /* Kunci utama = pilihan admin selama masih aktif dan belum limit. Bila kosong, nonaktif, atau limit, kunci yang sedang
     dipakai otomatis menggantikannya (kunci aktif pertama di daftar bila tidak ada yang bisa dipakai). */
  function mainKey() {
    var pOn = !!PRIMARY && OFF.indexOf(PRIMARY) === -1;
    if (pOn && keyState(PRIMARY) !== 'limit') return PRIMARY;
    var cur = allOff() ? '' : currentKey();
    if (cur) return cur;
    return pOn ? PRIMARY : pickPrimary(KEYS, OFF, PRIMARY);
  }
  /* Admin: simpan kunci utama otomatis ke database bila kunci utama kosong, nonaktif, atau limit dan ada kunci sehat
     yang menggantikannya. Hanya satu kolom ("primary") yang ditulis, jadi pengaturan lain tidak tertimpa. */
  var autoSig = '';
  function autoMain() {
    try {
      var b = window.__ngobrolFB;
      if (!b || !admin.is || locked || !KEYS.length) return;
      var want = mainKey();
      if (!want || want === PRIMARY || KEYS.indexOf(want) === -1 || OFF.indexOf(want) !== -1 || keyState(want) !== 'ok') return;
      if (PRIMARY && OFF.indexOf(PRIMARY) === -1 && keyState(PRIMARY) !== 'limit') return;
      var sig = want + '|' + KEYS.length + '|' + OFF.length;
      if (autoSig === sig) return;
      autoSig = sig;
      b.set(b.ref(b.db, 'config/youtube/primary'), want).catch(function () { /* tanpa izin atau offline: tampilan tetap benar, simpan dicoba lagi saat keadaan berubah */ });
    } catch (e) { /* diabaikan */ }
  }
  function allOff() { return KEYS.length > 0 && KEYS.every(function (k) { return OFF.indexOf(k) !== -1; }); }
  function usableKeys() { return KEYS.filter(function (k) { return keyState(k) === 'ok'; }); }
  function keysChanged() { try { if (admin.is && $('ytAdmin').classList.contains('open')) renderKeys(); } catch (e) { /* panel belum siap */ } autoMain(); }
  /* Golongkan galat API: quota (habis hari ini), rate (terlalu cepat), keybad (kunci bermasalah), other (bukan urusan kunci) */
  function classify(status, reason, msg) {
    msg = String(msg || '');
    if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded' || ((status === 403 || status === 429) && /quota/i.test(msg))) return 'quota';
    if (reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded' || status === 429) return 'rate';
    if (reason === 'keyInvalid' || reason === 'keyExpired' || reason === 'accessNotConfigured' || reason === 'ipRefererBlocked' || reason === 'forbidden' ||
        (reason === 'badRequest' && /API key/i.test(msg)) || /API key (not valid|expired)/i.test(msg)) return 'keybad';
    return 'other';
  }
  function dur(iso) {
    var m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
    if (!m) return '';
    var h = (+m[1] || 0) * 24 + (+m[2] || 0), mi = +m[3] || 0, s = +m[4] || 0;
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return h ? h + ':' + p(mi) + ':' + p(s) : mi + ':' + p(s);
  }
  function compact(n) {
    n = +n; if (isNaN(n)) return '';
    try { return new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(n); } catch (e) { return String(n); }
  }
  function ago(iso) {
    var t = Date.parse(iso); if (!t) return '';
    var s = Math.max(1, (Date.now() - t) / 1000);
    var u = [[31536000, 'tahun'], [2592000, 'bulan'], [604800, 'minggu'], [86400, 'hari'], [3600, 'jam'], [60, 'menit']];
    for (var i = 0; i < u.length; i++) if (s >= u[i][0]) return Math.floor(s / u[i][0]) + ' ' + u[i][1] + ' lalu';
    return 'baru saja';
  }

  /* ---------- Akses API dengan cache ---------- */
  function cacheGet(k, ttl) {
    try {
      var raw = localStorage.getItem('yt:' + k); if (!raw) return null;
      var o = JSON.parse(raw);
      if (Date.now() - o.t > (ttl || CFG.CACHE_MINUTES || 10) * 60000) return null;
      return o.d;
    } catch (e) { return null; }
  }
  function cacheSet(k, d) { try { localStorage.setItem('yt:' + k, JSON.stringify({ t: Date.now(), d: d })); } catch (e) { /* penyimpanan penuh atau diblokir */ } }

  function call(endpoint, params, ttl) {
    var q = Object.keys(params).filter(function (k) { return params[k] !== '' && params[k] != null; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    var ck = endpoint + '?' + q;
    if (!ytOn()) return Promise.reject(disabledError());
    if (allOff()) { var eo = new Error('Semua API key dinonaktifkan.'); eo.reason = 'allOff'; return Promise.reject(eo); }
    var hit = cacheGet(ck, ttl);
    if (hit) return Promise.resolve(hit);
    return request(endpoint, q, ck);
  }

  /* Alasan bila tidak ada kunci yang bisa dipakai saat ini */
  function noUsableError() {
    var on = KEYS.filter(function (k) { return OFF.indexOf(k) === -1; });
    var e, reason;
    if (!KEYS.length) { e = new Error('API key belum diatur.'); e.reason = 'noKey'; return e; }
    if (!on.length) { e = new Error('Semua API key dinonaktifkan.'); e.reason = 'allOff'; return e; }
    if (on.some(function (k) { return keyState(k) === 'limit'; })) { e = new Error('Kuota semua API key habis.'); e.reason = 'quotaExceeded'; return e; }
    var t = tmpBad[on[0]]; reason = (t && t.reason) || 'rateLimitExceeded';
    e = new Error(reason === 'rateLimitExceeded' ? 'Terlalu banyak permintaan.' : 'API key bermasalah.'); e.reason = reason; return e;
  }

  function fetchTimeout(url, ms) {
    if (typeof AbortController === 'undefined') return fetch(url);
    var ac = new AbortController(), timer = setTimeout(function () { ac.abort(); }, ms);
    return fetch(url, { signal: ac.signal }).then(function (r) { clearTimeout(timer); return r; }, function (err) {
      clearTimeout(timer);
      if (err && err.name === 'AbortError') { var e = new Error('Waktu tunggu habis. Periksa koneksi internet.'); e.timeout = true; throw e; }
      throw err;
    });
  }

  /* Kunci yang boleh dicoba: aktif dan belum limit hari ini. Yang sehat didahulukan, yang sempat bermasalah
     (rate limit atau ditolak) ditaruh paling akhir sebagai cadangan agar tidak ada kunci sehat yang terlewat. */
  function tryOrder() {
    var good = [], bad = [], act = actLoad();
    KEYS.forEach(function (k) { var st = keyState(k); if (st === 'ok') good.push(k); else if (st === 'bad') bad.push(k); });
    var first = good.indexOf(PRIMARY) !== -1 ? PRIMARY : act;   /* pilihan admin menang; bila tak ada, kunci yang sedang menetap */
    var i = good.indexOf(first);
    if (i > 0) { good.splice(i, 1); good.unshift(first); }
    return good.concat(bad);
  }
  function currentKey() { return allOff() ? '' : (tryOrder()[0] || ''); }

  /* Pakai satu kunci saja. Hanya bila gagal (limit atau bermasalah), pindah ke kunci berikutnya dan menetap di sana. */
  function request(endpoint, q, ck) {
    var pool = tryOrder();
    if (!pool.length) return Promise.reject(noUsableError());
    var lastErr = null, retries = {}, tried = {};
    function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
    function attempt(i) {
      if (i >= pool.length) {
        /* Daftar habis: cek ulang kunci yang belum dicoba (mis. kunci baru ditambah atau pulih saat permintaan berjalan) */
        var more = tryOrder().filter(function (x) { return !tried[x] && pool.indexOf(x) === -1; });
        if (more.length) { pool = pool.concat(more); return attempt(i); }
        return Promise.reject(lastErr || noUsableError());
      }
      if (!ytOn()) return Promise.reject(disabledError());   /* dimatikan saat permintaan berjalan */
      var k = pool[i];
      var st = keyState(k);
      if (st === 'off' || st === 'limit') return attempt(i + 1);   /* berubah saat permintaan lain berjalan */
      tried[k] = 1;
      return fetchTimeout(API + endpoint + '?' + q + '&key=' + encodeURIComponent(k), 20000).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) {
            var er = j && j.error || {};
            var e = new Error(er.message || ('HTTP ' + r.status));
            e.reason = er.errors && er.errors[0] && er.errors[0].reason;
            e.status = r.status; e.cls = classify(r.status, e.reason, er.message);
            throw e;
          }
          var moved = actLoad() !== k;
          if (moved) actSave(k);
          var wasBad = !!tmpBad[k]; delete tmpBad[k];
          if (moved || wasBad) keysChanged();
          cacheSet(ck, j); return j;
        });
      }).catch(function (e) {
        if (!e || !e.cls || e.cls === 'other') throw e;   /* jaringan, waktu habis, atau galat non-kunci: jangan ganti kunci */
        /* Terlalu cepat (rate limit) bukan kuota habis: kunci ini masih sehat. Coba lagi kunci YANG SAMA setelah jeda singkat;
           kunci siaga tidak disentuh. Bila tetap gagal, laporkan saja tanpa menandai kunci rusak. */
        if (e.cls === 'rate') {
          var n = retries[k] = (retries[k] || 0) + 1;
          if (n <= 2) return wait(1200 * n).then(function () { return attempt(i); });
          e.reason = 'rateLimitExceeded'; throw e;
        }
        lastErr = e;
        /* Pindah ke kunci berikutnya HANYA bila kunci ini benar-benar tak bisa dipakai: kuota harian habis atau kunci ditolak */
        if (e.cls === 'quota') markExhausted(k);
        else { tmpBad[k] = { until: Date.now() + 600000, reason: e.reason || 'keyInvalid' }; keysChanged(); }
        return attempt(i + 1);
      });
    }
    return attempt(0);
  }

  function details(ids) {
    if (!ids.length) return Promise.resolve([]);
    return call('videos', { part: 'snippet,contentDetails,statistics', id: ids.join(','), hl: CFG.LANGUAGE }).then(function (j) { return j.items || []; });
  }

  var GAME_CAT = '20';
  var EXTRA_REGIONS = ['MY', 'SG', 'PH', 'US'];
  /* Kata kunci anime/donghua. Hasil pencarian disimpan lama di perangkat karena boros kuota (100 unit/cari). */
  var ANIME_Q = ['anime sub indo', 'donghua sub indo', 'anime terbaru', 'donghua terbaru', 'trailer anime', 'amv anime', 'rekomendasi anime', 'rekomendasi donghua'];
  var SEARCH_TTL = 720; /* menit */
  /* Buang video pendek (Shorts): durasi di bawah MIN_SECONDS. Siaran langsung tetap ditampilkan. */
  function secs(iso) {
    var m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
    return m ? (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0) : 0;
  }
  function notShort(v) {
    if (!v) return false;
    if (v.snippet && v.snippet.liveBroadcastContent === 'live') return true;
    var min = (CFG.MIN_SECONDS == null ? 300 : CFG.MIN_SECONDS);
    return secs(v.contentDetails && v.contentDetails.duration) >= min;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var k = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[k]; a[k] = t; }
    return a;
  }
  function takePool(n) {
    var items = state.pool.slice(state.pos, state.pos + n);
    state.pos += n;
    return { items: items, next: state.pos < state.pool.length ? 'pool' : '' };
  }
  function popularOf(region) {
    var p = { part: 'snippet,contentDetails,statistics', chart: 'mostPopular', videoCategoryId: GAME_CAT, regionCode: region, maxResults: 50, hl: CFG.LANGUAGE };
    return call('videos', p).then(function (j) { return j.items || []; });
  }
  function recentDay() { var d = new Date(Date.now() - 21 * 864e5); d.setUTCHours(0, 0, 0, 0); return d.toISOString().replace('.000Z', 'Z'); }
  function searchTopic(q) {
    var p = { part: 'snippet', type: 'video', q: q, order: 'viewCount', publishedAfter: recentDay(), maxResults: 40, regionCode: CFG.REGION_CODE || 'ID', relevanceLanguage: CFG.LANGUAGE || 'id', safeSearch: 'moderate' };
    return call('search', p, SEARCH_TTL).then(function (j) {
      var ids = (j.items || []).map(function (x) { return x.id && x.id.videoId; }).filter(Boolean);
      return details(ids);
    });
  }
  /* Beranda: game (chart kategori Gaming) selang-seling dengan anime/donghua (2 kata kunci acak) */
  function buildPool() {
    var regs = [CFG.REGION_CODE || 'ID'].concat(shuffle(EXTRA_REGIONS).slice(0, 2));
    var games = Promise.all(regs.map(function (r, i) { var p = popularOf(r); return i === 0 ? p : p.catch(function () { return []; }); }));
    var anime = Promise.all(shuffle(ANIME_Q).slice(0, 2).map(function (q) { return searchTopic(q).catch(function () { return []; }); }));
    return Promise.all([games, anime]).then(function (r) {
      var seen = {};
      function uniq(lists) { var out = []; lists.forEach(function (l) { l.forEach(function (v) { if (notShort(v) && v.id && !seen[v.id]) { seen[v.id] = 1; out.push(v); } }); }); return shuffle(out); }
      var a = uniq(r[1]), g = uniq(r[0]), out = [];
      while (a.length || g.length) { if (a.length) out.push(a.shift()); if (g.length) out.push(g.shift()); }
      return out;
    });
  }
  function fetchPage() {
    var size = Math.min(50, CFG.PAGE_SIZE || 12);
    if (state.mode === 'popular') {
      /* Beranda: game + anime/donghua, diacak ulang setiap dimuat */
      if (state.token === 'pool') return Promise.resolve(takePool(size));
      return buildPool().then(function (items) { state.pool = shuffle(items); state.pos = 0; return takePool(size); });
    }
    var p = { part: 'snippet', type: 'video', maxResults: Math.max(size, 30), pageToken: state.token, regionCode: CFG.REGION_CODE || 'ID', relevanceLanguage: CFG.LANGUAGE || 'id', safeSearch: 'moderate' };
    if (state.mode === 'search') p.q = state.query; else p.videoCategoryId = state.cat;
    return call('search', p).then(function (j) {
      var ids = (j.items || []).map(function (x) { return x.id && x.id.videoId; }).filter(Boolean);
      return details(ids).then(function (items) { return { items: items.filter(notShort), next: j.nextPageToken || '' }; });
    });
  }

  /* ---------- Tampilan ---------- */
  function renderChips() {
    var box = $('ytChips'); if (!box) return;
    box.innerHTML = CATS.map(function (c) {
      var on = state.mode !== 'search' && state.cat === c.id;
      return '<button type="button" class="yt-chip' + (on ? ' active' : '') + '" data-cat="' + c.id + '">' + c.icon + esc(c.label) + '</button>';
    }).join('');
  }
  function secTitle() { var t = title(); return t ? '<div class="yt-section-title">' + t + '</div>' : ''; }
  function title() {
    if (state.mode === 'search') return I.search + 'Hasil untuk "' + esc(state.query) + '"';
    return '';
    var c = CATS.filter(function (x) { return x.id === state.cat; })[0];
    return (c ? c.icon : I.trend) + (state.cat === 'popular' ? 'Video populer' : 'Kategori ' + esc(c.label));
  }
  function skeleton(n) {
    var h = '';
    for (var i = 0; i < n; i++) h += '<div class="yt-card yt-skel"><div class="yt-thumb"></div><div class="yt-info"><div class="yt-ch-av"></div><div class="yt-txt" style="flex:1"><div class="yt-line" style="width:92%"></div><div class="yt-line" style="width:60%"></div></div></div></div>';
    return h;
  }
  function card(v) {
    var sn = v.snippet || {}, st = v.statistics || {};
    var th = (sn.thumbnails && (sn.thumbnails.medium || sn.thumbnails.high || sn.thumbnails.default) || {}).url || '';
    var live = sn.liveBroadcastContent === 'live';
    var d = v.contentDetails && dur(v.contentDetails.duration);
    var views = st.viewCount ? compact(st.viewCount) + ' ditonton' : '';
    return '<button type="button" class="yt-card" data-id="' + esc(v.id) + '" aria-label="' + esc(sn.title) + '">' +
      '<div class="yt-thumb"><img loading="lazy" alt="" src="' + esc(th) + '">' +
      (live ? '<span class="yt-live">LIVE</span>' : (d && d !== '0:00' ? '<span class="yt-dur">' + d + '</span>' : '')) + '</div>' +
      '<div class="yt-info"><div class="yt-ch-av">' + esc((sn.channelTitle || '?').trim().charAt(0).toUpperCase()) + '</div>' +
      '<div class="yt-txt"><div class="yt-title">' + esc(sn.title) + '</div>' +
      '<div class="yt-sub"><b>' + esc(sn.channelTitle) + '</b><br>' + [views, ago(sn.publishedAt)].filter(Boolean).join('  ·  ') + '</div></div><span class="yt-cardgo" aria-hidden="true">' + I.play + '</span></div></button>';
  }
  function stateBox(kind, icon, h, p, btn) {
    return '<div class="yt-state ' + kind + '"><div class="yt-state-ico">' + icon + '</div><h3>' + h + '</h3><p>' + p + '</p>' + (btn || '') + '</div>';
  }
  function offBox() {
    return stateBox('', I.off, 'YouTube dinonaktifkan', 'Fitur ini sedang dinonaktifkan oleh admin dan tidak dapat digunakan.');
  }
  function renderOff() {
    closePlayer();
    var l = $('ytList'), m = $('ytMoreWrap');
    if (l) l.innerHTML = offBox();
    if (m) m.innerHTML = '';
  }
  function showError(e, fresh) {
    var box;
    if (!hasKey()) {
      box = admin.is
        ? stateBox('', I.key, 'API key belum diatur', 'Fitur YouTube membutuhkan API key. Sebagai admin, Anda dapat mengisinya sekarang.', '<button type="button" class="yt-btn primary" id="ytSetKey">' + I.key + 'Atur API key</button>')
        : stateBox('', I.key, 'Fitur belum aktif', 'API key YouTube belum diatur. Silakan hubungi admin aplikasi.');
    } else if (e && e.reason === 'allOff') {
      box = stateBox('error', I.key, 'API key dinonaktifkan', admin.is ? 'Semua API key sedang dinonaktifkan. Aktifkan salah satu lewat ikon kunci di kanan atas.' : 'Fitur YouTube sedang dinonaktifkan. Silakan hubungi admin aplikasi.');
    } else if (e && e.reason === 'rateLimitExceeded') {
      box = stateBox('error', I.alert, 'Terlalu banyak permintaan', 'YouTube membatasi permintaan sesaat. Tunggu sekitar satu menit lalu coba lagi.', '<button type="button" class="yt-btn primary" id="ytRetry">' + I.refresh + 'Coba lagi</button>');
    } else if (e && (e.reason === 'quotaExceeded' || e.reason === 'dailyLimitExceeded')) {
      box = stateBox('error', I.alert, 'Kuota harian habis', (KEYS.length > 1 ? 'Kuota semua ' + KEYS.length + ' API key sudah terpakai.' : 'Kuota YouTube Data API untuk kunci ini sudah terpakai.') + ' Kuota pulih otomatis setiap hari' + (admin.is ? ', atau tambahkan API key lain lewat ikon kunci.' : '.'));
    } else if (e && (e.reason === 'keyInvalid' || e.reason === 'badRequest' && /API key/i.test(e.message))) {
      box = stateBox('error', I.key, 'API key tidak valid', admin.is ? 'Perbarui kunci melalui ikon kunci di kanan atas.' : 'Silakan hubungi admin aplikasi untuk memperbarui kunci.');
    } else if (e && (e.reason === 'accessNotConfigured' || e.reason === 'forbidden' || e.reason === 'ipRefererBlocked')) {
      box = stateBox('error', I.alert, 'Akses ditolak', 'Pastikan YouTube Data API v3 sudah diaktifkan pada proyek Anda dan pembatasan HTTP referrer pada kunci mengizinkan domain aplikasi ini.');
    } else {
      box = stateBox('error', I.alert, 'Gagal memuat video', esc(navigator.onLine ? (e && e.message) || 'Terjadi kesalahan.' : 'Tidak ada koneksi internet.'),
        '<button type="button" class="yt-btn primary" id="ytRetry">' + I.refresh + 'Coba lagi</button>');
    }
    if (fresh) $('ytList').innerHTML = box;
  }

  function load(fresh) {
    if (!ytOn()) { renderOff(); return; }
    if (state.loading) { if (fresh) state.again = true; return; }
    if (fresh) { state.token = ''; }
    if (!hasKey()) {
      $('ytMoreWrap').innerHTML = '';
      /* kunci belum diketahui: tampilkan pemuatan, jangan tampilkan "fitur belum aktif" */
      if (!state.keyKnown) { $('ytList').innerHTML = secTitle() + '<div class="yt-grid">' + skeleton(6) + '</div>'; return; }
      $('ytList').innerHTML = ''; showError(null, true); return;
    }
    if (allOff()) { closePlayer(); $('ytMoreWrap').innerHTML = ''; $('ytList').innerHTML = ''; showError({ reason: 'allOff' }, true); return; }
    state.loading = true;
    if (fresh) $('ytList').innerHTML = secTitle() + '<div class="yt-grid">' + skeleton(6) + '</div>';
    var btn = $('ytMore'); if (btn) { btn.disabled = true; }
    fetchPage().then(function (r) {
      if (!ytOn()) { renderOff(); return; }   /* dinonaktifkan saat memuat: buang hasilnya */
      state.token = r.next; state.lastLoad = Date.now();
      if (fresh) {
        if (!r.items.length) { $('ytList').innerHTML = stateBox('', I.empty, 'Video tidak ditemukan', 'Coba kata kunci lain atau pilih kategori yang berbeda.'); $('ytMoreWrap').innerHTML = ''; return; }
        $('ytList').innerHTML = secTitle() + '<div class="yt-grid" id="ytGrid"></div>';
      }
      $('ytGrid').insertAdjacentHTML('beforeend', r.items.map(card).join(''));
      $('ytMoreWrap').innerHTML = r.next ? '<div class="yt-more"><button type="button" class="yt-btn" id="ytMore">' + I.down + 'Muat lebih banyak</button></div>' : '';
    }).catch(function (e) { if (!ytOn()) { renderOff(); return; } showError(e, fresh); if (!fresh) { var b = $('ytMore'); if (b) b.disabled = false; } })
      .then(function () { state.loading = false; if (state.again) { state.again = false; load(true); } });
  }

  function setCat(id) {
    var c = CATS.filter(function (x) { return x.id === id; })[0]; if (!c) return;
    state.cat = id; state.mode = id === 'popular' ? 'popular' : 'category'; state.query = '';
    $('ytInput').value = ''; $('ytSearchBox').classList.remove('has-text');
    renderChips(); load(true);
  }
  function doSearch() {
    var q = $('ytInput').value.trim();
    if (!q) { setCat('popular'); return; }
    state.mode = 'search'; state.query = q; renderChips(); load(true);
    $('ytScroll').scrollTop = 0;
  }

  /* ---------- Pemutar ---------- */
  function openPlayer(id) {
    if (!ytOn()) { renderOff(); return; }
    $('ytFrameWrap').innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&playsinline=1&modestbranding=1" title="Pemutar video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    $('ytDetail').innerHTML = '<div class="yt-line" style="height:18px;width:80%;border-radius:6px;background:#e6ecee"></div>';
    $('ytPlayer').classList.add('open');
    state.current = { id: id };
    details([id]).then(function (items) {
      var v = items[0]; if (!v || !state.current || state.current.id !== id || !ytOn()) return;
      var sn = v.snippet || {}, st = v.statistics || {};
      state.current = { id: id, title: sn.title };
      var desc = String(sn.description || '').trim();
      $('ytDetail').innerHTML = '<h2>' + esc(sn.title) + '</h2><div class="yt-meta">' +
        '<span>' + I.user + esc(sn.channelTitle) + '</span>' +
        (st.viewCount ? '<span>' + I.eye + compact(st.viewCount) + ' ditonton</span>' : '') +
        '<span>' + I.clock + esc(ago(sn.publishedAt)) + '</span></div>' +
        '<div class="yt-actions"><button type="button" class="yt-btn" id="ytShare">' + I.share + 'Bagikan</button>' +
        '<button type="button" class="yt-btn" id="ytCopy">' + I.link + 'Salin tautan</button>' +
        '<a class="yt-btn" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=' + encodeURIComponent(id) + '" style="text-decoration:none">' + I.external + 'Buka di YouTube</a></div>' +
        (desc ? '<div class="yt-desc" id="ytDesc">' + esc(desc) + '</div><button type="button" class="yt-desc-toggle" id="ytDescToggle">Tampilkan selengkapnya</button>' : '');
    }).catch(function () { $('ytDetail').innerHTML = ''; });
  }
  function closePlayer() {
    $('ytPlayer').classList.remove('open');
    $('ytFrameWrap').innerHTML = '';
    state.current = null;
  }
  function url() { return state.current ? 'https://www.youtube.com/watch?v=' + state.current.id : ''; }

  /* ---------- Kunci dari database dan peran admin ---------- */
  var admin = { is: false, meta: null };

  function waitBridge(ms) {
    return new Promise(function (res) {
      var t0 = Date.now();
      (function p() {
        var b = window.__ngobrolFB;
        if (b && b.getMyId && b.getMyId()) return res(b);
        if (Date.now() - t0 > ms) return res(null);
        setTimeout(p, 150);
      })();
    });
  }

  /* Berlangganan config/youtube (semua pengguna) dan users/<id>/role (peran sendiri) */
  function startSync() {
    return waitBridge(60000).then(function (b) {
      if (!b) { state.keyKnown = true; if (state.ready) load(true); return; }
      var id = b.getMyId();
      return new Promise(function (resolve) {
        var first = true;
        var done = function () { if (first) { first = false; state.keyKnown = true; resolve(); if (state.ready && !state.loading) load(true); else if (state.ready) state.again = true; } };
        b.onValue(b.ref(b.db, 'config/youtube'), function (snap) {
          var v = snap.val() || {};
          admin.meta = v;
          var list = [];
          var raw = v.apiKeys;
          if (raw && typeof raw === 'object') Object.keys(raw).forEach(function (i) { list.push(raw[i]); });
          if (v.apiKey) list.unshift(v.apiKey);   /* dukung data lama (satu kunci) */
          var seen = {};
          list = list.map(function (x) { return String(x || '').trim(); }).filter(function (x) { if (x.length < 10 || seen[x]) return false; seen[x] = 1; return true; });
          var off = [];
          if (v.keysOff && typeof v.keysOff === 'object') Object.keys(v.keysOff).forEach(function (i) { if (list.indexOf(v.keysOff[i]) !== -1) off.push(v.keysOff[i]); });
          var prim = typeof v.primary === 'string' && list.indexOf(v.primary.trim()) !== -1 ? v.primary.trim() : '';
          var changed = list.join('|') !== KEYS.join('|') || off.join('|') !== OFF.join('|') || prim !== PRIMARY;
          KEYS = list; OFF = off; PRIMARY = prim;
          if (changed) { tmpBad = {}; if (!first) actSave(''); }   /* pengaturan diubah admin: mulai ulang pilihan kunci */
          if (admin.is && $('ytAdmin').classList.contains('open')) renderKeys();
          if (first) done(); else if (changed && state.ready) load(true);
          autoMain();
        }, done);
        b.onValue(b.ref(b.db, 'users/' + id + '/role'), function (snap) {
          var r = snap.val();
          /* akun lama tanpa peran diberi "user". Peran "admin" hanya bisa diberikan manual di konsol Firebase */
          if (r === null || r === undefined) b.set(b.ref(b.db, 'users/' + id + '/role'), 'user').catch(function () {});
          admin.is = r === 'admin';
          try { document.documentElement.classList.toggle('yt-adm', admin.is); } catch (er) { /* diabaikan */ }
          autoMain();
          $('ytAdminBtn').hidden = !admin.is;
          if (!admin.is) closeAdmin();
          syncService();
          if (state.ready && !ytOn()) renderOff();
          else if (state.ready && !hasKey()) load(true);
        }, function () {});
      });
    });
  }

  var MASK_OK = (function () { try { return !!(window.CSS && CSS.supports && CSS.supports('-webkit-text-security', 'disc')); } catch (e) { return false; } })();
  function setReveal(show) {
    var i = $('ytKeyInput'), b = $('ytKeyEye');
    /* Pakai teks biasa + penyamaran CSS agar browser tidak menawarkan "Simpan sandi". Cadangan: type=password */
    if (MASK_OK) { i.type = 'text'; i.classList.toggle('yt-secret', !show); } else { i.type = show ? 'text' : 'password'; i.classList.remove('yt-secret'); }
    b.innerHTML = show ? I.eye : I.eyeOff;
    b.setAttribute('aria-pressed', show ? 'true' : 'false');
    b.setAttribute('aria-label', show ? 'Sembunyikan kunci' : 'Tampilkan kunci');
    b.title = show ? 'Sembunyikan kunci' : 'Tampilkan kunci';
  }
  function isRevealed() { return $('ytKeyEye').getAttribute('aria-pressed') === 'true'; }
  function maskKey(k) { return k && k.length > 10 ? k.slice(0, 4) + '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' + k.slice(-4) : ''; }
  var msgTimer = 0, msgClear = 0;
  /* Pop-up pesan di panel sudah dihapus; hanya penanda merah pada kolom input yang tersisa. */
  function admMsg(t, ok, keep) {
    var f = $('ytAdmField');
    clearTimeout(msgTimer); clearTimeout(msgClear);
    if (!t) { if (f) f.classList.remove('err'); return; }
    if (f) f.classList.toggle('err', !ok && $('ytPaneAdd').classList.contains('on'));
    if (!keep) msgTimer = setTimeout(function () { admMsg(''); }, t.length > 45 ? 4000 : 2000);
  }
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
  var STATE_LABEL = { using: 'Sedang dipakai', standby: 'Siaga', limit: 'LIMIT', bad: 'Bermasalah', off: 'Nonaktif' };
  function stateNote(k, st) {
    if (st === 'using') return 'Semua permintaan YouTube lewat kunci ini.';
    if (st === 'standby') return 'Cadangan: belum dipakai, kuota masih utuh.';
    if (st === 'limit') return 'Kuota harian habis. Pulih ' + resetText() + '.';
    if (st === 'bad') { var t = tmpBad[k]; return t && t.reason === 'rateLimitExceeded' ? 'Terlalu banyak permintaan. Dicoba lagi otomatis.' : 'Ditolak YouTube (kunci salah atau API belum aktif). Dicoba lagi otomatis.'; }
    return 'Dinonaktifkan. Tidak dipakai.';
  }
  function renderKeys() {
    var m = admin.meta || {}, n = KEYS.length;
    var on = KEYS.filter(function (k) { return OFF.indexOf(k) === -1; }).length;
    var lim = KEYS.filter(function (k) { return keyState(k) === 'limit'; }).length;
    $('ytStTotal').textContent = n; $('ytStOn').textContent = on; $('ytStLimit').textContent = lim;
    $('ytAdmCount').textContent = n + ' dari 10 terpakai'; $('ytTabCnt').textContent = n;
    var cur = currentKey(), main = mainKey();
    $('ytKeyList').innerHTML = n ? KEYS.map(function (k, i) {
      var st = keyState(k), isOn = OFF.indexOf(k) === -1;
      if (st === 'ok') st = k === cur ? 'using' : 'standby';
      return '<div class="yt-key-row st-' + st + (isOn ? '' : ' is-off') + '">' +
        '<div class="yt-key-top"><div class="yt-key-no">' + (i + 1) + '</div>' +
        '<div class="yt-key-info"><span class="yt-key-mask">' + esc(maskKey(k)) + '</span><span class="yt-key-badge ' + st + '">' + STATE_LABEL[st] + '</span>' +
        '<span class="yt-key-note">' + esc(stateNote(k, st)) + '</span></div>' +
        (k === main ? '<span class="yt-key-prim">' + CHECK + 'Utama</span>' : '<button type="button" class="yt-key-use" data-i="' + i + '" aria-label="Jadikan kunci ' + (i + 1) + ' sebagai kunci utama">Pakai</button>') + '</div>' +
        '<div class="yt-key-bar"><div class="yt-key-sw"><button type="button" class="yt-sw" role="switch" data-i="' + i + '" aria-checked="' + (isOn ? 'true' : 'false') + '" aria-label="' + (isOn ? 'Nonaktifkan' : 'Aktifkan') + ' kunci ' + (i + 1) + '"></button>' +
        '<span class="yt-key-swlbl">' + (isOn ? 'Kunci aktif' : 'Kunci nonaktif') + '</span></div>' +
        '<button type="button" class="yt-key-del" data-i="' + i + '" aria-label="Hapus kunci ' + (i + 1) + '">' + TRASH + '<span>Hapus</span></button></div></div>';
    }).join('') : '<div class="yt-key-empty">Belum ada API key.<br>Tempel kunci pertama Anda di bawah.</div>';
    var meta = '';
    if (n && m.updatedAt) meta = 'Terakhir diubah oleh ' + (m.updatedByName || m.updatedBy || 'admin') + ', ' + ago(new Date(m.updatedAt).toISOString());
    $('ytAdmMeta').textContent = meta; $('ytAdmMeta').style.display = meta ? '' : 'none';
  }
  function setTab(t) {
    var add = t === 'add';
    $('ytTabKeys').setAttribute('aria-selected', add ? 'false' : 'true'); $('ytTabAdd').setAttribute('aria-selected', add ? 'true' : 'false');
    $('ytPaneKeys').classList.toggle('on', !add); $('ytPaneAdd').classList.toggle('on', add);
    $('ytAdmActions').hidden = !add; $('ytAdmCard').classList.toggle('has-actions', add);
    if ($('ytAdmScroll')) $('ytAdmScroll').scrollTop = 0;
    admMsg('');
  }
  /* Tempelkan panel persis pada area layar yang terlihat, agar tidak bergeser atau tertutup keyboard */
  var pinned = false;
  function pinApply() {
    var vv = window.visualViewport, el = $('ytAdmin'), card = $('ytAdmCard');
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
    var vv = window.visualViewport, el = $('ytAdmin');
    if (vv && pinned) { vv.removeEventListener('resize', pinApply); vv.removeEventListener('scroll', pinApply); }
    pinned = false;
    if (el) ['left', 'top', 'width', 'height', 'right', 'bottom'].forEach(function (p) { el.style.removeProperty(p); });
    var c = $('ytAdmCard'); if (c) c.classList.remove('compact');
  }
  /* ---------- Sakelar layanan YouTube (admin) ---------- */
  function syncService() {
    var on = ytOn(), label = on ? 'Nonaktifkan YouTube untuk semua pengguna' : 'Aktifkan YouTube untuk semua pengguna';
    var text = on ? 'Aktif untuk semua pengguna' : 'Nonaktif untuk semua pengguna';
    ['ytSvcSw', 'setYtSw'].forEach(function (id) {
      var sw = $(id); if (!sw) return;
      sw.setAttribute('aria-checked', on ? 'true' : 'false');
      sw.setAttribute('aria-label', label);
      sw.disabled = !!svcBusy;
    });
    if ($('ytSvcState')) $('ytSvcState').textContent = text;
    if ($('setYtState')) $('setYtState').textContent = text;
    if ($('ytSvcIco')) $('ytSvcIco').innerHTML = on ? I.play2 : I.off;
    if ($('ytSvc')) $('ytSvc').classList.toggle('off', !on);
  }
  var svcBusy = false;
  function svcError(e) {
    if (e && e.code === 'PERMISSION_DENIED') return 'Ditolak oleh aturan database. Perbarui Rules Firebase.';
    return 'Pengaturan gagal disimpan. Periksa koneksi internet.';
  }
  function svcNotify(text, ok) {
    if ($('ytAdmin').classList.contains('open')) admMsg(text, ok);
  }
  function setService(on) {
    if (svcBusy || locked || !admin.is || !window.YTGate) return;
    if (on === ytOn()) return;
    svcBusy = true; syncService();
    window.YTGate.set(on).then(function () {
      svcNotify(on ? 'YouTube diaktifkan untuk semua pengguna.' : 'YouTube dinonaktifkan untuk semua pengguna.', true);
    }).catch(function (e) { svcNotify(svcError(e), false); })
      .then(function () { svcBusy = false; syncService(); });
  }
  /* Dipanggil setiap status berubah (lokal maupun dari admin lain) */
  function onGate(on) {
    syncService();
    if (!on) {
      state.mode = 'popular'; state.cat = 'popular'; state.query = ''; state.token = ''; state.pool = []; state.pos = 0; state.lastLoad = 0;
      var inp = $('ytInput'); if (inp) { inp.value = ''; var sb = $('ytSearchBox'); if (sb) sb.classList.remove('has-text'); }
      renderChips();
      renderOff();
    } else if (state.ready) {
      var pane = $('paneYoutube');
      if (pane && pane.classList.contains('active')) load(true); else $('ytList').innerHTML = '';
    }
  }

  function openAdmin() {
    if (!admin.is) return;
    syncService();
    $('ytKeyInput').value = ''; setReveal(false);
    renderKeys(); setTab(KEYS.length ? 'keys' : 'add'); $('ytAdmin').classList.add('open'); pinOn();
  }
  function closeAdmin() { var a = $('ytAdmin'); if (a) a.classList.remove('open'); closeConfirm(); admMsg(''); pinOff(); }

  /* Simpan daftar kunci. "apiKey" tetap diisi kunci pertama agar kompatibel dengan data dan aturan lama. */
  function writeKeys(list, off, primary) {
    var b = window.__ngobrolFB;
    if (!b || !admin.is) return Promise.reject(new Error('Hanya admin yang dapat mengubah API key.'));
    off = (off || OFF).filter(function (k) { return list.indexOf(k) !== -1; });
    var prim = primary === undefined ? PRIMARY : primary;
    if (list.indexOf(prim) === -1) prim = '';
    return b.set(b.ref(b.db, 'config/youtube'), { apiKey: list[0] || '', apiKeys: list, keysOff: off, primary: prim, updatedBy: b.getMyId(), updatedByName: b.getMyName(), updatedAt: Date.now() });
  }
  var locked = false;   /* true selama ada penyimpanan berjalan: ketukan ganda diabaikan agar data tidak tertimpa */
  function busy(on) {
    locked = !!on;
    ['ytAdmSave', 'ytAdmX', 'ytTabKeys', 'ytTabAdd'].forEach(function (i) { $(i).disabled = on; });
    $('ytKeyList').classList.toggle('is-busy', !!on);
  }
  function failText(e) {
    var c = classify(e && e.status, e && e.reason, e && e.message);
    if (c === 'quota') return 'Kunci valid, tetapi kuota harian habis.';
    if (c === 'rate') return 'Terlalu banyak permintaan. Coba lagi sebentar lagi.';
    if (e && (e.reason === 'accessNotConfigured' || e.reason === 'forbidden' || e.reason === 'ipRefererBlocked')) return 'Kunci ditolak. Aktifkan YouTube Data API v3 dan cek pembatasan referrer.';
    if (c === 'keybad') return 'API key tidak valid.';
    return (e && e.message) || 'Gagal memeriksa kunci.';
  }
  function dbErr(e) { return e && e.reason ? failText(e) : (e && e.code === 'PERMISSION_DENIED' ? 'Ditolak oleh aturan database. Periksa Rules Firebase.' : failText(e)); }
  function saveKey() {
    if (locked) return;
    var k = $('ytKeyInput').value.trim().replace(/^["'`]+|["'`]+$/g, '');   /* buang tanda kutip bila tertempel */
    if (!k) { admMsg('Masukkan API key.'); return; }
    if (!/^[A-Za-z0-9_-]{20,190}$/.test(k)) { admMsg('Format API key tidak valid.'); return; }
    if (KEYS.indexOf(k) !== -1) { admMsg('Kunci ini sudah ada dalam daftar.'); return; }
    if (KEYS.length >= 10) { admMsg('Maksimal 10 API key.'); return; }
    busy(true); admMsg('Memeriksa kunci...', true, true);
    /* uji kunci dengan satu permintaan ringan (1 unit kuota) sebelum disimpan */
    var quotaHit = false;
    fetch(API + 'videos?part=id&id=dQw4w9WgXcQ&key=' + encodeURIComponent(k)).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) {
          var e = new Error((j.error && j.error.message) || 'HTTP ' + r.status); e.reason = j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason;
          if (!e.reason && classify(r.status, '', e.message) === 'quota') e.reason = 'quotaExceeded';
          /* kunci sah tetapi kuota hari ini habis: tetap boleh disimpan, akan dipakai lagi saat kuota pulih */
          if (e.reason === 'quotaExceeded' || e.reason === 'dailyLimitExceeded') { quotaHit = true; return; }
          throw e;
        }
      });
    }).then(function () { return writeKeys(KEYS.concat([k]), OFF, mainKey() ? undefined : k); }).then(function () {
      if (quotaHit) markExhausted(k);
      $('ytKeyInput').value = '';
      setTab('keys'); admMsg(quotaHit ? 'Kunci ditambahkan, tetapi kuota hari ini sudah habis. Akan dipakai lagi saat kuota pulih.' : 'Kunci berhasil ditambahkan.', true);
    }).catch(function (e) { admMsg(dbErr(e)); })
      .then(function () { busy(false); });
  }
  function toggleKey(i) {
    if (locked) return;
    var k = KEYS[i]; if (k == null) return;
    var off = OFF.indexOf(k) === -1 ? OFF.concat([k]) : OFF.filter(function (x) { return x !== k; });
    var turnOff = off.indexOf(k) !== -1, np = PRIMARY, promoted = false;
    if (turnOff && k === PRIMARY) { np = pickPrimary(KEYS, off, k); promoted = !!np; }
    else if (!turnOff && !mainKey()) { np = k; promoted = true; }   /* belum ada kunci utama: kunci yang pertama diaktifkan jadi utama */   /* kunci utama dinonaktifkan: kunci aktif berikutnya otomatis jadi utama */
    busy(true); admMsg('');
    writeKeys(KEYS, off, np).then(function () {
      var ni = promoted ? KEYS.indexOf(np) : -1;
      admMsg('Kunci ' + (i + 1) + (turnOff ? ' dinonaktifkan.' : ' diaktifkan.') + (ni >= 0 ? ' Kunci ' + (ni + 1) + ' jadi utama.' : ''), true); })
      .catch(function (e) { admMsg(dbErr(e)); })
      .then(function () { busy(false); });
  }
  function setPrimary(i) {
    if (locked) return;
    var k = KEYS[i]; if (k == null || (k === PRIMARY && OFF.indexOf(k) === -1)) return;
    var wasOff = OFF.indexOf(k) !== -1, lim = keyState(k) === 'limit';
    busy(true); admMsg('');
    writeKeys(KEYS, OFF.filter(function (x) { return x !== k; }), k).then(function () {
      admMsg(wasOff ? 'Kunci ' + (i + 1) + ' diaktifkan dan dijadikan utama.' : lim ? 'Kunci ' + (i + 1) + ' jadi utama, tetapi sedang limit.' : 'Kunci ' + (i + 1) + ' dijadikan utama.', true);
    }).catch(function (e) { admMsg(dbErr(e)); })
      .then(function () { busy(false); });
  }
  var pendingDel = null;
  function askDelete(i) {
    var k = KEYS[i]; if (k == null) return;
    pendingDel = k;
    $('ytCfIco').innerHTML = I.alert;
    $('ytCfKey').textContent = 'Kunci ' + (i + 1) + '  ·  ' + maskKey(k);
    $('ytCfOk').disabled = false; $('ytCfNo').disabled = false;
    $('ytAdmConfirm').classList.add('open');
    setTimeout(function () { $('ytCfNo').focus(); }, 40);
  }
  function closeConfirm() { pendingDel = null; var c = $('ytAdmConfirm'); if (c) c.classList.remove('open'); }
  function doDelete() {
    var k = pendingDel; if (k == null || locked) return;
    busy(true);
    $('ytCfOk').disabled = true; $('ytCfNo').disabled = true; $('ytCfOk').textContent = 'Menghapus...';
    var rest = KEYS.filter(function (x) { return x !== k; });
    writeKeys(rest, OFF, k === PRIMARY ? pickPrimary(rest, OFF, k) : PRIMARY)
      .then(function () { closeConfirm(); admMsg('Kunci dihapus.', true); })
      .catch(function (e) { closeConfirm(); admMsg(dbErr(e)); })
      .then(function () { $('ytCfOk').textContent = 'Ya, hapus'; busy(false); });
  }

  /* ---------- Inisialisasi ---------- */
  function init() {
    if (!$('paneYoutube')) return;
    $('ytSearchIcon').innerHTML = I.search;
    $('ytClear').innerHTML = I.close; $('ytGo').innerHTML = I.arrow; $('ytClose').innerHTML = I.close;
    renderChips();
    $('ytRefresh').innerHTML = I.refresh;
    function refreshHome(spin) {
      if (!ytOn()) { renderOff(); return; }
      if (state.mode !== 'popular' || state.loading) return;
      if (spin) { var b = $('ytRefresh'); b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); }
      $('ytScroll').scrollTop = 0; load(true);
    }
    $('ytRefresh').addEventListener('click', function () { if (!ytOn()) return; if (state.mode === 'search') { $('ytInput').value = ''; $('ytSearchBox').classList.remove('has-text'); state.mode = 'popular'; state.cat = 'popular'; state.query = ''; load(true); $('ytScroll').scrollTop = 0; } else refreshHome(true); });
    var ytTab = document.querySelector('.bottom-tab[data-pane="paneYoutube"]');
    if (ytTab) ytTab.addEventListener('click', function () {
      var pane = $('paneYoutube'), wasActive = pane && pane.classList.contains('active');
      if (wasActive || Date.now() - state.lastLoad > 30000) refreshHome(false);
    });

    $('ytList').addEventListener('click', function (e) {
      var c = e.target.closest('.yt-card[data-id]'); if (c) { openPlayer(c.dataset.id); return; }
      if (e.target.closest('#ytRetry')) load(true);
      if (e.target.closest('#ytSetKey')) openAdmin();
    });
    $('ytMoreWrap').addEventListener('click', function (e) { if (e.target.closest('#ytMore')) load(false); });
    $('ytInput').addEventListener('input', function () { $('ytSearchBox').classList.toggle('has-text', !!this.value); });
    $('ytInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); this.blur(); doSearch(); } });
    $('ytGo').addEventListener('click', doSearch);
    $('ytClear').addEventListener('click', function () { $('ytInput').value = ''; $('ytSearchBox').classList.remove('has-text'); $('ytInput').focus(); if (state.mode === 'search') setCat('popular'); });

    $('ytClose').addEventListener('click', closePlayer);
    $('ytPlayer').addEventListener('click', function (e) {
      if (e.target === $('ytPlayer')) { closePlayer(); return; }
      if (e.target.closest('#ytCopy')) {
        var u = url(); if (!u) return;
        (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { }, function () { });
      } else if (e.target.closest('#ytShare')) {
        var t = state.current || {};
        if (navigator.share) navigator.share({ title: t.title || 'Video YouTube', url: url() }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(url()).then(function () { });
      } else if (e.target.closest('#ytDescToggle')) {
        var d = $('ytDesc'), open = d.classList.toggle('open');
        e.target.closest('#ytDescToggle').textContent = open ? 'Tampilkan lebih sedikit' : 'Tampilkan selengkapnya';
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('ytAdmConfirm').classList.contains('open')) { closeConfirm(); return; } if (e.key === 'Escape' && $('ytAdmin').classList.contains('open')) { closeAdmin(); return; } if (e.key === 'Escape' && $('ytPlayer').classList.contains('open')) closePlayer(); });

    /* muat pertama kali saat tab dibuka */
    $('ytAdminBtn').innerHTML = I.key; $('ytAdmIco').innerHTML = I.key; setReveal(false);
    $('ytSvcSw').addEventListener('click', function () { setService(!ytOn()); });
    if ($('setYtSw')) $('setYtSw').addEventListener('click', function (e) { e.stopPropagation(); setService(!ytOn()); });
    if ($('setYtKeys')) $('setYtKeys').addEventListener('click', openAdmin);
    if ($('setYtRow')) $('setYtRow').addEventListener('click', function (e) { if (!e.target.closest('#setYtSw')) setService(!ytOn()); });
    if (window.YTGate) window.YTGate.onChange(onGate);
    syncService();
    if (!ytOn()) renderOff();
    $('ytAdminBtn').addEventListener('click', openAdmin);
    $('ytAdmX').innerHTML = I.close; $('ytAdmX').addEventListener('click', closeAdmin);
    $('ytCfNo').addEventListener('click', closeConfirm);
    $('ytCfOk').addEventListener('click', doDelete);
    $('ytAdmConfirm').addEventListener('click', function (e) { if (e.target === $('ytAdmConfirm')) closeConfirm(); });
    $('ytTabKeys').addEventListener('click', function () { setTab('keys'); });
    $('ytTabAdd').addEventListener('click', function () { setTab('add'); });
    $('ytAdmSave').addEventListener('click', saveKey);
    $('ytKeyList').addEventListener('click', function (e) { var u = e.target.closest('.yt-key-use'); if (u) { setPrimary(+u.dataset.i); return; } var w = e.target.closest('.yt-sw'); if (w) { toggleKey(+w.dataset.i); return; } var d = e.target.closest('.yt-key-del'); if (d) askDelete(+d.dataset.i); });
    $('ytKeyInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') saveKey(); });
    $('ytKeyEye').addEventListener('click', function () { setReveal(!isRevealed()); $('ytKeyInput').focus(); });
    $('ytAdmin').addEventListener('click', function (e) { if (e.target === $('ytAdmin')) closeAdmin(); });

    /* sinkronkan kunci dan peran sejak aplikasi dibuka, jadi saat tab YouTube dibuka kunci sudah siap */
    startSync().catch(function () { state.keyKnown = true; if (state.ready) load(true); });
    var tab = document.querySelector('.bottom-tab[data-pane="paneYoutube"]');
    if (tab) tab.addEventListener('click', function () {
      if (!ytOn()) { state.ready = true; renderOff(); return; }
      if (state.ready) return;
      state.ready = true;
      load(true); /* bila kunci belum diketahui, tampil pemuatan lalu otomatis lanjut saat kunci tiba */
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
