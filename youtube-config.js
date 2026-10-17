/* ==========================================================================
   KONFIGURASI YOUTUBE
   --------------------------------------------------------------------------
   Ganti nilai API_KEY di bawah dengan kunci API Anda dari Google Cloud:
     1. Buka https://console.cloud.google.com lalu pilih atau buat proyek.
     2. APIs & Services > Library > aktifkan "YouTube Data API v3".
     3. APIs & Services > Credentials > Create credentials > API key.
     4. Sangat disarankan: pada API key, batasi Application restrictions
        (HTTP referrers) ke domain aplikasi Anda, dan API restrictions
        hanya ke "YouTube Data API v3". Kunci ini terlihat di browser.
   Setelah diganti, unggah ulang file ini ke hosting.
   ========================================================================== */
window.YT_CONFIG = {
  API_KEY: 'AIzaSyArgLueuY2K5wywQNf7HvdJ3vSOLRU8FpQ',

  REGION_CODE: 'ID',        // wilayah untuk video populer (kode negara 2 huruf)
  LANGUAGE: 'id',           // bahasa relevansi hasil pencarian
  PAGE_SIZE: 12,            // jumlah video per muatan (maks 50)
  CACHE_MINUTES: 10         // lama simpan hasil di perangkat untuk menghemat kuota
};
