'use strict';
/* ERA Portal — public.js : halaman publik (bagian 1) */
const Pages = {};
const MENU_OF = { research: 'research', expeditions: 'expeditions', locations: 'expeditions', species: 'database', specimens: 'database', distribution: 'database', conservation: 'conservation', publications: 'publications', news: 'news', events: 'news', knowledge: 'knowledge', gallery: 'gallery' };
const SCH = () => ERA.S.boot.schema.entities;
const OPTS = () => ERA.S.boot.schema.opt;
const locOptions = () => (ERA.S.boot.home.locations || []).map(l => [l.id, l.name]);
const viewLink = (e, id) => '#/view/' + e + '/' + encodeURIComponent(id);
function subFrom(menuKey, sub) { const m = menuOf(menuKey); return (m.subs.filter(s => s[0] === sub)[0]) || m.subs[0]; }
function optFor(list, sub) { return list.filter(x => slug(x) === sub)[0] || ''; }
function lead(t) { return '<p class="muted" style="max-width:70ch">' + esc(t) + '</p>'; }
function secHead(eyebrow, title, right) { return '<div class="sec-h"><div><div class="eyebrow">' + esc(eyebrow) + '</div><h2 style="margin:6px 0 0">' + esc(title) + '</h2></div>' + (right || '') + '</div>'; }
function metaRow(items) { const x = items.filter(Boolean); return x.length ? '<div class="meta">' + x.join('') + '</div>' : ''; }
const mI = (ic, t) => t ? '<span>' + icon(ic, 's16') + esc(t) + '</span>' : '';
function pageErr(host, e) { host.innerHTML = '<div class="empty">' + icon('alert', 's32') + '<h3>Gagal memuat</h3><p>' + esc(e.message) + '</p><button class="btn btn-p btn-sm" onclick="Router.run()">Coba lagi</button></div>'; }
function mkEl(html) { const d = document.createElement('div'); d.innerHTML = html; return d; }
function tabsHtml(list, cur) { return '<div class="tabs" role="tablist">' + list.map(t => '<button role="tab" data-tab="' + t[0] + '" class="' + (t[0] === cur ? 'on' : '') + '" aria-selected="' + (t[0] === cur) + '">' + esc(t[1]) + '</button>').join('') + '</div>'; }
function bindTabs(root) {
  root.addEventListener('click', e => {
    const b = e.target.closest('.tabs [data-tab]'); if (!b) return;
    $$('.tabs [data-tab]', root).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
    $$('[data-pane]', root).forEach(p => p.classList.toggle('hide', p.dataset.pane !== b.dataset.tab));
    if (b.dataset.tab === 'map' && root._onMap) root._onMap();
  });
}

/* ---------- kartu per entitas ---------- */
const Cards = {
  research: r => `<a class="card" href="${viewLink('research', r.id)}"><div class="card-i">${img(r.coverUrl, r.title, r.id, 'wave')}<div class="tagpos"><span class="badge b-navy">${esc(r.field)}</span>${statusBadge(r.researchStatus)}</div></div><div class="card-b"><h3>${esc(r.title)}</h3><p class="muted sm clamp">${esc(r.snippet || '')}</p>${metaRow([mI('pin', r.locationName), mI('cal', r.startDate ? fmtDate(r.startDate) : '')])}</div></a>`,
  expeditions: r => `<a class="card" href="${viewLink('expeditions', r.id)}"><div class="card-i">${img(r.coverUrl, r.name, r.id, 'pin')}<div class="tagpos"><span class="badge b-navy">${esc(r.type)}</span>${statusBadge(r.expStatus)}</div></div><div class="card-b"><h3>${esc(r.name)}</h3><p class="muted sm clamp">${esc(r.snippet || '')}</p>${metaRow([mI('pin', r.locationName), mI('cal', fmtDate(r.startDate) + (r.endDate ? ' – ' + fmtDate(r.endDate) : ''))])}</div></a>`,
  species: r => `<a class="card" href="${viewLink('species', r.id)}"><div class="card-i" style="aspect-ratio:4/3">${img(r.photoUrl, r.scientificName, r.id, 'fish')}<div class="tagpos"><span>${iucnBadge(r.iucn)}</span>${endemicBadge(r)}</div></div><div class="card-b"><div class="mono xs muted">${esc(r.id)} · ${esc(r.family || '')}</div><h3 class="it" style="margin-top:6px">${esc(r.scientificName)}</h3><div class="muted sm">${esc(r.localName || '—')}</div><div class="meta" style="margin-top:10px"><span class="badge">${esc(r.organismGroup || '')}</span>${mI('pin', String(r.ecosystemTags || '').split(',')[0])}${mI('layers', r.depthRange)}</div></div></a>`,
  conservation: r => `<a class="card" href="${viewLink('conservation', r.id)}"><div class="card-i">${img(r.coverUrl, r.program, r.id, 'wave')}<div class="tagpos"><span class="badge b-navy">${esc(r.category)}</span>${statusBadge(r.progStatus)}</div></div><div class="card-b"><h3>${esc(r.program)}</h3><p class="muted sm clamp">${esc(r.snippet || '')}</p>${metaRow([mI('pin', r.locationName), mI('cal', r.period)])}</div></a>`,
  news: r => `<a class="card" href="${viewLink('news', r.id)}"><div class="card-i">${img(r.coverUrl, r.title, r.id, 'wave')}<div class="tagpos"><span class="badge b-navy">${esc(r.category)}</span></div></div><div class="card-b"><div class="meta" style="margin-bottom:6px">${mI('cal', fmtDate(r.publishDate || r.publishedAt))}${mI('clock', r.readMin ? r.readMin + ' min read' : '')}</div><h3>${esc(r.title)}</h3><p class="muted sm clamp">${esc(r.excerpt || r.snippet || '')}</p></div></a>`,
  knowledge: r => `<a class="card" href="${viewLink('knowledge', r.id)}"><div class="card-i">${img(r.coverUrl, r.title, r.id, 'doc')}<div class="tagpos"><span class="badge b-navy">${esc(r.format || 'Article')}</span><span class="badge">${esc(r.level || '')}</span></div></div><div class="card-b"><div class="eyebrow" style="margin-bottom:6px">${esc(r.topic)}</div><h3>${esc(r.title)}</h3><p class="muted sm clamp">${esc(r.summary || r.snippet || '')}</p></div></a>`,
  locations: r => `<a class="card" href="${viewLink('locations', r.id)}"><div class="card-i">${img(r.coverUrl, r.name, r.id, 'pin')}<div class="tagpos"><span class="badge b-navy">${esc(r.ecosystem)}</span></div></div><div class="card-b"><h3>${esc(r.name)}</h3><div class="mono xs muted">${esc(coord(r.latitude, 'N', 'S'))} · ${esc(coord(r.longitude, 'E', 'W'))}</div><p class="muted sm clamp" style="margin-top:8px">${esc(r.snippet || '')}</p>${metaRow([mI('layers', r.depthMax ? 'Kedalaman maks. ' + r.depthMax + ' m' : ''), mI('globe', r.region)])}</div></a>`
};
function pubRow(r) {
  const open = (validUrl(r.fileUrl) ? r.fileUrl : '') || (validUrl(r.link) ? r.link : ''), cite = `${r.authors} (${r.year}). ${r.title}.${r.journal ? ' ' + r.journal + '.' : ''}${r.doi ? ' https://doi.org/' + String(r.doi).replace(/^https?:\/\/doi.org\//, '') : ''}`;
  return `<article class="card pub-row" style="display:grid;grid-template-columns:96px 1fr auto;gap:20px;padding:18px;align-items:start"><div style="width:96px;aspect-ratio:3/4;border-radius:10px;overflow:hidden;border:1px solid var(--border)">${img(r.coverUrl, r.title, r.id, 'doc')}</div><div><div class="row" style="gap:8px;margin-bottom:6px"><span class="badge b-navy">${esc(r.pubType)}</span><span class="mono xs muted">${esc(r.year)}</span>${r.accessType === 'open' ? '<span class="badge b-solid">Open Access</span>' : ''}</div><h3 style="font-size:19px;margin:0 0 4px">${esc(r.title)}</h3><div class="muted sm">${esc(r.authors)}${r.journal ? ' · <i>' + esc(r.journal) + '</i>' : ''}</div><p class="muted sm clamp" style="margin:8px 0 0">${esc(r.snippet || '')}</p>${r.doi ? `<div class="mono xs" style="margin-top:8px">DOI: ${esc(r.doi)}</div>` : ''}</div><div class="col" style="min-width:150px"><button class="btn btn-o btn-sm" data-abs="${esc(r.id)}">${icon('eye', 's16')} Abstract</button>${open ? `<a class="btn btn-p btn-sm" href="${esc(open)}" target="_blank" rel="noopener noreferrer">${icon(validUrl(r.fileUrl) ? 'download' : 'ext', 's16')} ${validUrl(r.fileUrl) ? 'Unduh PDF' : 'Tautan'}</a>` : ''}<button class="btn btn-o btn-sm" data-cite="${esc(cite)}">${icon('copy', 's16')} Sitasi</button></div></article>`;
}

/* ---------- Listing generik: filter + grid + pager + SWR ---------- */
function Listing(host, o) {
  const st = { page: 1, q: '', f: {} };
  let seq = 0;
  const fl = o.filters || [];
  host.innerHTML = (fl.length ? `<div class="filters" id="lf" style="grid-template-columns:${fl.map(f => f.type === 'search' ? '2fr' : '1fr').join(' ')} auto"><button type="button" class="btn btn-o filt-toggle" id="lft" aria-expanded="false">${icon('filter', 's16')} Filter lanjutan</button>` +
    fl.map(f => f.type === 'search' ? `<div><label class="f" for="lf_${f.name}">${esc(f.label || 'Cari')}</label><div class="inp-ic">${icon('search')}<input class="inp" id="lf_${f.name}" data-n="${f.name}" type="search" placeholder="${esc(f.ph || 'Kata kunci…')}"></div></div>`
      : `<div class="f-extra"><label class="f" for="lf_${f.name}">${esc(f.label)}</label><select class="inp" id="lf_${f.name}" data-n="${f.name}"><option value="">Semua</option>${(f.opts || []).map(x => { const v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return `<option value="${esc(v)}">${esc(l)}</option>`; }).join('')}</select></div>`).join('') +
    `<button class="btn btn-o" id="lreset" type="button">Reset</button></div>` : '') + '<div id="lr"></div>';
  const R = $('#lr', host);
  async function run() {
    const my = ++seq, p = Object.assign({ entity: o.entity, page: st.page, size: o.size || 12 }, o.base || {});
    if (st.q) p.q = st.q;
    Object.keys(st.f).forEach(k => { if (st.f[k]) p['f_' + k] = st.f[k]; });
    R.innerHTML = Views.loading(o.skel || 6, o.cols || 'g3');
    try {
      await API.swr('pub.list', p, d => {
        if (my !== seq || !host.isConnected) return;
        if (o.after) o.after(d);
        const rows = o.render ? null : d.rows;
        R.innerHTML = (o.render ? o.render(d) : (d.rows.length ? `<div class="grid ${o.cols || 'g3'}">${d.rows.map(o.card).join('')}</div>` : '')) +
          (d.rows.length ? pager(d.total, d.page, d.size) : Views.empty(o.emptyTitle || 'Tidak ada data yang cocok', o.emptyMsg || 'Ubah kata kunci atau filter pencarian Anda.', '<button class="btn btn-o btn-sm" id="lreset2">Reset filter</button>'));
        const rs = $('#lreset2', R); if (rs) rs.onclick = reset;
        if (o.bind) o.bind(R, d);
      });
    } catch (e) { if (my === seq) pageErr(R, e); }
  }
  function reset() { st.q = ''; st.f = {}; st.page = 1; $$('#lf [data-n]', host).forEach(i => { i.value = ''; }); run(); }
  if (fl.length) {
    const lf = $('#lf', host);
    lf.addEventListener('input', debounce(e => { const n = e.target.dataset.n; if (!n) return; if (e.target.type === 'search') { st.q = e.target.value.trim(); st.page = 1; run(); } }, 350));
    lf.addEventListener('change', e => { const n = e.target.dataset.n; if (!n || e.target.type === 'search') return; st.f[n] = e.target.value; st.page = 1; run(); });
    $('#lreset', host).onclick = reset;
    const ft = $('#lft', host); if (ft) ft.onclick = () => { const o = lf.classList.toggle('open'); ft.setAttribute('aria-expanded', o); };
  }
  bindPager(R, p => { st.page = p; run(); window.scrollTo({ top: Math.max(0, host.getBoundingClientRect().top + scrollY - 140), behavior: 'smooth' }); });
  run();
  return { run, reset, st };
}

/* ---------- Beranda ---------- */
Pages.home = function () {
  const B = ERA.S.boot, H = B.home, st = B.stats, org = B.org || {}, ld = !!B.loading;
  const main = Shell.public('home');
  if (B.error) { main.innerHTML = '<div class="wrap sec"><div class="empty">' + icon('alert', 's32') + '<h3>Tidak dapat memuat data portal</h3><p>' + esc(B.error) + '</p><button class="btn btn-p" onclick="ERA.retryBoot()">' + icon('refresh', 's16') + ' Coba lagi</button></div></div>'; return; }
  const base = u => String(u).split('?')[0].split('/').pop().replace(/\.[a-z0-9]+$/i, '').toLowerCase();
  const isLogo = u => base(u) === base(logoUrl()) || /logo/.test(base(u));
  const heroImg = validUrl(setting('HERO_IMAGE')) && !isLogo(setting('HERO_IMAGE')) ? setting('HERO_IMAGE') : '';   // logo bukan foto hero
  const intro = String(org.who || '').split(/\n\s*\n/)[0];
  const locs = H.locations || [];
  main.innerHTML = `
  <section class="hero ${heroImg ? 'img' : ''}" ${heroImg ? `style="background-image:url('${esc(heroImg)}');background-size:cover;background-position:center"` : ''}>
    <div class="wrap hero-main"><div class="eyebrow" style="color:#53dad1"><span class="mono">PORTAL RISET LIMNOLOGI // DANAU PURBA SULAWESI</span></div>
      <h1 style="margin-top:14px">${esc(setting('HERO_TITLE', 'Exploring and Protecting Freshwater Life'))}</h1>
      <p class="lead">${esc(setting('HERO_SUBTITLE', 'Lembaga riset independen untuk eksplorasi limnologi, konservasi spesies purba endemik, dan pemetaan keanekaragaman hayati ekosistem perairan darat Indonesia.'))}</p>
      <div class="row" style="margin-top:28px"><a class="btn btn-a" href="#/research/all">${icon('flask', 's16')} Jelajahi Penelitian</a><a class="btn btn-w" href="#/collaboration/expedition">${icon('compass', 's16')} Bergabung dalam Ekspedisi</a></div>
      <div class="row mono xs" style="margin-top:28px;color:#9FC0DA;gap:20px"><span>${icon('drop', 's16')} Ancient lakes &amp; pristine rivers</span><span>${icon('globe', 's16')} Open limnology network</span></div></div>${waveSvg()}</section>
  <div class="wrap"><div class="stats" role="list">
    ${[['flask', st.research, 'Penelitian Lapangan'], ['pin', st.locations, 'Danau, Sungai & Stasiun'], ['book', st.publications, 'Publikasi & Monograf'], ['fish', st.species, 'Spesies Terdokumentasi']].map(s => `<div class="stat" role="listitem"><div class="ico">${icon(s[0], 's24')}</div><div><b data-count="${ld ? 0 : s[1]}">${ld ? '—' : fmtNum(s[1])}</b><span>${s[2]}</span></div></div>`).join('')}</div></div>
  <section class="sec"><div class="wrap split" style="grid-template-columns:1.1fr 1fr">
    <div><div class="eyebrow">Tentang Kami // Lembaga Riset Independen</div><h2 style="margin-top:8px">Mendedikasikan Sains untuk Masa Depan Perairan Tawar Nusantara</h2>${ld ? Views.lines(3) : `<p class="muted prose" style="font-size:16px;line-height:28px">${esc(intro)}</p>`}<a class="btn btn-o" href="#/about/who">Kenali Kami Lebih Dekat ${icon('arrowR', 's16')}</a></div>
    <div class="col">${[['drop', 'Ekosistem Danau Purba', 'Observasi stratifikasi, endemisme, dan sejarah geologi Kompleks Danau Malili dan Poso.', '/research/ancient-lake-research'], ['fish', 'Konservasi Spesies Endemik', 'Dokumentasi populasi dan perlindungan habitat ikan, keong, dan udang endemik.', '/conservation/all'], ['act', 'Pemantauan Kualitas Air', 'Pemantauan fisika-kimia dan biogeokimia perairan darat secara berkala.', '/research/water-quality-research']].map(c => `<a class="card hov" href="#${c[3]}" style="display:flex;gap:16px;padding:18px"><div class="stat"><div class="ico" style="width:46px;height:46px">${icon(c[0], 's24')}</div></div><div><h3 style="font-size:17px;margin:0 0 4px">${c[1]}</h3><p class="muted sm" style="margin:0">${c[2]}</p></div></a>`).join('')}</div></div></section>
  <section class="sec alt"><div class="wrap">${secHead('Aktivitas Lapangan', 'Misi Eksplorasi Ilmiah Terbaru', '<a class="btn btn-o btn-sm" href="#/expeditions/overview">Lihat Semua Ekspedisi ' + icon('arrowR', 's16') + '</a>')}
    ${ld ? Views.loading(3) : H.expeditions.length ? `<div class="grid g3">${H.expeditions.map(Cards.expeditions).join('')}</div>` : Views.empty('Belum ada ekspedisi', 'Ekspedisi yang diterbitkan akan muncul di sini.')}</div></section>
  <section class="sec"><div class="wrap">${secHead('Taksonomi & Keanekaragaman', 'Sorotan Spesies Purba Endemik Nusantara', '<div class="row"><button class="btn btn-o btn-ic" data-car="-1" aria-label="Sebelumnya">' + icon('chevL') + '</button><button class="btn btn-o btn-ic" data-car="1" aria-label="Berikutnya">' + icon('chevR') + '</button><a class="btn btn-o btn-sm" href="#/database/fish">Buka Katalog</a></div>')}
    ${ld ? Views.loading(4, 'g4') : H.species.length ? `<div class="car" id="car">${H.species.map(Cards.species).join('')}</div>` : Views.empty('Belum ada spesies', 'Katalog spesies akan muncul di sini.')}</div></section>
  <section class="sec alt"><div class="wrap">${secHead('Observasi & Stasiun', 'Pusat Observasi Limnologi dan Laboratorium Lapangan')}
    <div class="grid" style="grid-template-columns:1.4fr 1fr;gap:28px"><div class="map" id="homemap" style="height:440px" role="img" aria-label="Peta lokasi riset"></div>
    <div class="col">${ld ? Views.lines(4) : locs.slice(0, 5).map(l => `<a class="card hov" href="${viewLink('locations', l.id)}" style="padding:16px"><div class="row sp"><b>${esc(l.name)}</b><span class="badge ${l.kind === 'station' ? 'b-solid' : ''}">${esc(l.kind === 'station' ? 'Stasiun' : l.ecosystem)}</span></div><div class="mono xs muted" style="margin-top:6px">${esc(coord(l.latitude, 'N', 'S'))} · ${esc(coord(l.longitude, 'E', 'W'))}</div></a>`).join('') || Views.empty('Belum ada lokasi')}<a class="btn btn-o" href="#/expeditions/locations">Semua lokasi riset ${icon('arrowR', 's16')}</a></div></div></div></section>
  <section class="sec"><div class="wrap">${secHead('Diseminasi Ilmiah', 'Disparitas Ilmiah & Catatan Ekspedisi', '<a class="btn btn-o btn-sm" href="#/news/all">Arsip Warta ' + icon('arrowR', 's16') + '</a>')}
    ${ld ? Views.loading(2, 'g2') : H.news.length ? `<div class="grid" style="grid-template-columns:1.4fr 1fr;gap:28px"><a class="card hov" href="${viewLink('news', H.news[0].id)}"><div class="card-i" style="aspect-ratio:16/9">${img(H.news[0].coverUrl, H.news[0].title, H.news[0].id, 'wave')}<div class="tagpos"><span class="badge b-navy">${esc(H.news[0].category)}</span></div></div><div class="card-b"><div class="meta">${mI('cal', fmtDate(H.news[0].publishDate))}${mI('clock', (H.news[0].readMin || 4) + ' min read')}</div><h3 style="font-size:24px;line-height:32px;-webkit-line-clamp:3">${esc(H.news[0].title)}</h3><p class="muted clamp">${esc(H.news[0].excerpt || '')}</p></div></a>
    <div class="col">${H.news.slice(1).map(n => `<a class="card hov" href="${viewLink('news', n.id)}" style="display:flex;gap:16px;padding:14px"><div class="date-b">${esc(fmtDate(n.publishDate).split(' ').slice(0, 2).join(' '))}</div><div><span class="badge" style="margin-bottom:6px">${esc(n.category)}</span><h3 style="font-size:16px;line-height:22px;margin:4px 0 0">${esc(n.title)}</h3></div></a>`).join('')}</div></div>` : Views.empty('Belum ada berita', 'Berita yang diterbitkan akan muncul di sini.')}</div></section>
  <section class="sec" style="padding-top:0"><div class="wrap"><div class="cta"><div class="eyebrow" style="justify-content:center;color:#53dad1">Kolaborasi Terbuka</div><h2 style="margin-top:10px">Bermitra dan Berkontribusi dalam Riset Keanekaragaman Hayati Akuatik</h2><p>ERA membuka ruang kolaborasi bagi universitas, peneliti independen, lembaga konservasi, dan relawan sains yang ingin bergabung dalam eksplorasi perairan darat Indonesia.</p><div class="row" style="justify-content:center"><a class="btn btn-a" href="#/collaboration/overview">Ajukan Kolaborasi Riset</a><a class="btn btn-w" href="#/collaboration/expedition">Unduh Buku Panduan</a></div></div></div></section>`;
  // peta
  MapKit.with($('#homemap'), { wheel: false }, m => { const pts = []; locs.forEach(l => { if (isFinite(l.latitude)) { const p = [l.latitude, l.longitude]; pts.push(p); MapKit.dot(p[0], p[1], l.kind === 'station' ? '#20B8B0' : '#0B2D4D', 9).addTo(m).bindPopup(`<b>${esc(l.name)}</b><br><span class="muted">${esc(l.ecosystem)}</span><br><a href="${viewLink('locations', l.id)}">Detail lokasi →</a>`); } }); MapKit.fit(m, pts); });
  const car = $('#car'); $$('[data-car]', main).forEach(b => b.onclick = () => car && car.scrollBy({ left: Number(b.dataset.car) * 300, behavior: 'smooth' }));
  $$('[data-count]', main).forEach(el => { const n = Number(el.dataset.count); if (n < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return; let i = 0; const step = Math.max(1, Math.ceil(n / 24)), t = setInterval(() => { i = Math.min(n, i + step); el.textContent = fmtNum(i); if (i >= n) clearInterval(t); }, 28); Router.cleanup(() => clearInterval(t)); });
};

/* ---------- About ---------- */
Pages.about = async function (p, q, T) {
  const sub = p.sub || 'who', M = menuOf('about'), cur = subFrom('about', sub), org = ERA.S.boot.org || {};
  const main = Shell.public('about'); const paras = t => String(t || '').split(/\n\s*\n/).map(x => `<p>${esc(x)}</p>`).join('');
  main.innerHTML = pageBanner({ crumbs: [['About', '/about/who'], [cur[1]]], eyebrow: 'Profil Kelembagaan', title: cur[1], sub: sub === 'who' ? 'Lembaga riset independen eksplorasi limnologi dan konservasi perairan darat.' : '' }) + subnav(M, sub) + '<section class="sec"><div class="wrap" id="ab"></div></section>';
  const host = $('#ab');
  if (sub === 'who' || sub === 'background') {
    host.innerHTML = `<div class="split" style="grid-template-columns:1.4fr 1fr"><div class="prose">${paras(org[sub === 'who' ? 'who' : 'background'] || 'Konten belum diisi.')}</div><div class="card" style="aspect-ratio:4/3">${art('about-' + sub, 'wave')}</div></div>`;
  } else if (sub === 'vision') {
    host.innerHTML = `<div class="card pad hl" style="margin-bottom:32px"><div class="eyebrow">Visi</div><div class="quote" style="font-size:24px;line-height:36px">${esc(org.vision || '—')}</div></div><h2>Misi</h2><div class="grid g2">${lines(org.mission).map((m, i) => `<div class="card pad" style="display:flex;gap:16px"><span class="badge b-solid" style="height:28px;min-width:28px;justify-content:center">${i + 1}</span><div>${esc(m)}</div></div>`).join('')}</div>`;
  } else if (sub === 'objectives') {
    host.innerHTML = `<div class="grid g3">${lines(org.objectives).map((l, i) => { const [t, d] = l.split('|'); return `<div class="card pad"><div class="stat" style="padding:0;border:0;margin-bottom:12px"><div class="ico">${icon(['book', 'db', 'leaf', 'users', 'handshake', 'shield'][i % 6], 's24')}</div></div><h3>${esc(t)}</h3><p class="muted" style="margin:0">${esc(d || '')}</p></div>`; }).join('')}</div>`;
  } else if (sub === 'structure') {
    const lv = {}; lines(org.structure).forEach(l => { const [n, name, role] = l.split('|'); (lv[n] = lv[n] || []).push({ name, role }); });
    host.innerHTML = '<div class="org">' + Object.keys(lv).sort().map((k, i) => `<div class="org-r ${i === 0 ? 'top' : ''}">${lv[k].map(b => `<div class="org-b ${i === 0 ? 'lead' : ''}"><b>${esc(b.name)}</b><small>${esc(b.role || '')}</small></div>`).join('')}</div>`).join('') + '</div>';
  } else if (sub === 'team' || sub === 'partners') {
    host.innerHTML = Views.loading(8, 'g4');
    try {
      await API.swr('pub.list', { entity: sub, size: 60 }, d => {
        if (!T.ok()) return;
        if (sub === 'team') {
          host.innerHTML = `<div class="row" style="margin-bottom:24px" id="tf">${['All'].concat(OPTS().teamRole).map((r, i) => `<button class="chip ${i ? '' : 'on'}" data-r="${i ? r : ''}">${r}</button>`).join('')}</div><div class="grid g4" id="tg"></div>`;
          const draw = r => { $('#tg').innerHTML = d.rows.filter(x => !r || x.role === r).map(x => `<div class="card pad team"><div class="ph">${img(x.photoUrl, x.name, x.id, 'wave')}</div><h3 style="font-size:17px;margin-bottom:2px">${esc(x.name)}</h3><div class="muted sm">${esc(x.position)}</div><div style="margin-top:10px"><span class="badge ${x.role === 'Admin' ? 'b-navy' : ''}">${esc(x.role || 'Member')}</span></div><div class="xs muted mono" style="margin-top:8px">${esc(x.period || '')}</div></div>`).join('') || Views.empty('Belum ada anggota tim'); };
          draw(''); $('#tf').onclick = e => { const b = e.target.closest('[data-r]'); if (!b) return; $$('#tf .chip').forEach(c => c.classList.toggle('on', c === b)); draw(b.dataset.r); };
        } else {
          host.innerHTML = `<div class="row" style="margin-bottom:24px" id="pf">${['All'].concat(OPTS().partnerType).map((r, i) => `<button class="chip ${i ? '' : 'on'}" data-r="${i ? r : ''}">${r}</button>`).join('')}</div><div class="grid g4" id="pg"></div>`;
          const draw = r => { $('#pg').innerHTML = d.rows.filter(x => !r || x.partnerType === r).map(x => `<button class="card hov" data-pid="${esc(x.id)}" style="text-align:left;cursor:pointer;font:inherit;color:inherit;border:1px solid var(--border)"><div class="logo-box">${x.logoUrl ? img(x.logoUrl, x.name, x.id) : `<span>${esc(x.name)}</span>`}</div><div class="card-b" style="border-top:1px solid var(--border)"><span class="badge">${esc(x.partnerType)}</span></div></button>`).join('') || Views.empty('Belum ada mitra'); };
          draw(''); $('#pf').onclick = e => { const b = e.target.closest('[data-r]'); if (!b) return; $$('#pf .chip').forEach(c => c.classList.toggle('on', c === b)); draw(b.dataset.r); };
          host.onclick = e => { const b = e.target.closest('[data-pid]'); if (!b) return; const x = d.rows.filter(r => r.id === b.dataset.pid)[0]; Modal.open({ title: x.name, body: `<span class="badge">${esc(x.partnerType)}</span><p style="margin-top:12px">${esc(x.description || '')}</p>`, footer: validUrl(x.link) ? `<a class="btn btn-p" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">Kunjungi Situs ${icon('ext', 's16')}</a>` : '' }); };
        }
      });
    } catch (e) { pageErr(host, e); }
  }
};

/* ---------- Research ---------- */
Pages.research = function (p) {
  const sub = p.sub || 'all', M = menuOf('research'), cur = subFrom('research', sub), field = optFor(OPTS().researchField, sub);
  const main = Shell.public('research');
  main.innerHTML = pageBanner({ crumbs: [['Research', '/research/all'], [cur[1]]], eyebrow: 'Penelitian Ilmiah', title: field || 'Penelitian Limnologi & Biodiversitas Akuatik', sub: 'Proyek riset aktif dan arsip hasil penelitian ekosistem perairan darat.' }) + subnav(M, sub) + '<section class="sec"><div class="wrap" id="lst"></div></section>';
  Listing($('#lst'), { entity: 'research', card: Cards.research, base: field ? { f_field: field } : {}, size: 9, filters: [{ name: 'q', type: 'search', ph: 'Judul, ringkasan, kata kunci…' }, { name: 'researchStatus', label: 'Status', opts: [['ongoing', 'Ongoing'], ['completed', 'Completed'], ['planned', 'Planned']] }, { name: 'locationId', label: 'Lokasi', opts: locOptions() }] });
};

/* ---------- Expeditions ---------- */
Pages.expeditions = async function (p, q, T) {
  const sub = p.sub || 'overview', M = menuOf('expeditions'), cur = subFrom('expeditions', sub);
  const main = Shell.public('expeditions');
  main.innerHTML = pageBanner({ crumbs: [['Expeditions', '/expeditions/overview'], [cur[1]]], eyebrow: 'Ekspedisi Lapangan', title: cur[1], sub: 'Misi eksplorasi danau, sungai, dan keanekaragaman hayati perairan darat.' }) + subnav(M, sub) + '<section class="sec"><div class="wrap" id="lst"></div></section>';
  const host = $('#lst'), type = { lake: 'Lake', river: 'River', biodiversity: 'Biodiversity' }[sub];
  if (type) Listing(host, { entity: 'expeditions', card: Cards.expeditions, base: { f_type: type }, size: 9, filters: [{ name: 'q', type: 'search' }, { name: 'expStatus', label: 'Status', opts: [['planned', 'Planned'], ['ongoing', 'Ongoing'], ['completed', 'Completed']] }, { name: 'locationId', label: 'Lokasi', opts: locOptions() }] });
  else if (sub === 'overview') {
    host.innerHTML = `<div class="grid g3" style="margin-bottom:48px">${[['Lake', 'lake', 'Survei danau purba, sedimen, dan kolom air.', 'drop'], ['River', 'river', 'Biodiversitas aliran sungai dan kualitas air.', 'wave'], ['Biodiversity', 'biodiversity', 'Inventarisasi spesies dan koleksi spesimen.', 'fish']].map(t => `<a class="card hov hero" href="#/expeditions/${t[1]}" style="padding:28px;min-height:190px;color:#fff"><div class="stat" style="border:0;padding:0;color:#53dad1">${icon(t[3], 's32')}</div><h3 style="color:#fff;margin-top:14px">${t[0]} Expeditions</h3><p style="color:#C7D9E9;margin:0">${t[2]}</p></a>`).join('')}</div><h2>Linimasa Ekspedisi</h2><div id="tl">${Views.lines(5)}</div>`;
    try { await API.swr('pub.list', { entity: 'expeditions', size: 30 }, d => { if (!T.ok()) return; $('#tl').innerHTML = d.rows.length ? `<div class="timeline">${d.rows.map(r => `<a class="tl card hov" href="${viewLink('expeditions', r.id)}" style="padding:18px;display:block"><div class="row sp"><div><div class="mono xs muted">${fmtDate(r.startDate)}${r.endDate ? ' → ' + fmtDate(r.endDate) : ''}</div><h3 style="margin:4px 0">${esc(r.name)}</h3><div class="meta">${mI('pin', r.locationName)}<span class="badge">${esc(r.type)}</span>${statusBadge(r.expStatus)}</div></div><span class="btn btn-o btn-sm">Detail ${icon('arrowR', 's16')}</span></div><p class="muted sm clamp" style="margin:8px 0 0">${esc(r.snippet || '')}</p></a>`).join('')}</div>` : Views.empty('Belum ada ekspedisi'); }); } catch (e) { pageErr($('#tl'), e); }
  } else if (sub === 'locations') {
    host.innerHTML = `<div class="map" id="lmap" style="height:420px;margin-bottom:32px"></div><div id="ll">${Views.loading(6)}</div>`;
    try { await API.swr('pub.list', { entity: 'locations', size: 60 }, d => { if (!T.ok()) return; $('#ll').innerHTML = `<div class="grid g3">${d.rows.map(Cards.locations).join('')}</div>`; MapKit.with($('#lmap'), { wheel: false }, m => { const pts = []; d.rows.forEach(l => { if (isFinite(l.latitude)) { pts.push([l.latitude, l.longitude]); MapKit.dot(l.latitude, l.longitude, l.kind === 'station' ? '#20B8B0' : '#0B2D4D', 9).addTo(m).bindPopup(`<b>${esc(l.name)}</b><br><a href="${viewLink('locations', l.id)}">Detail →</a>`); } }); MapKit.fit(m, pts); }); }); } catch (e) { pageErr($('#ll'), e); }
  } else if (sub === 'reports') {
    host.innerHTML = `<div id="rp">${Views.lines(5)}</div>`;
    try {
      const [a, b] = await Promise.all([API.pub('pub.list', { entity: 'expeditions', size: 60 }), API.pub('pub.list', { entity: 'publications', size: 30, f_pubType: 'Expedition Report' })]);
      if (!T.ok()) return;
      const withRep = a.rows.filter(r => validUrl(r.reportUrl));
      $('#rp').innerHTML = (withRep.length ? `<div class="grid g3" style="margin-bottom:32px">${withRep.map(r => `<div class="card pad"><span class="badge b-navy">${esc(r.type)}</span><h3 style="margin-top:10px">${esc(r.name)}</h3><div class="meta" style="margin-bottom:14px">${mI('cal', fmtDate(r.startDate))}</div><a class="btn btn-p btn-sm" href="${esc(r.reportUrl)}" target="_blank" rel="noopener noreferrer">${icon('download', 's16')} Unduh Laporan</a></div>`).join('')}</div>` : '') + (b.rows.length ? `<h2>Laporan Ekspedisi (Publikasi)</h2><div class="col">${b.rows.map(pubRow).join('')}</div>` : '') || Views.empty('Belum ada laporan ekspedisi', 'Laporan yang dipublikasikan akan tampil di sini.', '', 'file');
      bindPubActions($('#rp'), b.rows);
    } catch (e) { pageErr($('#rp'), e); }
  } else if (sub === 'documentation') {
    host.innerHTML = '<div id="gl"></div>';
    Gallery($('#gl'), { 'f_category': 'Expedition Photography' });
  }
};

/* ---------- Conservation ---------- */
Pages.conservation = function (p) {
  const sub = p.sub || 'all', M = menuOf('conservation'), cur = subFrom('conservation', sub), cat = optFor(OPTS().consCat, sub);
  const main = Shell.public('conservation');
  main.innerHTML = pageBanner({ crumbs: [['Conservation', '/conservation/all'], [cur[1]]], eyebrow: 'Konservasi & Perlindungan Habitat', title: cat || 'Konservasi & Perlindungan Habitat Danau Purba', sub: 'Inisiatif pemulihan habitat, suaka perairan, pengendalian spesies invasif, dan ko-manajemen berbasis masyarakat.' }) + subnav(M, sub) +
    '<section class="sec"><div class="wrap"><div class="grid g4" id="cst" style="margin-bottom:36px"></div><div id="lst"></div></div></section><section class="sec" style="padding-top:0"><div class="wrap"><div class="cta"><h2>Dukung dan Berkolaborasi dalam Konservasi Danau Purba Nusantara</h2><p>Setiap peran — pendonor, peneliti, relawan, atau pemangku kebijakan — membantu menjaga kelestarian taksa endemik dan habitatnya.</p><div class="row" style="justify-content:center"><a class="btn btn-a" href="#/collaboration/sponsorship">Dukung Program</a><a class="btn btn-w" href="#/collaboration/volunteer">Jadi Relawan</a></div></div></div></section>';
  Listing($('#lst'), { entity: 'conservation', card: Cards.conservation, base: cat ? { f_category: cat } : {}, size: 9, filters: [{ name: 'q', type: 'search' }, { name: 'progStatus', label: 'Status', opts: [['active', 'Active'], ['completed', 'Completed'], ['planned', 'Planned']] }, { name: 'locationId', label: 'Lokasi', opts: locOptions() }],
    after: d => { const f = d.facets.category || {}, tot = Object.values(f).reduce((a, b) => a + b, 0); $('#cst').innerHTML = [['Program Terdaftar', tot, 'leaf'], ['Kategori Program', Object.keys(f).length, 'layers'], ['Lokasi Riset', ERA.S.boot.stats.locations, 'pin'], ['Spesies Dilindungi', ERA.S.boot.stats.endemic, 'fish']].map(s => `<div class="card pad row" style="flex-wrap:nowrap"><div class="stat" style="padding:0;border:0"><div class="ico">${icon(s[2], 's24')}</div></div><div><b class="big-num" style="font-size:30px">${fmtNum(s[1])}</b><div class="mono xs muted">${s[0].toUpperCase()}</div></div></div>`).join(''); } });
};

/* ---------- Publications ---------- */
function bindPubActions(root, getRows) {
  root.addEventListener('click', e => {
    const rows = typeof getRows === 'function' ? getRows() : getRows;
    const a = e.target.closest('[data-abs]'), c = e.target.closest('[data-cite]');
    if (c) { navigator.clipboard && navigator.clipboard.writeText(c.dataset.cite).then(() => toast('Sitasi disalin ke clipboard.')).catch(() => toast('Salin manual: ' + c.dataset.cite, 'warn')); }
    if (a) { const r = rows.filter(x => x.id === a.dataset.abs)[0]; if (!r) return; API.pub('pub.get', { entity: 'publications', id: r.id }).then(d => { const x = d.row; Modal.open({ size: 'lg', title: x.title, body: `<div class="row" style="margin-bottom:10px"><span class="badge b-navy">${esc(x.pubType)}</span><span class="mono xs muted">${esc(x.year)}</span></div><p class="muted">${esc(x.authors)}</p><div class="prose" style="font-size:16px;line-height:27px">${md(x.abstract || 'Abstrak belum tersedia.')}</div>${x.keywords ? `<div class="row" style="margin-top:12px">${String(x.keywords).split(',').map(k => `<span class="badge">${esc(k.trim())}</span>`).join('')}</div>` : ''}`, footer: (validUrl(x.fileUrl) || validUrl(x.link)) ? `<a class="btn btn-p" href="${esc(validUrl(x.fileUrl) ? x.fileUrl : x.link)}" target="_blank" rel="noopener noreferrer">${icon('download', 's16')} Buka Dokumen</a>` : '' }); }).catch(err => toast(err.message, 'err')); }
  });
}
Pages.publications = function (p) {
  const sub = p.sub || 'all', M = menuOf('publications'), cur = subFrom('publications', sub), typ = optFor(OPTS().pubType, sub);
  const main = Shell.public('publications');
  main.innerHTML = pageBanner({ crumbs: [['Publications', '/publications/all'], [cur[1]]], eyebrow: 'Repositori Publikasi & Monograf Ilmiah', title: typ || 'Publikasi Ilmiah, Laporan Ekspedisi & Policy Briefs', sub: 'Literatur terbuka hasil ekspedisi limnologi, biogeografi perairan darat, taksonomi molekuler, dan kebijakan perlindungan habitat.' }) + subnav(M, sub) +
    '<section class="sec" style="padding-top:36px"><div class="wrap"><div class="grid g4" id="pst" style="margin-bottom:28px"></div><div id="lst"></div></div></section>';
  let rowsRef = [];
  Listing($('#lst'), { entity: 'publications', base: typ ? { f_pubType: typ } : {}, size: 8, cols: '', filters: [{ name: 'q', type: 'search', ph: 'Judul, penulis, kata kunci, DOI…' }, { name: 'year', label: 'Tahun', opts: Array.from({ length: 8 }, (_, i) => String(new Date().getFullYear() - i)) }, { name: 'accessType', label: 'Akses', opts: [['open', 'Open Access'], ['restricted', 'Restricted']] }],
    render: d => { rowsRef = d.rows; return d.rows.length ? '<div class="col">' + d.rows.map(pubRow).join('') + '</div>' : ''; },
    after: d => { const f = d.facets.pubType || {}, tot = Object.values(f).reduce((a, b) => a + b, 0); $('#pst').innerHTML = [['Total Terindeks', tot, 'book'], ['Artikel Ilmiah', f['Scientific Article'] || 0, 'file'], ['Laporan', (f['Research Report'] || 0) + (f['Expedition Report'] || 0), 'clip'], ['Policy Brief', f['Policy Brief'] || 0, 'shield']].map(s => `<div class="card pad row" style="flex-wrap:nowrap"><div class="stat" style="padding:0;border:0"><div class="ico">${icon(s[2], 's24')}</div></div><div><b class="big-num" style="font-size:28px">${fmtNum(s[1])}</b><div class="mono xs muted">${s[0].toUpperCase()}</div></div></div>`).join(''); },
    bind: R => { if (!R._pb) { R._pb = 1; bindPubActions(R, () => rowsRef); } } });
};

/* ---------- News ---------- */
Pages.news = function (p) {
  const sub = p.sub || 'all', M = menuOf('news'), cur = subFrom('news', sub), cat = optFor(OPTS().newsCat, sub);
  const main = Shell.public('news');
  main.innerHTML = pageBanner({ crumbs: [['News', '/news/all'], [cur[1]]], eyebrow: 'Diseminasi Sains Ekspedisi & Rilis Ilmiah', title: cat || 'Warta Ekspedisi, Temuan Taksonomi & Ekologi Perairan', sub: 'Catatan lapangan naratif, rilis spesies baru, laporan hidrologi danau purba, dan dokumentasi aksi konservasi.' }) + subnav(M, sub) +
    '<section class="sec"><div class="wrap split" style="grid-template-columns:minmax(0,1fr) 300px"><div id="lst"></div><aside class="col" id="side"></aside></div></section>';
  const H = ERA.S.boot.home;
  $('#side').innerHTML = `<div class="card pad"><h3 style="font-size:16px">Kategori</h3><div class="col" style="gap:4px" id="cats"></div></div><div class="card pad"><h3 style="font-size:16px">Agenda Mendatang</h3>${(H.events || []).length ? H.events.map(e => `<a href="${viewLink('events', e.id)}" style="display:flex;gap:12px;padding:8px 0;color:inherit"><div class="date-b">${esc(fmtDate(e.eventDate).split(' ').slice(0, 2).join(' '))}</div><div><b class="sm">${esc(e.name)}</b><div class="xs muted">${esc(e.locationName || '')}</div></div></a>`).join('') : '<p class="muted sm">Belum ada agenda.</p>'}</div>`;
  Listing($('#lst'), { entity: 'news', card: Cards.news, base: cat ? { f_category: cat } : {}, size: 8, cols: 'g2', filters: [{ name: 'q', type: 'search', ph: 'Cari artikel, nama spesies…' }],
    after: d => { const f = d.facets.category || {}; $('#cats').innerHTML = `<a href="#/news/all" class="sm">Semua (${Object.values(f).reduce((a, b) => a + b, 0)})</a>` + Object.keys(f).map(k => `<a href="#/news/${slug(k)}" class="sm" style="padding:4px 0">${esc(k)} <span class="muted">(${f[k]})</span></a>`).join(''); } });
};

/* ---------- Gallery ---------- */
function Gallery(host, base) {
  Listing(host, { entity: 'gallery', base: base || {}, size: 18, cols: '', filters: [{ name: 'q', type: 'search', ph: 'Cari judul, keterangan…' }],
    render: d => d.rows.length ? `<div class="gal">${d.rows.map((r, i) => `<figure tabindex="0" role="button" data-gi="${i}" aria-label="${esc(r.title)}" style="--ar:${[4 / 3, 1, 3 / 4, 16 / 10][hash(r.id) % 4]}">${img(r.fileUrl, r.title, r.id, r.mediaType === 'video' ? 'wave' : 'fish')}${r.mediaType === 'video' ? `<div class="play"><span>${icon('play')}</span></div>` : ''}<figcaption><b>${esc(r.title)}</b><div class="xs">${esc(r.credit || '')}${r.locationName ? ' · ' + esc(r.locationName) : ''}</div></figcaption></figure>`).join('')}</div>` : '',
    bind: (R, d) => {
      const open = i => {
        const r = d.rows[i]; if (!r) return;
        const lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
        const draw = j => { const x = d.rows[j]; const e2 = x.mediaType === 'video' ? ytEmbed(x.videoUrl) : ''; lb.innerHTML = `<button class="btn btn-w btn-ic" data-c style="position:absolute;top:16px;right:16px" aria-label="Tutup">${icon('x')}</button><button class="nv" data-n="-1" style="left:16px" aria-label="Sebelumnya">${icon('chevL')}</button><button class="nv" data-n="1" style="right:16px" aria-label="Berikutnya">${icon('chevR')}</button><div style="max-width:92vw;text-align:center">${e2 ? `<iframe src="${esc(e2)}" style="width:min(900px,90vw);aspect-ratio:16/9;border:0;border-radius:10px" allowfullscreen title="${esc(x.title)}"></iframe>` : `<div style="max-width:88vw;max-height:78vh;overflow:hidden;border-radius:8px;display:inline-block">${img(x.fileUrl, x.title, x.id, 'wave').replace('class="art"', 'class="art" style="width:min(900px,86vw);height:auto;aspect-ratio:16/10"')}</div>`}<div class="cap"><b>${esc(x.title)}</b><div class="sm">${esc(x.caption || '')}</div><div class="xs">${esc(x.credit || '')} ${x.takenDate ? '· ' + fmtDate(x.takenDate) : ''}</div></div></div>`; lb._j = j; };
        draw(i);
        lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('[data-c]')) { lb.remove(); document.removeEventListener('keydown', kk); } const n = e.target.closest('[data-n]'); if (n) draw((lb._j + Number(n.dataset.n) + d.rows.length) % d.rows.length); });
        const kk = e => { if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', kk); } if (e.key === 'ArrowRight') draw((lb._j + 1) % d.rows.length); if (e.key === 'ArrowLeft') draw((lb._j - 1 + d.rows.length) % d.rows.length); };
        document.addEventListener('keydown', kk); $('#modal-root').appendChild(lb);
      };
      R.onclick = e => { const f = e.target.closest('[data-gi]'); if (f) open(Number(f.dataset.gi)); };
      R.onkeydown = e => { if (e.key === 'Enter') { const f = e.target.closest('[data-gi]'); if (f) open(Number(f.dataset.gi)); } };
    } });
}
Pages.gallery = function (p) {
  const sub = p.sub || 'all', M = menuOf('gallery'), cur = subFrom('gallery', sub), cat = optFor(OPTS().galCat, sub);
  const main = Shell.public('gallery');
  main.innerHTML = pageBanner({ crumbs: [['Gallery', '/gallery/all'], [cur[1]]], eyebrow: 'Koleksi Dokumentasi Visual', title: cat || 'Dokumentasi Visual Ekspedisi, Biodiversitas & Rekaman Planet', sub: 'Arsip fotografi ekspedisi, makrofotografi spesimen, aktivitas laboratorium lapangan, dan video ekspedisi.' }) + subnav(M, sub) + '<section class="sec"><div class="wrap" id="lst"></div></section>';
  Gallery($('#lst'), cat ? { f_category: cat } : {});
};

/* ---------- Knowledge Hub ---------- */
Pages.knowledge = function (p) {
  const sub = p.sub || 'all', M = menuOf('knowledge'), cur = subFrom('knowledge', sub), top = optFor(OPTS().knowTopic, sub);
  const main = Shell.public('knowledge');
  main.innerHTML = pageBanner({ crumbs: [['Knowledge', '/knowledge/all'], [cur[1]]], eyebrow: 'Pusat Edukasi Limnologi & Danau Purba Nusantara', title: top || 'Aquatic Knowledge Hub', sub: 'Pengetahuan limnologi, biodiversitas akuatik, dan konservasi untuk publik, pendidik, dan mahasiswa.' }) + subnav(M, sub) +
    '<section class="sec"><div class="wrap">' + (!top ? `<div class="grid g3" style="margin-bottom:48px">${OPTS().knowTopic.map((t, i) => `<a class="card hov pad" href="#/knowledge/${slug(t)}"><div class="stat" style="padding:0;border:0;margin-bottom:12px"><div class="ico">${icon(['drop', 'fish', 'wave', 'leaf', 'book', 'file'][i], 's24')}</div></div><div class="mono xs muted">TRACK ${String(i + 1).padStart(2, '0')}</div><h3 style="margin:6px 0 0">${esc(t)}</h3></a>`).join('')}</div>` : '') + '<div id="lst"></div></div></section>';
  Listing($('#lst'), { entity: 'knowledge', card: Cards.knowledge, base: top ? { f_topic: top } : {}, size: 9, filters: [{ name: 'q', type: 'search' }, { name: 'level', label: 'Level', opts: OPTS().knowLevel }, { name: 'format', label: 'Format', opts: OPTS().knowFormat }] });
};

/* ---------- Detail (publik & pratinjau CMS) ---------- */
function dwc(entity, r) {
  if (entity === 'species') return { '@context': 'http://rs.tdwg.org/dwc/terms/', basisOfRecord: 'PreservedSpecimen', taxonID: r.taxonId || r.id, scientificName: r.scientificName, scientificNameAuthorship: r.authority || '', vernacularName: r.localName || '', kingdom: r.kingdom || '', phylum: r.phylum || '', class: r.className || '', order: r.orderName || '', family: r.family || '', genus: r.genus || '', taxonRemarks: r.organismGroup || '', threatStatus: r.iucn || '', establishmentMeans: r.endemic === 'yes' ? 'native (endemic)' : 'native', habitat: r.habitat || '', verbatimDepth: r.depthRange || '' };
  if (entity === 'specimens') return { '@context': 'http://rs.tdwg.org/dwc/terms/', basisOfRecord: 'PreservedSpecimen', occurrenceID: r.code || r.id, scientificName: r.speciesName, typeStatus: r.typeStatus || '', recordedBy: r.collector || '', eventDate: r.collectionDate || '', locality: r.locationName || '', decimalLatitude: r.latitude === '' ? null : r.latitude, decimalLongitude: r.longitude === '' ? null : r.longitude, geodeticDatum: 'WGS84', minimumDepthInMeters: r.depth === '' ? null : r.depth, preparations: r.preservation || '', occurrenceRemarks: r.notes || '' };
  const o = {}; Object.keys(r).forEach(k => { if (['createdBy', 'seed', 'reviewNote', 'reviewedBy'].indexOf(k) < 0) o[k] = r[k]; }); return o;
}
function speciesMap(host, row, dist) {
  MapKit.with(host, { wheel: false, zoom: 9 }, m => {
  const pts = []; dist.forEach(d => { if (isFinite(d.latitude) && d.latitude !== '') { pts.push([d.latitude, d.longitude]); MapKit.dot(d.latitude, d.longitude, '#20B8B0', 8).addTo(m).bindPopup(`<b class="it">${esc(row.scientificName)}</b><br>${esc(d.locationName || '')}<br><span class="mono xs">${esc(coord(d.latitude, 'N', 'S'))} ${esc(coord(d.longitude, 'E', 'W'))}</span>${d.depth !== '' ? '<br>Kedalaman: ' + esc(d.depth) + ' m' : ''}`); } });
  MapKit.fit(m, pts); setTimeout(() => m.invalidateSize(), 250); });
}
function detailHtml(entity, r, x) {
  x = x || {};
  const bar = (t, right) => `<div class="row sp" style="margin-bottom:6px"><span class="eyebrow">${t}</span>${right || ''}</div>`;
  const dl = (u, label) => validUrl(u) ? `<a class="btn btn-p btn-sm" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${icon('download', 's16')} ${label || 'Unduh'}</a>` : '';
  if (entity === 'research') return `<div class="split"><div>${bar('Ringkasan')}<div class="prose"><p style="font-size:19px;line-height:30px">${esc(r.summary)}</p>${r.content ? md(r.content) : ''}${r.methods ? '<h2>Metode</h2>' + md(r.methods) : ''}${r.findings ? '<h2>Temuan Utama</h2>' + md(r.findings) : ''}</div></div>
    <aside class="col"><div class="card pad"><h3 style="font-size:16px">Informasi Riset</h3><div class="kv"><div>Bidang</div><div>${esc(r.field || '')}</div><div>Status</div><div>${statusBadge(r.researchStatus) || '—'}</div><div>Periode</div><div>${esc(fmtDate(r.startDate) || '—')}${r.endDate ? ' – ' + esc(fmtDate(r.endDate)) : ''}</div><div>Lokasi</div><div>${esc(r.locationName || '—')}</div></div></div>
    ${r.researchers ? `<div class="card pad"><h3 style="font-size:16px">Tim Peneliti</h3>${String(r.researchers).split(',').map(n => `<div class="row" style="margin:6px 0"><span class="badge" style="width:30px;height:30px;justify-content:center">${esc(n.trim()[0] || '?')}</span>${esc(n.trim())}</div>`).join('')}</div>` : ''}
    ${x.location && isFinite(x.location.latitude) ? `<div class="card"><div class="map" id="dmap" style="height:220px;border:0"></div><div class="card-b"><b>${esc(x.location.name)}</b><div class="mono xs muted">${esc(coord(x.location.latitude, 'N', 'S'))} · ${esc(coord(x.location.longitude, 'E', 'W'))}</div></div></div>` : ''}
    ${dl(r.docUrl, 'Unduh Laporan / Dokumen')}${(x.related || []).length ? `<div class="card pad"><h3 style="font-size:16px">Ekspedisi Terkait</h3>${x.related.map(e => `<a href="${viewLink('expeditions', e.id)}" class="sm" style="display:block;padding:6px 0">${esc(e.name)}</a>`).join('')}</div>` : ''}</aside></div>`;
  if (entity === 'expeditions') {
    const gal = lines(r.galleryUrls).filter(validUrl);
    return `<div id="dt" class="wm">${tabsHtml([['ov', 'Overview'], ['ob', 'Objectives'], ['tm', 'Team'], ['map', 'Route Map'], ['rp', 'Report'], ['ph', 'Photos']], 'ov')}
    <div data-pane="ov"><div class="split"><div class="prose"><p style="font-size:19px;line-height:30px">${esc(r.summary)}</p>${md(r.content)}</div><div class="card pad"><div class="kv"><div>Tipe</div><div>${esc(r.type)}</div><div>Status</div><div>${statusBadge(r.expStatus) || '—'}</div><div>Mulai</div><div>${esc(fmtDate(r.startDate, 1))}</div><div>Selesai</div><div>${esc(fmtDate(r.endDate, 1) || '—')}</div><div>Lokasi</div><div>${esc(r.locationName || '—')}</div><div>Tim</div><div>${esc(r.teamMembers || '—')}</div></div></div></div></div>
    <div data-pane="ob" class="hide">${lines(r.objectives).length ? `<div class="col">${lines(r.objectives).map(o => `<div class="card pad row" style="flex-wrap:nowrap">${icon('checkC')}<span>${esc(o)}</span></div>`).join('')}</div>` : Views.empty('Tujuan belum diisi')}</div>
    <div data-pane="tm" class="hide"><p>${esc(r.teamMembers || 'Informasi tim belum tersedia.')}</p></div>
    <div data-pane="map" class="hide">${x.location && isFinite(x.location.latitude) ? `<div class="map" id="dmap" style="height:420px"></div>` : Views.empty('Koordinat lokasi belum tersedia', '', '', 'pin')}</div>
    <div data-pane="rp" class="hide">${validUrl(r.reportUrl) ? `<div class="card pad row sp"><div class="row">${icon('file', 's32')}<div><b>Laporan Ekspedisi</b><div class="muted sm">${esc(r.name)}</div></div></div>${dl(r.reportUrl, 'Unduh PDF')}</div>` : Views.empty('Laporan belum tersedia', '', '', 'file')}</div>
    <div data-pane="ph" class="hide">${gal.length ? `<div class="grid g3">${gal.map((g, i) => `<div class="card">${img(g, r.name + ' ' + (i + 1), r.id + i)}</div>`).join('')}</div>` : Views.empty('Dokumentasi foto belum tersedia', '', '', 'image')}</div></div>`;
  }
  if (entity === 'conservation') return `<div class="split"><div class="prose"><p style="font-size:19px;line-height:30px">${esc(r.summary)}</p>${r.objective ? '<h2>Tujuan</h2>' + md(r.objective) : ''}${lines(r.outcomes).length ? '<h2>Capaian & Luaran</h2><div class="col">' + lines(r.outcomes).map(o => `<div class="row" style="flex-wrap:nowrap;align-items:flex-start;color:var(--text)">${icon('checkC')}<span>${esc(o)}</span></div>`).join('') + '</div>' : ''}</div>
    <aside class="col"><div class="card pad"><div class="kv"><div>Kategori</div><div>${esc(r.category)}</div><div>Status</div><div>${statusBadge(r.progStatus) || '—'}</div><div>Periode</div><div>${esc(r.period || '—')}</div><div>Lokasi</div><div>${esc(r.locationName || '—')}</div><div>Pelaksana</div><div>${esc(r.implementers || '—')}</div></div></div>${dl(r.docUrl, 'Dokumen Protokol')}</aside></div>`;
  if (entity === 'news') return `<article class="prose" style="margin:0 auto"><div class="row" style="margin-bottom:12px"><span class="badge b-navy">${esc(r.category)}</span>${mI('cal', fmtDate(r.publishDate || r.publishedAt, 1))}${mI('user', r.author)}${mI('clock', r.readMin ? r.readMin + ' min read' : '')}</div><div class="card" style="aspect-ratio:16/8;margin-bottom:28px">${img(r.coverUrl, r.title, r.id, 'wave')}</div><p style="font-size:20px;line-height:32px;font-weight:500">${esc(r.excerpt)}</p>${md(r.content)}${r.tags ? `<div class="row" style="margin-top:20px">${String(r.tags).split(',').map(t => `<span class="badge">#${esc(t.trim())}</span>`).join('')}</div>` : ''}</article>${(x.related || []).length ? `<h2 style="margin-top:48px">Cerita Terkait</h2><div class="grid g3">${x.related.map(Cards.news).join('')}</div>` : ''}`;
  if (entity === 'knowledge') {
    const heads = (String(r.content || '').match(/^#{1,2}\s+.*$/gm) || []).map(h => h.replace(/^#+\s+/, ''));
    return `<div class="split" style="grid-template-columns:240px minmax(0,1fr)">${heads.length ? `<aside class="fside" style="top:140px"><h4>Daftar Isi</h4>${heads.map(h => `<a class="sm" style="display:block;padding:5px 0" href="javascript:void(0)" data-toc="${esc(h)}">${esc(h)}</a>`).join('')}</aside>` : '<span></span>'}<article class="prose" id="kb"><div class="row" style="margin-bottom:12px"><span class="badge b-navy">${esc(r.topic)}</span><span class="badge">${esc(r.level || '')}</span><span class="badge">${esc(r.format || '')}</span></div><p style="font-size:19px;line-height:30px">${esc(r.summary)}</p>${md(r.content)}<div class="row">${dl(r.fileUrl, 'Unduh Materi')}${validUrl(r.link) ? `<a class="btn btn-o btn-sm" href="${esc(r.link)}" target="_blank" rel="noopener noreferrer">${icon('ext', 's16')} Tautan</a>` : ''}</div></article></div>`;
  }
  if (entity === 'events') return `<div class="split"><div class="prose"><p style="font-size:19px;line-height:30px">${esc(r.description || '')}</p>${validUrl(r.link) ? `<a class="btn btn-p" href="${esc(r.link)}" target="_blank" rel="noopener noreferrer">Pendaftaran / Info ${icon('ext', 's16')}</a>` : ''}</div><div class="card pad"><div class="kv"><div>Jenis</div><div>${esc(r.eventType || '—')}</div><div>Mulai</div><div>${esc(fmtDate(r.eventDate, 1))}</div><div>Selesai</div><div>${esc(fmtDate(r.endDate, 1) || '—')}</div><div>Lokasi</div><div>${esc(r.locationName || '—')}</div></div></div></div>`;
  if (entity === 'locations') return `<div class="split"><div><div class="map" id="dmap" style="height:420px"></div><div class="prose" style="margin-top:20px">${md(r.description)}</div></div><aside class="col"><div class="card pad"><div class="kv"><div>Ekosistem</div><div>${esc(r.ecosystem)}</div><div>Wilayah</div><div>${esc(r.region || '—')}</div><div>Latitude</div><div class="mono">${esc(coord(r.latitude, 'N', 'S'))}</div><div>Longitude</div><div class="mono">${esc(coord(r.longitude, 'E', 'W'))}</div><div>Kedalaman maks.</div><div>${r.depthMax ? esc(r.depthMax) + ' m' : '—'}</div></div></div>
    ${(x.species || []).length ? `<div class="card pad"><h3 style="font-size:16px">Spesies tercatat</h3>${[...new Map(x.species.map(s => [s.id, s])).values()].map(s => `<a class="it" href="${viewLink('species', s.id)}" style="display:block;padding:4px 0">${esc(s.name)}</a>`).join('')}</div>` : ''}${(x.research || []).length ? `<div class="card pad"><h3 style="font-size:16px">Penelitian</h3>${x.research.map(s => `<a href="${viewLink('research', s.id)}" class="sm" style="display:block;padding:4px 0">${esc(s.title)}</a>`).join('')}</div>` : ''}</aside></div>`;
  if (entity === 'species') return speciesDetailHtml(r, x);
  if (entity === 'specimens') return `<div class="split"><div class="col"><div class="card" style="aspect-ratio:16/10">${img(r.photoUrl, r.code, r.id, 'fish')}</div><div class="prose">${md(r.notes)}</div></div><div class="card pad"><div class="kv"><div>Kode</div><div class="code">${esc(r.code)}</div><div>Takson</div><div class="it">${esc(r.speciesName)}</div><div>Status tipe</div><div>${esc(r.typeStatus || '—')}</div><div>Kolektor</div><div>${esc(r.collector)}</div><div>Tanggal</div><div>${esc(fmtDate(r.collectionDate, 1))}</div><div>Lokasi</div><div>${esc(r.locationName || '—')}</div><div>Kedalaman</div><div>${r.depth !== '' ? esc(r.depth) + ' m' : '—'}</div><div>Awetan</div><div>${esc(r.preservation || '—')}</div></div></div></div>`;
  return `<div class="prose">${md(r.summary || r.description || '')}</div>`;
}
function speciesDetailHtml(r, x) {
  const photos = [r.photoUrl].concat(lines(r.photoUrls)).filter(Boolean);
  const sp = (x.specimens || []), dist = (x.distribution || []);
  return `<div class="grid" style="grid-template-columns:1.15fr 1fr;gap:32px;align-items:start;margin-bottom:36px">
    <div><div class="card" style="aspect-ratio:4/3" id="sp-main">${img(photos[0], r.scientificName, r.id, 'fish')}</div>${photos.length > 1 ? `<div class="row" style="margin-top:10px">${photos.slice(0, 5).map((u, i) => `<button class="card" data-ph="${esc(u)}" style="width:76px;height:58px;padding:0;cursor:pointer" aria-label="Foto ${i + 1}">${img(u, '', r.id + i, 'fish')}</button>`).join('')}</div>` : ''}</div>
    <div class="card pad"><div class="row" style="margin-bottom:10px"><span class="badge b-solid">Valid Species Name</span>${endemicBadge(r)}${iucnBadge(r.iucn, 1)}</div>
      <h1 class="it" style="font-size:36px;margin-bottom:4px">${esc(r.scientificName)}</h1><div class="muted">${esc(r.authority || '')}</div>
      <div class="kv" style="margin:18px 0"><div>Nama lokal</div><div>${esc(r.localName || '—')}</div><div>Kelompok</div><div>${esc(r.organismGroup || '—')}</div><div>Habitat</div><div>${esc(r.habitat || '—')}</div><div>Kedalaman</div><div>${esc(r.depthRange || '—')}</div><div>Ukuran</div><div>${esc(r.sizeInfo || '—')}</div><div>Ekosistem</div><div>${esc(r.ecosystemTags || '—')}</div></div>
      <div class="row"><button class="btn btn-a" data-print>${icon('download', 's16')} Lembar Fakta (PDF)</button><button class="btn btn-o" data-dwc>{ } DwC / JSON</button></div></div></div>
    <div class="tax" aria-label="Taksonomi">${[['Kingdom', r.kingdom], ['Phylum', r.phylum], ['Class', r.className], ['Order', r.orderName], ['Family', r.family], ['Genus', r.genus], ['Species', r.scientificName]].map(t => `<div><small>${t[0]}</small><b ${t[0] === 'Species' ? 'class="it"' : ''}>${esc(t[1] || '—')}</b></div>`).join('')}</div>
    <div style="margin-top:36px" id="dt" class="wm">${tabsHtml([['de', 'Deskripsi & Morfometri'], ['map', `Distribusi (${dist.length})`], ['sp', `Spesimen (${sp.length})`], ['rf', 'Referensi']], 'de')}
    <div data-pane="de"><div class="split"><div class="prose">${md(r.description)}${r.morphology ? '<h2>Karakter Diagnostik</h2>' + md(r.morphology) : ''}</div><div class="prose card pad">${r.ecology ? '<h3>Ekologi & Perilaku</h3>' + md(r.ecology) : '<p class="muted">Data ekologi belum tersedia.</p>'}</div></div></div>
    <div data-pane="map" class="hide">${dist.length ? `<div class="map" id="dmap" style="height:400px;margin-bottom:20px"></div><div class="tbl-w"><table class="tbl"><thead><tr><th>Lokasi</th><th>Latitude</th><th>Longitude</th><th>Kedalaman</th><th>Tanggal</th></tr></thead><tbody>${dist.map(d => `<tr><td>${esc(d.locationName || '—')}</td><td class="mono">${esc(coord(d.latitude, 'N', 'S'))}</td><td class="mono">${esc(coord(d.longitude, 'E', 'W'))}</td><td>${d.depth !== '' ? esc(d.depth) + ' m' : '—'}</td><td>${esc(fmtDate(d.collectedDate))}</td></tr>`).join('')}</tbody></table></div>` : Views.empty('Data distribusi belum tersedia', '', '', 'pin')}</div>
    <div data-pane="sp" class="hide">${sp.length ? `<div class="tbl-w"><table class="tbl"><thead><tr><th>Kode</th><th>Status Tipe</th><th>Lokasi</th><th>Kolektor</th><th>Tanggal</th></tr></thead><tbody>${sp.map(s => `<tr><td class="code">${esc(s.code)}</td><td>${esc(s.typeStatus || '—')}</td><td>${esc(s.locationName || '—')}</td><td>${esc(s.collector)}</td><td>${esc(fmtDate(s.collectionDate))}</td></tr>`).join('')}</tbody></table></div>` : Views.empty('Belum ada spesimen terdaftar', '', '', 'layers')}</div>
    <div data-pane="rf" class="hide">${lines(r.references).length ? `<ol>${lines(r.references).map(l => `<li style="margin:8px 0">${esc(l)}</li>`).join('')}</ol>` : '<p class="muted">Referensi belum dicantumkan.</p>'}</div></div>
    ${(x.related || []).length ? `<h2 style="margin-top:48px">Spesies Terkait</h2><div class="grid g4">${x.related.map(Cards.species).join('')}</div>` : ''}`;
}
function bindDetail(root, entity, r, x) {
  bindTabs(root);
  const run = () => {
    const el = $('#dmap', root); if (!el || el._m) return; el._m = 1;
    if (entity === 'species') speciesMap(el, r, x.distribution || []);
    else { const lat = entity === 'locations' ? r.latitude : (x.location || {}).latitude, lng = entity === 'locations' ? r.longitude : (x.location || {}).longitude, nm = entity === 'locations' ? r.name : (x.location || {}).name; if (isFinite(lat) && lat !== '') { MapKit.with(el, { center: [lat, lng], zoom: 10, wheel: false }, m => { MapKit.dot(lat, lng, '#20B8B0', 11).addTo(m).bindPopup('<b>' + esc(nm) + '</b>'); }); } }
  };
  root._onMap = () => setTimeout(run, 60);
  if (!$('[data-pane]', root) || !$('[data-pane="map"].hide', root)) run();
  root.addEventListener('click', e => {
    const ph = e.target.closest('[data-ph]'); if (ph) { const m = $('#sp-main', root); if (m) m.innerHTML = img(ph.dataset.ph, r.scientificName, r.id, 'fish'); }
    if (e.target.closest('[data-print]')) window.print();
    if (e.target.closest('[data-dwc]')) downloadText((r.scientificName || r.id).replace(/\s+/g, '_') + '.dwc.json', JSON.stringify(dwc(entity, r), null, 2), 'application/json');
    const t = e.target.closest('[data-toc]'); if (t) { const h = $$('#kb h2', root).filter(x => x.textContent === t.dataset.toc)[0]; if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
}
Pages.detail = async function (p, q, T) {
  const entity = p.entity, menu = MENU_OF[entity];
  if (!menu || !SCH()[entity]) { Router.go('/'); return; }
  const main = Shell.public(menu);
  main.innerHTML = '<section class="sec"><div class="wrap">' + Views.lines(6) + '</div></section>';
  let d;
  try { d = await API.pub('pub.get', { entity: entity, id: p.id }); } catch (e) { if (T.ok()) main.innerHTML = '<section class="sec"><div class="wrap">' + Views.empty('Data tidak ditemukan', e.message, '<a class="btn btn-p" href="#/">Kembali ke Beranda</a>') + '</div></section>'; return; }
  if (!T.ok()) return;
  const r = d.row, E = SCH()[entity], title = r[E.title] || r.id, back = { research: '/research/all', expeditions: '/expeditions/overview', species: '/database/fish', specimens: '/database/specimens', locations: '/expeditions/locations', conservation: '/conservation/all', news: '/news/all', events: '/news/all', knowledge: '/knowledge/all', publications: '/publications/all', gallery: '/gallery/all' }[entity] || '/';
  document.title = title + ' — ERA';
  const cls = entity === 'species' ? 'it' : '';
  main.innerHTML = (entity === 'species' ? '' : pageBanner({ crumbs: [[menuOf(menu).label, back], [title]], eyebrow: E.label + ' // ' + r.id, title: title, sub: entity === 'news' ? '' : '' })) + `<section class="sec" ${entity === 'species' ? 'style="padding-top:32px"' : ''}><div class="wrap" id="dw">${entity === 'species' ? `<div class="crumb" style="color:var(--muted);margin-bottom:18px"><a href="#/database/fish" style="color:var(--muted)">Scientific Database</a> / <b style="color:var(--text)" class="${cls}">${esc(title)}</b></div>` : ''}${detailHtml(entity, r, d.extra)}</div></section>`;
  bindDetail($('#dw'), entity, r, d.extra);
};
