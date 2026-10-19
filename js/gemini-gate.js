/* ==========================================================================
   SAKELAR GEMINI (global)
   --------------------------------------------------------------------------
   Satu sumber kebenaran untuk seluruh fitur Gemini: tombol Gemini, panel
   obrolan, dan permintaan ke Google. Status disimpan admin di database pada
   config/geminiSwitch dan diterima semua pengguna secara langsung.

   - Status terakhir disimpan di perangkat, jadi bila dinonaktifkan, Gemini
     tetap terkunci sejak aplikasi dibuka, bahkan sebelum database menjawab.
   - Di perangkat yang belum pernah tahu statusnya, Gemini tetap TERKUNCI
     sampai database menjawab (aman terlebih dahulu).
   - Bila database tidak bisa dibaca (aturan belum diperbarui), status
     dianggap aktif (perilaku lama) agar aplikasi tidak mati total.
   - Kelas "gm-off" di <html> menyembunyikan tombol dan panel lewat CSS.
   ========================================================================== */
(function () {
  'use strict';
  var STORE = 'gm:gate';
  var PATH = 'config/geminiSwitch';

  var enabled = true;     /* nilai sakelar dari admin */
  var pending = true;     /* belum pernah tahu statusnya: terkunci */
  var known = false;      /* database sudah menjawab pada sesi ini */
  var listeners = [];
  var memo = null;
  var writing = 0;        /* jumlah penulisan sakelar yang belum dikonfirmasi server */

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
  function effective() { return enabled && !pending; }
  function paint() {
    try { document.documentElement.classList.toggle('gm-off', !effective()); } catch (e) { /* diabaikan */ }
  }
  function notify() {
    var on = effective();
    listeners.slice().forEach(function (fn) { try { fn(on); } catch (e) { console.warn('GMGate:', e); } });
    try { window.dispatchEvent(new CustomEvent('gmgate', { detail: { enabled: on } })); } catch (e) { /* diabaikan */ }
  }

  /* Terapkan status baru; pemanggil gerbang diberi tahu bila status efektif atau pengetahuan berubah. */
  function apply(nextEnabled, nextPending, nextKnown) {
    var before = effective(), wasKnown = known;
    enabled = !!nextEnabled;
    pending = !!nextPending;
    if (nextKnown) known = true;
    if (!pending) writeCache(enabled);
    paint();
    if (before !== effective() || (known && !wasKnown)) notify();
  }

  /* Admin: simpan status ke database. Aturan database memeriksa bahwa penulis adalah admin.
     Status baru HANYA dianggap berlaku setelah server menerima dan terbaca ulang dari server.
     Gema lokal sementara dari Firebase diabaikan agar sakelar tidak sempat berubah lalu
     kembali sendiri bila penulisan ditolak. */
  function set(on) {
    var b = window.__ngobrolFB;
    if (!b || !b.set || !b.ref || !b.db || !b.getMyId || !b.getMyId()) {
      return Promise.reject(new Error('Belum terhubung ke database.'));
    }
    var target = b.ref(b.db, PATH);
    var prev = { enabled: enabled, pending: pending };
    writing++;

    function confirmFromServer(fallbackOn) {
      var read;
      try { read = b.get ? Promise.resolve(b.get(target)) : Promise.reject(new Error('get')); }
      catch (e) { read = Promise.reject(e); }
      return read.then(function (snap) {
        var v = snap.val();
        apply(!(v && v.enabled === false), false, true);
      }, function () {
        if (fallbackOn === null) apply(prev.enabled, prev.pending, known);
        else apply(fallbackOn, false, true);
      }).then(function () { writing = Math.max(0, writing - 1); });
    }

    var payload = {
      enabled: !!on,
      updatedBy: b.getMyId(),
      updatedByName: b.getMyName ? String(b.getMyName() || '') : '',
      updatedAt: Date.now()
    };
    var w;
    try { w = Promise.resolve(b.set(target, payload)); } catch (e) { w = Promise.reject(e); }
    return w.then(function () {
      return confirmFromServer(!!on);
    }, function (err) {
      return confirmFromServer(null).then(function () { throw err; });
    });
  }

  function attach(b) {
    try {
      b.onValue(b.ref(b.db, PATH), function (snap) {
        if (writing > 0) return; /* gema lokal sementara: tunggu konfirmasi server */
        var v = snap.val();
        apply(!(v && v.enabled === false), false, true);
      }, function () {
        /* gagal membaca (mis. aturan database belum diperbarui): pertahankan status terakhir,
           atau anggap aktif bila belum pernah tahu */
        apply(enabled, false, true);
      });
    } catch (e) { apply(enabled, false, true); }
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
  if (cached === false) { enabled = false; pending = false; }
  else if (cached === true) { enabled = true; pending = false; }
  paint();
  waitBridge();

  window.GMGate = {
    isEnabled: effective,
    isKnown: function () { return known; },
    onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); },
    set: set
  };
})();
