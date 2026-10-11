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
2. Setelan HP > Aplikasi > browser Anda > Notifikasi: pastikan aktif dan bunyi tidak dimatikan.
3. Matikan penghemat baterai untuk browser, dan jangan "hentikan paksa" browser.
4. Mode jangan ganggu / senyap harus mati.

## 5. Batasan sistem (tidak bisa diakali oleh web)
- **HP mati total**: tidak ada aplikasi yang bisa menampilkan notifikasi. Pesan tertahan di server FCM (maks. 24 jam) dan notifikasi muncul begitu HP menyala dan online.
- **Jangan ganggu aktif**: ini diatur Android/iOS. Agar tetap berbunyi, tambahkan browser/aplikasi ini ke pengecualian: Setelan > Jangan ganggu > Aplikasi yang diizinkan.
- **iPhone**: notifikasi hanya jalan jika situs dipasang ke Layar Utama (Bagikan > Tambah ke Layar Utama) dan switch senyap tidak aktif.

## 6. File baru
`badge-96.png` (ikon kecil status bar) harus ikut diupload bersama `icon-192.png`. Gambar besar notifikasi dibuat otomatis per pesan dan berisi isi pesan dengan huruf besar; judulnya nama pengirim (atau nama grup). Setelah upload, buka aplikasi sekali lalu tutup-buka lagi agar service worker v8 aktif, dan buka Setelan > Notifikasi lalu ketuk sekali di tiap HP.

## 7. Centang baca
Pesan terkirim = centang 2 abu-abu. Setelah penerima membuka chat di website (layar terlihat), berubah jadi centang 2 biru. Untuk grup, biru jika semua anggota sudah membaca. Status baca disimpan di field `readAt` (chat pribadi) dan `readBy` (grup) pada tiap pesan; pastikan Rules database mengizinkan penerima menulis field itu di `chats/*` dan `groupChats/*`.

## Hapus percakapan
Menu "Hapus percakapan" kini menghapus seluruh node `chats/<id1>__<id2>` di Firebase (teks, foto, pesan suara, penanda baca) lalu memeriksa ulang bahwa node benar-benar kosong. Rules database harus mengizinkan penghapusan (`.write`) pada `chats/*`; jika tidak, aplikasi menampilkan pesan gagal.

## Notifikasi 100% muncul
- Notifikasi hanya ditahan bila chat yang sama sedang terbuka dan terlihat di layar. Aplikasi terbuka di chat lain / daftar chat tetap menampilkan notifikasi (plus pemberitahuan di dalam aplikasi).
- Cloud Function memakai `retry: true`; kegagalan sementara FCM otomatis dicoba ulang (tag = key pesan, jadi tidak dobel).
- Setelah mengganti file, deploy ulang fungsi: `firebase deploy --only functions`, dan unggah ulang `index.html` serta `firebase-messaging-sw.js`.

## Badge pesan belum dibaca
Jumlah pesan belum dibaca disimpan di `unread/<idPenerima>/<idChat>` (angka). Pengirim menaikkannya (+1, atomik) bersamaan dengan pesan; penerima menghapusnya saat chat terbuka dan terlihat di layar. Badge hijau muncul di daftar chat dan hilang otomatis setelah dibaca. Pastikan Rules database mengizinkan baca/tulis pada path `unread/*` (penerima boleh membaca/menghapus miliknya, pengirim boleh menambah milik lawan bicara).

## Format ID 08
Semua ID berformat `08xxxxxxxxxx` (`08` + 10 angka) di layar dan di database (`users/08...`, `chats/08...__08...`, anggota grup, `unread`, `fcmTokens`, dst). Akun baru langsung dibuat dengan format ini.

## Notifikasi "diblokir"
Status ini berarti browser mencatat izin notifikasi situs = ditolak (pernah ketuk Blokir/Jangan izinkan, atau browser memblokir otomatis). Situs web tidak bisa membukanya sendiri; pengguna harus mengubahnya di setelan situs. Aplikasi menampilkan langkah sesuai browser (Chrome/Edge/Opera, Samsung Internet, Firefox, iPhone), dan otomatis aktif begitu izin diubah tanpa perlu muat ulang. Browser di dalam aplikasi lain (Telegram, Instagram, dll) dan Safari iPhone yang belum "Tambah ke Layar Utama" tidak mendukung notifikasi, aplikasi menampilkan petunjuknya.

## Agar notifikasi jalan di semua HP
Folder sekarang berisi `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, dan `vercel.json` (agar service worker selalu versi terbaru). Semua file ini harus ikut diupload. Dengan manifest, aplikasi bisa dipasang ke Layar Utama (wajib di iPhone, disarankan di Android) sehingga notifikasi lebih andal.

## Foto sekali lihat
Ketuk tombol lampiran > **Foto sekali lihat**. Penerima melihat kotak "Foto sekali lihat"; setelah dibuka, foto langsung dihapus dari database (`data` menjadi kosong, `viewedAt` terisi) dan tidak bisa dibuka lagi. Pengirim melihat status "Terkirim, belum dibuka" lalu "Dibuka". Di grup, foto dihapus setelah semua anggota selain pengirim membukanya (`viewedBy/<id>`).
- Rules database harus mengizinkan penerima menulis `data`, `viewedAt`, dan `viewedBy` pada `chats/*` dan `groupChats/*`, sama seperti `readAt`/`readBy`.
- Web tidak bisa memblokir screenshot atau perekaman layar seperti aplikasi native; yang bisa dilakukan hanya menutup tampilan saat aplikasi ke latar belakang dan mematikan menu simpan/tekan lama. Penerima yang nakal tetap bisa memotret layar dengan HP lain.
- Deploy ulang `functions` agar notifikasi menampilkan "Foto sekali lihat".
