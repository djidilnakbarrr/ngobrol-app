/* ===== Link video di chat: dikenali otomatis & diputar otomatis (senyap) saat terlihat, plus tautan yang bisa diketuk ===== */
(function () {
  'use strict';
  const NS_SVG = {
    spk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
    open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>',
    ban: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3.5"/><path d="M10 9.5v5l4.5-2.5z"/><line x1="4" y1="20" x2="20" y2="4"/></svg>'
  };

  /* ---------- sakelar YouTube (diatur admin, lihat youtube-gate.js) ---------- */
  const ytOff = () => !!window.YTGate && !window.YTGate.isEnabled();
  const isYt = raw => !!window.YTGate && window.YTGate.isYouTubeUrl(raw);
  const httpOK = /^https?:$/.test(location.protocol);

  /* ---------- pengenal link video ---------- */
  function secs(t) {
    if (!t) return 0;
    if (/^\d+$/.test(t)) return +t;
    const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i.exec(t);
    return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
  }
  function parse(raw) {
    let u;
    try { u = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw); } catch (e) { return null; }
    if (!/^https?:$/.test(u.protocol)) return null;
    const h = u.hostname.toLowerCase().replace(/^(www|m|mobile|music|web|gaming)\./, '');
    const path = u.pathname, q = u.searchParams;
    let m;
    /* YouTube */
    if (h === 'youtu.be' || h === 'youtube.com' || h === 'youtube-nocookie.com') {
      let id = '', portrait = false, list = q.get('list');
      if (h === 'youtu.be') id = path.split('/')[1] || '';
      else if (path === '/watch') id = q.get('v') || '';
      else if ((m = /^\/(shorts|live|embed|v)\/([\w-]{6,})/.exec(path))) { id = m[2]; portrait = m[1] === 'shorts'; }
      else if (path === '/playlist' && list) {
        return { kind: 'iframe', name: 'YouTube', color: '#c4302b', embed: 'https://www.youtube-nocookie.com/embed/videoseries?list=' + encodeURIComponent(list) + '&autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1', sound: 'yt' };
      }
      if (!/^[\w-]{6,}$/.test(id)) return null;
      const st = secs(q.get('t') || q.get('start'));
      return { kind: 'iframe', name: 'YouTube', color: '#c4302b', portrait, sound: 'yt',
        thumb: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg',
        embed: 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&loop=0' + (st ? '&start=' + st : '') + (httpOK ? '&origin=' + encodeURIComponent(location.origin) : '') };
    }
    /* Vimeo */
    if (h === 'vimeo.com' || h === 'player.vimeo.com') {
      m = /\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d{5,})(?:\/([0-9a-f]{8,}))?/.exec(path);
      if (!m) return null;
      return { kind: 'iframe', name: 'Vimeo', color: '#1ab7ea', sound: 'vimeo',
        embed: 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1&muted=1&playsinline=1' + (m[2] ? '&h=' + m[2] : (q.get('h') ? '&h=' + q.get('h') : '')) };
    }
    /* Dailymotion */
    if (h === 'dailymotion.com' || h === 'dai.ly') {
      m = h === 'dai.ly' ? /^\/([a-z0-9]+)/i.exec(path) : /\/(?:embed\/)?video\/([a-z0-9]+)/i.exec(path);
      if (!m) return null;
      return { kind: 'iframe', name: 'Dailymotion', color: '#0066dc', thumb: 'https://www.dailymotion.com/thumbnail/video/' + m[1],
        embed: 'https://www.dailymotion.com/embed/video/' + m[1] + '?autoplay=1&mute=1' };
    }
    /* TikTok */
    if (h === 'tiktok.com') {
      m = /\/video\/(\d{8,})/.exec(path);
      if (!m) return null;
      return { kind: 'iframe', name: 'TikTok', color: '#111', portrait: true, embed: 'https://www.tiktok.com/embed/v2/' + m[1] + '?autoplay=1&muted=1' };
    }
    /* Instagram */
    if (h === 'instagram.com') {
      m = /^\/(?:[^/]+\/)?(reel|reels|p|tv)\/([\w-]+)/.exec(path);
      if (!m) return null;
      return { kind: 'iframe', name: 'Instagram', color: '#c13584', portrait: true, embed: 'https://www.instagram.com/' + (m[1] === 'reels' ? 'reel' : m[1]) + '/' + m[2] + '/embed/' };
    }
    /* Facebook */
    if (h === 'facebook.com' || h === 'fb.watch' || h === 'fb.com') {
      if (h !== 'fb.watch' && !/\/(videos?|reel|watch)\b/.test(path)) return null;
      const portrait = /\/reel\b/.test(path);
      return { kind: 'iframe', name: 'Facebook', color: '#1877f2', portrait,
        embed: 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(u.href) + '&show_text=false&autoplay=true&mute=1&allowfullscreen=true' };
    }
    /* Twitch */
    if (h === 'twitch.tv' || h === 'clips.twitch.tv') {
      const parent = encodeURIComponent(location.hostname || 'localhost');
      if (h === 'clips.twitch.tv' && (m = /^\/([\w-]+)/.exec(path)))
        return { kind: 'iframe', name: 'Twitch', color: '#9146ff', embed: 'https://clips.twitch.tv/embed?clip=' + m[1] + '&parent=' + parent + '&autoplay=true&muted=true' };
      if ((m = /\/clip\/([\w-]+)/.exec(path)))
        return { kind: 'iframe', name: 'Twitch', color: '#9146ff', embed: 'https://clips.twitch.tv/embed?clip=' + m[1] + '&parent=' + parent + '&autoplay=true&muted=true' };
      if ((m = /^\/videos\/(\d+)/.exec(path)))
        return { kind: 'iframe', name: 'Twitch', color: '#9146ff', embed: 'https://player.twitch.tv/?video=v' + m[1] + '&parent=' + parent + '&autoplay=true&muted=true' };
      if ((m = /^\/([\w]{3,25})\/?$/.exec(path)))
        return { kind: 'iframe', name: 'Twitch', color: '#9146ff', embed: 'https://player.twitch.tv/?channel=' + m[1] + '&parent=' + parent + '&autoplay=true&muted=true' };
      return null;
    }
    /* Streamable */
    if (h === 'streamable.com') {
      m = /^\/(?:e\/)?([a-z0-9]+)/i.exec(path);
      if (!m) return null;
      return { kind: 'iframe', name: 'Streamable', color: '#0f90fa', embed: 'https://streamable.com/e/' + m[1] + '?autoplay=1&muted=1' };
    }
    /* Google Drive */
    if (h === 'drive.google.com' && (m = /\/file\/d\/([\w-]+)/.exec(path)))
      return { kind: 'iframe', name: 'Google Drive', color: '#1a73e8', embed: 'https://drive.google.com/file/d/' + m[1] + '/preview' };
    /* Bilibili */
    if (h === 'bilibili.com' && (m = /\/video\/(BV[\w]+)/i.exec(path)))
      return { kind: 'iframe', name: 'Bilibili', color: '#00a1d6', embed: 'https://player.bilibili.com/player.html?bvid=' + m[1] + '&autoplay=1&muted=1&high_quality=1' };
    /* berkas video langsung */
    if (/\.(mp4|m4v|mov|webm|ogv|ogg|3gp|mkv|m3u8)$/i.test(path)) {
      const hls = /\.m3u8$/i.test(path);
      return { kind: 'file', hls, name: hls ? 'Siaran langsung' : 'Video', color: '#17323a', src: u.href };
    }
    return null;
  }
  const URL_RE = /((?:https?:\/\/|www\.)[^\s<>"']+|\b(?:youtu\.be|youtube\.com|m\.youtube\.com|vimeo\.com|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|dailymotion\.com|dai\.ly|twitch\.tv|streamable\.com)\/[^\s<>"']+)/gi;
  function splitUrl(s) {   /* pisahkan tanda baca di ujung link */
    const m = /[.,;:!?)\]}'"»]+$/.exec(s);
    return m ? [s.slice(0, m.index), m[0]] : [s, ''];
  }
  function findUrls(text) {
    const out = []; let m;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(text))) { const [u, tail] = splitUrl(m[0]); if (u.length > 3) out.push({ url: u, index: m.index, tail }); }
    return out;
  }

  /* ---------- teks dengan tautan bisa diketuk ---------- */
  function linkify(el, text) {
    text = String(text == null ? '' : text);
    const urls = findUrls(text);
    if (!urls.length) { el.textContent = text; return; }
    let pos = 0;
    urls.forEach(x => {
      if (x.index > pos) el.appendChild(document.createTextNode(text.slice(pos, x.index)));
      if (ytOff() && isYt(x.url)) {
        const b = document.createElement('span');
        b.className = 'msg-link yt-blocked';
        b.textContent = x.url;
        el.appendChild(b);
        pos = x.index + x.url.length;
        return;
      }
      const a = document.createElement('a');
      a.className = 'msg-link';
      a.href = /^https?:\/\//i.test(x.url) ? x.url : 'https://' + x.url;
      a.target = '_blank'; a.rel = 'noopener noreferrer nofollow';
      a.textContent = x.url;
      a.addEventListener('click', e => {
        if (document.querySelector('.msg.selected')) { e.preventDefault(); return; }   /* sedang memilih pesan */
        e.stopPropagation();
      });
      el.appendChild(a);
      pos = x.index + x.url.length;
    });
    if (pos < text.length) el.appendChild(document.createTextNode(text.slice(pos)));
  }

  /* ---------- pemutar ---------- */
  const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let hlsPromise = null;
  function loadHls() {
    if (window.Hls) return Promise.resolve();
    if (hlsPromise) return hlsPromise;
    hlsPromise = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
      s.onload = res; s.onerror = () => { hlsPromise = null; rej(new Error('hls')); };
      document.head.appendChild(s);
    });
    return hlsPromise;
  }
  /* satu pengamat untuk semua kartu: putar saat >=50% terlihat, hentikan saat keluar layar */
  let io = null;
  const cardOf = new WeakMap();
  function observer() {
    if (io || !('IntersectionObserver' in window)) return io;
    io = new IntersectionObserver(list => {
      list.forEach(en => {
        const c = cardOf.get(en.target); if (!c) return;
        if (en.intersectionRatio >= 0.5) c.start(); else if (en.intersectionRatio < 0.1) c.stop();
      });
    }, { root: document.getElementById('messages') || null, threshold: [0, 0.1, 0.5, 0.75] });
    return io;
  }
  document.addEventListener('touchstart', e => {   /* sentuh di luar kartu: pelindung sentuhan kembali aktif */
    document.querySelectorAll('.vid-card.interactive').forEach(c => { if (!c.contains(e.target)) c.classList.remove('interactive'); });
  }, { passive: true, capture: true });

  function makeCard(info, href) {
    const card = mk('div', 'vid-card' + (info.portrait ? ' portrait' : ''));
    card.style.setProperty('--vc', info.color || '#17323a');
    if (info.name === 'YouTube') card.setAttribute('data-yt', '1');
    card.innerHTML =
      '<div class="vid-media">' +
        '<div class="vid-poster">' + (info.thumb ? '<img alt="" referrerpolicy="no-referrer" src="' + esc(info.thumb) + '">' : '') +
          '<span class="vid-prov">' + esc(info.name) + '</span><button type="button" class="vid-play" aria-label="Putar video">' + NS_SVG.play + '</button></div>' +
        '<div class="vid-stage"></div>' +
        '<div class="vid-load"><i></i></div>' +
        '<div class="vid-err"><span>Video tidak dapat diputar di sini</span></div>' +
        '<div class="vid-shield"></div>' +
      '</div>' +
      '<div class="vid-bar"><span class="vid-name"><b></b>' + esc(info.name) + '</span><span class="vid-btns"></span></div>';
    const stage = card.querySelector('.vid-stage');
    const btns = card.querySelector('.vid-btns');
    const shield = card.querySelector('.vid-shield');
    let mounted = false, muted = true, el = null, hls = null, manual = false;
    let soundBtn = null;
    if (info.kind === 'file' || info.sound) {
      soundBtn = mk('button', 'vid-btn', NS_SVG.mute); soundBtn.type = 'button'; soundBtn.setAttribute('aria-label', 'Suara');
      soundBtn.addEventListener('click', e => { e.stopPropagation(); setMuted(!muted); });
      btns.appendChild(soundBtn);
    }
    const open = mk('a', 'vid-btn', NS_SVG.open); open.href = href; open.target = '_blank'; open.rel = 'noopener noreferrer'; open.setAttribute('aria-label', 'Buka tautan');
    open.addEventListener('click', e => e.stopPropagation());
    btns.appendChild(open);

    function post(msg) { try { el && el.contentWindow && el.contentWindow.postMessage(typeof msg === 'string' ? msg : JSON.stringify(msg), '*'); } catch (e) {} }
    function setMuted(v) {
      muted = v;
      if (soundBtn) soundBtn.innerHTML = v ? NS_SVG.mute : NS_SVG.spk;
      if (!mounted) return;
      if (info.kind === 'file') { el.muted = v; if (!v) el.play().catch(() => {}); }
      else if (info.sound === 'yt') { post({ event: 'command', func: v ? 'mute' : 'unMute', args: [] }); if (!v) post({ event: 'command', func: 'setVolume', args: [100] }); }
      else if (info.sound === 'vimeo') { post({ method: 'setMuted', value: v }); if (!v) post({ method: 'setVolume', value: 1 }); }
    }
    function fail() { card.classList.add('failed'); card.classList.remove('playing', 'ready'); }
    function start() {
      if (mounted || card.classList.contains('failed')) return;
      if (info.name === 'YouTube' && ytOff()) return;   /* YouTube dinonaktifkan: jangan pernah memasang pemutar */
      mounted = true; card.classList.add('playing');
      if (info.kind === 'file') {
        const v = document.createElement('video');
        v.muted = true; v.defaultMuted = true; v.autoplay = true; v.loop = true; v.playsInline = true; v.preload = 'metadata';
        v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', ''); v.setAttribute('muted', '');
        v.addEventListener('playing', () => card.classList.add('ready'));
        v.addEventListener('error', fail);
        stage.appendChild(v); el = v;
        if (info.hls) {
          if (v.canPlayType('application/vnd.apple.mpegurl')) v.src = info.src;
          else loadHls().then(() => {
            if (window.Hls && Hls.isSupported()) { hls = new Hls(); hls.loadSource(info.src); hls.attachMedia(v); hls.on(Hls.Events.ERROR, (_, d) => { if (d && d.fatal) fail(); }); }
            else fail();
          }).catch(fail);
        } else v.src = info.src;
        const p = v.play(); if (p && p.catch) p.catch(() => {});
      } else {
        const f = document.createElement('iframe');
        f.src = info.embed;
        f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write';
        f.allowFullscreen = true; f.setAttribute('allowfullscreen', ''); f.setAttribute('frameborder', '0');
        f.referrerPolicy = 'strict-origin-when-cross-origin'; f.title = info.name;
        f.addEventListener('load', () => { card.classList.add('ready'); if (info.sound === 'vimeo') post({ method: 'addEventListener', value: 'ready' }); });
        stage.appendChild(f); el = f;
      }
      muted = true; if (soundBtn) soundBtn.innerHTML = NS_SVG.mute;
    }
    function stop() {
      if (!mounted) return;
      mounted = false;
      if (hls) { try { hls.destroy(); } catch (e) {} hls = null; }
      if (el && el.tagName === 'VIDEO') { try { el.pause(); el.removeAttribute('src'); el.load(); } catch (e) {} }
      stage.innerHTML = ''; el = null;
      card.classList.remove('playing', 'ready', 'interactive');
    }
    card.start = start; card.stop = stop;
    card.querySelector('.vid-play').addEventListener('click', e => { e.stopPropagation(); card.classList.remove('failed'); start(); card.classList.add('interactive'); });
    shield.addEventListener('click', e => {
      e.stopPropagation();
      if (document.querySelector('.msg.selected')) return;
      if (!mounted) { start(); return; }
      card.classList.add('interactive');
      if (el && el.tagName === 'VIDEO') el.controls = true;
    });
    cardOf.set(card, card);
    const o = observer();
    if (o) o.observe(card); else setTimeout(start, 0);
    return card;
  }

  /* pemberitahuan statis pengganti video YouTube saat fitur dinonaktifkan */
  function blockedCard() {
    const c = mk('div', 'vid-blocked',
      '<span class="vid-blocked-ic">' + NS_SVG.ban + '</span>' +
      '<span class="vid-blocked-tx"><b>Video YouTube dinonaktifkan</b><span>Fitur ini dimatikan oleh admin.</span></span>');
    c.setAttribute('role', 'note');
    c.setAttribute('data-yt-blocked', '1');
    return c;
  }
  /* langsung hentikan dan ganti semua video YouTube yang sedang tampil di layar */
  function purgeYouTube() {
    document.querySelectorAll('.vid-card[data-yt]').forEach(c => {
      try { c.stop && c.stop(); } catch (e) { /* diabaikan */ }
      if (io) { try { io.unobserve(c); } catch (e) { /* diabaikan */ } }
      try { c.replaceWith(blockedCard()); } catch (e) { c.remove(); }
    });
    document.querySelectorAll('a.msg-link').forEach(a => {
      if (!isYt(a.getAttribute('href'))) return;
      const b = document.createElement('span');
      b.className = 'msg-link yt-blocked';
      b.textContent = a.textContent;
      try { a.replaceWith(b); } catch (e) { /* diabaikan */ }
    });
  }
  if (window.YTGate) window.YTGate.onChange(on => { if (!on) purgeYouTube(); });
  if (ytOff()) document.addEventListener('DOMContentLoaded', purgeYouTube);
  /* apakah teks memuat tautan YouTube (dipakai app.js agar pesan dibangun ulang saat status berubah) */
  function hasYouTube(text) {
    text = String(text || '');
    if (!/youtu/i.test(text)) return false;
    return findUrls(text).some(x => isYt(x.url));
  }

  /* kartu untuk satu pesan teks (null bila tidak ada link video) */
  function card(text) {
    text = String(text || '');
    const urls = findUrls(text);
    for (const x of urls) {
      const info = parse(x.url);
      if (info && info.name === 'YouTube' && ytOff()) return blockedCard();
      if (info) return makeCard(info, /^https?:\/\//i.test(x.url) ? x.url : 'https://' + x.url);
    }
    /* link polos yang tidak dikenali: coba cek apakah berkas video (tanpa ekstensi) */
    const bare = /^\s*(https?:\/\/[^\s]+)\s*$/i.exec(text);
    if (bare && !(ytOff() && isYt(bare[1])) && !/\.(jpe?g|png|gif|webp|svg|pdf|html?|php|aspx?)([?#]|$)/i.test(bare[1]) && !(location.protocol === 'https:' && /^http:/i.test(bare[1]))) {
      const holder = mk('div', 'vid-probe');
      holder.hidden = true;
      probe(bare[1], holder);
      return holder;
    }
    return null;
  }
  function probe(url, holder) {
    const v = document.createElement('video');
    v.muted = true; v.preload = 'metadata'; v.playsInline = true;
    let done = false;
    const fin = ok => {
      if (done) return; done = true; clearTimeout(t);
      try { v.removeAttribute('src'); v.load(); } catch (e) {}
      if (ok && holder.parentNode) { const c = makeCard({ kind: 'file', name: 'Video', color: '#17323a', src: url }, url); holder.replaceWith(c); }
    };
    const t = setTimeout(() => fin(false), 6000);
    v.addEventListener('loadedmetadata', () => fin(v.videoWidth > 0));
    v.addEventListener('error', () => fin(false));
    v.src = url;
  }

  window.ChatVideo = { card, linkify, parse, findUrls, hasYouTube };
})();
