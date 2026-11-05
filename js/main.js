'use strict';
/* ERA Portal — main.js : boot instan • daftar rute • prefetch • penanganan galat global */
(function () {
  const R = (p, h, o) => Router.on(p, h, o);
  const redirect = to => () => Router.go(to, true);
  const A = { auth: true }, AD = { auth: true, admin: true };

  // ---- publik ----
  R('/', (p, q, T) => Pages.home(p, q, T));
  [['about', 'who'], ['research', 'all'], ['expeditions', 'overview'], ['database', 'fish'], ['conservation', 'all'], ['publications', 'all'], ['news', 'all'], ['gallery', 'all'], ['collaboration', 'overview'], ['knowledge', 'all'], ['contact', 'info']].forEach(m => {
    R('/' + m[0], redirect('/' + m[0] + '/' + m[1]));
    R('/' + m[0] + '/:sub', (p, q, T) => Pages[m[0]](p, q, T));
  });
  R('/view/:entity/:id', (p, q, T) => Pages.detail(p, q, T));
  R('/search', (p, q, T) => Pages.search(p, q, T));
  R('/login', (p, q, T) => Pages.login(p, q, T));

  // ---- CMS ----
  R('/app', (p, q, T) => Pages.dash(p, q, T), A);
  R('/app/content/:entity', (p, q, T) => Pages.content(p, q, T), A);
  R('/app/new/:entity', (p, q, T) => Pages.edit(p, q, T), A);
  R('/app/edit/:entity/:id', (p, q, T) => Pages.edit(p, q, T), A);
  R('/app/review/:entity/:id', (p, q, T) => Pages.review(p, q, T), AD);
  R('/app/queue', (p, q, T) => Pages.queue(p, q, T), AD);
  R('/app/revisions', (p, q, T) => Pages.revisions(p, q, T), A);
  R('/app/inquiries', (p, q, T) => Pages.inquiries(p, q, T), AD);
  R('/app/files', (p, q, T) => Pages.files(p, q, T), A);
  R('/app/pdf', (p, q, T) => Pages.pdf(p, q, T), A);
  R('/app/stats', (p, q, T) => Pages.stats(p, q, T), A);
  R('/app/users', (p, q, T) => Pages.users(p, q, T), AD);
  R('/app/audit', (p, q, T) => Pages.audit(p, q, T), AD);
  R('/app/settings', (p, q, T) => Pages.settings(p, q, T), AD);
  Router.notFound = {
    opt: {}, handler: async () => {
      const adm = Auth.on && /^\/app/.test(Router.cur.path), main = adm ? Shell.admin('', 'Tidak ditemukan') : Shell.public('');
      main.innerHTML = '<section class="sec"><div class="wrap">' + Views.empty('Halaman tidak ditemukan', 'Alamat yang Anda tuju tidak tersedia.', '<a class="btn btn-p" href="' + (adm ? '#/app' : '#/') + '">Kembali</a>', 'compass') + '</div></section>';
    }
  };

  // ---- galat global ----
  let lastErr = 0;
  const report = m => { if (Date.now() - lastErr > 4000) { lastErr = Date.now(); toast('Terjadi kendala tak terduga. Muat ulang halaman jika berlanjut.', 'err'); } console.error(m); };
  window.addEventListener('error', e => report(e.message));
  window.addEventListener('unhandledrejection', e => report(e.reason && e.reason.message));

  // ---- boot instan: aplikasi TIDAK menunggu server untuk tampil ----
  const verCmp = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true });
  function currentSchema() {
    const emb = window.ERA_SCHEMA; let st = null;
    try { st = JSON.parse(localStorage.getItem('era.schema') || 'null'); } catch (e) { }
    return st && st.entities && verCmp(st.ver, emb.ver) > 0 ? st : emb;
  }
  const placeholder = schema => ({ loading: true, app: {}, schema: schema, settings: {}, org: {}, demo: false, schemaVer: schema.ver, stats: { research: 0, expeditions: 0, publications: 0, species: 0, specimens: 0, locations: 0, conservation: 0, news: 0, endemic: 0 }, home: { research: [], expeditions: [], species: [], locations: [], news: [], publications: [], events: [] } });
  const needsBoot = p => p === '/' || /^\/(about|contact)(\/|$)/.test(p);

  async function fetchSchema() {
    try { const s = await API.pub('pub.schema'); try { localStorage.setItem('era.schema', JSON.stringify(s)); } catch (e) { } ERA.S.boot.schema = s; Shell.type = ''; Router.run(); } catch (e) { }
  }
  function applyBoot(d) {
    const schema = ERA.S.boot.schema;
    if (d.schemaVer && d.schemaVer !== schema.ver && !ERA.S._sf) { ERA.S._sf = 1; fetchSchema(); }
    const sig = JSON.stringify(d);
    if (sig === ERA.S.bootSig && !ERA.S.boot.loading) return;                  // data sama dengan yang sudah tampil → tidak render ulang
    ERA.S.bootSig = sig; d.schema = schema; ERA.S.boot = d;
    const fav = document.querySelector('link[rel=icon]'); if (fav && logoUrl() !== fav.href) fav.href = logoUrl();
    const path = Router.cur.path;
    if (/^\/(login|app)/.test(path)) return;
    Shell.updateChrome();
    if (needsBoot(path)) Router.run();
  }
  async function boot() {
    Auth.load();
    if (!API.ready()) { $('#app').innerHTML = Views.setup(); return; }
    const schema = currentSchema(); let cached = null;
    try { cached = JSON.parse(localStorage.getItem('era.c.pub.boot.') || 'null'); } catch (e) { }
    if (cached && cached.d && cached.d.stats) { ERA.S.boot = Object.assign({}, cached.d, { schema: schema }); ERA.S.bootSig = JSON.stringify(cached.d); }   // kunjungan ulang: data langsung tampil
    else ERA.S.boot = placeholder(schema);
    Router.run();                                                             // tampil SEKARANG (kerangka + skeleton) — data menyusul
    try {
      await API.swr('pub.boot', {}, d => applyBoot(d), 120);
    } catch (e) {
      ERA.S.boot.loading = false; ERA.S.boot.error = e.message; if (needsBoot(Router.cur.path)) Router.run();
    }
    if (Auth.on || localStorage.getItem('era.seenlogin')) (window.requestIdleCallback || (f => setTimeout(f, 2500)))(() => loadGIS().catch(() => { }));
  }
  ERA.retryBoot = () => { ERA.S.boot.error = ''; ERA.S.boot.loading = true; Router.run(); API.swr('pub.boot', {}, d => applyBoot(d), 1).catch(e => { ERA.S.boot.loading = false; ERA.S.boot.error = e.message; Router.run(); }); };

  // ---- prefetch saat niat terlihat (hover / sentuh) → klik berikutnya terasa instan ----
  const PF = {
    '/research/all': () => ['pub.list', { entity: 'research', page: 1, size: 9 }],
    '/database/fish': () => ['pub.list', { entity: 'species', page: 1, size: 12, order: 'az', f_organismGroup: 'Ikan Air Tawar' }],
    '/database/map': () => ['pub.map', {}],
    '/news/all': () => ['pub.list', { entity: 'news', page: 1, size: 8 }],
    '/publications/all': () => ['pub.list', { entity: 'publications', page: 1, size: 8 }],
    '/gallery/all': () => ['pub.list', { entity: 'gallery', page: 1, size: 18 }],
    '/expeditions/overview': () => ['pub.list', { entity: 'expeditions', size: 30 }],
    '/conservation/all': () => ['pub.list', { entity: 'conservation', page: 1, size: 9 }],
    '/knowledge/all': () => ['pub.list', { entity: 'knowledge', page: 1, size: 9 }]
  };
  let pt;
  const intent = delay => e => {
    const a = e.target.closest && e.target.closest('a[href^="#/"]'); if (!a) return;
    clearTimeout(pt); pt = setTimeout(() => { const f = PF[a.getAttribute('href').slice(1)]; if (f) { const c = f(); API.prefetch(c[0], c[1]); } }, delay);
  };
  document.addEventListener('mouseover', intent(140), { passive: true });
  document.addEventListener('touchstart', intent(0), { passive: true });

  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
