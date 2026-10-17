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
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
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
  function hasKey() { return String(CFG.API_KEY || '').length > 10; }
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
  function toast(m) { if (typeof window.showToast === 'function') window.showToast(m); }

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
    var hit = cacheGet(ck, ttl);
    if (hit) return Promise.resolve(hit);
    return fetch(API + endpoint + '?' + q + '&key=' + encodeURIComponent(CFG.API_KEY)).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) {
          var e = new Error((j.error && j.error.message) || ('HTTP ' + r.status));
          e.reason = j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason;
          e.status = r.status; throw e;
        }
        cacheSet(ck, j); return j;
      });
    });
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
  function showError(e, fresh) {
    var box;
    if (!hasKey()) {
      box = admin.is
        ? stateBox('', I.key, 'API key belum diatur', 'Fitur YouTube membutuhkan API key. Sebagai admin, Anda dapat mengisinya sekarang.', '<button type="button" class="yt-btn primary" id="ytSetKey">' + I.key + 'Atur API key</button>')
        : stateBox('', I.key, 'Fitur belum aktif', 'API key YouTube belum diatur. Silakan hubungi admin aplikasi.');
    } else if (e && (e.reason === 'quotaExceeded' || e.reason === 'dailyLimitExceeded' || e.reason === 'rateLimitExceeded')) {
      box = stateBox('error', I.alert, 'Kuota harian habis', 'Kuota YouTube Data API untuk kunci ini sudah terpakai. Kuota akan pulih otomatis setiap hari, atau tambah kuota di Google Cloud Console.');
    } else if (e && (e.reason === 'keyInvalid' || e.reason === 'badRequest' && /API key/i.test(e.message))) {
      box = stateBox('error', I.key, 'API key tidak valid', admin.is ? 'Perbarui kunci melalui ikon kunci di kanan atas.' : 'Silakan hubungi admin aplikasi untuk memperbarui kunci.');
    } else if (e && (e.reason === 'accessNotConfigured' || e.reason === 'forbidden' || e.reason === 'ipRefererBlocked')) {
      box = stateBox('error', I.alert, 'Akses ditolak', 'Pastikan YouTube Data API v3 sudah diaktifkan pada proyek Anda dan pembatasan HTTP referrer pada kunci mengizinkan domain aplikasi ini.');
    } else {
      box = stateBox('error', I.alert, 'Gagal memuat video', esc(navigator.onLine ? (e && e.message) || 'Terjadi kesalahan.' : 'Tidak ada koneksi internet.'),
        '<button type="button" class="yt-btn primary" id="ytRetry">' + I.refresh + 'Coba lagi</button>');
    }
    if (fresh) $('ytList').innerHTML = box; else toast('Gagal memuat: ' + ((e && e.message) || 'kesalahan'));
  }

  function load(fresh) {
    if (state.loading) { if (fresh) state.again = true; return; }
    if (fresh) { state.token = ''; }
    if (!hasKey()) {
      $('ytMoreWrap').innerHTML = '';
      /* kunci belum diketahui: tampilkan pemuatan, jangan tampilkan "fitur belum aktif" */
      if (!state.keyKnown) { $('ytList').innerHTML = secTitle() + '<div class="yt-grid">' + skeleton(6) + '</div>'; return; }
      $('ytList').innerHTML = ''; showError(null, true); return;
    }
    state.loading = true;
    if (fresh) $('ytList').innerHTML = secTitle() + '<div class="yt-grid">' + skeleton(6) + '</div>';
    var btn = $('ytMore'); if (btn) { btn.disabled = true; }
    fetchPage().then(function (r) {
      state.token = r.next; state.lastLoad = Date.now();
      if (fresh) {
        if (!r.items.length) { $('ytList').innerHTML = stateBox('', I.empty, 'Video tidak ditemukan', 'Coba kata kunci lain atau pilih kategori yang berbeda.'); $('ytMoreWrap').innerHTML = ''; return; }
        $('ytList').innerHTML = secTitle() + '<div class="yt-grid" id="ytGrid"></div>';
      }
      $('ytGrid').insertAdjacentHTML('beforeend', r.items.map(card).join(''));
      $('ytMoreWrap').innerHTML = r.next ? '<div class="yt-more"><button type="button" class="yt-btn" id="ytMore">' + I.down + 'Muat lebih banyak</button></div>' : '';
    }).catch(function (e) { showError(e, fresh); if (!fresh) { var b = $('ytMore'); if (b) b.disabled = false; } })
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
    $('ytFrameWrap').innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&playsinline=1&modestbranding=1" title="Pemutar video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    $('ytDetail').innerHTML = '<div class="yt-line" style="height:18px;width:80%;border-radius:6px;background:#e6ecee"></div>';
    $('ytPlayer').classList.add('open');
    state.current = { id: id };
    details([id]).then(function (items) {
      var v = items[0]; if (!v || state.current.id !== id) return;
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
  CFG.API_KEY = '';
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
          var k = String(v.apiKey || '').trim();
          admin.meta = v;
          var eff = k;
          var changed = eff !== CFG.API_KEY;
          CFG.API_KEY = eff;
          if (first) done(); else if (changed && state.ready) load(true);
        }, done);
        b.onValue(b.ref(b.db, 'users/' + id + '/role'), function (snap) {
          var r = snap.val();
          /* akun lama tanpa peran diberi "user". Peran "admin" hanya bisa diberikan manual di konsol Firebase */
          if (r === null || r === undefined) b.set(b.ref(b.db, 'users/' + id + '/role'), 'user').catch(function () {});
          admin.is = r === 'admin';
          $('ytAdminBtn').hidden = !admin.is;
          if (!admin.is) closeAdmin();
          if (state.ready && !hasKey()) load(true);
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
  function admMsg(t, ok) { var m = $('ytAdmMsg'); m.textContent = t || ''; m.classList.toggle('ok', !!ok); }
  function openAdmin() {
    if (!admin.is) return;
    var m = admin.meta || {}, has = hasKey();
    $('ytKeyInput').value = ''; setReveal(false);
    $('ytStatusDot').className = 'yt-dot' + (has ? ' on' : '');
    $('ytStatusText').textContent = has ? 'Aktif' : 'Belum diatur';
    $('ytKeyMasked').textContent = has ? maskKey(CFG.API_KEY) : 'Tidak ada kunci tersimpan'; $('ytKeyMasked').classList.toggle('empty', !has);
    var meta = '';
    if (has && m.updatedAt) meta = 'Diubah oleh ' + (m.updatedByName || m.updatedBy || 'admin') + ', ' + ago(new Date(m.updatedAt).toISOString());
    $('ytAdmMeta').textContent = meta; $('ytAdmMeta').style.display = meta ? '' : 'none';
    $('ytAdmReset').style.display = has ? '' : 'none';
    $('ytAdmReset').textContent = 'Hapus kunci'; $('ytAdmReset').dataset.confirm = '';
    admMsg(''); $('ytAdmin').classList.add('open');
    setTimeout(function () { $('ytKeyInput').focus(); }, 60);
  }
  function closeAdmin() { var a = $('ytAdmin'); if (a) a.classList.remove('open'); }

  function writeKey(key) {
    var b = window.__ngobrolFB;
    if (!b || !admin.is) return Promise.reject(new Error('Hanya admin yang dapat mengubah API key.'));
    return b.set(b.ref(b.db, 'config/youtube'), { apiKey: key, updatedBy: b.getMyId(), updatedByName: b.getMyName(), updatedAt: Date.now() });
  }
  function busy(on) { ['ytAdmSave', 'ytAdmReset', 'ytAdmCancel'].forEach(function (i) { $(i).disabled = on; }); }
  function failText(e) {
    if (e && (e.reason === 'quotaExceeded' || e.reason === 'dailyLimitExceeded')) return 'Kunci valid, tetapi kuota harian habis.';
    if (e && e.reason === 'keyInvalid') return 'API key tidak valid.';
    if (e && (e.reason === 'accessNotConfigured' || e.reason === 'forbidden' || e.reason === 'ipRefererBlocked')) return 'Kunci ditolak. Aktifkan YouTube Data API v3 dan cek pembatasan referrer.';
    return (e && e.message) || 'Gagal memeriksa kunci.';
  }
  function saveKey() {
    var k = $('ytKeyInput').value.trim();
    if (!k) { admMsg('Masukkan API key.'); return; }
    if (/\s/.test(k) || k.length < 20) { admMsg('Format API key tidak valid.'); return; }
    busy(true); admMsg('Memeriksa kunci...', true);
    /* uji kunci dengan satu permintaan ringan (1 unit kuota) sebelum disimpan */
    fetch(API + 'videos?part=id&id=dQw4w9WgXcQ&key=' + encodeURIComponent(k)).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) { var e = new Error((j.error && j.error.message) || 'HTTP ' + r.status); e.reason = j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason; throw e; }
      });
    }).then(function () { return writeKey(k); }).then(function () {
      admMsg('API key tersimpan dan langsung dipakai semua pengguna.', true); toast('API key YouTube diperbarui');
      setTimeout(closeAdmin, 900);
    }).catch(function (e) { admMsg(e && e.reason ? failText(e) : (e && e.code === 'PERMISSION_DENIED' ? 'Ditolak oleh aturan database. Periksa Rules Firebase.' : failText(e))); })
      .then(function () { busy(false); });
  }
  function resetKey() {
    var b = $('ytAdmReset');
    if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = 'Yakin hapus?'; return; }
    busy(true);
    writeKey('').then(function () { toast('API key dihapus'); closeAdmin(); })
      .catch(function (e) { admMsg(e && e.code === 'PERMISSION_DENIED' ? 'Ditolak oleh aturan database. Periksa Rules Firebase.' : failText(e)); })
      .then(function () { busy(false); b.dataset.confirm = ''; b.textContent = 'Hapus kunci'; });
  }

  /* ---------- Inisialisasi ---------- */
  function init() {
    if (!$('paneYoutube')) return;
    $('ytSearchIcon').innerHTML = I.search;
    $('ytClear').innerHTML = I.close; $('ytGo').innerHTML = I.arrow; $('ytClose').innerHTML = I.close;
    renderChips();
    $('ytRefresh').innerHTML = I.refresh;
    function refreshHome(spin) {
      if (state.mode !== 'popular' || state.loading) return;
      if (spin) { var b = $('ytRefresh'); b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); }
      $('ytScroll').scrollTop = 0; load(true);
    }
    $('ytRefresh').addEventListener('click', function () { if (state.mode === 'search') { $('ytInput').value = ''; $('ytSearchBox').classList.remove('has-text'); state.mode = 'popular'; state.cat = 'popular'; state.query = ''; load(true); $('ytScroll').scrollTop = 0; } else refreshHome(true); });
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
        (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { toast('Tautan disalin'); }, function () { toast(u); });
      } else if (e.target.closest('#ytShare')) {
        var t = state.current || {};
        if (navigator.share) navigator.share({ title: t.title || 'Video YouTube', url: url() }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(url()).then(function () { toast('Tautan disalin'); });
      } else if (e.target.closest('#ytDescToggle')) {
        var d = $('ytDesc'), open = d.classList.toggle('open');
        e.target.closest('#ytDescToggle').textContent = open ? 'Tampilkan lebih sedikit' : 'Tampilkan selengkapnya';
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('ytPlayer').classList.contains('open')) closePlayer(); });

    /* muat pertama kali saat tab dibuka */
    $('ytAdminBtn').innerHTML = I.key; $('ytAdmIco').innerHTML = I.key; setReveal(false);
    $('ytAdminBtn').addEventListener('click', openAdmin);
    $('ytAdmCancel').addEventListener('click', closeAdmin);
    $('ytAdmSave').addEventListener('click', saveKey);
    $('ytAdmReset').addEventListener('click', resetKey);
    $('ytKeyInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') saveKey(); });
    $('ytKeyEye').addEventListener('click', function () { setReveal(!isRevealed()); $('ytKeyInput').focus(); });
    $('ytAdmin').addEventListener('click', function (e) { if (e.target === $('ytAdmin')) closeAdmin(); });

    /* sinkronkan kunci dan peran sejak aplikasi dibuka, jadi saat tab YouTube dibuka kunci sudah siap */
    startSync().catch(function () { state.keyKnown = true; if (state.ready) load(true); });
    var tab = document.querySelector('.bottom-tab[data-pane="paneYoutube"]');
    if (tab) tab.addEventListener('click', function () {
      if (state.ready) return;
      state.ready = true;
      load(true); /* bila kunci belum diketahui, tampil pemuatan lalu otomatis lanjut saat kunci tiba */
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
