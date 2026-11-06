'use strict';
/* ERA Portal — pages2.js : Database • Kolaborasi • Kontak • Pencarian • Login */

/* publikasi & galeri pada halaman detail */
(function () {
  const base = detailHtml;
  detailHtml = function (entity, r, x) {
    if (entity === 'publications') return `<div class="split"><div class="prose"><p class="muted">${esc(r.authors)} (${esc(r.year)})${r.journal ? ' · <i>' + esc(r.journal) + '</i>' : ''}</p>${md(r.abstract || 'Abstrak belum tersedia.')}${r.doi ? `<p class="mono">DOI: ${esc(r.doi)}</p>` : ''}</div><div class="col">${validUrl(r.fileUrl) ? `<a class="btn btn-p" href="${esc(r.fileUrl)}" target="_blank" rel="noopener noreferrer">${icon('download', 's16')} Unduh PDF</a>` : ''}${validUrl(r.link) ? `<a class="btn btn-o" href="${esc(r.link)}" target="_blank" rel="noopener noreferrer">${icon('ext', 's16')} Tautan eksternal</a>` : ''}</div></div>`;
    if (entity === 'gallery') return `<div class="card" style="max-width:900px;margin:auto">${img(r.fileUrl, r.title, r.id, 'wave')}<div class="card-b"><p>${esc(r.caption || '')}</p><div class="muted sm">${esc(r.credit || '')}</div></div></div>`;
    if (entity === 'distribution') return `<div class="prose">${md(r.notes)}</div>`;
    return base(entity, r, x);
  };
})();

/* ============================================================
   DATABASE ILMIAH
   ============================================================ */
const DB_TITLES = {
  fish: ['Database Keanekaragaman Hayati & Katalog Ikan Air Tawar', 'Katalog taksonomi terstandardisasi, repositori spesimen digital, dan pemetaan biogeografi ikhtiofauna danau purba serta cekungan sungai tropis Nusantara.'],
  endemic: ['Spesies Endemik & Terancam', 'Taksa endemik Sulawesi dan status konservasi IUCN Red List.'],
  organisms: ['Organisme Akuatik & Makrobentos', 'Moluska, krustasea, flora akuatik, dan mikrofauna perairan darat.'],
  identification: ['Kunci Identifikasi Interaktif', 'Penelusuran kandidat spesies berdasarkan ciri lapangan.'],
  map: ['Peta Persebaran Spasial (GIS)', 'Titik kejadian spesies terverifikasi pada sistem koordinat WGS84.'],
  specimens: ['Katalog Baucer Digital & Koleksi Kurasi', 'Arsip spesimen biologis tipe dan referensi taksonomi perairan Indonesia dengan metadata Darwin Core.']
};
Pages.database = async function (p, q, T) {
  const sub = p.sub || 'fish', M = menuOf('database'), cur = subFrom('database', sub), t = DB_TITLES[sub] || DB_TITLES.fish;
  const main = Shell.public('database'), st = ERA.S.boot.stats;
  main.innerHTML = pageBanner({ crumbs: [['Scientific Database', '/database/fish'], [cur[1]]], eyebrow: 'Scientific Database // Darwin Core Archive', title: t[0], sub: t[1], extra: `<div class="row mono xs" style="margin-top:18px;color:#9FC0DA;gap:22px"><span>${fmtNum(st.species)} TAKSA TERDAFTAR</span><span>${fmtNum(st.specimens)} BAUCER</span><span>${fmtNum(st.endemic)} ENDEMIK</span></div>` }) + subnav(M, sub) + '<section class="sec" style="padding-top:36px"><div class="wrap" id="dbh"></div></section>';
  const host = $('#dbh');
  if (sub === 'fish') speciesCatalogue(host, { group: 'Ikan Air Tawar' });
  else if (sub === 'endemic') speciesCatalogue(host, { endemic: 'yes' });
  else if (sub === 'organisms') speciesCatalogue(host, { exclude: 'Ikan Air Tawar' });
  else if (sub === 'identification') identification(host);
  else if (sub === 'map') { host.classList.remove('wrap'); host.parentNode.style.padding = '0'; speciesDistributionMap(host, T); }
  else if (sub === 'specimens') specimensCatalogue(host);
};

function speciesCatalogue(host, forced) {
  const st = { q: '', group: forced.group || '', endemic: forced.endemic || '', iucn: '', eco: '', order: 'az', page: 1, view: 'grid' };
  let seq = 0, last = [];
  const groups = OPTS().orgGroup.filter(g => !forced.exclude || g !== forced.exclude);
  const ecos = (ERA.S.boot.home.locations || []).filter(l => /Danau/.test(l.ecosystem) || l.kind === 'research').map(l => l.name);
  host.innerHTML = `<button class="btn btn-o fs-open" type="button">${icon('filter', 's16')} Filter &amp; urutkan <span class="badge b-solid" id="fcnt" hidden></span></button><div class="fs-bd"></div><div class="sp-layout"><aside class="fside sheet" aria-label="Filter taksonomi"><div class="fs-head"><b>Filter taksonomi</b><button type="button" class="btn btn-o btn-ic" data-fclose aria-label="Tutup">${icon('x')}</button></div><h4>Pencarian</h4><div class="inp-ic">${icon('search')}<input class="inp" id="sq" type="search" placeholder="Nama ilmiah, lokal, famili…" aria-label="Cari spesies"></div>
    ${forced.group ? '' : `<h4>Kelompok Organisme</h4><label class="chk"><input type="radio" name="g" value="" checked> Semua <span class="muted xs" data-gc=""></span></label>${groups.map(g => `<label class="chk"><input type="radio" name="g" value="${esc(g)}"> ${esc(g)} <span class="muted xs" data-gc="${esc(g)}"></span></label>`).join('')}`}
    ${forced.endemic ? '' : `<h4>Endemisitas</h4><label class="chk"><input type="radio" name="e" value="" checked> Semua</label><label class="chk"><input type="radio" name="e" value="yes"> Endemik</label><label class="chk"><input type="radio" name="e" value="no"> Non-endemik</label>`}
    <h4>Status IUCN Red List</h4><select class="inp" id="si" aria-label="IUCN"><option value="">Semua status</option>${OPTS().iucn.map(i => `<option value="${i}">${i} — ${IUCN_L[i]}</option>`).join('')}</select>
    <h4>Cekungan Limnologis</h4><select class="inp" id="se" aria-label="Cekungan"><option value="">Semua cekungan</option>${ecos.map(e => `<option>${esc(e)}</option>`).join('')}</select>
    <h4>Urutkan</h4><select class="inp" id="so" aria-label="Urutan"><option value="az">Nama ilmiah (A–Z)</option><option value="new">Terbaru</option></select>
    <button class="btn btn-o btn-block" id="sr" style="margin-top:18px">Reset filter</button><button class="btn btn-p btn-block fs-apply" type="button">Lihat hasil</button></aside>
    <div><div class="row sp" style="margin-bottom:18px"><div class="mono xs muted" id="cnt" aria-live="polite">MEMUAT…</div><div class="row"><button class="btn btn-o btn-sm" id="exp">${icon('download', 's16')} CSV</button><div class="row" style="gap:0"><button class="btn btn-sm btn-p" data-v="grid" aria-label="Tampilan kartu">${icon('grid', 's16')}</button><button class="btn btn-sm btn-o" data-v="table" aria-label="Tampilan tabel">${icon('list', 's16')}</button></div></div></div><div id="res"></div></div></div>`;
  const res = $('#res', host); Mobile.sheet(host, '.fside.sheet');
  async function run() {
    const my = ++seq, size = st.view === 'table' ? 20 : 12, clientEx = forced.exclude && !st.group;
    const p = { entity: 'species', page: clientEx ? 1 : st.page, size: clientEx ? 60 : size, order: st.order };
    if (st.q) p.q = st.q; if (st.group) p.f_organismGroup = st.group; if (st.endemic) p.f_endemic = st.endemic; if (st.iucn) p.f_iucn = st.iucn; if (st.eco) p.f_ecosystemTags = st.eco;
    res.innerHTML = Views.loading(6, st.view === 'grid' ? 'g3' : 'g1');
    const nf = ['group', 'endemic', 'iucn', 'eco'].filter(k => st[k] && st[k] !== (forced[k === 'group' ? 'group' : k] || '')).length + (st.q ? 1 : 0), fc = $('#fcnt', host); if (fc) { fc.textContent = nf; fc.hidden = !nf; }
    try {
      await API.swr('pub.list', p, d => {
        if (my !== seq || !host.isConnected) return;
        let rows = d.rows, total = d.total;
        if (clientEx) { rows = rows.filter(r => r.organismGroup !== forced.exclude); total = rows.length; rows = rows.slice((st.page - 1) * size, st.page * size); }
        last = rows; $('#cnt', host).textContent = `MENAMPILKAN ${rows.length} DARI ${total} TAKSA TERDAFTAR (DARWIN CORE)`;
        const f = d.facets.organismGroup || {}; $$('[data-gc]', host).forEach(s => { const g = s.dataset.gc; s.textContent = '(' + (g ? (f[g] || 0) : Object.values(f).reduce((a, b) => a + b, 0)) + ')'; });
        if (!rows.length) { res.innerHTML = Views.empty('Tidak ada spesies yang cocok', 'Coba longgarkan filter.', '<button class="btn btn-o btn-sm" id="sr2">Reset filter</button>'); const b = $('#sr2'); if (b) b.onclick = reset; return; }
        res.innerHTML = (st.view === 'grid' ? `<div class="grid g3 sp-grid">${rows.map(Cards.species).join('')}</div>` :
          `<div class="tbl-w"><table class="tbl"><thead><tr><th>Foto</th><th>Nama Ilmiah</th><th>Nama Lokal</th><th>Kelompok</th><th>Famili</th><th>Endemik</th><th>IUCN</th></tr></thead><tbody>${rows.map(r => `<tr><td><div class="thumb">${img(r.photoUrl, r.scientificName, r.id, 'fish')}</div></td><td><a href="${viewLink('species', r.id)}" class="it"><b>${esc(r.scientificName)}</b></a><div class="code">${esc(r.id)}</div></td><td>${esc(r.localName || '—')}</td><td>${esc(r.organismGroup || '')}</td><td>${esc(r.family || '')}</td><td>${r.endemic === 'yes' ? '<span class="badge b-solid">Ya</span>' : '—'}</td><td>${iucnBadge(r.iucn) || '—'}</td></tr>`).join('')}</tbody></table></div>`) + pager(total, st.page, size);
      });
    } catch (e) { if (my === seq) pageErr(res, e); }
  }
  function reset() { Object.assign(st, { q: '', group: forced.group || '', endemic: forced.endemic || '', iucn: '', eco: '', page: 1 }); $('#sq', host).value = ''; $('#si', host).value = ''; $('#se', host).value = ''; $$('input[type=radio]', host).forEach(r => { r.checked = r.value === ''; }); run(); }
  $('#sq', host).addEventListener('input', debounce(e => { st.q = e.target.value.trim(); st.page = 1; run(); }, 350));
  host.addEventListener('change', e => { const t = e.target; if (t.name === 'g') st.group = t.value; else if (t.name === 'e') st.endemic = t.value; else if (t.id === 'si') st.iucn = t.value; else if (t.id === 'se') st.eco = t.value; else if (t.id === 'so') st.order = t.value; else return; st.page = 1; run(); });
  $('#sr', host).onclick = reset;
  host.addEventListener('click', e => { const v = e.target.closest('[data-v]'); if (v) { st.view = v.dataset.v; st.page = 1; $$('[data-v]', host).forEach(b => { b.className = 'btn btn-sm ' + (b === v ? 'btn-p' : 'btn-o'); }); run(); } });
  bindPager(res, pg => { st.page = pg; run(); window.scrollTo({ top: Math.max(0, host.getBoundingClientRect().top + scrollY - 140), behavior: 'smooth' }); });
  $('#exp', host).onclick = () => { if (!last.length) return toast('Tidak ada data untuk diekspor.', 'warn'); const cols = ['id', 'scientificName', 'authority', 'localName', 'kingdom', 'phylum', 'className', 'orderName', 'family', 'genus', 'organismGroup', 'endemic', 'iucn', 'habitat', 'depthRange']; const c = v => '"' + String(v === undefined ? '' : v).replace(/"/g, '""') + '"'; downloadText('ERA-spesies.csv', '\ufeff' + cols.join(',') + '\r\n' + last.map(r => cols.map(k => c(/^[=+\-@]/.test(String(r[k] || '')) ? "'" + r[k] : r[k])).join(',')).join('\r\n'), 'text/csv;charset=utf-8'); };
  run();
}

/* ---- kunci identifikasi ---- */
function depthRange(s) { const m = /(\d+(?:[.,]\d+)?)\D+?(\d+(?:[.,]\d+)?)/.exec(String(s || '')); return m ? [parseFloat(m[1].replace(',', '.')), parseFloat(m[2].replace(',', '.'))] : null; }
function identification(host) {
  const ans = { g: '', z: '', e: '', l: '' };
  host.innerHTML = `<div class="notice" style="margin-bottom:24px">${icon('info')}<div><b>Panduan identifikasi awal.</b> Hasil berupa kandidat berdasarkan ciri umum — selalu verifikasi dengan monograf spesies dan oleh taksonom.</div></div>
  <div class="step-cards" id="ik"><div class="card pad"><div class="mono xs muted">LANGKAH 01 // KELOMPOK</div><h3 style="font-size:17px">Kelompok organisme</h3><select class="inp" data-a="g"><option value="">Tidak tahu</option>${OPTS().orgGroup.map(g => `<option>${esc(g)}</option>`).join('')}</select></div>
  <div class="card pad"><div class="mono xs muted">LANGKAH 02 // HABITAT</div><h3 style="font-size:17px">Zona kedalaman temuan</h3><div class="col" style="gap:8px">${[['', 'Tidak tahu'], ['s', 'Permukaan (0–15 m)'], ['m', 'Menengah (15–50 m)'], ['d', 'Dalam (> 50 m)']].map((o, i) => `<label class="opt ${i ? '' : 'on'}" style="padding:10px 12px"><input type="radio" name="z" value="${o[0]}" ${i ? '' : 'checked'} style="margin-right:8px">${o[1]}</label>`).join('')}</div></div>
  <div class="card pad"><div class="mono xs muted">LANGKAH 03 // LOKASI & STATUS</div><h3 style="font-size:17px">Danau / perairan</h3><select class="inp" data-a="l" style="margin-bottom:12px"><option value="">Tidak tahu</option>${(ERA.S.boot.home.locations || []).filter(l => /Danau/.test(l.ecosystem)).map(l => `<option>${esc(l.name)}</option>`).join('')}</select><select class="inp" data-a="e"><option value="">Endemik? Tidak tahu</option><option value="yes">Endemik</option><option value="no">Bukan endemik</option></select></div></div>
  <div id="ir" style="margin-top:32px">${Views.lines(3)}</div>`;
  let all = [];
  const score = r => {
    let tot = 0, hit = 0;
    if (ans.g) { tot++; if (r.organismGroup === ans.g) hit++; }
    if (ans.e) { tot++; if ((r.endemic || 'no') === ans.e) hit++; }
    if (ans.l) { tot++; if (String(r.ecosystemTags || '').indexOf(String(ans.l).replace(/^Danau /, 'Danau ')) >= 0) hit++; }
    if (ans.z) { tot++; const d = depthRange(r.depthRange); if (d) { const [a, b] = d, z = ans.z === 's' ? [0, 15] : ans.z === 'm' ? [15, 50] : [50, 9999]; if (a <= z[1] && b >= z[0]) hit++; } }
    return tot ? hit / tot : 0;
  };
  const draw = () => {
    const any = ans.g || ans.z || ans.e || ans.l;
    if (!any) { $('#ir').innerHTML = Views.empty('Pilih minimal satu ciri', 'Hasil kandidat akan muncul di sini.', '', 'search'); return; }
    const sc = all.map(r => ({ r, s: score(r) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
    $('#ir').innerHTML = sc.length ? `<h2>Kandidat teridentifikasi <span class="muted" style="font-size:16px">(${sc.length})</span></h2><div class="grid g3">${sc.slice(0, 12).map(x => `<div style="position:relative">${Cards.species(x.r)}<span class="badge b-solid" style="position:absolute;right:12px;bottom:12px">Match ${Math.round(x.s * 100)}%</span></div>`).join('')}</div>` : Views.empty('Tidak ada kandidat', 'Kurangi jumlah ciri yang dipilih.', '', 'search');
  };
  host.addEventListener('change', e => { const t = e.target; if (t.dataset.a) ans[t.dataset.a] = t.value; else if (t.name === 'z') { ans.z = t.value; $$('#ik .opt').forEach(o => o.classList.toggle('on', o.contains(t))); } draw(); });
  API.swr('pub.list', { entity: 'species', size: 60 }, d => { all = d.rows; draw(); }).catch(e => pageErr($('#ir'), e));
}

/* ---- peta persebaran ---- */
function speciesDistributionMap(host, T) {
  host.innerHTML = `<div class="fs-bd"></div><div class="map-full"><aside class="map-side sheet" id="ms"><div class="fs-head"><b>Filter peta</b><button type="button" class="btn btn-o btn-ic" data-fclose aria-label="Tutup">${icon('x')}</button></div><div class="eyebrow">Geospatial filter engine</div><h3 style="margin:6px 0 12px">Lapisan & Taksa Spesies <span class="badge" id="mc"></span></h3><div class="inp-ic">${icon('search')}<input class="inp" id="mq" placeholder="Cari taksa…" aria-label="Cari taksa"></div><div id="mf">${Views.lines(6)}</div></aside><div class="map-box"><div class="map" id="bigmap"></div><button class="btn btn-p fs-open" type="button">${icon('filter', 's16')} Filter taksa</button><div style="position:absolute;top:12px;right:12px;z-index:500" class="row"><div class="row" style="gap:0;background:var(--card);border-radius:10px;box-shadow:var(--sh2)"><button class="btn btn-sm btn-p" data-b="osm">Peta</button><button class="btn btn-sm btn-o" data-b="sat" style="border:0">Citra Satelit</button></div></div></div></div>
  <div class="wrap"><div class="leg"><span>${dot('#20B8B0')} Spesies endemik</span><span>${dot('#0B2D4D')} Non-endemik</span><span>${dot('#F59E0B')} Terancam (CR/EN)</span><span>◆ Lokasi riset / stasiun</span></div></div>`;
  Mobile.sheet(host, '.map-side.sheet');
  MapKit.with($('#bigmap'), { zoom: 7 }, map => speciesMapInit(host, T, map));
}
function speciesMapInit(host, T, map) {
  const layer = L.layerGroup().addTo(map), locL = L.layerGroup().addTo(map);
  let data = { points: [], locations: [] }; const st = { q: '', lake: '', groups: new Set(), endemic: false, sp: new Set(), all: true };
  $$('[data-b]', host).forEach(b => b.onclick = () => { MapKit.base(map, b.dataset.b); $$('[data-b]', host).forEach(x => { x.className = 'btn btn-sm ' + (x === b ? 'btn-p' : 'btn-o'); x.style.border = x === b ? '' : '0'; }); });
  const col = pt => (pt.iucn === 'CR' || pt.iucn === 'EN') ? '#F59E0B' : pt.endemic === 'yes' ? '#20B8B0' : '#0B2D4D';
  const vis = pt => (!st.q || (pt.name + ' ' + (pt.local || '') + ' ' + (pt.family || '')).toLowerCase().indexOf(st.q.toLowerCase()) >= 0) && (!st.lake || pt.locationName === st.lake) && (!st.groups.size || st.groups.has(pt.group)) && (!st.endemic || pt.endemic === 'yes') && (st.all || st.sp.has(pt.speciesId));
  function draw() {
    layer.clearLayers(); const pts = [], list = data.points.filter(vis);
    list.forEach(pt => { const m = MapKit.dot(pt.lat, pt.lng, col(pt), 8).addTo(layer); pts.push([pt.lat, pt.lng]); m.bindPopup(`<div class="pin-pop"><div class="mono xs muted">OCCURRENCE ${esc(pt.id)}</div><div style="width:100%;height:100px;border-radius:8px;overflow:hidden;margin:8px 0">${img(pt.photoUrl, pt.name, pt.speciesId, 'fish')}</div><b>${esc(pt.name)}</b><div class="sm muted">${esc(pt.family || '')} · ${esc(pt.local || '')}</div><div class="mono xs" style="margin:6px 0">${esc(coord(pt.lat, 'N', 'S'))} ${esc(coord(pt.lng, 'E', 'W'))}${pt.depth !== '' ? ' · ' + esc(pt.depth) + ' m' : ''}</div><a class="btn btn-p btn-sm" href="${viewLink('species', pt.speciesId)}">Monograf Spesies →</a></div>`); });
    $('#mc').textContent = list.length + ' titik'; if (pts.length && !draw.fitted) { MapKit.fit(map, pts); draw.fitted = 1; }
  }
  function side() {
    const lakes = {}, grp = {}, spp = {}; data.points.forEach(p => { lakes[p.locationName] = (lakes[p.locationName] || 0) + 1; grp[p.group] = (grp[p.group] || 0) + 1; spp[p.speciesId] = spp[p.speciesId] || { n: p.name, c: 0, col: col(p) }; spp[p.speciesId].c++; });
    $('#mf').innerHTML = `<h4 class="mono xs muted" style="margin:18px 0 8px">CEKUNGAN HIDROLOGIS</h4><div class="row" style="gap:6px"><button class="chip on" data-l="">Semua <i style="font-style:normal;opacity:.6">${data.points.length}</i></button>${Object.keys(lakes).map(l => `<button class="chip" data-l="${esc(l)}">${esc(l)} <i style="font-style:normal;opacity:.6">${lakes[l]}</i></button>`).join('')}</div>
    <h4 class="mono xs muted" style="margin:18px 0 6px">KELOMPOK ORGANISME</h4>${Object.keys(grp).map(g => `<label class="chk"><input type="checkbox" data-g="${esc(g)}"> ${esc(g)} <span class="muted xs">(${grp[g]})</span></label>`).join('')}<label class="chk"><input type="checkbox" id="mend"> Hanya endemik</label>
    <h4 class="mono xs muted" style="margin:18px 0 6px">SPESIES TARGET</h4>${Object.keys(spp).map(id => `<label class="chk"><input type="checkbox" data-s="${esc(id)}" checked> ${dot(spp[id].col)}<span class="it">${esc(spp[id].n)}</span> <span class="muted xs">${spp[id].c} pts</span></label>`).join('')}
    <h4 class="mono xs muted" style="margin:18px 0 6px">LAYER ANOTASI</h4><label class="chk"><input type="checkbox" id="mloc" checked> Lokasi riset & stasiun</label>`;
  }
  host.addEventListener('click', e => { const l = e.target.closest('[data-l]'); if (l) { st.lake = l.dataset.l; $$('[data-l]', host).forEach(x => x.classList.toggle('on', x === l)); const m = data.locations.filter(x => x.name === st.lake)[0]; if (m && st.lake) map.setView([m.lat, m.lng], 11); draw(); } });
  host.addEventListener('change', e => { const t = e.target; if (t.dataset.g !== undefined) { t.checked ? st.groups.add(t.dataset.g) : st.groups.delete(t.dataset.g); } else if (t.id === 'mend') st.endemic = t.checked; else if (t.dataset.s !== undefined) { t.checked ? st.sp.add(t.dataset.s) : st.sp.delete(t.dataset.s); st.all = false; } else if (t.id === 'mloc') { t.checked ? locL.addTo(map) : map.removeLayer(locL); return; } else return; draw(); });
  $('#mq', host).addEventListener('input', debounce(e => { st.q = e.target.value.trim(); draw(); }, 250));
  API.swr('pub.map', {}, d => {
    if (!T.ok()) return; data = d; draw.fitted = 0; st.sp = new Set(d.points.map(p => p.speciesId)); st.all = false;
    locL.clearLayers(); d.locations.forEach(l => { if (isFinite(l.lat)) L.marker([l.lat, l.lng], { icon: L.divIcon({ className: '', html: '<div style="width:16px;height:16px;background:#145B78;border:2px solid #fff;transform:rotate(45deg);box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }) }).addTo(locL).bindPopup(`<b>${esc(l.name)}</b><br>${esc(l.ecosystem)}${l.depthMax ? '<br>Kedalaman maks. ' + l.depthMax + ' m' : ''}<br><a href="${viewLink('locations', l.id)}">Detail lokasi →</a>`); });
    side(); draw();
  }).catch(e => { $('#mf').innerHTML = '<div class="notice bad">' + esc(e.message) + '</div>'; });
}

/* ---- katalog spesimen ---- */
function specimensCatalogue(host) {
  host.innerHTML = '<div class="grid g4" id="sst" style="margin-bottom:24px"></div><div id="lst"></div>';
  Listing($('#lst'), { entity: 'specimens', size: 10, cols: '', filters: [{ name: 'q', type: 'search', ph: 'Kode baucer, takson, kolektor…' }, { name: 'typeStatus', label: 'Status tipe', opts: OPTS().typeStatus }, { name: 'locationId', label: 'Lokasi', opts: locOptions() }],
    after: d => { const f = d.facets.typeStatus || {}, tot = Object.values(f).reduce((a, b) => a + b, 0); $('#sst').innerHTML = [['Total baucer', tot, 'layers'], ['Holotype & Paratype', (f.Holotype || 0) + (f.Paratype || 0), 'award'], ['DNA / Jaringan', f['DNA Tissue'] || 0, 'flask'], ['Standar', 'Darwin Core', 'shield']].map(s => `<div class="card pad row" style="flex-wrap:nowrap"><div class="stat" style="padding:0;border:0"><div class="ico">${icon(s[2], 's24')}</div></div><div><b class="big-num" style="font-size:${typeof s[1] === 'number' ? 28 : 18}px">${typeof s[1] === 'number' ? fmtNum(s[1]) : s[1]}</b><div class="mono xs muted">${s[0].toUpperCase()}</div></div></div>`).join(''); },
    render: d => d.rows.length ? `<div class="tbl-w"><table class="tbl"><thead><tr><th>Kode Baucer</th><th>Takson Ilmiah</th><th>Lokasi & Stasiun</th><th>Kolektor / Waktu</th><th>Status Tipe</th><th></th></tr></thead><tbody>${d.rows.map(r => `<tr data-sid="${esc(r.id)}" style="cursor:pointer"><td class="code">${esc(r.code)}</td><td><a class="it" href="${viewLink('species', r.speciesId)}">${esc(r.speciesName)}</a></td><td>${esc(r.locationName || '—')}<div class="muted xs">${esc(r.station || '')}${r.depth !== '' ? ' · ' + esc(r.depth) + ' m' : ''}</div></td><td>${esc(r.collector)}<div class="muted xs">${esc(fmtDate(r.collectionDate))}</div></td><td>${r.typeStatus ? `<span class="badge ${/type/i.test(r.typeStatus) ? 'b-navy' : ''}">${esc(r.typeStatus)}</span>` : '—'}</td><td><button class="btn btn-o btn-sm" data-sd="${esc(r.id)}">Dossier</button></td></tr>`).join('')}</tbody></table></div>` : '',
    bind: (R, d) => { R.onclick = e => { const b = e.target.closest('[data-sd],[data-sid]'); if (!b || e.target.closest('a')) return; const id = b.dataset.sd || b.dataset.sid, r = d.rows.filter(x => x.id === id)[0]; API.pub('pub.get', { entity: 'specimens', id: id }).then(g => { const x = g.row; Drawer.open(`<div class="mono xs muted">DOSSIER KURASI BAUCER</div><h2 class="code" style="font-size:26px;margin:4px 0 14px">${esc(x.code)}</h2><div class="card" style="aspect-ratio:16/10;margin-bottom:16px">${img(x.photoUrl, x.code, x.id, 'fish')}</div>${detailHtml('specimens', x, g.extra).replace(/<div class="split">/, '<div>')}<div class="row" style="margin-top:16px"><button class="btn btn-o btn-sm" id="dwcs">{ } DwC JSON</button><a class="btn btn-p btn-sm" href="${viewLink('specimens', x.id)}">Halaman lengkap</a></div>`); setTimeout(() => { const b2 = $('#dwcs'); if (b2) b2.onclick = () => downloadText(x.code + '.dwc.json', JSON.stringify(dwc('specimens', x), null, 2), 'application/json'); }, 60); void r; }).catch(err => toast(err.message, 'err')); }; } });
}

/* ============================================================
   KOLABORASI & FORMULIR PUBLIK
   ============================================================ */
const FORM_EXTRA = {
  research: [['stationNeeded', 'Fasilitas / stasiun dibutuhkan', 'select', ['Stasiun Limnologi Danau Poso', 'Laboratorium Lapangan Matano', 'Kapal Riset RV Anoa', 'Laboratorium Basah / eDNA']], ['duration', 'Estimasi durasi riset', 'select', ['< 1 minggu', '1–2 minggu', '1 bulan', '> 1 bulan']], ['periodStart', 'Perkiraan mulai', 'date']],
  academic: [['university', 'Universitas / Fakultas', 'text'], ['scope', 'Cakupan kemitraan', 'select', ['Joint Field School', 'Pertukaran data', 'Co-supervision', 'Penelitian bersama']]],
  institutional: [['institutionType', 'Jenis institusi', 'select', ['Pemerintah Pusat', 'Pemerintah Daerah / BKSDA', 'Lembaga Konservasi', 'Lembaga Internasional']], ['agreement', 'Bentuk kerja sama', 'select', ['MoU', 'Perjanjian Kerja Sama (PKS)', 'Izin / Rekomendasi', 'Belum ditentukan']]],
  volunteer: [['availability', 'Ketersediaan waktu', 'text'], ['skills', 'Keahlian / minat', 'text'], ['experience', 'Pengalaman lapangan', 'select', ['Belum ada', 'Pemula', 'Menengah', 'Berpengalaman']]],
  student: [['university', 'Universitas', 'text'], ['studyProgram', 'Program studi', 'text'], ['level', 'Jenjang', 'select', ['S1 / Skripsi', 'S2 / Tesis', 'S3 / Disertasi']], ['proposedTopic', 'Topik yang diusulkan', 'text'], ['supervisor', 'Dosen pembimbing', 'text']],
  sponsorship: [['supportType', 'Bentuk dukungan', 'select', ['Pendanaan program', 'Peralatan / logistik', 'Donasi umum', 'CSR / kemitraan program']], ['budgetRange', 'Perkiraan nilai dukungan', 'select', ['< Rp 10 juta', 'Rp 10–50 juta', 'Rp 50–250 juta', '> Rp 250 juta']]],
  expedition: [['experience', 'Pengalaman lapangan', 'select', ['Belum ada', 'Pemula', 'Menengah', 'Berpengalaman']], ['availability', 'Ketersediaan tanggal', 'text'], ['preferred', 'Ekspedisi yang diminati', 'select', 'EXP']],
  partnership: [['partnershipInterest', 'Minat kemitraan', 'select', ['Riset bersama', 'Pendanaan', 'Edukasi', 'Konservasi', 'Lainnya']]],
  message: []
};
const NEED_ORG = ['partnership', 'research', 'academic', 'institutional', 'student', 'sponsorship'];

function formHtml(type, o) {
  o = o || {};
  const ex = (FORM_EXTRA[type] || []).map(f => {
    let opts = f[3]; if (opts === 'EXP') opts = (ERA.S.boot.home.expeditions || []).map(e => e.name).concat(['Belum ditentukan']);
    return fld(f[1], 'x_' + f[0], { type: f[2] === 'select' ? 'select' : f[2], opts: opts });
  }).join('');
  return `<form id="ff" novalidate class="wm" aria-label="${esc((FORMS[type] || {}).label || 'Formulir')}"><div id="fsum" class="notice bad hide" role="alert" style="margin-bottom:16px"></div>
    <div class="fgrid">${fld('Nama lengkap & gelar', 'name', { req: 1, autocomplete: 'name' })}${fld('Email', 'email', { req: 1, type: 'email', autocomplete: 'email' })}${fld('Nomor telepon / WhatsApp', 'phone', { type: 'tel', autocomplete: 'tel' })}${fld(NEED_ORG.indexOf(type) >= 0 ? 'Institusi / Organisasi' : 'Institusi / Organisasi (opsional)', 'organization', { req: NEED_ORG.indexOf(type) >= 0 })}${ex}${fld('Judul / subjek', 'subject', { full: 1, val: o.subject || '' })}${fld('Pesan / ringkasan pengajuan', 'message', { type: 'textarea', req: 1, full: 1, rows: 6, max: 5000, help: 'Minimal 10 karakter.' })}
    <div class="full"><label class="f" for="f_att">Lampiran (opsional)</label><input class="inp" id="f_att" name="att" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"><div class="help">PDF, DOC, DOCX, JPG, PNG — maksimal 4 MB.</div></div>
    <div class="hp" aria-hidden="true"><label>Jangan diisi<input name="hp" tabindex="-1" autocomplete="off"></label></div>
    <label class="chk full"><input type="checkbox" name="consent" required> <span>Saya menyetujui data pengajuan ini disimpan dan diproses tim ERA untuk menanggapi permohonan saya.</span></label></div>
    <div class="row" style="margin-top:20px"><button class="btn btn-p" type="submit" id="fsub">${icon('send', 's16')} Kirim Pengajuan</button><span class="muted sm">Nomor referensi akan dikirim ke email Anda.</span></div></form>`;
}
function bindForm(host, type, onOk) {
  const form = $('#ff', host), t0 = Date.now();
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form), g = k => String(fd.get(k) || '').trim(), errs = [];
    $$('.inp.err', form).forEach(i => i.classList.remove('err')); $$('.fe', form).forEach(x => x.remove());
    const bad = (k, m) => { const i = form.elements[k]; if (i) { i.classList.add('err'); i.insertAdjacentHTML('afterend', '<div class="fe">' + m + '</div>'); } errs.push(m); };
    if (!g('name')) bad('name', 'Nama wajib diisi.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(g('email'))) bad('email', 'Format email tidak valid.');
    if (NEED_ORG.indexOf(type) >= 0 && !g('organization')) bad('organization', 'Institusi wajib diisi.');
    if (g('message').length < 10) bad('message', 'Pesan minimal 10 karakter.');
    if (!fd.get('consent')) errs.push('Centang persetujuan penyimpanan data.');
    const sum = $('#fsum', form); sum.classList.toggle('hide', !errs.length); sum.innerHTML = icon('alert') + '<div><b>Periksa kembali isian Anda:</b><br>' + errs.map(esc).join('<br>') + '</div>';
    if (errs.length) { sum.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    const fields = {}; (FORM_EXTRA[type] || []).forEach(f => { const v = g('x_' + f[0]); if (v) fields[f[0]] = v; });
    let attachment = null; const file = form.elements.att.files[0];
    const btn = $('#fsub', form); btn.disabled = true; btn.innerHTML = 'Mengirim…';
    try {
      if (file) attachment = { name: file.name, b64: await readFileB64(file, 4 * 1048576) };
      const r = await API.post('form.submit', { type: type, name: g('name'), email: g('email'), phone: g('phone'), organization: g('organization'), subject: g('subject'), message: g('message'), fields: fields, attachment: attachment, hp: g('hp'), elapsed: Date.now() - t0, consent: true }, { noauth: true });
      if (!r.success) throw new Error(r.message);
      onOk(r.data);
    } catch (err) { sum.classList.remove('hide'); sum.innerHTML = icon('alert') + '<div>' + esc(err.message) + '</div>'; btn.disabled = false; btn.innerHTML = icon('send', 's16') + ' Kirim Pengajuan'; }
  });
}
function receiptHtml(d) {
  return `<div class="card pad tc" style="max-width:560px;margin:0 auto"><div class="stat" style="justify-content:center;border:0"><div class="ico" style="background:var(--ok-bg);color:var(--ok);width:64px;height:64px;border-radius:50%">${icon('check', 's32')}</div></div><h2 style="margin-top:12px">Pengajuan diterima</h2><p class="muted">Terima kasih. Tim ERA akan meninjau dan menghubungi Anda melalui email.</p><div class="card hl pad mono" style="font-size:20px;letter-spacing:.04em" id="refbox">${esc(d.ref)}</div><div class="row" style="justify-content:center;margin-top:14px"><button class="btn btn-o btn-sm" data-copy="${esc(d.ref)}">${icon('copy', 's16')} Salin nomor</button><a class="btn btn-o btn-sm" href="#/contact/info">Cek status</a><a class="btn btn-p btn-sm" href="#/">Kembali ke Beranda</a></div></div>`;
}
Pages.collaboration = function (p) {
  const sub = p.sub || 'overview', M = menuOf('collaboration'), cur = subFrom('collaboration', sub), F = FORMS[sub];
  const main = Shell.public('collaboration');
  main.innerHTML = pageBanner({ crumbs: [['Collaboration', '/collaboration/overview'], [cur[1]]], eyebrow: 'Kemitraan & Partisipasi', title: F ? F.label : 'Kolaborasi Riset, Aliansi Akademik & Partisipasi Ekspedisi Limnologi', sub: F ? F.desc : 'Pilih jalur kemitraan yang sesuai dengan mandat institusi, agenda akademik, atau kepedulian Anda terhadap ekosistem perairan.' }) + subnav(M, sub) + '<section class="sec"><div class="wrap" id="cb"></div></section>';
  const host = $('#cb');
  if (!F) {
    host.innerHTML = `<div class="grid g3">${Object.keys(FORMS).map((k, i) => `<a class="card hov pad" href="#/collaboration/${k}"><div class="mono xs muted">JALUR ${String(i + 1).padStart(2, '0')}</div><div class="stat" style="padding:0;border:0;margin:12px 0"><div class="ico">${icon(FORMS[k].ic, 's24')}</div></div><h3>${esc(FORMS[k].label)}</h3><p class="muted sm">${esc(FORMS[k].desc)}</p><span class="btn btn-p btn-sm">Pilih skema ini ${icon('arrowR', 's16')}</span></a>`).join('')}</div>
    <h2 style="margin-top:56px">Alur Penelaahan & Penerbitan Izin</h2><div class="grid g4">${[['Verifikasi Administrasi', 'Kelengkapan dokumen dan kesesuaian dengan mandat ERA.'], ['Peer-Review Dewan Ilmiah', 'Telaah kelayakan metode, etika, dan dampak.'], ['Izin & Koordinasi Lapangan', 'Koordinasi otoritas kawasan, SIMAKSI, dan komunitas.'], ['MoU & Onboarding', 'Penandatanganan kesepakatan dan orientasi lapangan.']].map((s, i) => `<div class="card pad"><div class="big-num" style="color:var(--accent)">${String(i + 1).padStart(2, '0')}</div><h3 style="font-size:17px">${s[0]}</h3><p class="muted sm" style="margin:0">${s[1]}</p></div>`).join('')}</div>`;
  } else {
    host.innerHTML = `<div class="split" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)"><div class="card pad" id="fcard"><div class="mono xs muted">FORMULIR // ${esc(F.label.toUpperCase())}</div>${formHtml(sub)}</div><aside class="col"><div class="card pad hl"><h3 style="font-size:17px">${icon('shield')} Prosedur singkat</h3><ol class="sm" style="padding-left:18px;color:var(--muted)"><li>Isi formulir dan lampirkan proposal (opsional).</li><li>Anda menerima nomor referensi via email.</li><li>Tim ERA meninjau dan menghubungi Anda.</li></ol></div><div class="card pad"><h3 style="font-size:17px">Butuh bantuan?</h3><p class="muted sm">${esc(setting('EMAIL'))}<br>${esc(setting('PHONE'))}</p></div></aside></div>`;
    bindForm(host, sub, d => { $('#fcard').innerHTML = receiptHtml(d); });
  }
};
document.addEventListener('click', e => { const c = e.target.closest('[data-copy]'); if (c) { navigator.clipboard && navigator.clipboard.writeText(c.dataset.copy).then(() => toast('Disalin.')).catch(() => { }); } });

/* ============================================================
   KONTAK
   ============================================================ */
Pages.contact = function (p) {
  const sub = p.sub || 'info', M = menuOf('contact'), cur = subFrom('contact', sub);
  const main = Shell.public('contact');
  main.innerHTML = pageBanner({ crumbs: [['Contact', '/contact/info'], [cur[1]]], eyebrow: 'Institutional Liaison & Public Inquiries', title: cur[1] === 'Contact Information' ? 'Contact Us & Institutional Liaison' : cur[1], sub: 'Kanal resmi pertukaran data ilmiah, koordinasi riset, dan permohonan kemitraan.' }) + subnav(M, sub) + '<section class="sec"><div class="wrap" id="ct"></div></section>';
  const host = $('#ct');
  if (sub === 'info') {
    const st = (ERA.S.boot.home.locations || []).filter(l => l.kind === 'station' || l.kind === 'research');
    host.innerHTML = `<div class="split" style="grid-template-columns:1fr 1.2fr"><div class="col">${[['pin', 'Alamat', setting('ADDRESS')], ['mail', 'Email', setting('EMAIL')], ['phone', 'Telepon / WhatsApp', setting('PHONE')], ['clock', 'Jam layanan', setting('OFFICE_HOURS')]].map(c => `<div class="card pad row" style="flex-wrap:nowrap;align-items:flex-start"><div class="stat" style="padding:0;border:0"><div class="ico">${icon(c[0], 's24')}</div></div><div><div class="mono xs muted">${c[1].toUpperCase()}</div><div>${esc(c[2] || '—')}</div></div></div>`).join('')}</div><div class="map" id="cmap" style="min-height:360px"></div></div>
    <div class="card pad" style="margin-top:36px;max-width:720px" id="stc"><h3>${icon('search')} Cek status pengajuan</h3><p class="muted sm">Masukkan nomor referensi dari email tanda terima beserta alamat email pengaju.</p><form id="stf" class="grid g2" style="gap:12px">${fld('Nomor referensi', 'ref', { req: 1, ph: 'ERA-INQ-2026-0001' })}${fld('Email pengaju', 'email', { req: 1, type: 'email' })}<div><button class="btn btn-p" type="submit">Cek Status</button></div></form><div id="stres" style="margin-top:14px"></div></div>`;
    MapKit.with($('#cmap'), { wheel: false }, m => { const pts = []; st.forEach(l => { if (isFinite(l.latitude)) { pts.push([l.latitude, l.longitude]); MapKit.dot(l.latitude, l.longitude, '#20B8B0', 10).addTo(m).bindPopup('<b>' + esc(l.name) + '</b>'); } }); MapKit.fit(m, pts); });
    $('#stf').addEventListener('submit', async e => { e.preventDefault(); const fd = new FormData(e.target), r = $('#stres'); r.innerHTML = Views.lines(2); try { const d = await API.pub('pub.status', { ref: fd.get('ref'), email: fd.get('email') }); r.innerHTML = `<div class="notice ok">${icon('checkC')}<div><b>${esc(d.ref)}</b> — ${esc(d.type)}<br>Status: <b>${esc(d.statusLabel)}</b><br><span class="xs">Diterima ${esc(fmtDT(d.createdAt))} · Diperbarui ${esc(fmtDT(d.updatedAt))}</span></div></div>`; } catch (er) { r.innerHTML = `<div class="notice bad">${icon('alert')}<div>${esc(er.message)}</div></div>`; } });
  } else if (sub === 'message' || sub === 'partnership') {
    host.innerHTML = `<div class="card pad" id="fcard" style="max-width:820px;margin:auto"><div class="mono xs muted">FORMULIR // ${sub === 'message' ? 'KORESPONDENSI RESMI' : 'PARTNERSHIP INQUIRY'}</div>${formHtml(sub)}</div>`;
    bindForm(host, sub, d => { $('#fcard').innerHTML = receiptHtml(d); });
  } else if (sub === 'social') {
    const soc = [['SOCIAL_INSTAGRAM', 'Instagram', 'Dokumentasi lapangan & cerita ekspedisi'], ['SOCIAL_YOUTUBE', 'YouTube', 'Video ekspedisi & rekaman ROV'], ['SOCIAL_LINKEDIN', 'LinkedIn', 'Kemitraan & rekrutmen'], ['SOCIAL_GITHUB', 'GitHub', 'Repositori terbuka & kode analisis'], ['SOCIAL_ZENODO', 'Zenodo', 'Dataset & DOI publikasi'], ['SOCIAL_X', 'X / Twitter', 'Kabar singkat lapangan']].filter(s => validUrl(setting(s[0])));
    host.innerHTML = soc.length ? `<div class="grid g3">${soc.map(s => `<a class="card hov pad" target="_blank" rel="noopener noreferrer" href="${esc(setting(s[0]))}"><div class="mono xs muted">${esc(s[1].toUpperCase())}</div><h3 style="margin-top:6px">${esc(s[1])}</h3><p class="muted sm">${s[2]}</p><span class="btn btn-o btn-sm">Kunjungi ${icon('ext', 's16')}</span></a>`).join('')}</div>` : Views.empty('Kanal media sosial belum dikonfigurasi', 'Admin dapat menambahkannya di Settings → Identity.', '', 'globe');
  } else if (sub === 'faq') {
    const f = [['Bagaimana prosedur pengajuan kunjungan riset atau studi banding ke stasiun lapangan?', 'Ajukan melalui halaman Collaboration, pilih skema yang sesuai, dan lampirkan proposal singkat. Tim akan merespons dalam beberapa hari kerja.'], ['Apakah jumlah dan media apa yang dapat diminta atas data spesimen?', 'Metadata publik dapat diunduh dalam format Darwin Core. Peminjaman spesimen fisik diajukan lewat formulir Collaboration dengan surat pengantar institusi.'], ['Berapa lama waktu yang dibutuhkan untuk memproses usulan kemitraan resmi (MoU)?', 'Umumnya 3–8 minggu bergantung kelengkapan dokumen dan telaah Dewan Ilmiah.'], ['Ke mana laporan temuan satwa terancam atau gangguan habitat?', 'Gunakan Send a Message dengan subjek “Laporan Lapangan” dan sertakan foto serta koordinat bila ada.']];
    host.innerHTML = '<div style="max-width:820px">' + f.map(x => `<details class="acc"><summary>${esc(x[0])}${icon('chevD', 's16')}</summary><div>${esc(x[1])}</div></details>`).join('') + '</div>';
  }
};

/* ============================================================
   PENCARIAN
   ============================================================ */
Pages.search = async function (p, qp, T) {
  const q = (qp.get('q') || '').trim(), ent = qp.get('e') || '';
  const main = Shell.public('');
  main.innerHTML = `<section class="hero banner"><div class="wrap"><div class="eyebrow" style="color:#53dad1">Pencarian Portal</div><h1>Hasil pencarian</h1><form id="sf" class="row" style="margin-top:16px;flex-wrap:nowrap"><div class="inp-ic" style="flex:1">${icon('search')}<input class="inp" name="q" value="${esc(q)}" placeholder="Cari spesies, penelitian, publikasi…" aria-label="Kata kunci"></div><button class="btn btn-a" type="submit">Cari</button></form></div>${waveSvg()}</section><section class="sec" style="padding-top:32px"><div class="wrap split" style="grid-template-columns:240px minmax(0,1fr)"><aside class="fside" id="sfc"></aside><div id="sres"></div></div></section>`;
  $('#sf').onsubmit = e => { e.preventDefault(); Router.go('/search?q=' + encodeURIComponent(new FormData(e.target).get('q'))); };
  const R = $('#sres');
  if (q.length < 2) { R.innerHTML = Views.empty('Masukkan kata kunci', 'Minimal 2 karakter.', '', 'search'); $('#sfc').remove(); return; }
  R.innerHTML = Views.lines(6);
  try {
    const d = await API.pub('pub.search', { q: q, entity: ent });
    if (!T.ok()) return;
    const all = ent ? await API.pub('pub.search', { q: q }) : d, labels = { research: 'Research', expeditions: 'Expeditions', species: 'Species', specimens: 'Specimens', conservation: 'Conservation', publications: 'Publications', news: 'News', gallery: 'Gallery', knowledge: 'Knowledge', events: 'Events', locations: 'Locations' };
    $('#sfc').innerHTML = `<h4>Jenis konten</h4><a class="chk" href="#/search?q=${encodeURIComponent(q)}" style="${ent ? '' : 'font-weight:700'}">Semua <span class="muted xs">(${Object.values(all.counts || {}).reduce((a, b) => a + b, 0)})</span></a>` + Object.keys(all.counts || {}).map(k => `<a class="chk" href="#/search?q=${encodeURIComponent(q)}&e=${k}" style="${ent === k ? 'font-weight:700' : ''}">${labels[k] || k} <span class="muted xs">(${all.counts[k]})</span></a>`).join('');
    const re = new RegExp('(' + q.split(/\s+/).filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'ig');
    const hl = s => esc(s).replace(re, '<mark>$1</mark>');
    R.innerHTML = `<div class="muted sm" style="margin-bottom:8px">${d.total} hasil untuk “${esc(q)}”</div>` + (d.results.length ? d.results.map(r => `<a class="res" href="${viewLink(r.entity, r.id)}" style="color:inherit;text-decoration:none"><div class="thumb" style="width:72px;height:54px">${img(r.cover, r.title, r.id, 'fish')}</div><div><span class="stag">${esc(labels[r.entity] || r.entity)}</span> ${r.tag ? `<span class="muted xs">${esc(r.tag)}</span>` : ''}<h3 style="font-size:18px;margin:4px 0">${hl(r.title)}</h3><div class="muted sm clamp" style="-webkit-line-clamp:2">${hl(r.snippet)}</div></div></a>`).join('') : Views.empty('Tidak ada hasil', 'Coba kata kunci lain, misalnya nama danau atau genus.', '<a class="btn btn-o btn-sm" href="#/database/fish">Telusuri katalog</a>'));
  } catch (e) { pageErr(R, e); }
};

/* ============================================================
   LOGIN
   ============================================================ */
let _gis = null;
function loadGIS() {
  if (window.google && google.accounts) return Promise.resolve();
  if (_gis) return _gis;
  _gis = new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true; sc.onload = () => res(); sc.onerror = () => { _gis = null; rej(new Error('Layanan Google tidak dapat dimuat.')); }; document.head.appendChild(sc); });
  return _gis;
}
Pages.login = async function (p, qp, T) {
  if (Auth.on) { Router.go(qp.get('next') || '/app', true); return; }
  Shell.type = ''; if (document.body) document.body.classList.remove('has-tabbar');
  const next = qp.get('next') || '/app';
  const ready = API.ready();
  $('#app').innerHTML = `<div class="login-wrap"><div class="login-l"><a class="brand" href="#/" style="color:#fff!important"><span class="mk logo">${logoMark()}</span><span><b>${esc(setting('SITE_NAME', 'Ekspedisi Riset Akuatik'))}</b><small style="color:#9FC0DA">ERA LIMNOLOGY &amp; MARINE PORTAL</small></span></a><div><div class="eyebrow" style="color:#53dad1">Internal Back-Office</div><h1 style="margin-top:12px">Ruang kerja riset, kurasi, dan penerbitan data ilmiah.</h1><p style="color:#C7D9E9;max-width:46ch">Masuk untuk mengelola penelitian, ekspedisi, katalog spesies, spesimen, dan publikasi.</p></div><div class="mono xs" style="color:#8FAAC4">DATUM WGS84 · OPEN ACCESS CC-BY-NC 4.0</div></div>
  <div class="login-r"><div class="login-card"><div class="row sp" style="margin-bottom:6px"><span class="badge b-navy">Authorized accounts only</span><button class="btn btn-o btn-ic" data-theme-ic id="lt" aria-label="Ganti tema">${icon(Theme.get() === 'dark' ? 'sun' : 'moon')}</button></div><h2>Member &amp; Admin Login</h2><p class="muted">Gunakan akun Google yang telah didaftarkan admin.</p>
  <div id="lerr" class="notice bad hide" role="alert" style="margin-bottom:16px"></div>
  <div id="gbtn" style="min-height:44px;margin:18px 0">${Views.lines(1)}</div>
  <details class="acc" style="margin-top:6px"><summary>Login Google bermasalah?${icon('chevD', 's16')}</summary><div class="sm">Jika muncul <b>Error 400: origin_mismatch</b>, daftarkan alamat situs ini di Google Cloud Console → Credentials → OAuth client → <i>Authorized JavaScript origins</i>:<div class="row" style="margin:8px 0"><code class="mono" style="background:var(--surface);padding:6px 10px;border-radius:8px;color:var(--text)">${esc(location.origin || '')}</code><button type="button" class="btn btn-o btn-sm" data-copy="${esc(location.origin || '')}">${icon('copy', 's16')} Salin</button></div>Tanpa garis miring di akhir dan tanpa <code>#</code>. Perubahan dapat butuh beberapa menit untuk berlaku.</div></details>
  <div style="text-align:center;margin:10px 0"><button class="btn btn-o btn-sm" id="te">${icon('key', 's16')} Gunakan akses darurat</button></div>
  <form id="ef" class="hide col" style="margin-top:12px" autocomplete="off"><div class="notice warn">${icon('alert')}<div class="sm">Akses darurat hanya untuk admin bila login Google belum dikonfigurasi atau terkendala.</div></div>${fld('Nama pengguna', 'username', { req: 1, autocomplete: 'username' })}${fld('Kata sandi', 'password', { req: 1, type: 'password', autocomplete: 'current-password' })}<button class="btn btn-p btn-block" type="submit" id="eb">Masuk</button></form>
  <hr style="border:0;border-top:1px solid var(--border);margin:22px 0"><a href="#/" class="sm">${icon('arrowL', 's16')} Kembali ke situs publik</a></div></div></div>`;
  $('#lt').onclick = () => Theme.toggle();
  const err = m => { const e = $('#lerr'); e.classList.toggle('hide', !m); e.innerHTML = icon('alert') + '<div>' + esc(m || '') + '</div>'; };
  const done = d => { try { localStorage.setItem('era.seenlogin', '1'); } catch (x) { } Auth.save(d.token, d.me); Shell.type = ''; toast('Selamat datang, ' + (d.me.nama || d.me.email) + '.'); Router.go(next.indexOf('/') === 0 ? next : '/app'); };
  $('#te').onclick = () => $('#ef').classList.toggle('hide');
  $('#ef').onsubmit = async e => { e.preventDefault(); const fd = new FormData(e.target), b = $('#eb'); b.disabled = true; b.textContent = 'Memeriksa…'; err(''); try { const r = await API.post('auth.darurat', { username: fd.get('username'), password: fd.get('password') }, { noauth: true }); if (!r.success) throw new Error(r.message); done(r.data); } catch (x) { err(x.message); b.disabled = false; b.textContent = 'Masuk'; } };
  if (!ready) { $('#gbtn').innerHTML = '<div class="notice warn">' + icon('alert') + '<div>Backend belum terhubung. Isi <code>GAS_URL</code> di <code>js/config.js</code>.</div></div>'; return; }
  const gis = loadGIS();                                               // unduh skrip Google LANGSUNG, paralel dengan auth.config
  let cfg = null; try { cfg = JSON.parse(localStorage.getItem('era.authcfg') || 'null'); } catch (x) { }
  const fresh = API.pub('auth.config').then(c => { try { localStorage.setItem('era.authcfg', JSON.stringify(c)); } catch (x) { } return c; });
  if (!cfg) { try { cfg = await fresh; } catch (x) { $('#gbtn').innerHTML = ''; err(x.message); $('#ef').classList.remove('hide'); return; } } else fresh.catch(() => { });   // konfigurasi tersimpan → tombol muncul tanpa menunggu server
  if (!T.ok()) return;
  if (!cfg.googleClientId) { $('#gbtn').innerHTML = '<div class="notice info">' + icon('info') + '<div class="sm">Login Google belum dikonfigurasi. Masuk dengan akses darurat, lalu isi <b>Google Client ID</b> di Settings → Security.</div></div>'; $('#ef').classList.remove('hide'); return; }
  const init = () => {
    try {
      google.accounts.id.initialize({ client_id: cfg.googleClientId, ux_mode: 'popup', callback: async resp => { err(''); $('#gbtn').style.opacity = .5; try { const r = await API.post('auth.google', { credential: resp.credential }, { noauth: true }); if (!r.success) throw new Error(r.message); done(r.data); } catch (x) { err(x.message); $('#gbtn').style.opacity = 1; } } });
      $('#gbtn').innerHTML = ''; google.accounts.id.renderButton($('#gbtn'), { theme: Theme.get() === 'dark' ? 'filled_black' : 'outline', size: 'large', width: 340, text: 'signin_with', shape: 'rectangular' });
    } catch (x) { $('#gbtn').innerHTML = ''; err('Tidak dapat memuat tombol Google. Gunakan akses darurat.'); }
  };
  gis.then(init).catch(() => { $('#gbtn').innerHTML = ''; err('Layanan Google tidak dapat dimuat. Periksa koneksi atau gunakan akses darurat.'); });
};
