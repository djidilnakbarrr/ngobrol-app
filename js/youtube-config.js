/* ==========================================================================
   PENGATURAN YOUTUBE
   --------------------------------------------------------------------------
   API key TIDAK disimpan di file ini. Kunci diatur oleh admin langsung dari
   aplikasi (tab YouTube > ikon kunci) dan disimpan di database Firebase.
   File ini hanya berisi pengaturan tampilan dan kuota.
   ========================================================================== */
window.YT_CONFIG = {
  API_KEY: '',              // jangan diisi. Kunci diambil dari database

  REGION_CODE: 'ID',        // wilayah untuk video populer (kode negara 2 huruf)
  LANGUAGE: 'id',           // bahasa relevansi hasil pencarian
  MIN_SECONDS: 300,         // hanya video berdurasi segini (detik) atau lebih yang ditampilkan; 300 = 5 menit, isi 0 untuk semua
  PAGE_SIZE: 12,            // jumlah video per muatan (maks 50)
  CACHE_MINUTES: 5          // lama simpan hasil di perangkat untuk menghemat kuota
};
