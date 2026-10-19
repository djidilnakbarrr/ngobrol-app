# Sakelar lisensi admin

Panel toggle tersedia di bagian bawah halaman utama hanya ketika `users/<id>/role` bernilai `admin`. Akun biasa tidak melihat panel. ON mengizinkan aplikasi; OFF mengunci tampilan pada klien yang terhubung ke Firebase.

**Wajib:** gabungkan aturan database/database.rules.license.json ke aturan produksi Firebase, lalu deploy. Jangan mengganti seluruh aturan produksi dengan file contoh karena bisa memutus akses data lain.

**Peringatan keamanan:** aplikasi memakai ID pengguna khusus, bukan Firebase Authentication yang diverifikasi server. Aturan `.write` contoh berdasarkan `updatedBy` bisa dipalsukan oleh klien; menyembunyikan toggle bukan otorisasi aman. Untuk kontrol admin sungguhan, migrasikan ke Firebase Auth dan validasi `auth.uid`/custom claims dalam aturan server, serta batasi akses data melalui aturan server. Tanpa itu, toggle tidak aman dari penyalahgunaan.

**Pengujian:** login sebagai admin, periksa panel, nyalakan/matikan dan pastikan nilai `config/licenseSwitch/enabled` berubah di Firebase. Uji pengguna biasa, jaringan offline, dan aplikasi yang sudah terbuka. Ketika OFF, admin bisa memakai Firebase Console untuk menghidupkan kembali jika halaman aplikasi terkunci.
