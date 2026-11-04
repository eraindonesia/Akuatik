'use strict';
/* ERA Portal — core.js : util • ikon • API (cache SWR) • sesi • router • toast/modal */
const ERA = window.ERA = { S: { boot: null, me: null, token: '' } };
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

/* ---------- util ---------- */
function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function qs(o) { return Object.keys(o || {}).filter(k => o[k] !== '' && o[k] !== undefined && o[k] !== null).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(o[k])).join('&'); }
function slug(s) { return String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function hash(s) { let h = 0; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function debounce(fn, ms) { let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), ms); }; }
function fmtDate(s, long) {
  if (!s) return '';
  const d = new Date(String(s).length <= 10 ? s + 'T00:00:00' : s);
  if (isNaN(d)) return String(s);
  return d.toLocaleDateString('id-ID', long ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDT(s) { const d = new Date(s); return isNaN(d) ? '' : d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('.', ':'); }
function ago(s) {
  const d = new Date(s); if (isNaN(d)) return '';
  const m = Math.floor((Date.now() - d) / 60000);
  if (m < 1) return 'baru saja'; if (m < 60) return m + ' mnt lalu'; if (m < 1440) return Math.floor(m / 60) + ' jam lalu'; if (m < 43200) return Math.floor(m / 1440) + ' hari lalu';
  return fmtDate(s);
}
function fmtNum(n) { return Number(n || 0).toLocaleString('id-ID'); }
function fmtBytes(b) { b = Number(b || 0); return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
function lines(s) { return String(s || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean); }
function coord(v, pos, neg) { v = Number(v); if (!isFinite(v)) return ''; return Math.abs(v).toFixed(4) + '° ' + (v >= 0 ? pos : neg); }
function driveId(u) { const m = /\/file\/d\/([\w-]{20,})/.exec(u || '') || /[?&]id=([\w-]{20,})/.exec(u || ''); return m ? m[1] : ''; }
function validUrl(u) { return /^https?:\/\/[^\s<>"']{3,500}$/i.test(u || ''); }
function ytEmbed(u) {
  let m = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/.exec(u || '');
  if (m) return 'https://www.youtube.com/embed/' + m[1];
  m = /drive\.google\.com\/file\/d\/([\w-]{20,})/.exec(u || '');
  return m ? 'https://drive.google.com/file/d/' + m[1] + '/preview' : '';
}
/* markdown mini & aman: ## judul, - daftar, **tebal**, *miring*, paragraf */
function md(t) {
  t = String(t || '').trim(); if (!t) return '';
  const inl = s => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
  let out = '', list = false, para = [];
  const flush = () => { if (para.length) { out += '<p>' + inl(para.join(' ')) + '</p>'; para = []; } };
  const endList = () => { if (list) { out += '</ul>'; list = false; } };
  esc(t).split(/\r?\n/).forEach(l => {
    let m;
    if ((m = /^#{1,2}\s+(.*)$/.exec(l))) { flush(); endList(); out += '<h2>' + inl(m[1]) + '</h2>'; }
    else if ((m = /^###\s+(.*)$/.exec(l))) { flush(); endList(); out += '<h3>' + inl(m[1]) + '</h3>'; }
    else if ((m = /^[-*•]\s+(.*)$/.exec(l))) { flush(); if (!list) { out += '<ul>'; list = true; } out += '<li>' + inl(m[1]) + '</li>'; }
    else if (!l.trim()) { flush(); endList(); }
    else { endList(); para.push(l.trim()); }
  });
  flush(); endList(); return out;
}

/* ---------- ikon (garis, gaya Lucide) ---------- */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>', chevR: '<path d="m9 6 6 6-6 6"/>', chevL: '<path d="m15 6-6 6 6 6"/>', arrowR: '<path d="M5 12h14M13 5l7 7-7 7"/>', arrowL: '<path d="M19 12H5M11 5l-7 7 7 7"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>', cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>', user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>', phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>', shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', checkC: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m22 4-10 10-3-3"/>', alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>', clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>', download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>', grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', layers: '<path d="m12 2 10 5-10 5L2 7zM2 17l10 5 10-5M2 12l10 5 10-5"/>', image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  play: '<path d="M6 4l14 8-14 8z"/>', compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>', drop: '<path d="M12 2.7s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12z"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.7-4 3-9 3s-9-1.3-9-3M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>', bar: '<path d="M12 20V10M18 20V4M6 20v-4"/>',
  pie: '<path d="M21.2 15.9A10 10 0 1 1 8 2.8M22 12A10 10 0 0 0 12 2v10z"/>', cog: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>', bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>', moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
  clip: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="m9 14 2 2 4-4"/>', hist: '<path d="M1 4v6h6M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M16 7l3 3M14 9l2 2"/>',
  refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>', copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>', send: '<path d="m22 2-11 11M22 2l-7 20-4-9-9-4z"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>', file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>', ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01"/>', award: '<circle cx="12" cy="8" r="7"/><path d="m8.2 13.9-1.2 8.1 5-3 5 3-1.2-8.1"/>',
  wave: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  fish: '<path d="M6.5 12c3-5 8-5 11 0-3 5-8 5-11 0zM17.5 12l4-3v6zM2 12l4.5 0M9.5 11h.01"/>', flask: '<path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 1.8 3h12.4a2 2 0 0 0 1.8-3l-6-10V3"/>',
  act: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>', folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>', mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 7-10 16-10 0 9-4 16-10 16zM2 22c2-6 5-9 9-11"/>', handshake: '<path d="m11 17 2 2a1 1 0 0 0 3-3M14 14l2.5 2.5a1 1 0 0 0 3-3l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a1 1 0 0 1-1.4 0 1 1 0 0 1 0-1.4l3-3a4 4 0 0 1 5.6 0L21 8M3 8l5.2-.5M2 11l3.5 3.5a1 1 0 0 0 3-3"/>'
};
function icon(n, c) { return '<svg class="ic ' + (c || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || ICONS.info) + '</svg>'; }

/* ---------- ilustrasi pengganti foto (deterministik) ---------- */
function art(seed, kind) {
  const h = hash(seed), a = 188 + h % 36, b = 198 + (h >> 4) % 30, id = 'g' + h;
  let glyph = '';
  if (kind === 'fish') glyph = '<g transform="translate(200 128)" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-linecap="round"><path d="M-62 0c24-38 70-38 100 0-30 38-76 38-100 0zM38 0l34-26v52z"/><circle cx="-34" cy="-6" r="3.5" fill="rgba(255,255,255,.7)"/></g>';
  else if (kind === 'pin') glyph = '<g transform="translate(200 124)" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3"><path d="M0 52C-34 20-40-6-40-18a40 40 0 0 1 80 0C40-6 34 20 0 52z"/><circle cx="0" cy="-18" r="14"/></g>';
  else if (kind === 'doc') glyph = '<g transform="translate(200 125)" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3"><rect x="-32" y="-44" width="64" height="88" rx="6"/><path d="M-16-18h32M-16 0h32M-16 18h20"/></g>';
  else glyph = '<g transform="translate(200 128)" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="3" stroke-linecap="round"><path d="M-70-14c12 8 24-8 35 0s24-8 35 0 24-8 35 0M-70 6c12 8 24-8 35 0s24-8 35 0 24-8 35 0M-70 26c12 8 24-8 35 0s24-8 35 0 24-8 35 0"/></g>';
  return '<svg class="art" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + a + ' 72% 20%)"/><stop offset="1" stop-color="hsl(' + b + ' 62% 36%)"/></linearGradient></defs>' +
    '<rect width="400" height="250" fill="url(#' + id + ')"/><g fill="none" stroke="rgba(255,255,255,.08)" stroke-width="2"><circle cx="' + (80 + h % 240) + '" cy="' + (60 + (h >> 3) % 130) + '" r="60"/><circle cx="' + (80 + h % 240) + '" cy="' + (60 + (h >> 3) % 130) + '" r="100"/><circle cx="' + (80 + h % 240) + '" cy="' + (60 + (h >> 3) % 130) + '" r="140"/></g>' + glyph + '</svg>';
}
function imgSrc(u) {
  if (!u) return '';
  const id = driveId(u);
  return id && !/thumbnail/.test(u) && !/\/preview$/.test(u) ? 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1200' : u;
}
function img(u, alt, seed, kind) {
  const s = imgSrc(u);
  if (!s) return art(seed || alt, kind);
  return '<img src="' + esc(s) + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async" data-seed="' + esc(seed || alt) + '" data-kind="' + esc(kind || '') + '" onerror="ERA.imgErr(this)">';
}
ERA.imgErr = function (el) {
  const fb = () => { el.outerHTML = art(el.dataset.seed, el.dataset.kind); };
  if (el.dataset.t !== '1' && ERA.S.token && /drive\.google\.com/.test(el.src)) {
    el.dataset.t = '1';
    API.post('file.preview', { url: el.src }).then(r => { if (r.success) el.src = r.data.dataUrl; else fb(); }).catch(fb);
  } else fb();
};

/* ---------- API client + cache SWR (gas-instant-ux) ---------- */
const API = {
  url() { return (window.ERA_CONFIG && window.ERA_CONFIG.GAS_URL) || ''; },
  ready() { return /^https:\/\/script\.google\.com\/(a\/[^/]+\/)?macros\/s\/[\w-]+\/exec/.test(this.url()); },
  async _fetch(url, opt) {
    const c = new AbortController(), t = setTimeout(() => c.abort(), 45000);
    try {
      const r = await fetch(url, Object.assign({ signal: c.signal, redirect: 'follow' }, opt || {}));
      return await r.json();
    } catch (e) {
      throw new Error(e.name === 'AbortError' ? 'Waktu tunggu habis. Periksa koneksi Anda lalu coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } finally { clearTimeout(t); }
  },
  async get(action, params) {
    if (!this.ready()) throw new Error('Alamat backend belum diatur. Isi GAS_URL di js/config.js.');
    return this._fetch(this.url() + '?' + qs(Object.assign({ action: action }, params || {})));
  },
  async post(action, data, opt) {
    if (!this.ready()) throw new Error('Alamat backend belum diatur. Isi GAS_URL di js/config.js.');
    const res = await this._fetch(this.url(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: action, token: (opt && opt.noauth) ? '' : ERA.S.token, data: data || {} }) });
    if (res && !res.success && res.code === 'AUTH' && ERA.S.token) { Auth.clear(); toast('Sesi berakhir. Silakan masuk kembali.', 'warn'); Router.go('/login'); }
    return res;
  },
  /** panggil + lempar error bila gagal */
  async call(action, data, opt) { const r = await this.post(action, data, opt); if (!r.success) { const e = new Error(r.message || 'Gagal'); e.code = r.code; throw e; } return r.data; },
  async pub(action, params) { const r = await this.get(action, params); if (!r.success) { const e = new Error(r.message || 'Gagal memuat data'); e.code = r.code; throw e; } return r.data; },
  /** stale-while-revalidate untuk GET publik */
  async swr(action, params, cb, ttl) {
    ttl = ttl || (window.ERA_CONFIG.CACHE_TTL_SEC || 300);
    const key = 'era.c.' + action + '.' + qs(params);
    let hit = null; try { hit = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { }
    if (hit) { cb(hit.d, true); if (Date.now() - hit.t < ttl * 500) return; }
    let data;
    try { data = await this.pub(action, params); } catch (e) { if (hit) return; throw e; }
    const s = JSON.stringify(data);
    if (!hit || JSON.stringify(hit.d) !== s) cb(data, false);
    try { if (s.length < 350000) localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: data })); } catch (e) { API.prune(); }
  },
  prune() { Object.keys(localStorage).filter(k => k.indexOf('era.c.') === 0).forEach(k => localStorage.removeItem(k)); }
};

/* ---------- sesi ---------- */
const Auth = {
  load() { try { const s = JSON.parse(localStorage.getItem('era.sess') || 'null'); if (s && s.token && s.exp > Date.now()) { ERA.S.token = s.token; ERA.S.me = s.me; } else this.clear(true); } catch (e) { this.clear(true); } },
  save(token, me) { ERA.S.token = token; ERA.S.me = me; localStorage.setItem('era.sess', JSON.stringify({ token: token, me: me, exp: Date.now() + 11.5 * 3600e3 })); },
  clear(quiet) { ERA.S.token = ''; ERA.S.me = null; try { localStorage.removeItem('era.sess'); } catch (e) { } if (!quiet) { try { Object.keys(localStorage).filter(k => k.indexOf('era.draft.') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) { } } },
  get isAdmin() { return !!(ERA.S.me && ERA.S.me.role === 'admin'); },
  get on() { return !!(ERA.S.token && ERA.S.me); },
  can(perm) { const m = ERA.S.me; if (!m) return false; if (m.role === 'admin') return true; if (perm === 'admin') return false; return String(m.categories || '').split(',').map(s => s.trim()).indexOf(perm) >= 0; }
};

/* ---------- tema ---------- */
const Theme = {
  get() { return document.documentElement.getAttribute('data-theme') || 'light'; },
  toggle() { const n = this.get() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); try { localStorage.setItem('era.theme', n); } catch (e) { } $$('[data-theme-ic]').forEach(b => { b.innerHTML = icon(n === 'dark' ? 'sun' : 'moon'); }); document.dispatchEvent(new Event('era:theme')); }
};

/* ---------- toast & modal ---------- */
function toast(msg, type, ms) {
  const box = $('#toasts'), el = document.createElement('div');
  el.className = 'toast ' + (type || 'ok'); el.setAttribute('role', type === 'err' ? 'alert' : 'status');
  el.innerHTML = '<span>' + icon(type === 'err' ? 'alert' : type === 'warn' ? 'alert' : 'checkC') + '</span><div style="flex:1">' + esc(msg) + '</div>';
  box.appendChild(el); setTimeout(() => el.remove(), ms || (type === 'err' ? 7000 : 4200));
}
const Modal = {
  stack: [],
  open(o) {
    const ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = '<div class="modal ' + (o.size || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(o.title || '') + '"><div class="modal-h"><h3>' + esc(o.title || '') + '</h3><button class="btn btn-o btn-ic" data-x aria-label="Tutup">' + icon('x') + '</button></div><div class="modal-b">' + (o.body || '') + '</div>' + (o.footer ? '<div class="modal-f">' + o.footer + '</div>' : '') + '</div>';
    const prev = document.activeElement;
    const api = { el: ov, close() { ov.remove(); Modal.stack = Modal.stack.filter(x => x !== api); document.removeEventListener('keydown', onKey); if (prev && prev.focus) try { prev.focus(); } catch (e) { } if (o.onClose) o.onClose(); } };
    const onKey = e => { if (e.key === 'Escape' && Modal.stack[Modal.stack.length - 1] === api) api.close(); };
    ov.addEventListener('mousedown', e => { if (e.target === ov) api.close(); });
    ov.querySelector('[data-x]').onclick = () => api.close();
    document.addEventListener('keydown', onKey);
    $('#modal-root').appendChild(ov); Modal.stack.push(api);
    const f = ov.querySelector('input,select,textarea,button:not([data-x])'); if (f) setTimeout(() => f.focus(), 30);
    if (o.onOpen) o.onOpen(api);
    return api;
  },
  confirm(o) {
    return new Promise(res => {
      const m = Modal.open({ title: o.title || 'Konfirmasi', size: 'sm', body: '<p style="margin:0">' + (o.html || esc(o.msg || '')) + '</p>', footer: '<button class="btn btn-o" data-n>Batal</button><button class="btn ' + (o.danger ? 'btn-d' : 'btn-p') + '" data-y>' + esc(o.ok || 'Ya, lanjutkan') + '</button>', onClose: () => res(false) });
      m.el.querySelector('[data-n]').onclick = () => m.close();
      m.el.querySelector('[data-y]').onclick = () => { m.el.querySelector('[data-y]').disabled = true; res(true); m.close = () => m.el.remove(); m.el.remove(); Modal.stack = Modal.stack.filter(x => x !== m); };
    });
  },
  prompt(o) {
    return new Promise(res => {
      let done = false;
      const m = Modal.open({ title: o.title, size: 'sm', body: '<label class="f" for="pm">' + esc(o.label || '') + (o.required ? ' <span class="req">*</span>' : '') + '</label><textarea id="pm" class="inp" rows="4" placeholder="' + esc(o.placeholder || '') + '"></textarea><div class="fe hide" id="pme">Wajib diisi.</div>', footer: '<button class="btn btn-o" data-n>Batal</button><button class="btn ' + (o.danger ? 'btn-d' : 'btn-p') + '" data-y>' + esc(o.ok || 'Simpan') + '</button>', onClose: () => { if (!done) res(null); } });
      m.el.querySelector('[data-n]').onclick = () => m.close();
      m.el.querySelector('[data-y]').onclick = () => { const v = m.el.querySelector('#pm').value.trim(); if (o.required && !v) { m.el.querySelector('#pme').classList.remove('hide'); return; } done = true; res(v); m.close(); };
    });
  }
};
const Drawer = {
  open(html, onClose) {
    const ov = document.createElement('div'); ov.className = 'ov'; ov.style.cssText = 'display:block;padding:0;place-items:unset';
    ov.innerHTML = '<aside class="dr" role="dialog" aria-modal="true"><div style="display:flex;justify-content:flex-end;padding:12px 14px 0"><button class="btn btn-o btn-ic" data-x aria-label="Tutup">' + icon('x') + '</button></div><div style="padding:0 24px 28px">' + html + '</div></aside>';
    const api = { el: ov, close() { ov.remove(); document.removeEventListener('keydown', k); if (onClose) onClose(); } };
    const k = e => { if (e.key === 'Escape') api.close(); };
    ov.addEventListener('mousedown', e => { if (e.target === ov) api.close(); });
    ov.querySelector('[data-x]').onclick = () => api.close();
    document.addEventListener('keydown', k); $('#modal-root').appendChild(ov);
    return api;
  }
};

/* ---------- router hash ---------- */
const Router = {
  routes: [], cleanups: [], seq: 0, cur: { path: '/', q: new URLSearchParams() },
  on(pattern, handler, opt) {
    const keys = [], re = new RegExp('^' + pattern.replace(/:([a-z]+)/gi, (_, k) => { keys.push(k); return '([^/]+)'; }).replace(/\*/g, '.*') + '/?$');
    this.routes.push({ re, keys, handler, opt: opt || {} });
  },
  go(path, replace) { const h = '#' + path; if (replace) history.replaceState(null, '', h); if (location.hash === h) this.run(); else location.hash = h; },
  cleanup(fn) { this.cleanups.push(fn); },
  token() { const n = ++this.seq; return { ok: () => n === Router.seq }; },
  parse() { const h = location.hash.slice(1) || '/', i = h.indexOf('?'); return { path: decodeURIComponent(i < 0 ? h : h.slice(0, i)) || '/', q: new URLSearchParams(i < 0 ? '' : h.slice(i + 1)) }; },
  async run() {
    this.cleanups.splice(0).forEach(f => { try { f(); } catch (e) { } });
    const T = this.token(), cur = this.parse(); this.cur = cur;
    let hit = null;
    for (const r of this.routes) { const m = r.re.exec(cur.path); if (m) { const p = {}; r.keys.forEach((k, i) => { p[k] = decodeURIComponent(m[i + 1]); }); hit = { r, p }; break; } }
    if (!hit) hit = { r: this.notFound, p: {} };
    if (hit.r.opt.auth && !Auth.on) { Router.go('/login?next=' + encodeURIComponent(cur.path), true); return; }
    if (hit.r.opt.admin && !Auth.isAdmin) { toast('Halaman ini hanya untuk Admin.', 'warn'); Router.go('/app', true); return; }
    window.scrollTo(0, 0); document.title = 'Ekspedisi Riset Akuatik (ERA)';
    try { await hit.r.handler(hit.p, cur.q, T); }
    catch (e) { if (!T.ok()) return; console.error(e); const m = Shell.main(); if (m) m.innerHTML = Views.error(e.message || 'Terjadi kesalahan'); }
  }
};
window.addEventListener('hashchange', () => Router.run());
document.addEventListener('click', e => {
  const a = e.target.closest('[data-go]'); if (a) { e.preventDefault(); Router.go(a.getAttribute('data-go')); }
});
