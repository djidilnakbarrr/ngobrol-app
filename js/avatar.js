/* Warna avatar otomatis: tiap pengguna mendapat warna acak yang tetap (berdasarkan ID-nya),
   jadi warnanya sama di semua tampilan dan di semua perangkat, tidak berubah saat dimuat ulang. */
(function () {
  var SEL = '.avatar-lg:not(.group-avatar),.avatar-md:not(.group-avatar),.vn-avatar:not(.group-avatar)';

  /* FNV-1a + pengacak akhir supaya ID yang mirip (mis. ABCD dan ABCE) tetap beda jauh warnanya */
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    h ^= h >>> 16; h = Math.imul(h, 2246822507) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
  }

  function colorsFor(key) {
    var h = hash(key);
    var hue = h % 360;                       /* seluruh lingkaran warna */
    var sat = 58 + ((h >>> 9) % 15);         /* 58-72%: cerah tapi tidak menyilaukan */
    var l1 = 42 + ((h >>> 14) % 6);          /* 42-47%: teks putih tetap terbaca */
    var hue2 = (hue + 24 + ((h >>> 20) % 22)) % 360;
    return ['hsl(' + hue + ',' + sat + '%,' + l1 + '%)', 'hsl(' + hue2 + ',' + Math.min(80, sat + 6) + '%,' + (l1 - 10) + '%)'];
  }

  function paintOne(el) {
    var k = (el.dataset.avseed || '').trim() || (el.textContent || '').trim() || '?';
    if (el.dataset.avk === k) return;
    el.dataset.avk = k;
    var c = colorsFor(k);
    el.style.setProperty('--av-bg', 'linear-gradient(135deg,' + c[0] + ',' + c[1] + ')');
  }

  function paint() {
    try { document.querySelectorAll(SEL).forEach(paintOne); } catch (e) {}
  }

  /* dipanggil langsung oleh renderAvatar() supaya warna langsung benar tanpa menunggu pengamat DOM */
  window.paintAvatar = function (el) {
    try { if (el && el.matches && el.matches(SEL)) paintOne(el); } catch (e) {}
  };

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; paint(); });
  }

  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
  paint();
})();
