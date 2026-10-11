# Panduan pasang notifikasi

## 1. Upload ke hosting (HTTPS)
Taruh 3 file ini di folder yang sama:
- `index.html`
- `firebase-messaging-sw.js`
- `icon-192.png`

Notifikasi hanya jalan lewat **HTTPS** atau `localhost` (GitHub Pages, Firebase Hosting, Netlify, dll). Tidak jalan dari file lokal (`file://`) atau http biasa.

## 2. Aktifkan push saat aplikasi ditutup (Cloud Functions)
Tanpa langkah ini, notifikasi hanya muncul saat aplikasi masih terbuka atau jalan di latar belakang.
Butuh project Firebase `hrsof14` di paket **Blaze**.

```
npm i -g firebase-tools
firebase login
cd functions && npm install && cd ..
firebase deploy --only functions --project hrsof14
```
Wajib deploy ulang setiap `functions/index.js` berubah. Fungsi memakai `minInstances: 1` (selalu hangat) agar notifikasi tidak telat; biayanya kecil di paket Blaze. Jika ingin gratis, ubah jadi `0` (notifikasi bisa telat beberapa detik).

Setelah upload `firebase-messaging-sw.js` baru, buka aplikasi sekali lalu tutup-buka lagi supaya service worker versi baru aktif.

## 3. Aturan database
Aplikasi menulis ke path baru `fcmTokens/<id>`. Kalau Rules database membatasi path, beri izin baca/tulis untuk path itu.

## 4. Kalau notifikasi tidak muncul
1. Setelan > Notifikasi di aplikasi: ketuk, pilih **Izinkan**. Teks di bawah judul menampilkan masalahnya.
2. Setelan HP > Aplikasi > browser kamu > Notifikasi: pastikan aktif dan bunyi tidak dimatikan.
3. Matikan penghemat baterai untuk browser, dan jangan "hentikan paksa" browser.
4. Mode jangan ganggu / senyap harus mati.

## 5. Batasan sistem (tidak bisa diakali oleh web)
- **HP mati total**: tidak ada aplikasi yang bisa menampilkan notifikasi. Pesan tertahan di server FCM (maks. 24 jam) dan notifikasi muncul begitu HP menyala dan online.
- **Jangan ganggu aktif**: ini diatur Android/iOS. Agar tetap berbunyi, tambahkan browser/aplikasi ini ke pengecualian: Setelan > Jangan ganggu > Aplikasi yang diizinkan.
- **iPhone**: notifikasi hanya jalan jika situs dipasang ke Layar Utama (Bagikan > Tambah ke Layar Utama) dan switch senyap tidak aktif.
