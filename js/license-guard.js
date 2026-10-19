/* iD1L License Integrity Guard
 * Fail-closed client-side integrity check. This deters casual removal/editing of
 * LICENSE.md, but is not tamper-proof if a user can modify the app JavaScript.
 * Strong enforcement requires a trusted server to authorize sensitive operations.
 */
(function () {
  'use strict';
  var EXPECTED_LICENSE_SHA256 = '608daac1d3d180214e300781d93c355bd02a5276e7c35bc2782713172100d599';
  var locked = false;

  function showLicenseError(reason) {
    if (locked) return;
    locked = true;
    function render() {
      if (!document.body) { document.addEventListener('DOMContentLoaded', render, { once: true }); return; }
      if (document.getElementById('id1l-license-lock')) return;
      var lock = document.createElement('div');
      lock.id = 'id1l-license-lock';
      lock.setAttribute('role', 'alert');
      lock.setAttribute('aria-live', 'assertive');
      lock.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;height:100dvh;z-index:2147483647;box-sizing:border-box;overflow:hidden;overscroll-behavior:none;touch-action:none;background:radial-gradient(ellipse at 50% 0%,#e8f2ff 0%,#f8fbff 48%,#eef4fc 100%);color:#172b4d;display:flex;align-items:center;justify-content:center;padding:10px;font:15px/1.45 Inter,system-ui,-apple-system,sans-serif;text-align:center;';
      var panel = document.createElement('div');
      panel.style.cssText = 'box-sizing:border-box;width:100%;max-width:460px;max-height:100%;margin:auto;padding:clamp(14px,3.5vh,25px) clamp(16px,4vw,26px);border:1px solid rgba(59,130,246,.14);border-radius:24px;background:rgba(255,255,255,.92);box-shadow:0 18px 48px rgba(30,64,175,.10);overflow:hidden;';
      var heading = document.createElement('div');
      heading.style.cssText = 'font-size:clamp(23px,5.5vw,30px);line-height:1.2;letter-spacing:-.035em;font-weight:800;margin:0 0 14px;color:#142b4e;';
      heading.textContent = 'Lisensi Tidak Valid'; heading.style.color = '#1769e8';
      var emblem = document.createElement('div'); emblem.setAttribute('aria-hidden','true'); emblem.textContent = '×'; emblem.style.cssText = 'display:flex;align-items:center;justify-content:center;width:clamp(52px,10vh,68px);height:clamp(52px,10vh,68px);margin:0 auto 14px;border-radius:22px;background:linear-gradient(145deg,#e4efff,#cfe2ff);color:#1769e8;font-size:clamp(38px,7vh,48px);font-weight:500;box-shadow:inset 0 0 0 1px rgba(23,105,232,.12);';
      var message = document.createElement('p');
      message.style.cssText = 'margin:0 0 12px;font-size:clamp(14px,3.7vw,17px);line-height:1.5;color:#263f60;font-weight:700;';
      message.textContent = 'Lisensi aplikasi tidak ditemukan atau telah diubah. Aplikasi dikunci sampai file lisensi asli dipulihkan.';
      var note = document.createElement('p');
      note.style.cssText = 'box-sizing:border-box;margin:14px 0 0;padding:12px 14px;border:1px solid #d9e8ff;border-radius:16px;background:linear-gradient(135deg,#f0f6ff,#e8f1ff);font-size:clamp(11px,2.9vw,13px);line-height:1.5;color:#587397;text-align:left;overflow-wrap:anywhere;font-weight:650;';
      note.textContent = 'Cara memperbaiki: unggah kembali LICENSE.md asli ke folder yang sama dengan index.html, lalu muat ulang aplikasi.';
      panel.appendChild(emblem); panel.appendChild(heading); panel.appendChild(message); panel.appendChild(note);
      var footer = document.createElement('div'); footer.style.cssText = 'margin-top:16px;color:#1769e8;font-size:20px;font-weight:800;letter-spacing:.04em;'; footer.textContent = 'iD1L';
      var footerSub = document.createElement('div'); footerSub.style.cssText = 'margin-top:2px;color:#8ba0bd;font-size:10px;font-weight:800;letter-spacing:.16em;'; footerSub.textContent = 'DEVELOPER & OWNER'; lock.appendChild(panel);
      panel.appendChild(footer); panel.appendChild(footerSub); document.body.appendChild(lock);
      document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden';
      document.addEventListener('touchmove', function (event) { if (lock.contains(event.target)) event.preventDefault(); }, { passive: false });
      document.addEventListener('wheel', function (event) { if (lock.contains(event.target)) event.preventDefault(); }, { passive: false });
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
      var bytes = await response.arrayBuffer();
      var digest = await crypto.subtle.digest('SHA-256', bytes);
      var actual = Array.from(new Uint8Array(digest)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      if (actual !== EXPECTED_LICENSE_SHA256) showLicenseError('license-modified');
    } catch (_) {
      // Fail closed: network/hosting errors cannot be distinguished safely from a missing license.
      showLicenseError('verification-failed');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', verifyLicense, { once: true });
  else verifyLicense();
})();
