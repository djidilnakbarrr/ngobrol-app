# Perbaikan pembaruan versi 1.7.79

Masalah awal: `version.json` berisi 1.7.78 tetapi `js/updater.js` masih 1.7.77 dan tag aset di `index.html` juga 1.7.77. Akibatnya notifikasi pembaruan berulang.

## Deploy
1. Unggah **semua file** dari paket ini ke branch/folder deployment yang sama, bukan hanya `version.json`.
2. Pastikan URL `js/updater.js` yang dilayani hosting memuat `APP_VERSION = '1.7.79'` dan `version.json` menunjukkan 1.7.79.
3. Buka ulang aplikasi saat online. Jika PWA tetap lama, tutup dan buka kembali atau hapus cache situs (jangan hapus data situs jika ingin mempertahankan sesi).
4. Rilis berikutnya: jalankan `node rilis.js 1.7.80 "catatan"`, kemudian deploy **seluruh** perubahan.

## Lisensi jarak jauh
Sudah ada di `js/license-gate.js` dan `js/license-guard.js`. Atur `config/licenseSwitch/enabled` di Firebase Realtime Database. Gunakan aturan produksi yang membatasi tulis ke admin sesuai `database/RULE-WRAPPER-GUIDE.md`. **Jangan menimpa seluruh aturan database tanpa menggabungkannya dengan aturan yang sudah digunakan.**

## Batas pengujian
Pemeriksaan statis dan sintaks bukan pengujian login, Firebase, atau deployment langsung. Perilaku real-time dan versi di hosting perlu diuji pada lingkungan produksi/staging.
