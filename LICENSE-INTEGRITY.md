# Integritas Lisensi iD1L

Ada **dua lapisan** pemeriksaan lisensi yang berjalan independen. Keduanya
fail-closed terhadap kondisi yang bisa dideteksi, tapi **tidak satu pun, atau
pun gabungan keduanya, memberi jaminan anti-bypass 100%** untuk kode yang
berjalan di browser orang lain. Itu bukan soal kurang usaha — itu batas fisik
dari aplikasi web statis, dan berlaku untuk semua aplikasi sejenis, bukan
cuma punya kamu.

## Lapisan 1 — Hash statis (`js/license-guard.js`)

Memeriksa SHA-256 `LICENSE.md` saat aplikasi dibuka (akhir baris CRLF
dinormalisasi ke LF dulu). Jika file hilang, isi berubah, atau pemeriksaan
gagal, layar dikunci.

Hash SHA-256 resmi `LICENSE.md` pada paket ini:
`b456893f852e07881490b5f54db97853377b17d4996b70dc5b3e9e51e41fce1f`

**Batasan:** siapa pun yang punya akses ke seluruh berkas situs (hosting
sendiri, clone repo) bisa menghapus/mengedit `js/license-guard.js` itu
sendiri, mengganti nilai hash yang diharapkan, atau menjalankan salinan yang
sudah dimodifikasi. Pemeriksaan ini murni di sisi klien.

## Lapisan 2 — Sakelar jarak jauh (`js/license-gate.js`) — BARU

Membaca status `config/licenseSwitch` di Firebase Realtime Database secara
live. Kamu (akun `role:'admin'`) bisa menonaktifkan akses **kapan saja**
dengan menulis `{ enabled:false }` ke path itu — tanpa redeploy kode apa pun.
Karena keputusannya disimpan di server yang kamu kendalikan (bukan di file
yang dipegang pembeli), mengedit file lokal di perangkat pembeli **tidak
cukup** untuk menghidupkannya kembali selama mereka masih memakai proyek
Firebase ini.

Lihat `database/database.rules.license.json` (rules path baru, aman
digabung) dan `database/RULE-WRAPPER-GUIDE.md` (cara mengikat sakelar ini ke
rules data sungguhan seperti `chats`/`groupChats`, supaya server juga menolak
*data*-nya, bukan cuma mengunci tampilan).

**Batasan yang tetap berlaku, apa pun bantuannya (termasuk AI):**
- Ini baru efektif kalau langkah di `RULE-WRAPPER-GUIDE.md` sungguh
  diterapkan ke rules production kamu. Tanpa itu, lapisan ini baru mengunci
  tampilan, bukan data.
- Siapa pun yang mengganti `js/firebase-config.js` ke proyek Firebase milik
  mereka sendiri lolos sepenuhnya dari sakelar ini — mereka tidak lagi
  memakai server kamu sama sekali. Tidak ada kode yang bisa mencegah
  seseorang mengganti backend di salinan yang mereka kuasai penuh; ini batas
  keras arsitektur web, bukan celah yang bisa "ditambal".
- Siapa pun yang memiliki akun `role:'admin'` di database kamu juga bisa
  mengubah sakelar ini. Jaga akses admin seketat mungkin.

## Untuk penegakan yang jauh lebih kuat

Pindahkan fitur-fitur sensitif (misalnya panggilan ke Gemini API) supaya
lewat Cloud Function yang memvalidasi lisensi di server sebelum memproses
tiap permintaan — bukan hanya sekali saat aplikasi dibuka. `functions/`
sudah ada di proyek ini untuk notifikasi; pola yang sama bisa dipakai untuk
proxy Gemini dengan validasi lisensi per-request.

## Cara memperbarui hash (Lapisan 1)

Setiap kali isi `LICENSE.md` diubah (walau hanya satu spasi), hitung ulang
hash dengan `sha256sum LICENSE.md`, lalu salin hasilnya ke
`EXPECTED_LICENSE_SHA256` di `js/license-guard.js` dan ke berkas ini. Unggah
`LICENSE.md`, `js/license-guard.js`, dan `index.html` secara bersamaan.
