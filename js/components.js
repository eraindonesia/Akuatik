'use strict';
/* ERA Portal — components.js : shell publik & CMS • badge • pager • peta • grafik */

const ST = { draft: ['Draft', 'b-neu'], submitted: ['Submitted', 'b-warn'], returned: ['Returned for Revision', 'b-ret'], approved: ['Approved', 'b-info'], published: ['Published', 'b-ok'], rejected: ['Rejected', 'b-bad'], archived: ['Archived', 'b-neu'] };
function stPill(s) { const x = ST[s] || [s, 'b-neu']; return '<span class="badge dot ' + x[1] + '">' + esc(x[0]) + '</span>'; }
const IUCN_C = { CR: 'b-bad', EN: 'b-ret', VU: 'b-warn', NT: 'b-info', LC: 'b-ok', DD: 'b-neu', NE: 'b-neu' };
const IUCN_L = { CR: 'Critically Endangered', EN: 'Endangered', VU: 'Vulnerable', NT: 'Near Threatened', LC: 'Least Concern', DD: 'Data Deficient', NE: 'Not Evaluated' };
function iucnBadge(c, long) { return c ? '<span class="badge ' + (IUCN_C[c] || 'b-neu') + '" title="IUCN: ' + esc(IUCN_L[c] || c) + '">' + (long ? esc(c + ' · ' + (IUCN_L[c] || '')) : 'IUCN ' + esc(c)) + '</span>' : ''; }
function endemicBadge(r) { return r && r.endemic === 'yes' ? '<span class="badge b-solid">Endemik</span>' : ''; }
function statusBadge(s) {
  const m = { ongoing: ['Ongoing', 'b-solid'], completed: ['Completed', 'b-info'], planned: ['Planned', 'b-neu'], active: ['Active', 'b-solid'] };
  const x = m[s]; return x ? '<span class="badge dot ' + x[1] + '">' + x[0] + '</span>' : '';
}
function dot(c) { return '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + c + '"></span>'; }

/* ---------- tampilan umum ---------- */
const Views = {
  loading(n, cls) { let s = ''; for (let i = 0; i < (n || 6); i++) s += '<div class="sk sk-card"></div>'; return '<div class="grid ' + (cls || 'g3') + '" aria-busy="true" aria-label="Memuat">' + s + '</div>'; },
  lines(n) { let s = ''; for (let i = 0; i < (n || 4); i++) s += '<div class="sk" style="height:18px;margin-bottom:12px;width:' + (60 + (i * 13) % 40) + '%"></div>'; return s; },
  empty(t, m, cta, ic) { return '<div class="empty">' + icon(ic || 'fish', 's32') + '<h3>' + esc(t || 'Belum ada data') + '</h3><p>' + esc(m || '') + '</p>' + (cta || '') + '</div>'; },
  error(msg) { return '<div class="wrap sec"><div class="empty">' + icon('alert', 's32') + '<h3>Tidak dapat memuat halaman</h3><p>' + esc(msg) + '</p><button class="btn btn-p" onclick="Router.run()">' + icon('refresh', 's16') + ' Coba lagi</button></div></div>'; },
  setup() {
    return '<div class="wrap sec" style="max-width:760px"><div class="card pad"><span class="badge b-warn">Konfigurasi diperlukan</span><h1 style="margin-top:14px">Backend belum terhubung</h1><p class="muted">Frontend ERA sudah berjalan, tetapi alamat Web App Google Apps Script belum diisi.</p><ol><li>Deploy backend (lihat <b>PANDUAN</b>) lalu salin URL Web App berakhiran <code class="mono">/exec</code>.</li><li>Buka <code class="mono">js/config.js</code> dan tempel pada <code class="mono">GAS_URL</code>.</li><li>Commit &amp; push; tunggu 1–2 menit hingga GitHub Pages memperbarui.</li></ol></div></div>';
  }
};
function pager(total, page, size) {
  const n = Math.ceil(total / size); if (n <= 1) return '';
  const pages = []; for (let i = 1; i <= n; i++) if (i === 1 || i === n || Math.abs(i - page) <= 1) pages.push(i); else if (pages[pages.length - 1] !== '…') pages.push('…');
  return '<nav class="pager" aria-label="Halaman"><button data-p="' + (page - 1) + '" ' + (page <= 1 ? 'disabled' : '') + ' aria-label="Sebelumnya">' + icon('chevL', 's16') + '</button>' +
    pages.map(p => p === '…' ? '<span class="muted" style="align-self:center">…</span>' : '<button data-p="' + p + '" class="' + (p === page ? 'on' : '') + '" ' + (p === page ? 'aria-current="page"' : '') + '>' + p + '</button>').join('') +
    '<button data-p="' + (page + 1) + '" ' + (page >= n ? 'disabled' : '') + ' aria-label="Berikutnya">' + icon('chevR', 's16') + '</button></nav>';
}
function waveSvg(cls) { return '<svg class="wave ' + (cls || '') + '" viewBox="0 0 1440 48" preserveAspectRatio="none" aria-hidden="true"><path d="M0 24C120 4 240 4 360 20s240 24 360 8 240-26 360-12 240 22 360 6V48H0z"/></svg>'; }
const DEFAULT_LOGO = 'https://res.cloudinary.com/qzxx5soz/image/upload/f_auto,q_auto/Logo_ERA_crop';
function logoUrl() { const u = (ERA.S.boot && ERA.S.boot.settings && ERA.S.boot.settings.LOGO_URL) || ''; return validUrl(u) ? u : DEFAULT_LOGO; }
ERA.logoErr = function (el) { const p = el.parentNode; if (p) p.classList.remove('logo'); el.outerHTML = icon('wave', 's24'); };
function logoMark() { return '<img class="logo-img" src="' + esc(logoUrl()) + '" alt="Logo ERA" decoding="async" onerror="ERA.logoErr(this)">'; }
function setting(k, d) { const s = ERA.S.boot && ERA.S.boot.settings; return (s && s[k]) || d || ''; }

/* ---------- menu publik ---------- */
const FORMS = {
  research: { label: 'Research Collaboration', ic: 'flask', desc: 'Riset bersama menggunakan Research Vessel, laboratorium, dan stasiun lapangan ERA.' },
  academic: { label: 'Academic Partnership', ic: 'book', desc: 'Kemitraan dengan universitas: Joint Field School dan pertukaran data.' },
  institutional: { label: 'Institutional Partnership', ic: 'shield', desc: 'Kerja sama pemerintah, BKSDA, dan lembaga konservasi.' },
  volunteer: { label: 'Volunteer Program', ic: 'users', desc: 'Relawan sains ekosistem perairan (Lake Rangers).' },
  student: { label: 'Student Research Program', ic: 'award', desc: 'Skripsi, tesis, dan disertasi dengan dukungan fasilitas lapangan.' },
  sponsorship: { label: 'Sponsorship & Funding', ic: 'handshake', desc: 'Pendanaan, donasi, dan program CSR konservasi.' },
  expedition: { label: 'Join Our Expedition', ic: 'compass', desc: 'Daftarkan diri untuk berpartisipasi dalam ekspedisi lapangan.' }
};
function buildMenu() {
  const o = ERA.S.boot.schema.opt, sl = a => a.map(x => [slug(x), x]);
  return [
    { k: 'about', label: 'About', path: '/about', subs: [['who', 'Who We Are'], ['background', 'Background'], ['vision', 'Vision & Mission'], ['objectives', 'Objectives'], ['structure', 'Organizational Structure'], ['team', 'Our Team'], ['partners', 'Our Partners']] },
    { k: 'research', label: 'Research', path: '/research', subs: [['all', 'All Research']].concat(sl(o.researchField)) },
    { k: 'expeditions', label: 'Expeditions', path: '/expeditions', subs: [['overview', 'Expedition Overview'], ['lake', 'Lake Expeditions'], ['river', 'River Expeditions'], ['biodiversity', 'Biodiversity Expeditions'], ['locations', 'Research Locations'], ['reports', 'Expedition Reports'], ['documentation', 'Expedition Documentation']] },
    { k: 'database', label: 'Database', path: '/database', subs: [['fish', 'Freshwater Fish Catalogue'], ['endemic', 'Endemic & Threatened Species'], ['organisms', 'Aquatic Organisms'], ['identification', 'Species Identification'], ['map', 'Species Distribution Map'], ['specimens', 'Digital Specimen Catalogue']] },
    { k: 'conservation', label: 'Conservation', path: '/conservation', subs: [['all', 'All Programs']].concat(sl(o.consCat)) },
    { k: 'publications', label: 'Publications', path: '/publications', subs: [['all', 'All Publications']].concat(sl(o.pubType)) },
    { k: 'news', label: 'News', path: '/news', subs: [['all', 'All Stories']].concat(sl(o.newsCat)) },
    { k: 'gallery', label: 'Gallery', path: '/gallery', subs: [['all', 'All Media']].concat(sl(o.galCat)) },
    { k: 'collaboration', label: 'Collaboration', path: '/collaboration', subs: [['overview', 'Collaboration Overview']].concat(Object.keys(FORMS).map(k => [k, FORMS[k].label])) },
    { k: 'knowledge', label: 'Knowledge', path: '/knowledge', subs: [['all', 'Aquatic Knowledge Hub']].concat(sl(o.knowTopic)) },
    { k: 'contact', label: 'Contact', path: '/contact', subs: [['info', 'Contact Information'], ['message', 'Send a Message'], ['social', 'Social Media'], ['partnership', 'Partnership Inquiry'], ['faq', 'FAQ']] }
  ];
}

/* ---------- Shell: kerangka halaman ---------- */
const Shell = {
  type: '', menu: null,
  main() { return $('#main') || $('#cmain'); },
  fresh(id) { const o = $('#' + id); if (!o) return null; const n = o.cloneNode(false); o.replaceWith(n); return n; },   // buang listener rute sebelumnya
  fitNav() {   // menu otomatis menjadi tombol ☰ bila tidak muat (berlaku di zoom / lebar layar berapa pun)
    const nav = $('.nav'), ul = nav && $('.menu', nav); if (!ul) return;
    nav.classList.remove('compact');
    const need = Array.from(ul.children).reduce((a, li) => a + li.getBoundingClientRect().width, 0);
    if (need > ul.clientWidth - 6) nav.classList.add('compact');
  },
  bindOnce() {
    if (this._g) return; this._g = 1;
    window.addEventListener('resize', debounce(() => Shell.fitNav(), 120));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => Shell.fitNav());
    $('#app').addEventListener('click', async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'theme') Theme.toggle();
      if (b.dataset.act === 'burger') { const d = $('#dm'); if (d) d.classList.toggle('open'); }
      if (b.dataset.act === 'search') Shell.searchBox();
      if (b.dataset.act === 'logout') { try { await API.post('auth.logout'); } catch (x) { } Auth.clear(); Shell.type = ''; toast('Sesi diakhiri.'); Router.go('/'); }
    });
  },
  public(active) {
    if (this.type !== 'public') {
      this.menu = buildMenu(); this.type = 'public';
      const m = this.menu, mark = logoMark();
      $('#app').innerHTML =
        (ERA.S.boot.demo ? '<div class="demo-bar">Mode <b>data contoh</b> aktif — ganti dengan data asli atau jalankan <code>hapusDataContoh()</code> di Apps Script.</div>' : '') +
        '<div class="topbar"><div class="wrap"><span class="live">PORTAL RISET LIMNOLOGI TERBUKA</span><span>WGS84 · OPEN ACCESS CC-BY-NC 4.0</span></div></div>' +
        '<header class="nav"><div class="wrap"><a class="brand" href="#/" aria-label="Beranda ERA"><span class="mk logo">' + mark + '</span><span><b>' + esc(setting('SITE_NAME', 'Ekspedisi Riset Akuatik')) + '</b><small>' + esc(setting('SITE_TAGLINE', 'ERA LIMNOLOGY & MARINE PORTAL')) + '</small></span></a>' +
        '<ul class="menu" role="menubar">' + m.map(i => '<li data-k="' + i.k + '"><a href="#' + i.path + '/' + (i.subs[0][0]) + '" role="menuitem">' + esc(i.label) + (i.subs.length > 1 ? icon('chevD', 's16') : '') + '</a><div class="mega" role="menu">' + i.subs.map(s => '<a href="#' + i.path + '/' + s[0] + '" role="menuitem">' + icon('chevR', 's16') + esc(s[1]) + '</a>').join('') + '</div></li>').join('') + '</ul>' +
        '<div class="nav-r"><button class="btn btn-o btn-ic" data-act="search" aria-label="Cari">' + icon('search') + '</button><button class="btn btn-o btn-ic" data-theme-ic data-act="theme" aria-label="Ganti tema">' + icon(Theme.get() === 'dark' ? 'sun' : 'moon') + '</button><a class="btn btn-o btn-sm" id="nav-login" href="#/login">' + icon('user', 's16') + '<span>Member Login</span></a><button class="btn btn-o btn-ic burger" data-act="burger" aria-label="Menu">' + icon('menu') + '</button></div></div></header>' +
        '<main id="main" tabindex="-1"></main>' + this.footer() +
        '<div class="drawer-m" id="dm"><nav aria-label="Menu utama"><div class="row sp" style="margin-bottom:8px"><b>Menu</b><button class="btn btn-o btn-ic" data-act="burger" aria-label="Tutup">' + icon('x') + '</button></div><a class="btn btn-o btn-block" href="#/" style="margin-bottom:8px">Beranda</a>' + m.map(i => '<details><summary>' + esc(i.label) + icon('chevD', 's16') + '</summary>' + i.subs.map(s => '<a href="#' + i.path + '/' + s[0] + '">' + esc(s[1]) + '</a>').join('') + '</details>').join('') + '</nav></div>';
      this.bindPublic();
    }
    this.bindOnce(); this.fitNav(); requestAnimationFrame(() => Shell.fitNav());
    $$('.menu>li').forEach(li => li.classList.toggle('act', li.dataset.k === active));
    const nl = $('#nav-login'); if (nl) { nl.href = Auth.on ? '#/app' : '#/login'; nl.querySelector('span').textContent = Auth.on ? 'Dashboard' : 'Member Login'; }
    $('#dm') && $('#dm').classList.remove('open');
    return this.fresh('main');
  },
  bindPublic() {
    $('#dm').addEventListener('click', e => { if (e.target.id === 'dm' || e.target.closest('a')) $('#dm').classList.remove('open'); });
  },
  updateChrome() {   // data boot asli tiba setelah kerangka tampil: segarkan footer, nama & logo tanpa menggambar ulang halaman
    if (this.type !== 'public') return;
    const f = $('.foot'); if (f) f.outerHTML = this.footer();
    const b = $('.nav .brand b'), t = $('.nav .brand small'), im = $('.nav .logo-img');
    if (b) b.textContent = setting('SITE_NAME', 'Ekspedisi Riset Akuatik'); if (t) t.textContent = setting('SITE_TAGLINE', 'ERA LIMNOLOGY & MARINE PORTAL');
    if (im && im.getAttribute('src') !== logoUrl()) im.src = logoUrl();
  },
  searchBox() {
    const m = Modal.open({ title: 'Cari di portal ERA', body: '<form id="gs"><div class="inp-ic">' + icon('search') + '<input class="inp" name="q" placeholder="Nama spesies, penelitian, publikasi, lokasi…" aria-label="Kata kunci" autocomplete="off" required minlength="2"></div><p class="help">Contoh: <a href="#/search?q=oryzias" data-x>oryzias</a>, <a href="#/search?q=matano" data-x>matano</a>, <a href="#/search?q=konservasi" data-x>konservasi</a></p></form>' });
    m.el.querySelectorAll('[data-x]').forEach(a => a.addEventListener('click', () => m.close()));
    m.el.querySelector('#gs').addEventListener('submit', e => { e.preventDefault(); const q = new FormData(e.target).get('q'); m.close(); Router.go('/search?q=' + encodeURIComponent(q)); });
  },
  footer() {
    const soc = [['SOCIAL_INSTAGRAM', 'IG', 'Instagram'], ['SOCIAL_YOUTUBE', 'YT', 'YouTube'], ['SOCIAL_LINKEDIN', 'in', 'LinkedIn'], ['SOCIAL_GITHUB', 'GH', 'GitHub'], ['SOCIAL_ZENODO', 'Zn', 'Zenodo'], ['SOCIAL_X', 'X', 'X']].filter(s => validUrl(setting(s[0])));
    return '<footer class="foot"><div class="wrap"><div class="grid"><div><div class="brand" style="color:#fff!important;margin-bottom:12px"><span class="mk logo">' + logoMark() + '</span><b style="font-size:16px">' + esc(setting('SITE_NAME', 'ERA Portal')) + '</b></div><p style="font-size:14px">Pusat pengkajian dan observasi ekosistem perairan darat. Mengembangkan sains konservasi berbasis data terintegrasi.</p></div>' +
      '<div><h4>Research Stations</h4><a href="#/contact/info">' + esc(setting('ADDRESS')) + '</a><a href="#/expeditions/locations">Lihat semua lokasi riset →</a></div>' +
      '<div><h4>Portal Directory</h4>' + [['/about/who', 'About'], ['/research/all', 'Research'], ['/expeditions/overview', 'Expeditions'], ['/database/fish', 'Database'], ['/publications/all', 'Publications'], ['/news/all', 'News'], ['/collaboration/overview', 'Collaboration'], ['/knowledge/all', 'Knowledge']].map(x => '<a href="#' + x[0] + '">' + x[1] + '</a>').join('') + '</div>' +
      '<div><h4>Hubungi Kami</h4><a href="mailto:' + esc(setting('EMAIL')) + '">' + esc(setting('EMAIL')) + '</a><a href="tel:' + esc(String(setting('PHONE')).replace(/\s/g, '')) + '">' + esc(setting('PHONE')) + '</a><span style="font-size:13px;color:#8FAAC4">' + esc(setting('OFFICE_HOURS')) + '</span>' + (soc.length ? '<div class="soc" style="margin-top:14px">' + soc.map(s => '<a href="' + esc(s[0] && setting(s[0])) + '" target="_blank" rel="noopener noreferrer" aria-label="' + s[2] + '" class="mono xs">' + s[1] + '</a>').join('') + '</div>' : '') + '</div></div>' +
      '<div class="bar"><span>DATUM WGS84 · OPEN ACCESS CC-BY-NC 4.0</span><span>© ' + new Date().getFullYear() + ' ' + esc(setting('SITE_NAME', 'Ekspedisi Riset Akuatik')) + '. All institutional rights reserved.</span></div></div></footer>';
  },

  /* ----- CMS ----- */
  admin(active, crumbs) {
    const me = ERA.S.me, adm = me.role === 'admin';
    if (this.type !== 'admin') {
      this.type = 'admin';
      const sch = ERA.S.boot.schema.entities, can = k => Auth.can(sch[k].perm);
      const ent = Object.keys(sch).filter(k => can(k) && !['team', 'partners'].includes(k)).map(k => '<a class="it" href="#/app/content/' + k + '" data-k="c-' + k + '">' + icon({ research: 'flask', expeditions: 'compass', locations: 'pin', species: 'fish', distribution: 'globe', specimens: 'layers', conservation: 'leaf', publications: 'book', news: 'file', gallery: 'image', events: 'cal', knowledge: 'db' }[k] || 'file') + sch[k].label + '</a>').join('');
      const admOnly = adm ? '<a class="it" href="#/app/content/team" data-k="c-team">' + icon('users') + 'Team</a><a class="it" href="#/app/content/partners" data-k="c-partners">' + icon('handshake') + 'Partners</a>' : '';
      $('#app').innerHTML = '<div class="cms"><aside class="side" id="side" aria-label="Navigasi CMS"><div class="lg"><span class="on">● ONLINE</span><span class="mk logo" style="display:inline-flex;margin-bottom:10px">' + logoMark() + '</span><br><b>ERA CMS</b><small>EKSPEDISI RISET AKUATIK</small></div>' +
        '<div class="rolesw" aria-label="Peran"><span class="' + (adm ? 'on' : '') + '">Admin</span><span class="' + (!adm ? 'on' : '') + '">Member</span></div>' +
        '<h5>Core Workspace</h5><a class="it" href="#/app" data-k="dash">' + icon('grid') + (adm ? 'Console Desk' : 'My Workspace') + '</a>' +
        (adm ? '<a class="it" href="#/app/queue" data-k="queue">' + icon('clip') + 'Approvals<span class="n" id="bq" hidden></span></a>' : '<a class="it" href="#/app/revisions" data-k="rev">' + icon('hist') + 'Revisions<span class="n o" id="br" hidden></span></a>') +
        '<h5>Content &amp; Collections</h5>' + ent + admOnly +
        '<h5>Governance &amp; Ops</h5>' + (adm ? '<a class="it" href="#/app/inquiries" data-k="inq">' + icon('inbox') + 'Inquiries<span class="n" id="bi" hidden></span></a>' : '') +
        '<a class="it" href="#/app/files" data-k="files">' + icon('folder') + 'File Manager</a><a class="it" href="#/app/pdf" data-k="pdf">' + icon('file') + 'PDF Generator</a><a class="it" href="#/app/stats" data-k="stats">' + icon('bar') + 'Reports &amp; Stats</a>' +
        (adm ? '<a class="it" href="#/app/users" data-k="users">' + icon('users') + 'Users</a><a class="it" href="#/app/audit" data-k="audit">' + icon('hist') + 'Audit Logs</a><a class="it" href="#/app/settings" data-k="settings">' + icon('cog') + 'Settings</a>' : '') +
        '<div class="ft"><a class="it" href="#/" style="padding:6px 0">' + icon('globe', 's16') + ' Lihat situs publik</a><button class="btn btn-w btn-sm btn-block" data-act="logout" style="margin-top:8px">' + icon('logout', 's16') + ' End Session</button></div></aside>' +
        '<div><div class="ctop"><button class="btn btn-o btn-ic" id="sbt" aria-label="Menu" style="display:none">' + icon('menu') + '</button><div class="crumbs" id="crumbs"></div><div class="right row"><button class="btn btn-o btn-ic" data-theme-ic data-act="theme" aria-label="Ganti tema">' + icon(Theme.get() === 'dark' ? 'sun' : 'moon') + '</button><a class="btn btn-o btn-ic" href="' + (adm ? '#/app/queue' : '#/app/revisions') + '" aria-label="Notifikasi" style="position:relative">' + icon('bell') + '<span class="n" id="bell" hidden style="position:absolute;top:-4px;right:-4px;background:#DC2626;color:#fff;border-radius:99px;font:700 10px var(--f-sans);padding:1px 6px"></span></a>' +
        '<div style="text-align:right;line-height:1.25"><b class="sm">' + esc(me.nama || me.email) + '</b><div class="xs muted">' + (me.darurat ? 'Akses Darurat' : esc(me.title || (adm ? 'Administrator' : 'Member'))) + '</div></div></div></div><main class="cmain" id="cmain" tabindex="-1"></main></div></div>';
      this.bindAdmin();
    }
    this.bindOnce();
    $$('.side a.it').forEach(a => a.classList.toggle('on', a.dataset.k === active));
    $('#crumbs').innerHTML = 'ERA / <b>' + esc((crumbs || 'Panel')) + '</b>';
    $('#side').classList.remove('open');
    this.refreshBadges();
    return this.fresh('cmain');
  },
  bindAdmin() {
    const mq = matchMedia('(max-width:980px)'), sync = () => { const b = $('#sbt'); if (b) b.style.display = mq.matches ? 'inline-flex' : 'none'; };
    sync(); if (mq.addEventListener) mq.addEventListener('change', sync);
    $('#sbt').onclick = () => $('#side').classList.toggle('open');
  },
  _rb: 0,
  async refreshBadges(force) {
    if (!force && Date.now() - this._rb < 12000) return; this._rb = Date.now();
    if (Router.cur.path === '/app') return;     // dashboard memuat data yang sama dan memanggil applyBadges sendiri
    try { this.applyBadges(await API.call('dash.get', {})); } catch (e) { }
  },
  applyBadges(d) {
    ERA.S.dash = d; this._rb = Date.now();
    const set = (id, n) => { const el = $('#' + id); if (el) { el.textContent = n; el.hidden = !n; } };
    if (d.role === 'admin') { set('bq', d.queueCounts.submitted); set('bi', d.kpi.inquiriesNew); set('bell', d.queueCounts.submitted + d.kpi.inquiriesNew); }
    else { set('br', d.counts.returned); set('bell', d.counts.returned); }
  }
};

/* ---------- komponen halaman publik ---------- */
function pageBanner(o) {
  return '<section class="hero banner" style="padding-bottom:56px"><div class="wrap"><div class="crumb"><a href="#/">Portal Root</a> / ' + (o.crumbs || []).map(c => c[1] ? '<a href="#' + c[1] + '">' + esc(c[0]) + '</a>' : '<b>' + esc(c[0]) + '</b>').join(' / ') + '</div>' +
    '<div class="eyebrow" style="color:#53dad1;margin-top:18px">' + esc(o.eyebrow || '') + '</div><h1>' + esc(o.title) + '</h1>' + (o.sub ? '<p>' + esc(o.sub) + '</p>' : '') + (o.extra || '') + '</div>' + waveSvg() + '</section>';
}
function subnav(menu, sub) {
  return '<nav class="subnav" aria-label="Submenu"><div class="wrap">' + menu.subs.map((s, i) => '<a href="#' + menu.path + '/' + s[0] + '" class="' + (s[0] === sub ? 'on' : '') + '" ' + (s[0] === sub ? 'aria-current="page"' : '') + '><span class="n">' + String(i + 1).padStart(2, '0') + '</span>' + esc(s[1]) + '</a>').join('') + '</div></nav>';
}
function menuOf(k) { return Shell.menu.filter(m => m.k === k)[0]; }
function bindPager(root, fn) { root.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b && !b.disabled) fn(Number(b.dataset.p)); }); }

/* ---------- form publik/umum ---------- */
function fld(label, name, o) {
  o = o || {};
  const id = 'f_' + name, req = o.req ? ' required' : '', ph = o.ph ? ' placeholder="' + esc(o.ph) + '"' : '';
  let ctl;
  if (o.type === 'select') ctl = '<select class="inp" id="' + id + '" name="' + name + '"' + req + '><option value="">' + esc(o.ph || 'Pilih…') + '</option>' + (o.opts || []).map(x => { const v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return '<option value="' + esc(v) + '"' + (String(o.val) === String(v) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>';
  else if (o.type === 'textarea') ctl = '<textarea class="inp" id="' + id + '" name="' + name + '" rows="' + (o.rows || 5) + '"' + req + ph + (o.max ? ' maxlength="' + o.max + '"' : '') + '>' + esc(o.val || '') + '</textarea>';
  else ctl = '<input class="inp" id="' + id + '" name="' + name + '" type="' + (o.type || 'text') + '"' + req + ph + ' value="' + esc(o.val || '') + '"' + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.autocomplete ? ' autocomplete="' + o.autocomplete + '"' : '') + '>';
  return '<div class="' + (o.full ? 'full' : '') + '"><label class="f" for="' + id + '">' + esc(label) + (o.req ? ' <span class="req" aria-hidden="true">*</span>' : '') + '</label>' + ctl + (o.help ? '<div class="help">' + esc(o.help) + '</div>' : '') + '</div>';
}
function readFileB64(file, maxBytes) {
  return new Promise((res, rej) => {
    if (maxBytes && file.size > maxBytes) return rej(new Error('Ukuran berkas maksimal ' + Math.round(maxBytes / 1048576) + ' MB.'));
    const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(new Error('Gagal membaca berkas.')); r.readAsDataURL(file);
  });
}
function downloadText(name, text, mime) { const b = new Blob([text], { type: mime || 'text/plain;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
function downloadB64(name, mime, b64) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([u], { type: mime })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }

/* ---------- peta (Leaflet) ---------- */
const MapKit = {
  ok() { return typeof L !== 'undefined'; },
  with(el, o, cb) {   // muat Leaflet hanya saat dibutuhkan (tidak menahan tampil pertama)
    if (!el) return;
    Libs.load('leaflet').then(() => { if (!el.isConnected) return; const m = MapKit.create(el, o); if (m) cb(m); })
      .catch(e => { el.innerHTML = '<div class="empty">' + icon('globe', 's32') + '<p>' + esc(e.message) + '</p></div>'; });
  },
  create(el, o) {
    o = o || {}; if (el._m) { try { el._m.remove(); } catch (e) { } }
    if (!this.ok()) { el.innerHTML = '<div class="empty">' + icon('globe', 's32') + '<p>Library peta belum termuat. Muat ulang halaman.</p></div>'; return null; }
    const m = L.map(el, { center: o.center || [-2.2, 120.8], zoom: o.zoom || 7, scrollWheelZoom: o.wheel !== false, attributionControl: true });
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' });
    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, attribution: 'Tiles © Esri' });
    osm.addTo(m); m._b = { osm: osm, sat: sat, cur: 'osm' }; el._m = m;
    Router.cleanup(() => { try { m.remove(); } catch (e) { } });
    setTimeout(() => m.invalidateSize(), 200); return m;
  },
  base(m, k) { if (!m || m._b.cur === k) return; m.removeLayer(m._b[m._b.cur]); m._b[k].addTo(m); m._b.cur = k; },
  dot(lat, lng, color, r) { return L.circleMarker([lat, lng], { radius: r || 8, color: '#fff', weight: 2, fillColor: color, fillOpacity: .95 }); },
  fit(m, pts) { if (!m || !pts.length) return; if (pts.length === 1) m.setView(pts[0], 11); else m.fitBounds(L.latLngBounds(pts).pad(.2)); }
};

/* ---------- grafik (Chart.js) ---------- */
const Charts = {
  pal: ['#0B2D4D', '#20B8B0', '#145B78', '#8CC7E0', '#E8D8B0', '#7995BB', '#53dad1', '#F59E0B'],
  make(canvas, cfg) {   // Chart.js dimuat malas; pemanggil tidak memakai nilai kembaliannya
    if (!canvas) return null;
    Libs.load('chart').then(() => { if (canvas.isConnected) Charts._make(canvas, cfg); }).catch(() => { if (canvas.parentNode) canvas.parentNode.innerHTML = '<div class="empty">Grafik tidak dapat dimuat.</div>'; });
    return null;
  },
  _make(canvas, cfg) {
    const cs = getComputedStyle(document.documentElement);
    Chart.defaults.color = cs.getPropertyValue('--muted').trim() || '#5B7083'; Chart.defaults.font.family = 'Inter, sans-serif'; Chart.defaults.borderColor = cs.getPropertyValue('--border').trim() || '#DCE6EC';
    cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false }, cfg.options || {});
    const c = new Chart(canvas, cfg); Router.cleanup(() => { try { c.destroy(); } catch (e) { } }); return c;
  }
};
