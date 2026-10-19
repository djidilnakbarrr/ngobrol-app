/* ===== Pembaruan aplikasi otomatis =====
   Naikkan versi dengan:  node rilis.js 1.2.0 "catatan 1" "catatan 2"   (mengubah APP_VERSION di bawah + version.json) */
(function () {
  'use strict';
  const APP_VERSION = '1.7.81';
  const CHECK_URL = 'version.json';
  const $ = id => document.getElementById(id);
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  window.APP_VERSION = APP_VERSION;

  /* bersihkan penanda ?_u= bekas muat ulang pembaruan (parameter lain, mis. openchat, dipertahankan) */
  try {
    const u = new URL(location.href);
    if (u.searchParams.has('_u')) { u.searchParams.delete('_u'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); }
  } catch (e) {}

  const IC_REFRESH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><polyline points="7 11 12 16 17 11"/><path d="M5 20h14"/></svg>';
  const IC_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const IC_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12.5 11 15.5 16 9"/></svg>';

  /* ---------- tombol "Perbarui" melayang: muncul otomatis saat ada versi baru, hilang setelah diperbarui ---------- */
  let fab = null, pending = null;
  function showFab(info) {
    pending = info;
    if (running) return;
    if (!fab) {
      fab = document.createElement('button');
      fab.id = 'updFab'; fab.type = 'button';
      fab.setAttribute('aria-label', 'Perbarui aplikasi');
      fab.addEventListener('click', () => { if (pending) apply(pending); });
      document.body.appendChild(fab);
    }
    fab.innerHTML = '<span class="ic">' + IC_REFRESH + '</span><span class="tx"><b>Perbarui</b><span>Versi ' + esc(info.version) + ' tersedia</span></span>';
    fab.classList.add('on');
    requestAnimationFrame(() => requestAnimationFrame(() => fab && fab.classList.add('show')));
  }
  function hideFab() {
    pending = null;
    if (!fab) return;
    const el = fab; el.classList.remove('show');
    setTimeout(() => { if (!pending) el.classList.remove('on'); }, 400);
  }

  /* ---------- layar "Memperbarui…" ---------- */
  let run = null, running = false;
  const STEPS = ['Mengunduh versi terbaru', 'Menerapkan pembaruan', 'Memuat ulang aplikasi'];
  function buildRun(info) {
    if (run) run.remove();
    run = document.createElement('div');
    run.id = 'updRun';
    run.setAttribute('role', 'alertdialog'); run.setAttribute('aria-live', 'polite');
    run.innerHTML =
      '<div class="updr-logo"><span class="updr-ring"></span><img src="icon-192.png" alt=""></div>' +
      '<h3 class="updr-title" id="updrTitle">Memperbarui aplikasi</h3>' +
      '<p class="updr-sub" id="updrSub">Ke versi ' + esc(info.version) + '</p>' +
      '<div class="updr-bar"><i id="updrBar"></i></div>' +
      '<ul class="updr-steps" id="updrSteps">' + STEPS.map(t => '<li><span class="dot">' + IC_CHECK + '</span><span>' + t + '</span></li>').join('') + '</ul>' +
      '<p class="updr-note">Mohon jangan tutup aplikasi</p>' +
      '<div class="updr-actions"><button class="upd-btn primary" id="updRetry" type="button">Coba lagi</button><button class="upd-btn ghost" id="updClose" type="button">Tutup</button></div>';
    document.body.appendChild(run);
    run.classList.add('on');
    requestAnimationFrame(() => requestAnimationFrame(() => run.classList.add('show')));
    $('updRetry').addEventListener('click', () => apply(info));
    $('updClose').addEventListener('click', () => { running = false; run.classList.remove('show'); setTimeout(() => run.classList.remove('on'), 300); showFab(info); });
  }
  function setStep(i, pct) {
    const lis = run.querySelectorAll('#updrSteps li');
    lis.forEach((li, k) => { li.classList.toggle('done', k < i); li.classList.toggle('active', k === i); });
    $('updrBar').style.width = pct + '%';
  }
  async function apply(info) {
    if (running && run && !run.classList.contains('err')) return;
    running = true;
    hideFab();
    buildRun(info);
    run.classList.remove('err');
    try {
      /* 1) unduh: paksa ambil ulang halaman, service worker, dan manifest dari server */
      setStep(0, 12);
      const base = location.pathname.replace(/[^/]*$/, '');
      const ASSETS = ['css/base.css','css/update.css','css/chat-video.css','css/youtube.css','css/auth.css','js/keyboard.js','js/firebase-config.js','js/database.js','js/app.js','js/chat-video.js','js/avatar.js','js/updater.js','js/youtube-config.js','js/youtube-gate.js','js/youtube.js','css/gemini.css','js/gemini-gate.js','js/gemini.js'];
      const targets = [location.pathname, base + 'firebase-messaging-sw.js', base + 'manifest.webmanifest', base + CHECK_URL].concat(ASSETS.map(a => base + a));
      const got = await Promise.all(targets.map(u => withTimeout(fetch(u, { cache: 'reload' }), 20000).then(r => r.ok, () => false)));
      if (!got[0]) throw new Error('unduh gagal');
      await sleep(450);
      /* 2) terapkan: perbarui service worker & kosongkan cache lama (login & data pesan tidak disentuh) */
      setStep(1, 52);
      try {
        if ('serviceWorker' in navigator) {
          const regs = await withTimeout(navigator.serviceWorker.getRegistrations(), 4000);
          await Promise.all(regs.map(r => withTimeout(r.update(), 6000).catch(() => {})));
        }
      } catch (e) {}
      try { if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } } catch (e) {}
      await sleep(450);
      /* 3) muat ulang */
      setStep(2, 92);
      ls.set('app_just_updated', info.version);
      ss.set('upd_target', info.version);
      await sleep(500);
      $('updrBar').style.width = '100%';
      run.querySelectorAll('#updrSteps li').forEach(li => { li.classList.remove('active'); li.classList.add('done'); });
      await sleep(250);
      const u = new URL(location.href);
      u.searchParams.set('_u', Date.now().toString(36));
      location.replace(u.toString());
    } catch (e) {
      run.classList.add('err');
      $('updrTitle').textContent = 'Pembaruan gagal';
      $('updrSub').textContent = navigator.onLine === false ? 'Tidak ada koneksi internet. Sambungkan lalu coba lagi.' : 'Terjadi kendala saat mengunduh. Coba lagi.';
      run.querySelectorAll('#updrSteps li').forEach(li => li.classList.remove('active'));
    }
  }

  /* ---------- pemeriksaan versi ---------- */
  let checking = false, lastCheck = 0;
  async function fetchRemote() {
    const r = await withTimeout(fetch(CHECK_URL + '?t=' + Date.now(), { cache: 'no-store' }), 12000);
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    if (!j || !j.version) throw new Error('format');
    return j;
  }
  async function check(manual) {
    if (checking || running) return;
    if (!manual && Date.now() - lastCheck < 30000) return;
    checking = true; lastCheck = Date.now();
    try {
      const info = await fetchRemote();
      if (String(info.version) !== APP_VERSION) showFab(info);
      else hideFab();
    } catch (e) { /* offline: biarkan keadaan sekarang */ }
    finally { checking = false; }
  }
  window.checkAppUpdate = check;

  /* ---------- catat versi setelah berhasil diperbarui (tanpa banner) ---------- */
  function announceUpdated() {
    const seen = ls.get('app_ver_seen');
    ls.set('app_ver_seen', APP_VERSION);
    if (ls.get('app_just_updated') || (seen && seen !== APP_VERSION)) {
      try { localStorage.removeItem('app_just_updated'); } catch (e) {}
      try { sessionStorage.removeItem('upd_target'); } catch (e) {}
    }
  }

  /* ---------- pemicu ---------- */
  function start() {
    announceUpdated();
    setTimeout(() => check(false), 600);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(false); });
    window.addEventListener('focus', () => check(false));
    window.addEventListener('online', () => check(false));
    window.addEventListener('pageshow', e => { if (e.persisted) check(false); });
    setInterval(() => { if (document.visibilityState === 'visible') check(false); }, 10 * 60 * 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
