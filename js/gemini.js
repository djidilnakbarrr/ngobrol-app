/* Fitur Gemini AI: obrolan dengan Gemini. API key TIDAK disimpan di file ini.
   Admin mengatur kunci langsung dari aplikasi (ikon kunci di header Gemini); kunci disimpan di database
   Firebase pada config/gemini, sama seperti pengaturan YouTube. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';
  var MODELS = [
    { id: 'gemini-flash-latest', name: 'Flash', sub: 'Cepat' },
    { id: 'gemini-flash-lite-latest', name: 'Flash Lite', sub: 'Hemat kuota' },
    { id: 'gemini-pro-latest', name: 'Pro', sub: 'Paling pintar' }
  ];
  var DEFAULT_MODEL = MODELS[0].id;
  var SYSTEM = 'Kamu adalah Gemini, asisten AI di dalam aplikasi obrolan Ngobrol. Jawab dengan bahasa yang dipakai pengguna (default Bahasa Indonesia), ramah, jelas, dan ringkas. Gunakan daftar atau blok kode hanya bila membantu.';
  var MAX_KEEP = 60;      /* jumlah pesan yang disimpan di perangkat */
  var MAX_SEND = 24;      /* jumlah pesan terakhir yang dikirim sebagai konteks */

  var I = {
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 9h14M5 15h9"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 01-12.2 7.6L3.5 21l1.5-4.9A8.5 8.5 0 1121 12z"/></svg>',
    compose: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H6.5A2.5 2.5 0 004 6.5v11A2.5 2.5 0 006.5 20h11a2.5 2.5 0 002.5-2.5V13"/><path d="M18.4 3.6a1.9 1.9 0 112.7 2.7L12 15.4 8.2 16.2l.8-3.8z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="gmG{n}" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4285f4"/><stop offset=".55" stop-color="#9b72cb"/><stop offset="1" stop-color="#d96570"/></linearGradient></defs><path fill="url(#gmG{n})" d="M12 1.5c.6 5.6 1.9 7.9 4 9.5 1.6 1.2 3.7 1.8 6.5 2.5-2.8.7-4.9 1.3-6.5 2.5-2.1 1.6-3.4 3.9-4 9.5-.6-5.6-1.9-7.9-4-9.5C6.4 14.3 4.3 13.7 1.5 13c2.8-.7 4.9-1.3 6.5-2.5 2.1-1.6 3.4-3.9 4-9z"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2M16 7l3 3M14 9l2 2"/></svg>',
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
  var badKeys = {};       /* kunci yang ditolak atau limit selama sesi ini: { kunci: 'limit' | 'invalid' } */
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

  function activeKeys() { return KEYS.filter(function (k) { return OFF.indexOf(k) === -1; }); }
  function usableKeys() { return activeKeys().filter(function (k) { return !badKeys[k]; }); }
  function orderedKeys() {
    var u = usableKeys();
    if (PRIMARY && u.indexOf(PRIMARY) !== -1) u = [PRIMARY].concat(u.filter(function (k) { return k !== PRIMARY; }));
    return u;
  }
  function maskKey(k) { return k.length > 12 ? k.slice(0, 6) + '••••••••••••' + k.slice(-4) : '••••••••'; }

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
    var out = [], list = null;
    function close() { if (list) { out.push('</' + list + '>'); list = null; } }
    src.split('\n').forEach(function (l) {
      var m;
      if (/^\u0000\d+\u0000$/.test(l.trim())) { close(); out.push(l.trim()); return; }
      if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push('<li>' + inline(m[1]) + '</li>'); return; }
      if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push('<li>' + inline(m[1]) + '</li>'); return; }
      close();
      if ((m = l.match(/^#{1,6}\s+(.*)/))) { out.push('<h4>' + inline(m[1]) + '</h4>'); return; }
      if (!l.trim()) return;
      out.push('<p>' + inline(l) + '</p>');
    });
    close();
    return out.join('').replace(/\u0000(\d+)\u0000/g, function (_, i) { return blocks[+i] || ''; });
  }

  var toastT;
  function toast(t, bad) {
    var el = $('gmToast'); if (!el || !t) return;
    el.innerHTML = I.info + '<span>' + esc(t) + '</span>'; el.classList.toggle('bad', !!bad); el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('show'); }, bad ? 6500 : 2400);
  }
  function copyText(t) {
    function done() { toast('Disalin'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
    function fallback() {
      try { var a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); done(); } catch (e) { toast('Gagal menyalin'); }
    }
  }

  /* ---------- Penyimpanan riwayat (banyak obrolan, per akun, di perangkat) ---------- */
  var chats = [], curId = '', showAll = false, ctxId = '', srchQ = '', runTok = 0, dlgAct = null, pressT = 0, pressX = 0, pressY = 0, longFired = false, ctxAt = 0;
  var HIST_SHOW = 7, MAX_CHATS = 40;
  function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function storeKey() { return 'ngobrolGeminiChats_' + (myId || 'tamu'); }
  function oldKey() { return 'ngobrolGemini_' + (myId || 'tamu'); }
  function titleOf(list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].role === 'user') { var t = String(list[i].text).replace(/\s+/g, ' ').trim(); return t.length > 48 ? t.slice(0, 48).trim() + '\u2026' : t; }
    }
    return 'Obrolan baru';
  }
  function loadHist() {
    chats = [];
    try { var v = JSON.parse(localStorage.getItem(storeKey()) || 'null'); if (Array.isArray(v)) chats = v.filter(function (c) { return c && c.id && Array.isArray(c.msgs) && c.msgs.length; }); } catch (e) { chats = []; }
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
  }
  function saveHist() {
    var clean = msgs.filter(function (m) { return !m.err; }).slice(-MAX_KEEP), idx = -1;
    chats.forEach(function (c, i) { if (c.id === curId) idx = i; });
    if (!clean.length) { if (idx !== -1) chats.splice(idx, 1); }
    else {
      var c = { id: curId, title: titleOf(clean), ts: clean[clean.length - 1].ts || Date.now(), msgs: clean };
      if (idx === -1) chats.unshift(c); else chats[idx] = c;
      chats.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
      chats = chats.slice(0, MAX_CHATS);
    }
    try { localStorage.setItem(storeKey(), JSON.stringify(chats)); } catch (e) { /* penyimpanan penuh: abaikan */ }
    renderDrawer();
  }

  /* ---------- Laci samping (riwayat) ---------- */
  function renderDrawer() {
    var hist = $('gmHist'); if (!hist) return;
    var q = srchQ.trim().toLowerCase();
    var list = chats.filter(function (c) { return !q || String(c.title).toLowerCase().indexOf(q) !== -1; });
    var shown = (showAll || q) ? list : list.slice(0, HIST_SHOW);
    var h = shown.map(function (c) {
      return '<div class="gm-hi' + (c.id === curId ? ' on' : '') + (ctxId === c.id ? ' press' : '') + '" data-id="' + c.id + '"><button type="button" class="gm-hi-t" data-h="open" data-id="' + c.id + '"><span>' + esc(c.title) + '</span></button></div>';
    }).join('');
    if (!list.length) h = '<div class="gm-hempty">' + (q ? 'Tidak ada obrolan yang cocok.' : 'Belum ada riwayat obrolan.') + '</div>';
    if (!q && list.length > HIST_SHOW) h += '<button type="button" class="gm-more" data-h="more">' + (showAll ? 'Ringkas' : 'Lihat semua\u2026') + '</button>';
    hist.innerHTML = h;
    var nm = ''; try { nm = String((window.__ngobrolFB && window.__ngobrolFB.getMyName && window.__ngobrolFB.getMyName()) || '').trim(); } catch (e) { nm = ''; }
    $('gmAvatar').textContent = nm ? nm.charAt(0).toUpperCase() : 'G';
    $('gmClearAll').hidden = !chats.length;
    $('gmKeyBtn').hidden = !admin.is;
  }
  function openDrawer() { renderDrawer(); $('gmPanel').classList.add('drawer-open'); $('gmDrawer').setAttribute('aria-hidden', 'false'); }
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
        h += '<div class="gm-msg me"><div class="gm-ub">' + esc(m.text) + '</div><span class="gm-time">' + fmtTime(m.ts) + '</span></div>';
      } else if (m.err) {
        h += '<div class="gm-msg">' + aiHead(m.ts) + '<div class="gm-ai-body err">' + I.alert + '<span>' + esc(m.text) + '</span></div><div class="gm-acts"><button type="button" class="gm-act" data-gm="retry">' + I.retry + 'Coba lagi</button></div></div>';
      } else {
        h += '<div class="gm-msg">' + aiHead(m.ts) + '<div class="gm-ai-body">' + md(m.text) + '</div><div class="gm-acts"><button type="button" class="gm-act" data-gm="copy" data-i="' + i + '">' + I.copy + 'Salin</button>' +
          (i === last && !busy ? '<button type="button" class="gm-act" data-gm="regen">' + I.regen + 'Buat ulang</button>' : '') + '</div></div>';
      }
    });
    if (busy) h += '<div class="gm-msg" id="gmTyping">' + aiHead() + '<div class="gm-ai-body"><span class="gm-typing"><i></i><i></i><i></i></span></div></div>';
    b.innerHTML = h;
  }

  function modelName() { for (var i = 0; i < MODELS.length; i++) if (MODELS[i].id === MODEL) return 'Gemini ' + MODELS[i].name; return 'Gemini'; }

  /* ---------- Panggilan API ---------- */
  function buildContents() {
    var list = msgs.filter(function (m) { return !m.err && m.text; }).slice(-MAX_SEND), out = [];
    list.forEach(function (m) {
      var role = m.role === 'user' ? 'user' : 'model';
      if (out.length && out[out.length - 1].role === role) out[out.length - 1].parts[0].text += '\n' + m.text;
      else out.push({ role: role, parts: [{ text: m.text }] });
    });
    while (out.length && out[0].role !== 'user') out.shift();
    return out;
  }

  var BASE = 'https://generativelanguage.googleapis.com/v1beta/';
  var OVR = {};   /* model hasil deteksi otomatis: { pilihan admin: id model yang benar-benar tersedia } */

  function classify(status, j) {
    var msg = (j && j.error && j.error.message) || ('HTTP ' + status), low = String(msg).toLowerCase(), kind = 'error';
    if (status === 429 || low.indexOf('quota') !== -1 || low.indexOf('rate limit') !== -1) kind = 'limit';
    else if (status === 400 && (low.indexOf('api key') !== -1 || low.indexOf('api_key') !== -1)) kind = 'invalid';
    else if (status === 401 || status === 403) kind = 'invalid';
    else if (status === 404) kind = 'model';
    return { kind: kind, message: msg, status: status };
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
  function tierOf(id) { return /pro/.test(id) ? 'pro' : /lite/.test(id) ? 'lite' : 'flash'; }
  function pickModel(ids, tier) {
    var bad = /image|tts|live|audio|embed|robot|computer|native|imagen|veo|lyria|omni|banana|gemma|learnlm|aqa|exp|thinking|customtools|vision/;
    var c = ids.filter(function (id) { return /^gemini-/.test(id) && !bad.test(id) && tierOf(id) === tier && (tier === 'pro' ? /pro/.test(id) : /flash/.test(id)); });
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

  /* Coba kunci satu per satu; kunci yang limit atau tidak valid dilewati */
  function ask() {
    if (!gmOn()) return Promise.reject(offErr());
    var keys = orderedKeys(), tried = 0, lastKind = '';
    if (!keys.length && activeKeys().length) { badKeys = {}; keys = orderedKeys(); }
    var body = { systemInstruction: { parts: [{ text: SYSTEM }] }, contents: buildContents(), generationConfig: { temperature: 0.8, maxOutputTokens: 2048 } };
    function next() {
      var k = keys.shift();
      if (!k) {
        if (!tried) throw { kind: 'nokey', message: 'Tidak ada API key yang bisa dipakai saat ini.' };
        throw { kind: lastKind === 'invalid' ? 'invalid' : 'limit', message: '' };
      }
      tried++;
      return callGemini(k, body, ctrl.signal).catch(function (e) {
        if (e && e.kind === 'model') return resolveModel(k, ctrl.signal).then(function (m) { return callGemini(k, body, ctrl.signal, m); });
        throw e;
      }).then(extractText, function (e) {
        if (e && (e.kind === 'limit' || e.kind === 'invalid')) { badKeys[k] = e.kind; lastKind = e.kind; return next(); }
        throw e;
      });
    }
    return Promise.resolve().then(next);
  }

  function errText(e) {
    if (!e) return 'Terjadi kesalahan. Coba lagi.';
    if (e.name === 'AbortError') return '';
    switch (e.kind) {
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
    var s = $('gmSend'), has = !!$('gmInput').value.trim(), on = gmOn() && activeKeys().length > 0;
    s.hidden = !(busy || (has && on));
    s.classList.toggle('stop', busy);
    s.innerHTML = busy ? I.stop : I.send;
    s.setAttribute('aria-label', busy ? 'Hentikan' : 'Kirim');
    s.disabled = busy ? false : !on;
  }
  function setBusy(v) { busy = v; updSend(); }

  function run() {
    if (!gmOn()) return;
    var tok = ++runTok;
    ctrl = typeof AbortController !== 'undefined' ? new AbortController() : { signal: undefined, abort: function () {} };
    setBusy(true); render(); scrollEnd(true);
    ask().then(function (t) { if (tok !== runTok) return; msgs.push({ role: 'model', text: t, ts: Date.now() }); saveHist(); },
      function (e) { if (tok !== runTok) return; var t = errText(e); if (t) msgs.push({ role: 'model', text: t, err: true, ts: Date.now() }); })
      .then(function () { if (tok !== runTok) return; ctrl = null; setBusy(false); render(); scrollEnd(true); });
  }

  function send(text) {
    text = String(text || '').trim();
    if (!text || busy || !gmOn() || !activeKeys().length) return;
    msgs.push({ role: 'user', text: text, ts: Date.now() }); saveHist();
    $('gmInput').value = ''; fit(); updSend();
    run();
  }
  function retry() {
    if (busy || !gmOn()) return;
    while (msgs.length && msgs[msgs.length - 1].err) msgs.pop();
    badKeys = {};
    run();
  }
  function regen() {
    if (busy || !gmOn()) return;
    while (msgs.length && msgs[msgs.length - 1].role !== 'user') msgs.pop();
    saveHist(); badKeys = {};
    run();
  }
  function stopRun() { runTok++; if (busy && ctrl) ctrl.abort(); ctrl = null; busy = false; }
  function newChat() {
    stopRun();
    if (msgs.length) saveHist();
    curId = uid(); msgs = []; closeDrawer(); closePop(); setBusy(false); render(); scrollEnd(false);
  }
  function openChat(id) {
    var c = null; chats.forEach(function (x) { if (x.id === id) c = x; });
    if (!c) return;
    stopRun();
    curId = c.id; msgs = c.msgs.slice(); closeDrawer(); setBusy(false); render(); scrollEnd(false);
  }
  function delChat(id) {
    chats = chats.filter(function (c) { return c.id !== id; });
    try { localStorage.setItem(storeKey(), JSON.stringify(chats)); } catch (e) { /* abaikan */ }
    if (id === curId) { stopRun(); curId = uid(); msgs = []; setBusy(false); render(); } else renderDrawer();
    toast('Obrolan dihapus');
  }
  function clearAll() {
    stopRun();
    chats = []; msgs = []; curId = uid();
    try { localStorage.removeItem(storeKey()); localStorage.removeItem(oldKey()); } catch (e) { /* abaikan */ }
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
    KEYS = []; OFF = []; PRIMARY = ''; META = null; badKeys = {}; OVR = {}; loaded = false;
  }
  function applyConfig(v) {
    META = v;
    var list = parseKeys(v), off = [];
    if (v.keysOff && typeof v.keysOff === 'object') Object.keys(v.keysOff).forEach(function (i) { if (list.indexOf(v.keysOff[i]) !== -1) off.push(v.keysOff[i]); });
    var prim = typeof v.primary === 'string' && list.indexOf(v.primary.trim()) !== -1 ? v.primary.trim() : '';
    var model = typeof v.model === 'string' && v.model ? v.model : DEFAULT_MODEL;
    /* Gemini 2.5 sudah dimatikan Google (16 Okt 2026): pakai alias terbaru */
    if (/^gemini-2\.(5|0)-pro/.test(model)) model = 'gemini-pro-latest';
    else if (/^gemini-2\.(5|0)-flash-lite/.test(model)) model = 'gemini-flash-lite-latest';
    else if (/^gemini-2\.(5|0)/.test(model)) model = 'gemini-flash-latest';
    if (list.join('|') !== KEYS.join('|') || off.join('|') !== OFF.join('|')) badKeys = {};
    if (model !== MODEL) OVR = {};
    KEYS = list; OFF = off; PRIMARY = prim; MODEL = model;
    loaded = true; synced = true;
    if ($('gmPanel').classList.contains('open')) render();
    if ($('gmAdmin').classList.contains('open')) renderAdmin();
    syncSend();
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
    msgs = []; chats = []; curId = '';
    try {
      closeDrawer(); closePop(); hideCtx(); hideDlg();
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
    waitBridge().then(function (b) {
      myId = b.getMyId();
      if (gmOn()) attachConfig(); else lockdown();
      b.onValue(b.ref(b.db, 'users/' + myId + '/role'), function (snap) {
        admin.is = snap.val() === 'admin';
        try { document.documentElement.classList.toggle('gm-adm', admin.is); } catch (e) { /* diabaikan */ }
        if (!admin.is) closeAdmin();
        syncService();
        if ($('gmPanel').classList.contains('open')) render();
      }, function () {});
    });
  }

  /* ---------- Pengaturan admin ---------- */
  function setStatus(t, kind) { if (t) toast(t, kind === 'bad'); }
  function setReveal(v) {
    reveal = v;
    var i = $('gmKeyInput'), b = $('gmEye');
    var maskOk = false; try { maskOk = !!(window.CSS && CSS.supports && CSS.supports('-webkit-text-security', 'disc')); } catch (e) { /* abaikan */ }
    if (maskOk) { i.type = 'text'; i.classList.toggle('gm-secret', !v); } else { i.type = v ? 'text' : 'password'; i.classList.remove('gm-secret'); }
    b.innerHTML = v ? I.eye : I.eyeOff;
    b.setAttribute('aria-label', v ? 'Sembunyikan kunci' : 'Tampilkan kunci');
  }

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
  function fail(e) { setStatus(e && e.message ? e.message : 'Gagal menyimpan. Periksa koneksi dan aturan database.', 'bad'); }

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
    if (svcBusy || !admin.is || !window.GMGate) return;
    if (on === gmOn()) return;
    svcBusy = true; syncService();
    window.GMGate.set(on).then(function () {
      toast(on ? 'Gemini diaktifkan untuk semua pengguna.' : 'Gemini dinonaktifkan untuk semua pengguna.');
    }).catch(function (e) { toast(svcError(e), true); })
      .then(function () { svcBusy = false; syncService(); });
  }

    var askDel = '', askT;
  function renderAdmin() {
    $('gmModels').innerHTML = MODELS.map(function (m) { return '<button type="button" data-m="' + m.id + '" class="' + (m.id === MODEL ? 'on' : '') + '">' + m.name + '<small>' + m.sub + '</small></button>'; }).join('');
    var act = activeKeys().length, lim = KEYS.filter(function (k) { return OFF.indexOf(k) === -1 && badKeys[k]; }).length;
    $('gmStats').innerHTML = '<div class="gm-stat"><b>' + KEYS.length + '</b><span>Total</span></div><div class="gm-stat ok"><b>' + (act - lim) + '</b><span>Siap pakai</span></div><div class="gm-stat' + (lim ? ' warn' : '') + '"><b>' + (KEYS.length - act + lim) + '</b><span>Tidak aktif</span></div>';
    $('gmKeyCnt').textContent = KEYS.length ? KEYS.length + ' kunci' : '';
    var list = $('gmKeyList');
    if (!KEYS.length) { list.innerHTML = '<div class="gm-empty">' + I.key + 'Belum ada API key.<br>Tambahkan kunci di bawah untuk mengaktifkan Gemini.</div>'; }
    else {
      var main = PRIMARY && OFF.indexOf(PRIMARY) === -1 ? PRIMARY : (activeKeys()[0] || '');
      list.innerHTML = KEYS.map(function (k, i) {
        var off = OFF.indexOf(k) !== -1, isMain = !off && k === main, tags = '';
        if (isMain) tags += '<span class="gm-tag main">Utama</span>';
        else if (!off) tags += '<span class="gm-tag">Cadangan</span>';
        if (off) tags += '<span class="gm-tag off">Nonaktif</span>';
        if (badKeys[k] === 'limit') tags += '<span class="gm-tag warn">Kuota habis</span>';
        if (badKeys[k] === 'invalid') tags += '<span class="gm-tag warn">Ditolak</span>';
        return '<div class="gm-key' + (isMain ? ' main' : '') + (off ? ' off' : '') + '"><div class="gm-key-top"><div class="gm-key-ico">' + I.key + '</div><div class="gm-key-i"><div class="gm-key-v">' + esc(maskKey(k)) + '</div><div class="gm-tags">' + tags + '</div></div></div>' +
          '<div class="gm-key-bot"><button type="button" class="gm-sw" role="switch" aria-checked="' + (!off) + '" data-a="toggle" data-i="' + i + '" aria-label="' + (off ? 'Aktifkan kunci' : 'Nonaktifkan kunci') + '"></button><span class="gm-swt">' + (off ? 'Nonaktif' : 'Aktif') + '</span><span class="gm-sp"></span>' +
          (!off && !isMain ? '<button type="button" class="gm-link" data-a="main" data-i="' + i + '">Jadikan utama</button>' : '') +
          '<button type="button" class="gm-link danger' + (askDel === k ? ' ask' : '') + '" data-a="del" data-i="' + i + '">' + (askDel === k ? 'Ketuk lagi untuk hapus' : I.trash + 'Hapus') + '</button></div></div>';
      }).join('');
    }
    var m = META || {};
    $('gmMeta').textContent = KEYS.length && m.updatedAt ? 'Terakhir diubah oleh ' + (m.updatedByName || 'admin') + ', ' + new Date(m.updatedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  }
  function openAdmin() {
    if (!admin.is) return;
    askDel = ''; $('gmKeyInput').value = ''; setReveal(false); setStatus(''); syncService(); renderAdmin();
    $('gmAdmin').classList.add('open');
  }
  function closeAdmin() { var a = $('gmAdmin'); if (a) a.classList.remove('open'); }

  function addKey() {
    var inp = $('gmKeyInput'), k = inp.value.replace(/\s+/g, '');
    var btn = $('gmAddBtn');
    if (k.length < 20) { setStatus('API key terlalu pendek. Tempel kunci lengkap dari Google AI Studio.', 'bad'); return; }
    if (KEYS.indexOf(k) !== -1) { setStatus('Kunci ini sudah ada di daftar.', 'bad'); return; }
    btn.disabled = true; btn.textContent = 'Menguji kunci'; setStatus('');
    var okState = 'ok';
    listModels(k).catch(function (e) { if (e && e.kind === 'limit') { okState = 'limit'; return null; } throw e; }).then(function (ids) {
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
        if (e && e.kind === 'limit') { okState = 'limit'; return model; }
        throw e;
      });
    }).then(function (model) {
      var next = cfg({ keys: KEYS.concat([k]) });
      if (!PRIMARY && !KEYS.length) next.primary = k;
      return saveConfig(next).then(function () {
        inp.value = '';
        setStatus(okState === 'limit' ? 'Kunci tersimpan, tetapi kuotanya sedang habis.' : 'Kunci valid dan berhasil disimpan (' + model + ').', okState === 'limit' ? '' : 'ok');
      });
    }).catch(function (e) {
      if (e && e.kind === 'invalid') setStatus('Kunci ditolak Google: ' + e.message, 'bad');
      else if (e && e.kind === 'model') setStatus('Model tidak tersedia: ' + (e.message || '') + ' Coba pilih model lain.', 'bad');
      else if (e && e.message && e.message.indexOf('Failed to fetch') !== -1) setStatus('Tidak bisa terhubung ke Google. Periksa koneksi internet.', 'bad');
      else fail(e);
    }).then(function () { btn.disabled = false; btn.textContent = 'Uji dan simpan kunci'; });
  }

  function adminClick(e) {
    var t = e.target.closest('[data-a],[data-m]'); if (!t) return;
    if (t.dataset.m) { if (t.dataset.m !== MODEL) saveConfig(cfg({ model: t.dataset.m })).then(function () { setStatus('Model diganti.', 'ok'); }, fail); return; }
    var k = KEYS[+t.dataset.i], a = t.dataset.a;
    if (!k) return;
    if (a === 'main') saveConfig(cfg({ primary: k })).then(function () { setStatus('Kunci utama diganti.', 'ok'); }, fail);
    else if (a === 'toggle') {
      var off = OFF.indexOf(k) !== -1 ? OFF.filter(function (x) { return x !== k; }) : OFF.concat([k]);
      saveConfig(cfg({ off: off })).then(function () { setStatus(off.indexOf(k) !== -1 ? 'Kunci dinonaktifkan.' : 'Kunci diaktifkan.', 'ok'); }, fail);
    } else if (a === 'del') {
      if (askDel !== k) { askDel = k; renderAdmin(); clearTimeout(askT); askT = setTimeout(function () { askDel = ''; renderAdmin(); }, 3000); return; }
      askDel = ''; clearTimeout(askT);
      saveConfig(cfg({ keys: KEYS.filter(function (x) { return x !== k; }), primary: PRIMARY === k ? '' : PRIMARY })).then(function () { setStatus('Kunci dihapus.', 'ok'); }, fail);
    }
  }

  /* ---------- Inisialisasi ---------- */
  function init() {
    if (!$('gmPanel') || !$('gmFab')) return;
    $('gmFab').innerHTML = spark();
    $('gmPillIc').innerHTML = spark();
    $('gmAdLogo').innerHTML = spark();
    $('gmMenu').innerHTML = I.menu;
    $('gmNew').innerHTML = I.chat;
    $('gmSrchBtn').innerHTML = I.search;
    $('gmBack').insertAdjacentHTML('afterbegin', I.back);
    $('gmOffBack').innerHTML = I.back; $('gmOffBack').addEventListener('click', close);
    $('gmKeyBtn').insertAdjacentHTML('afterbegin', I.key);
    $('gmClearAll').insertAdjacentHTML('afterbegin', I.trash);
    $('gmNew2').insertAdjacentHTML('afterbegin', I.compose);
    $('gmPlus').innerHTML = I.plus;
    $('gmPopNew').insertAdjacentHTML('afterbegin', I.compose);
    $('gmPopCopy').insertAdjacentHTML('afterbegin', I.copy);
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
    $('gmPopNew').addEventListener('click', newChat);
    $('gmPopCopy').addEventListener('click', function () {
      closePop();
      if (!msgs.length) { toast('Belum ada obrolan untuk disalin'); return; }
      copyText(msgs.filter(function (m) { return !m.err; }).map(function (m) { return (m.role === 'user' ? 'Saya' : 'Gemini') + ': ' + m.text; }).join('\n\n'));
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('#gmPop')) closePop(); });
    $('gmAdX').addEventListener('click', closeAdmin);
    $('gmAdmin').addEventListener('click', function (e) { if (e.target === $('gmAdmin')) closeAdmin(); });
    $('gmEye').addEventListener('click', function () { setReveal(!reveal); });
    $('gmAddBtn').addEventListener('click', addKey);
    $('gmKeyInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addKey(); } });
    $('gmAdmin').addEventListener('click', adminClick);

    $('gmSend').addEventListener('click', function () {
      if (busy) { if (ctrl) ctrl.abort(); return; }
      if ($('gmInput').value.trim()) send($('gmInput').value); else $('gmInput').focus();
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
      if (!$('gmDlg').hidden) hideDlg();
      else if (!$('gmCtxBg').hidden) hideCtx();
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
