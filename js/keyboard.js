/* Keyboard: pastikan semua kolom isian bisa diketik dan tidak tertutup keyboard */
(function () {
  'use strict';
  var SEL = 'input, textarea';
  function isField(el) {
    if (!el || !el.matches || !el.matches(SEL)) return false;
    var t = (el.type || '').toLowerCase();
    return t !== 'file' && t !== 'checkbox' && t !== 'radio' && t !== 'button' && t !== 'submit' && t !== 'hidden' && t !== 'range';
  }
  function reveal(el) {
    try {
      if (!el || !el.isConnected || document.activeElement !== el) return;
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
    } catch (e) { /* abaikan */ }
  }
  /* Saat kolom difokus, geser ke tengah layar setelah keyboard selesai muncul */
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (!isField(el)) return;
    setTimeout(function () { reveal(el); }, 120);
    setTimeout(function () { reveal(el); }, 400);
  }, true);
  /* Keyboard muncul/hilang mengubah tinggi layar: jaga kolom aktif tetap terlihat */
  function onVV() {
    var el = document.activeElement;
    if (isField(el)) setTimeout(function () { reveal(el); }, 50);
  }
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onVV);
  else window.addEventListener('resize', onVV);
})();
