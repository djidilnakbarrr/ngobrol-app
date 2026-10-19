# Ngobrol App — AI Serbaguna Profesional

Pembaruan ini memperluas instruksi sistem AI agar mendukung coding, debugging, desain arsitektur, pengujian, dokumentasi, percakapan umum, penjelasan pelajaran, penulisan, ringkasan, penerjemahan, ide kreatif, perencanaan, dan analisis.

## Batasan penting

- Tidak ada prompt atau aplikasi yang dapat menjamin 100% bebas bug/error atau penggunaan tanpa batas.
- Panjang konteks, panjang jawaban, kuota, biaya, rate limit, ketersediaan model, dan batas API ditentukan oleh penyedia model serta konfigurasi akun/server.
- AI harus menyatakan secara jujur apakah kode benar-benar dijalankan dan diuji.
- Untuk proyek besar, AI harus bekerja bertahap, memeriksa file yang tersedia, mencatat keputusan, dan meminta pengujian build/test sebelum mengklaim selesai.
- Fitur yang memerlukan akses file, terminal, internet, database, atau deployment tetap perlu diimplementasikan sebagai alat terpisah; instruksi sistem saja tidak memberikan kemampuan tersebut.

## Yang berubah

- Instruksi AI diperluas untuk tugas coding dan non-coding.
- Panduan proyek besar diperjelas agar modular dan bisa dilanjutkan.
- Aturan kejujuran verifikasi tetap dipertahankan: tidak boleh mengklaim tes lulus tanpa bukti.

## Verifikasi

Perubahan ini adalah peningkatan instruksi AI, bukan jaminan bahwa semua fitur aplikasi telah diuji end-to-end. Uji aplikasi di lingkungan target, cek API key/model yang aktif, dan jalankan pengujian sebelum rilis.
