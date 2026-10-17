/* Warna avatar otomatis: tiap inisial mendapat gradasi yang konsisten */

(function () {

  var PAL = [['#16a085', '#0b6b5c'], ['#3b82f6', '#1d4ed8'], ['#8b5cf6', '#6d28d9'], ['#ec4899', '#be185d'],

             ['#f59e0b', '#c2410c'], ['#06b6d4', '#0e7490'], ['#10b981', '#047857'], ['#64748b', '#334155'],

             ['#ef4444', '#b91c1c'], ['#6366f1', '#4338ca']];

  var SEL = '.avatar-lg:not(.group-avatar),.avatar-md:not(.group-avatar),.vn-avatar:not(.group-avatar)';

  function hash(s) { var x = 0; for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0; return x; }

  function paint() {

    try {

      document.querySelectorAll(SEL).forEach(function (el) {

        var k = (el.textContent || '').trim() || '?';

        if (el.dataset.avk === k) return;

        el.dataset.avk = k;

        var p = PAL[hash(k) % PAL.length];

        el.style.setProperty('--av-bg', 'linear-gradient(135deg,' + p[0] + ',' + p[1] + ')');

      });

    } catch (e) {}

  }

  var queued = false;

  function schedule() {

    if (queued) return;

    queued = true;

    requestAnimationFrame(function () { queued = false; paint(); });

  }

  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });

  paint();

})();
