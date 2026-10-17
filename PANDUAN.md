# Panduan pasang notifikasi

## 1. Upload ke hosting (HTTPS)
Unggah seluruh isi folder dengan struktur apa adanya (jangan diratakan):
- `index.html`, `firebase-messaging-sw.js`, `manifest.webmanifest`, `version.json`, ikon `*.png` (di root)
- `css/` (tampilan): `base.css`, `update.css`, `chat-video.css`, `youtube.css`
- `js/` (logika): `app.js`, `database.js`, `firebase-config.js`, `youtube.js`, `youtube-config.js`, `chat-video.js`, `avatar.js`, `updater.js`
- `database/` (aturan database): `database.rules.youtube.json`

`index.html` dan `firebase-messaging-sw.js` harus tetap satu folder (root).

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
- Setelah mengganti file, deploy ulang fungsi: `firebase deploy --only functions`, dan unggah ulang `index.html`, folder `js/`, dan `firebase-messaging-sw.js`.

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

## Diarsipkan
- Tekan lama percakapan (kontak maupun grup) lalu pilih **Arsipkan obrolan**. Chat pindah dari daftar utama ke baris **Diarsipkan** di paling atas; angka hijau = jumlah chat terarsip yang punya pesan belum dibaca. Toast "Urungkan" muncul sesaat setelah mengarsipkan.
- Ketuk baris **Diarsipkan** untuk membuka halaman arsip. Di sana: tekan lama chat > **Keluarkan dari arsip**, atau menu titik tiga > **Keluarkan semua dari arsip**. Chat tetap diarsipkan saat pesan baru diterima.
- Saat memakai kolom pencarian, chat terarsip ikut muncul dengan label **Diarsipkan**.
- Data arsip disimpan per akun di perangkat (localStorage, seperti penanda hapus percakapan), jadi **tidak perlu mengubah Rules database** dan tidak perlu deploy ulang Cloud Functions. Cukup unggah ulang `index.html`.
- Lencana hijau belum dibaca selalu menampilkan **1** per kontak/grup (berapa pun jumlah pesannya); angka di baris Diarsipkan = jumlah chat terarsip yang belum dibaca.

## Pembaruan aplikasi otomatis
- Aplikasi memeriksa `version.json` di server (tanpa cache) saat dibuka, saat kembali ke aplikasi, saat internet tersambung lagi, dan tiap 10 menit.
- Jika ada versi baru, tombol melayang **Perbarui** (dengan nomor versi) muncul sendiri di atas tombol "+". Ketuk: muncul layar "Memperbarui aplikasi" (mengunduh, menerapkan, memuat ulang), lalu aplikasi masuk ke versi terbaru dan tombol otomatis hilang karena sudah terbaru.
- Tombol disembunyikan saat chat atau halaman Diarsipkan sedang dibuka, dan muncul lagi setelah kembali ke daftar.
- Akun/sesi login dan data pesan tidak dihapus saat memperbarui.

### Cara merilis versi baru
1. Di folder proyek jalankan: `node rilis.js 1.2.0 "Catatan satu" "Catatan dua"` (mengubah `APP_VERSION` di `js/updater.js` dan menulis `version.json`).
2. Unggah ulang **`js/updater.js`** dan **`version.json`** (dan file lain yang berubah) ke hosting. Selesai; semua pengguna akan mendapat pembaruan.
- `vercel.json` sudah diberi header `no-cache` untuk `/`, `/index.html`, dan `/version.json`. Jika hosting bukan Vercel, pastikan tiga path itu tidak di-cache (mis. di Firebase Hosting: tambahkan header `Cache-Control: no-cache` untuk `index.html` dan `version.json`).
- Deploy pertama kali versi ini: pengguna yang masih di versi lama (belum punya fitur ini) harus membuka link sekali; setelah itu seterusnya otomatis.

## Link video di chat (putar otomatis)
Kirim link seperti biasa; bila link adalah video, pesan menampilkan pemutar yang **jalan otomatis (tanpa suara)** begitu terlihat di layar dan berhenti saat digulir keluar. Tombol speaker di bawah pemutar menyalakan suara (YouTube, Vimeo, dan berkas video); tombol panah membuka link asli. Tekan lama pada pemutar tetap bisa memilih/membalas/menghapus pesan; ketuk sekali pemutar untuk mulai mengendalikannya.
- **Didukung:** YouTube (watch, youtu.be, Shorts, Live, playlist, `t=` waktu mulai), Vimeo, Dailymotion, TikTok (link `/video/`), Instagram (Reels/post/TV), Facebook (video, Reels, fb.watch), Twitch (VOD, klip, channel live), Streamable, Google Drive, Bilibili, dan berkas video langsung (`.mp4 .webm .mov .m4v .ogv .3gp .mkv`, serta siaran `.m3u8`). Link polos tanpa ekstensi juga dicek otomatis: bila ternyata berkas video, langsung diputar.
- Semua link di chat kini bisa diketuk (dibuka di tab baru).
- **Batasan:** browser hanya mengizinkan putar otomatis dalam keadaan senyap; Instagram, Google Drive, dan Facebook kadang tetap meminta ketuk tombol putar karena aturan mereka. Link pendek yang perlu diurai server (mis. `vm.tiktok.com`), X/Twitter, dan Rumble tampil sebagai link biasa. Twitch hanya jalan di domain HTTPS yang sama dengan aplikasi. Siaran `.m3u8` di browser selain Safari memuat pustaka hls.js dari jsDelivr.

## Moderasi grup (admin dan pembuat)
- Admin dan pembuat grup dapat memilih pesan siapa pun di grup lalu **Hapus untuk semua orang**. Di Info Grup juga ada tombol **Hapus semua pesan grup** (hanya admin/pembuat).
- Rules database harus mengizinkan admin/pembuat menghapus `groupChats/<gid>/*` dan menulis `groups/<gid>/last` serta `unread/*`. Anggota biasa tetap hanya boleh menghapus pesannya sendiri (diatur di tampilan; batasi juga di Rules).

## Centang biru di grup
Di grup, centang hanya biru bila pesan Anda adalah **balasan** ke pesan seseorang dan orang itu sudah membuka chat (`readBy/<id>`). Pesan biasa tetap centang abu-abu.

## Anggota baru tidak melihat chat lama
Saat anggota ditambahkan (oleh pembuat atau lewat link undangan), waktu bergabung disimpan di `groups/<gid>/joined/<id>`. Pesan yang dikirim sebelum waktu itu tidak ditampilkan kepada anggota baru; anggota lama tetap melihat semua pesan. Pesan tidak dihapus dari database. Pastikan Rules mengizinkan menulis `groups/<gid>/joined`.

## Fitur YouTube
Tab **YouTube** menampilkan video populer, kategori, pencarian, dan pemutar bawaan (embed `youtube-nocookie.com`). Data diambil dari browser lewat YouTube Data API v3.

**API key tidak disimpan di file.** Kunci hanya diisi oleh admin dari dalam aplikasi dan disimpan di database (`config/youtube`).

Pemasangan:
1. Di Google Cloud Console aktifkan **YouTube Data API v3**, lalu buat **API key** (APIs & Services > Credentials). Batasi kunci: Application restrictions = HTTP referrers (domain aplikasi Anda), API restrictions = YouTube Data API v3. Kunci dapat dilihat oleh pengguna aplikasi, jadi pembatasan wajib.
2. Jadikan satu akun admin (lihat bagian peran di bawah).
3. Buka aplikasi dengan akun admin > tab YouTube > ikon kunci di kanan atas > tempel kunci > Simpan. Kunci diuji dulu (1 unit kuota) dan hanya disimpan jika valid. Perubahan langsung berlaku untuk semua pengguna. Setelah Simpan, kunci tersimpan permanen di database dan tidak dihapus otomatis oleh aplikasi (tidak oleh logout, hapus akun, maupun pembersihan data perangkat). Hanya tombol "Hapus kunci" milik admin yang mengosongkannya.

Kuota gratis 10.000 unit per hari. Video populer dan detail memakai 1 unit, pencarian 100 unit. Hasil disimpan di perangkat selama `CACHE_MINUTES` (default 10 menit). Wilayah, bahasa, dan jumlah video per muatan ada di `youtube-config.js` (file ini tidak berisi kunci).

## Peran pengguna dan admin
Peran disimpan di `users/<id>/role` dengan nilai `user` atau `admin`.
- Akun baru otomatis `user`. Akun lama tanpa peran diberi `user` otomatis saat pemiliknya membuka aplikasi. Anda juga bisa menambahkan field `role` = `user` manual di konsol.
- Aplikasi tidak pernah memberi peran `admin`. Menjadikan seseorang admin dilakukan **manual**: Firebase Console > Realtime Database > `users` > pilih ID > ubah `role` dari `user` menjadi `admin`. Untuk mencabut, ubah kembali menjadi `user`.
- Hanya admin yang melihat ikon kunci dan dapat menyimpan atau menghapus kunci.

**Rules Firebase (wajib).** Aplikasi ini tidak memakai Firebase Authentication, jadi pengaman di layar saja bisa dilewati orang yang paham teknis. Gabungkan isi `database.rules.youtube.json` ke Rules database Anda agar server ikut menegakkan:
- `users/<id>/role` tidak bisa diubah menjadi `admin` dari aplikasi, dan admin tidak bisa diturunkan dari aplikasi. Perubahan peran hanya lewat konsol Firebase.
- `config/youtube` hanya bisa ditulis jika `updatedBy` menunjuk pengguna ber-role `admin`, dan node ini tidak bisa dihapus dari aplikasi (penghapusan hanya lewat konsol Firebase). Tombol "Hapus kunci" milik admin hanya mengosongkan nilai kunci, datanya tetap ada.
- Jika Rules Anda punya `".write": true` di root, `config`, atau `users`, izin dari tingkat atas menimpa aturan di atas. Batasi izin tulis yang terlalu luas itu.
- Batasan: karena login memakai ID, siapa pun yang mengetahui ID akun admin dapat bertindak sebagai admin. Rahasiakan ID akun admin dan jangan menambahkannya sebagai kontak orang lain.

## Password akun (6 angka)
- **Daftar:** isi nama, username, password 6 angka, dan konfirmasi password. ID akun (4 huruf acak, contoh: KMRT) dibuat otomatis dan tidak perlu dimasukkan saat masuk.
- **Masuk:** cukup username dan password. Password yang salah tidak dapat membuka akun. Setelah 5 kali salah, akun dikunci 5 menit.
- **Ubah password:** Setelan > Password. Wajib memasukkan password saat ini. Setelah diubah, semua perangkat lain yang sedang masuk keluar otomatis dan harus memakai password baru.
- **Akun lama (tanpa password):** pengguna yang sudah masuk diminta membuat password sebelum dapat memakai aplikasi. Pengguna yang sudah keluar masuk lewat tab Masuk, lalu diminta verifikasi ID akun dan membuat password.
- **Penyimpanan:** password tidak pernah disimpan sebagai teks asli. Aplikasi menyimpan hash PBKDF2-SHA256 (150.000 iterasi) dengan salt acak di `credentials/<id>`. Password sederhana (111111, 123456, dan sejenisnya) ditolak.
- **Perhatian keamanan:** karena aplikasi memakai Realtime Database tanpa Firebase Authentication, pemeriksaan password berjalan di sisi aplikasi. Rules pada `database.rules.youtube.json` membatasi bentuk data, tetapi tidak dapat melarang akses langsung ke database. Untuk perlindungan penuh di sisi server, migrasikan login ke Firebase Authentication (custom token lewat Cloud Functions), lalu batasi Rules berdasarkan `auth.uid`.
- Hapus akun ikut menghapus `credentials/<id>`.

## Username unik 100%
Setiap username dikunci di `usernames/<username>` berisi ID pemilik. Aplikasi memakai transaksi Firebase sehingga dua orang yang mendaftar bersamaan tidak mungkin mendapat username yang sama, dan di layar Daftar tersedia pemeriksaan langsung ("Username tersedia" atau "Username sudah digunakan").
Agar tidak bisa ditembus lewat penulisan langsung ke database, tempel isi `database/database.rules.usernames.json` ke Rules Firebase (gabungkan dengan rules yang sudah ada). Pastikan tidak ada aturan di tingkat atas (`.write: true` di root atau `usernames`) karena akan menimpa aturan ini.

## Aturan username dan ID
- **Username terkunci permanen.** Username yang pernah dipakai sebuah akun tidak bisa dipakai akun lain, bahkan setelah pemiliknya menggantinya. Username baru dilepas hanya ketika akun pemiliknya **dihapus permanen**.
- **ID akun baru berupa 4 huruf besar acak** (tanpa I, L, O), misalnya `KMRT`. Pemesanan ID dilakukan atomik sehingga tidak mungkin ada dua akun dengan ID yang sama. Akun lama tetap memakai ID angkanya.

## Keluar dari semua perangkat lain
Di Setelan > tab **Lainnya** ada tombol **Keluar dari Semua Perangkat Lain**. Perangkat yang menekan tombol tetap masuk, semua perangkat lain keluar otomatis, termasuk yang sedang offline atau aplikasinya ditutup (mereka keluar begitu aplikasi dibuka dan terhubung). Caranya: nomor `credentials/<id>/epoch` dinaikkan dan versi sesi (`ver`) diganti; token notifikasi perangkat lain juga dihapus. Mengganti password tidak menghapus nomor ini.
