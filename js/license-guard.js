/* iD1L License Integrity Guard
 * Fail-closed client-side integrity check. This deters casual removal/editing of
 * LICENSE.md, but is not tamper-proof if a user can modify the app JavaScript.
 * Strong enforcement requires a trusted server to authorize sensitive operations.
 */
(function () {
  'use strict';
  var EXPECTED_LICENSE_SHA256 = 'b456893f852e07881490b5f54db97853377b17d4996b70dc5b3e9e51e41fce1f';
  var locked = false;

  var MESSAGES = {
    'license-missing': {
      badge: 'Berkas lisensi tidak ditemukan',
      text: 'Berkas LICENSE.md tidak tersedia di server aplikasi ini.',
      steps: ['Unggah LICENSE.md asli ke folder yang sama dengan index.html.', 'Muat ulang aplikasi.']
    },
    'license-modified': {
      badge: 'Berkas lisensi telah diubah',
      text: 'Isi LICENSE.md tidak sesuai dengan versi asli dari iD1L.',
      steps: ['Pulihkan LICENSE.md asli, lalu unggah ke folder yang sama dengan index.html.', 'Muat ulang aplikasi.']
    },
    'verification-failed': {
      badge: 'Verifikasi belum dapat diselesaikan',
      text: 'Lisensi belum dapat diperiksa. Penyebab umum: koneksi internet terputus atau server tidak merespons.',
      steps: ['Pastikan perangkat terhubung ke internet.', 'Muat ulang aplikasi.']
    },
    'verification-unavailable': {
      badge: 'Browser tidak didukung',
      text: 'Browser ini tidak mendukung fitur keamanan yang dibutuhkan untuk memeriksa lisensi.',
      steps: ['Perbarui browser atau WebView ke versi terbaru.', 'Buka kembali aplikasi.']
    },
    'license-remote-disabled': {
      badge: 'Akses dinonaktifkan pemilik',
      text: 'Pemilik aplikasi ini telah menonaktifkan akses dari jarak jauh (lisensi tidak aktif).',
      steps: ['Hubungi pemilik/penjual aplikasi untuk mengaktifkan kembali lisensi.', 'Muat ulang aplikasi setelah lisensi diaktifkan.']
    }
  };

  var ICON_SHIELD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 5 6v5.2c0 4.4 2.9 8.1 7 9.8 4.1-1.7 7-5.4 7-9.8V6l-7-3Z"/><rect x="9" y="11" width="6" height="4.6" rx="1.1"/><path d="M10.5 11V9.8a1.5 1.5 0 0 1 3 0V11"/></svg>';
  var ICON_ALERT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5"/><path d="M12 16.2h.01"/></svg>';

  var LOCK_CSS = [
    '#id1l-license-lock{--bg1:#eaf3ff;--bg2:#f7faff;--card:#fff;--line:#dbe7f7;--ink:#10243f;--sub:#4a617f;--mute:#8497b3;--brand:#1769e8;--brand-d:#0f55c4;--tint:#eaf2ff;--tile:#f4f8ff;}',
    '@media (prefers-color-scheme:dark){#id1l-license-lock{--bg1:#0d1627;--bg2:#0b1424;--card:#121e33;--line:#243551;--ink:#eaf1ff;--sub:#a7b9d6;--mute:#6f84a5;--brand:#4d90f5;--brand-d:#3b7fe6;--tint:#17294a;--tile:#0f1a2e;}}',
    '#id1l-license-lock,#id1l-license-lock *{box-sizing:border-box;}',
    '#id1l-license-lock{position:fixed;inset:0;width:100%;height:100%;height:100dvh;z-index:2147483647;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:none;display:flex;padding:20px 16px;background:radial-gradient(ellipse 80% 55% at 50% 0%,var(--bg1) 0%,var(--bg2) 70%);color:var(--ink);font:15px/1.5 Inter,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;text-align:center;-webkit-font-smoothing:antialiased;}',
    '#id1l-license-lock .id1l-card{width:100%;max-width:420px;margin:auto;padding:32px 24px 22px;background:var(--card);border:1px solid var(--line);border-radius:22px;box-shadow:0 1px 2px rgba(16,36,63,.04),0 20px 44px -16px rgba(23,105,232,.22);}',
    '#id1l-license-lock .id1l-icon{display:flex;align-items:center;justify-content:center;width:64px;height:64px;margin:0 auto 18px;border-radius:18px;background:var(--tint);color:var(--brand);box-shadow:inset 0 0 0 1px var(--line);}',
    '#id1l-license-lock .id1l-eyebrow{margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--mute);}',
    '#id1l-license-lock h1{margin:0 0 14px;font-size:clamp(23px,6.4vw,27px);line-height:1.2;font-weight:800;letter-spacing:-.02em;color:var(--ink);}',
    '#id1l-license-lock .id1l-pill{display:inline-flex;align-items:center;gap:6px;max-width:100%;margin:0 0 14px;padding:6px 12px 6px 10px;border-radius:999px;background:var(--tint);color:var(--brand);font-size:12.5px;font-weight:700;line-height:1.3;}',
    '#id1l-license-lock .id1l-pill svg{flex:none;}',
    '#id1l-license-lock .id1l-text{margin:0 auto 22px;max-width:34ch;font-size:15px;line-height:1.6;color:var(--sub);}',
    '#id1l-license-lock .id1l-steps{margin:0;padding:16px;list-style:none;text-align:left;background:var(--tile);border:1px solid var(--line);border-radius:16px;}',
    '#id1l-license-lock .id1l-steps-title{margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);}',
    '#id1l-license-lock .id1l-step{display:flex;align-items:flex-start;gap:12px;font-size:14px;line-height:1.5;color:var(--ink);font-weight:500;}',
    '#id1l-license-lock .id1l-step+.id1l-step{margin-top:12px;}',
    '#id1l-license-lock .id1l-num{flex:none;display:flex;align-items:center;justify-content:center;width:22px;height:22px;margin-top:1px;border-radius:50%;background:var(--brand);color:#fff;font-size:12px;font-weight:700;line-height:1;}',
    '#id1l-license-lock .id1l-step span:last-child{min-width:0;overflow-wrap:anywhere;}',
    '#id1l-license-lock .id1l-foot{margin-top:22px;padding-top:16px;border-top:1px solid var(--line);}',
    '#id1l-license-lock .id1l-brand{font-size:18px;font-weight:800;letter-spacing:.05em;color:var(--brand);line-height:1.2;}',
    '#id1l-license-lock .id1l-role{margin-top:2px;font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--mute);}',
    '#id1l-license-lock .id1l-code{margin-top:10px;font-size:11px;color:var(--mute);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.02em;}',
  ].join('\n');

  function showLicenseError(reason) {
    if (locked) return;
    locked = true;
    var info = MESSAGES[reason] || MESSAGES['verification-failed'];
    function el(tag, cls, text) {
      var node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text) node.textContent = text;
      return node;
    }
    function render() {
      if (!document.body) { document.addEventListener('DOMContentLoaded', render, { once: true }); return; }
      if (document.getElementById('id1l-license-lock')) return;
      var style = document.createElement('style');
      style.id = 'id1l-license-lock-style';
      style.textContent = LOCK_CSS;
      document.head.appendChild(style);

      var lock = document.createElement('div');
      lock.id = 'id1l-license-lock';
      // Fallback inline layout in case the stylesheet is blocked.
      lock.style.cssText = 'position:fixed;inset:0;z-index:2147483647;overflow-y:auto;';
      lock.setAttribute('role', 'alertdialog');
      lock.setAttribute('aria-modal', 'true');
      lock.setAttribute('aria-labelledby', 'id1l-lock-title');
      lock.setAttribute('aria-describedby', 'id1l-lock-desc');

      var card = el('main', 'id1l-card');
      var icon = el('div', 'id1l-icon'); icon.innerHTML = ICON_SHIELD;
      var eyebrow = el('p', 'id1l-eyebrow', 'Keamanan Lisensi');
      var title = el('h1', '', 'Akses Dikunci'); title.id = 'id1l-lock-title';
      var pill = el('div', 'id1l-pill'); pill.innerHTML = ICON_ALERT; pill.appendChild(el('span', '', info.badge));
      var text = el('p', 'id1l-text', info.text); text.id = 'id1l-lock-desc';

      var steps = el('div', 'id1l-steps');
      steps.appendChild(el('div', 'id1l-steps-title', 'Cara memperbaiki'));
      info.steps.forEach(function (step, i) {
        var li = el('div', 'id1l-step');
        li.appendChild(el('span', 'id1l-num', String(i + 1)));
        li.appendChild(el('span', '', step));
        steps.appendChild(li);
      });

      var foot = el('div', 'id1l-foot');
      foot.appendChild(el('div', 'id1l-brand', 'iD1L'));
      foot.appendChild(el('div', 'id1l-role', 'Developer & Owner'));
      foot.appendChild(el('div', 'id1l-code', 'Kode: ' + String(reason || 'verification-failed').toUpperCase().replace(/-/g, '_')));

      [icon, eyebrow, title, pill, text, steps, foot].forEach(function (n) { card.appendChild(n); });
      lock.appendChild(card);
      document.body.appendChild(lock);
      document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden';
    }
    render();
  }

  async function verifyLicense() {
    if (!window.crypto || !window.crypto.subtle || !window.fetch) {
      showLicenseError('verification-unavailable'); return;
    }
    try {
      var response = await fetch('./LICENSE.md?_license_check=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) { showLicenseError('license-missing'); return; }
      var raw = new Uint8Array(await response.arrayBuffer());
      // Normalisasi akhir baris (CRLF -> LF) agar perubahan akhir baris oleh Git/hosting tidak dianggap pengubahan isi.
      var clean = new Uint8Array(raw.length), n = 0;
      for (var i = 0; i < raw.length; i++) { if (raw[i] !== 13) clean[n++] = raw[i]; }
      var digest = await crypto.subtle.digest('SHA-256', clean.subarray(0, n));
      var actual = Array.from(new Uint8Array(digest)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      if (actual !== EXPECTED_LICENSE_SHA256) showLicenseError('license-modified');
    } catch (_) {
      // Fail closed: network/hosting errors cannot be distinguished safely from a missing license.
      showLicenseError('verification-failed');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', verifyLicense, { once: true });
  else verifyLicense();

  /* Diekspos agar js/license-gate.js (sakelar jarak jauh via Firebase) bisa
     memakai layar kunci yang sama tanpa menduplikasi markup/CSS. */
  window.__id1lLock = showLicenseError;
})();
