/* ==========================================================================
   SAKELAR YOUTUBE (global)
   --------------------------------------------------------------------------
   Satu sumber kebenaran untuk seluruh fitur YouTube: tab YouTube, pemutar,
   dan video YouTube di dalam chat. Status disimpan admin di database pada
   config/youtubeSwitch dan diterima semua pengguna secara langsung.

   - Status terakhir disimpan di perangkat, jadi bila dinonaktifkan, YouTube
     tetap terkunci sejak aplikasi dibuka, bahkan sebelum database menjawab.
   - Bila status belum pernah diketahui, YouTube dianggap aktif (perilaku lama).
   - Kelas "yt-off" di <html> menyembunyikan tab dan pemutar lewat CSS.
   ========================================================================== */
(function () {
  'use strict';
  var STORE = 'yt:gate';
  var PATH = 'config/youtubeSwitch';
  var HOST_RE = /(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be)$/;

  var enabled = true;
  var known = false;
  var listeners = [];
  var memo = null;

  function readCache() {
    try {
      var v = localStorage.getItem(STORE);
      if (v === '0') return false;
      if (v === '1') return true;
    } catch (e) { /* penyimpanan diblokir: pakai memori */ }
    return memo;
  }
  function writeCache(on) {
    memo = on;
    try { localStorage.setItem(STORE, on ? '1' : '0'); } catch (e) { /* diabaikan */ }
  }
  function paint() {
    try { document.documentElement.classList.toggle('yt-off', !enabled); } catch (e) { /* diabaikan */ }
  }

  /* Terapkan status baru. Mengembalikan true bila status berubah. */
  function apply(next) {
    next = !!next;
    var changed = next !== enabled;
    enabled = next;
    writeCache(next);
    paint();
    if (!changed) return false;
    listeners.slice().forEach(function (fn) { try { fn(enabled); } catch (e) { console.warn('YTGate:', e); } });
    try { window.dispatchEvent(new CustomEvent('ytgate', { detail: { enabled: enabled } })); } catch (e) { /* diabaikan */ }
    return true;
  }

  function isYouTubeHost(h) {
    h = String(h || '').toLowerCase().replace(/\.$/, '');
    return HOST_RE.test(h);
  }
  function isYouTubeUrl(raw) {
    raw = String(raw || '').trim();
    if (!raw) return false;
    try {
      var u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : 'https://' + raw);
      return isYouTubeHost(u.hostname);
    } catch (e) { return false; }
  }

  /* Admin: simpan status ke database. Aturan database memeriksa bahwa penulis adalah admin. */
  function set(on) {
    var b = window.__ngobrolFB;
    if (!b || !b.set || !b.ref || !b.db || !b.getMyId || !b.getMyId()) {
      return Promise.reject(new Error('Belum terhubung ke database.'));
    }
    return b.set(b.ref(b.db, PATH), {
      enabled: !!on,
      updatedBy: b.getMyId(),
      updatedByName: b.getMyName ? String(b.getMyName() || '') : '',
      updatedAt: Date.now()
    });
  }

  function attach(b) {
    try {
      b.onValue(b.ref(b.db, PATH), function (snap) {
        var v = snap.val();
        known = true;
        apply(!(v && v.enabled === false));
      }, function () {
        /* gagal membaca (mis. aturan database belum diperbarui): pertahankan status terakhir */
        known = true;
      });
    } catch (e) { known = true; }
  }

  /* Tunggu jembatan database dari app.js, lalu berlangganan. Berlangganan tidak butuh login. */
  function waitBridge() {
    var delay = 100;
    (function poll() {
      var b = window.__ngobrolFB;
      if (b && b.db && b.ref && b.onValue) { attach(b); return; }
      delay = Math.min(2000, Math.round(delay * 1.5));
      setTimeout(poll, delay);
    })();
  }

  var cached = readCache();
  if (cached === false) enabled = false;
  paint();
  waitBridge();

  window.YTGate = {
    isEnabled: function () { return enabled; },
    isKnown: function () { return known; },
    onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); },
    set: set,
    isYouTubeHost: isYouTubeHost,
    isYouTubeUrl: isYouTubeUrl
  };
})();
