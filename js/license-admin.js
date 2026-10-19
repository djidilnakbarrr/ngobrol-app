/* Panel admin lisensi: status server selalu dibaca sebelum tombol diaktifkan. */
(function () {
  'use strict';
  const panel = document.getElementById('licenseAdminPanel');
  const toggle = document.getElementById('licenseAdminToggle');
  const status = document.getElementById('licenseAdminStatus');
  if (!panel || !toggle || !status) return;
  let current = null, unsubscribe = null, adminId = null;
  function message(s) { status.textContent = s; }
  function check() {
    const b = window.__ngobrolFB;
    const id = b && b.getMyId && b.getMyId();
    if (!b || !b.get || !b.ref || !b.db || !id) { setTimeout(check, 1100); return; }
    if (adminId === id) return;
    adminId = id;
    b.get(b.ref(b.db, 'users/' + id + '/role')).then(snap => {
      if (snap.val() !== 'admin') { panel.hidden = true; adminId = null; setTimeout(check, 3000); return; }
      panel.hidden = false; message('Menghubungkan ke server…');
      if (unsubscribe) unsubscribe();
      unsubscribe = b.onValue(b.ref(b.db, 'config/licenseSwitch'), snap => {
        current = !(snap.val() && snap.val().enabled === false);
        toggle.checked = current; toggle.disabled = false;
        message(current ? 'Aktif — pengguna dapat mengakses aplikasi' : 'Nonaktif — akses aplikasi dikunci');
      }, err => { toggle.disabled = true; message('Gagal membaca lisensi: ' + err.message); });
    }).catch(err => { adminId = null; message('Gagal memeriksa admin: ' + err.message); setTimeout(check, 3000); });
  }
  toggle.addEventListener('change', async function () {
    const wanted = toggle.checked;
    toggle.disabled = true;
    message('Menyimpan perubahan…');
    try {
      if (!window.LicenseGate) throw new Error('Modul lisensi belum siap');
      await window.LicenseGate.set(wanted);
      message('Berhasil disimpan. Menunggu konfirmasi server…');
    } catch (err) {
      toggle.checked = current === null ? !wanted : current;
      message('Gagal menyimpan: ' + (err.message || String(err)));
    } finally { if (current !== null) toggle.disabled = false; }
  });
  check();
})();
