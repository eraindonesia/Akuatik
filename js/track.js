'use strict';
/* ERA Portal — track.js : statistik pengunjung ANONIM.
   Tanpa cookie, tanpa alamat IP. Yang dikirim ke backend hanya: kode negara, jenis perangkat, situs rujukan, jalur halaman,
   serta penanda "pengunjung baru hari ini". Menghormati Do-Not-Track; admin/anggota yang login tidak dihitung. */
const Track = {
  _q: [], _started: false, _timer: null, _cc: 'XX', _dev: 'desktop', _off: false,
  TZ: { 'Asia/Jakarta': 'ID', 'Asia/Makassar': 'ID', 'Asia/Jayapura': 'ID', 'Asia/Pontianak': 'ID', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Kuching': 'MY', 'Asia/Singapore': 'SG', 'Asia/Manila': 'PH', 'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK', 'Asia/Taipei': 'TW', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD', 'Asia/Brunei': 'BN', 'Asia/Dili': 'TL', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Perth': 'AU', 'Australia/Brisbane': 'AU', 'Pacific/Auckland': 'NZ', 'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Amsterdam': 'NL', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Zurich': 'CH', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Moscow': 'RU', 'Europe/Istanbul': 'TR', 'Africa/Cairo': 'EG', 'Africa/Lagos': 'NG', 'Africa/Johannesburg': 'ZA', 'Africa/Nairobi': 'KE', 'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR', 'America/Argentina/Buenos_Aires': 'AR', 'America/Bogota': 'CO', 'America/Lima': 'PE', 'America/Santiago': 'CL' },
  isBot() { const ua = navigator.userAgent || ''; return !!navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|prerender|facebookexternalhit|preview|pingdom/i.test(ua); },
  enabled() {
    if (this._off || !API.ready() || this.isBot()) return false;
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return false;
    const s = ERA.S.boot && ERA.S.boot.settings; if (s && s.TRACK_ENABLED === '0') return false;
    return !ERA.S.token;
  },
  allowed(path) { return !/^\/(app|login)(\/|$)/.test(path); },
  device() {
    const ua = navigator.userAgent || '', w = window.innerWidth || 1024;
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet';
    if (/Mobi|iPhone|iPod|Android/i.test(ua) || w < 600) return 'mobile';
    return 'desktop';
  },
  refHost() { try { const r = document.referrer; if (!r) return ''; const h = new URL(r).hostname; return h === location.hostname ? '' : h; } catch (e) { return ''; } },
  tzCountry() { try { return this.TZ[Intl.DateTimeFormat().resolvedOptions().timeZone] || ''; } catch (e) { return ''; } },
  async _get(url, pick, ms) {
    const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
    try { const r = await fetch(url, { signal: c.signal, cache: 'no-store' }); return pick(await r.text()); } finally { clearTimeout(t); }
  },
  /** negara: fungsi Vercel milik sendiri → layanan gratis → zona waktu. Hanya KODE negara yang dipakai. */
  async geo() {
    try { const c = JSON.parse(localStorage.getItem('era.cc') || 'null'); if (c && /^[A-Z]{2}$/.test(c.v) && Date.now() - c.t < 7 * 864e5) return c.v; } catch (e) { }
    const src = [
      ['/api/geo', x => JSON.parse(x).country],
      ['https://api.country.is/', x => JSON.parse(x).country],
      ['https://www.cloudflare.com/cdn-cgi/trace', x => (/loc=([A-Z]{2})/.exec(x) || [])[1]]
    ];
    for (let i = 0; i < src.length; i++) {
      try { const cc = await this._get(src[i][0], src[i][1], 2500); if (/^[A-Z]{2}$/.test(cc || '')) { try { localStorage.setItem('era.cc', JSON.stringify({ v: cc, t: Date.now() })); } catch (e) { } return cc; } } catch (e) { }
    }
    return this.tzCountry() || 'XX';                                          // cadangan terakhir: perkiraan dari zona waktu
  },
  waitBoot() { return new Promise(res => { const t0 = Date.now(), i = setInterval(() => { if (!ERA.S.boot || !ERA.S.boot.loading || Date.now() - t0 > 3500) { clearInterval(i); res(); } }, 120); }); },
  route(path) { if (!this.allowed(path) || !this.enabled()) return; if (!this._started) { this._started = true; this._start(path); } else { this._q.push(path); this._arm(); } },
  async _start(first) {
    await this.waitBoot();
    if (!this.enabled()) { this._off = true; return; }                        // dimatikan admin / DNT aktif
    this._cc = await this.geo(); this._dev = this.device();
    let isNew = true; try { isNew = !sessionStorage.getItem('era.ses'); sessionStorage.setItem('era.ses', '1'); } catch (e) { }
    const today = new Date().toISOString().slice(0, 10); let last = null, vid = null;
    try { last = localStorage.getItem('era.vd'); vid = localStorage.getItem('era.vid'); localStorage.setItem('era.vd', today); localStorage.setItem('era.vid', '1'); } catch (e) { }
    const pages = [first].concat(this._q); this._q = [];
    this.send({ cc: this._cc, dev: this._dev, ref: isNew ? this.refHost() : '', s: isNew ? 1 : 0, nd: last !== today ? 1 : 0, nv: vid ? 0 : 1, pages: pages });
  },
  _arm() { clearTimeout(this._timer); this._timer = setTimeout(() => Track.flush(), 20000); },
  flush() { if (!this._q.length || !this._started || this._off) return; const pages = this._q; this._q = []; this.send({ cc: this._cc, dev: this._dev, s: 0, pages: pages }); },
  send(p) {
    const url = API.url(), body = JSON.stringify({ action: 'track', token: '', data: p });
    try { if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'text/plain;charset=UTF-8' }))) return; } catch (e) { }
    try { fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body }).catch(() => { }); } catch (e) { }
  }
};
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Track.flush(); });
window.addEventListener('pagehide', () => Track.flush());
