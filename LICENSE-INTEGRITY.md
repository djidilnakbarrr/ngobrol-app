# Integritas Lisensi iD1L

Obrolan-App melakukan pemeriksaan SHA-256 terhadap `LICENSE.md` saat aplikasi dibuka. Jika file hilang, server mengembalikan status selain 2xx, isi file berubah, atau pemeriksaan gagal, aplikasi menampilkan layar penguncian.

Hash SHA-256 resmi `LICENSE.md` pada paket ini:

`608daac1d3d180214e300781d93c355bd02a5276e7c35bc2782713172100d599`

## Batasan penting

Ini adalah penghalang sisi klien dan **bukan jaminan anti-pengubahan 100%**. Pihak yang dapat mengubah seluruh berkas situs dapat menghapus atau memodifikasi `js/license-guard.js`, mengubah hash, atau menjalankan salinan aplikasi yang sudah dimodifikasi. Pemeriksaan ini juga membutuhkan `LICENSE.md` dapat diakses melalui hosting; jika jaringan/hosting gagal, aplikasi akan terkunci (fail-closed), termasuk saat offline.

Untuk penegakan yang lebih kuat, pindahkan validasi ke backend tepercaya dan wajibkan server memvalidasi lisensi sebelum memberi akses ke API, data, atau operasi penting. Kode frontend saja tidak dapat memberikan jaminan mutlak.
