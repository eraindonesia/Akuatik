'use strict';
/* ERA Portal — main.js : boot • daftar rute • penanganan galat global */
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
      if (!ERA.S.boot) return;
      const main = Auth.on && /^\/app/.test(Router.cur.path) ? Shell.admin('', 'Tidak ditemukan') : Shell.public('');
      main.innerHTML = '<section class="sec"><div class="wrap">' + Views.empty('Halaman tidak ditemukan', 'Alamat yang Anda tuju tidak tersedia.', '<a class="btn btn-p" href="' + (Auth.on && /^\/app/.test(Router.cur.path) ? '#/app' : '#/') + '">Kembali</a>', 'compass') + '</div></section>';
    }
  };

  // ---- galat global ----
  let lastErr = 0;
  const report = m => { if (Date.now() - lastErr > 4000) { lastErr = Date.now(); toast('Terjadi kendala tak terduga. Muat ulang halaman jika berlanjut.', 'err'); } console.error(m); };
  window.addEventListener('error', e => report(e.message));
  window.addEventListener('unhandledrejection', e => report(e.reason && e.reason.message));

  // ---- boot ----
  let started = false;
  function splash(msg) { $('#app').innerHTML = '<div style="min-height:100vh;display:grid;place-items:center;text-align:center;padding:24px"><div><div class="brand" style="justify-content:center;margin-bottom:18px"><span class="mk logo">' + logoMark() + '</span></div>' + (msg || '<div class="sk" style="width:220px;height:12px;margin:auto"></div><p class="muted sm" style="margin-top:14px">Memuat portal…</p>') + '</div></div>'; }
  async function boot() {
    Auth.load();
    splash();
    if (!API.ready()) { $('#app').innerHTML = Views.setup(); return; }
    try {
      await API.swr('pub.boot', {}, (d, cached) => {
        ERA.S.boot = d;
        const fav = document.querySelector('link[rel=icon]'); if (fav) fav.href = logoUrl();
        if (!started) { started = true; Router.run(); }
        else if (!cached && Shell.type === 'public' && Router.cur.path === '/') { Shell.type = ''; Router.run(); }
      }, 120);
    } catch (e) {
      splash('<h2>Tidak dapat memuat portal</h2><p class="muted" style="max-width:46ch">' + esc(e.message) + '</p><button class="btn btn-p" onclick="location.reload()">Muat ulang</button>');
    }
  }
  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
