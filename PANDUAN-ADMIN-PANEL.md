# Admin Panel — License Control

Buka **Setelan > Lainnya**. Panel hanya muncul ketika `users/<myId>/role` terbaca sebagai `admin` di Firebase Realtime Database. Jika belum muncul, periksa koneksi, ID akun, aturan `.read`, dan apakah file yang baru sudah ter-deploy; muat ulang setelah deploy.

## PENTING: keamanan server
Aturan contoh `database/database.rules.license.json` yang lama **TIDAK AMAN untuk produksi**: `updatedBy` dikirim klien dan bisa dipalsukan, sehingga tidak membuktikan identitas admin. Selain itu, role yang bisa ditulis sendiri juga tidak aman. Gunakan Firebase Authentication, custom claims admin yang diberikan melalui Admin SDK tepercaya, serta aturan RTDB yang memeriksa `auth.token.admin === true` untuk penulisan. Jangan gunakan toggle untuk data penting sebelum aturan produksi diamankan.

Contoh aturan khusus node (harus digabung dengan aturan produksi lain, bukan menggantinya):
```json
{"rules":{"config":{"licenseSwitch":{".read":true,".write":"auth != null && auth.token.admin === true"}}}}
```

Catatan: aplikasi sekarang memakai ID aplikasi, belum Firebase Auth. Integrasi Firebase Auth dan migrasi rules dibutuhkan sebelum toggle aman digunakan di produksi. Status OFF hanya memblokir antarmuka sampai rules akses data juga ditegakkan.
