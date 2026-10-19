/* ==========================================================================
   SAKELAR LISENSI JARAK JAUH (remote kill-switch)
   --------------------------------------------------------------------------
   Lapisan KEDUA di samping js/license-guard.js (yang memeriksa hash statis
   LICENSE.md). Lapisan ini membaca status di database pada
   config/licenseSwitch secara live. Developer (akun dengan role 'admin')
   dapat menonaktifkan SEMUA salinan aplikasi yang terpasang kapan saja,
   tanpa perlu redeploy kode, dengan menulis { enabled:false } ke path itu.

   PENTING — baca ini supaya ekspektasinya tepat:
   - Status di-fetch dari Firebase Realtime Database secara real-time. Selama
     aturan (database rules) untuk path ini membatasi penulisan hanya untuk
     admin, PENGGUNA/PEMBELI BIASA TIDAK BISA mengubah status ini walau
     mereka mengedit seluruh file JS/HTML di perangkat/hosting mereka —
     sebab nilainya tidak disimpan di kode, tapi di server Firebase yang
     tidak mereka kendalikan.
   - TAPI: ini baru mengunci TAMPILAN (UI) aplikasi. Supaya data sungguhan
     (chat, kontak, dsb.) juga ikut terkunci di sisi server saat sakelar ini
     off, aturan `.read`/`.write` pada path data tsb di database rules HARUS
     ditambahkan agar mensyaratkan config/licenseSwitch/enabled !== false.
     Lihat database/RULE-WRAPPER-GUIDE.md untuk cara menambahkannya dengan
     aman ke rules production kamu yang sebenarnya (file itu tidak disertakan
     lengkap di paket ini, jadi penambahannya harus kamu lakukan sendiri atau
     dengan bantuan lanjutan).
   - Siapa pun yang menjalankan SALINAN TERPISAH dengan proyek Firebase milik
     mereka sendiri (bukan proyek kamu) tidak tersentuh oleh sakelar ini sama
     sekali, karena mereka tidak memakai database kamu. Tidak ada mekanisme
     sisi klien yang bisa mencegah itu — ini batas keras dari web statis.
   ========================================================================== */
(function () {
  'use strict';
  var PATH = 'config/licenseSwitch';
  var STORE = 'lic:gate';

  var known = false;     /* server sudah pernah menjawab pada sesi ini */
  var locked = false;
  var memo = null;

  function readCache() {
    try {
      var v = localStorage.getItem(STORE);
      if (v === '0') return false;
      if (v === '1') return true;
    } catch (e) { /* penyimpanan diblokir */ }
    return memo;
  }
  function writeCache(on) {
    memo = on;
    try { localStorage.setItem(STORE, on ? '1' : '0'); } catch (e) { /* diabaikan */ }
  }

  function lockNow(reason) {
    if (locked) return;
    locked = true;
    if (typeof window.__id1lLock === 'function') {
      window.__id1lLock(reason || 'license-remote-disabled');
    } else {
      /* Fallback minimal kalau license-guard.js tidak termuat/berhasil diubah. */
      try {
        document.documentElement.innerHTML =
          '<div style="position:fixed;inset:0;display:flex;align-items:center;' +
          'justify-content:center;background:#0d1627;color:#eaf1ff;font:15px/1.5 ' +
          'system-ui,sans-serif;text-align:center;padding:24px;z-index:2147483647;">' +
          'Akses dikunci oleh pemilik aplikasi.</div>';
      } catch (e) { /* diabaikan */ }
    }
  }

  function apply(v) {
    known = true;
    var enabled = !(v && v.enabled === false);
    writeCache(enabled);
    if (!enabled) {
      lockNow('license-remote-disabled');
    } else if (locked) {
      if (typeof window.__id1lUnlockRemote === 'function' && window.__id1lUnlockRemote()) {
        locked = false;
      }
    }
  }

  function attach(b) {
    try {
      b.onValue(b.ref(b.db, PATH), function (snap) {
        apply(snap.val());
      }, function () {
        /* Gagal membaca — biasanya karena rules untuk path ini belum di-deploy.
           Fail-open di sini (konsisten dengan gemini-gate.js / youtube-gate.js)
           supaya aplikasi tidak terkunci total sebelum kamu sendiri sempat
           menambahkan rules config/licenseSwitch ke proyek Firebase-mu. */
        known = true;
      });
    } catch (e) { known = true; }
  }

  function waitBridge() {
    var delay = 100;
    (function poll() {
      var b = window.__ngobrolFB;
      if (b && b.db && b.ref && b.onValue) { attach(b); return; }
      delay = Math.min(2000, Math.round(delay * 1.5));
      setTimeout(poll, delay);
    })();
  }

  /* Status cache dipakai hanya untuk menampilkan kunci lebih cepat bila sesi
     sebelumnya sudah tahu statusnya off; tidak pernah dipakai untuk membuka
     kunci tanpa konfirmasi server. */
  if (readCache() === false) lockNow('license-remote-disabled');
  waitBridge();

  /* Admin: tulis status ke database. Aturan database HARUS memeriksa bahwa
     penulis adalah admin (lihat database/database.rules.license.json). */
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

  window.LicenseGate = {
    isKnown: function () { return known; },
    set: set
  };
})();
