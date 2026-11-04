'use strict';
/* ERA Portal — admin.js : CMS bagian 1 (dashboard • daftar • editor • antrean • review) */
const ENT_IC = { research: 'flask', expeditions: 'compass', locations: 'pin', species: 'fish', distribution: 'globe', specimens: 'layers', conservation: 'leaf', publications: 'book', news: 'file', gallery: 'image', events: 'cal', knowledge: 'db', team: 'users', partners: 'handshake' };
function head(eyebrow, title, lead, actions) { return `<div class="row sp" style="align-items:flex-end;margin-bottom:8px;gap:16px"><div style="min-width:0"><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}</div><div class="row">${actions || ''}</div></div>`; }
function errBox(e) { return `<div class="empty">${icon('alert', 's32')}<h3>Tidak dapat memuat</h3><p>${esc(e.message || e)}</p><button class="btn btn-p btn-sm" onclick="Router.run()">Coba lagi</button></div>`; }
async function guard(btn, fn, okMsg) { if (btn) btn.disabled = true; try { const r = await fn(); if (okMsg) toast(okMsg); return r; } catch (e) { toast(e.message, 'err'); return undefined; } finally { if (btn) btn.disabled = false; } }
const titleOf = (entity, row) => row[SCH()[entity].title] || row.id;
const entLabel = k => (SCH()[k] || {}).label || k;
async function loadLists(force) {
  const L = ERA.S.lists; if (L && !force && Date.now() - L.t < 300000) return L;
  const get = async (entity, fallbackEnt) => { try { return (await API.call('content.list', { entity: entity, size: 100, status: 'all' })).rows; } catch (e) { try { return (await API.pub('pub.list', { entity: fallbackEnt || entity, size: 60 })).rows; } catch (x) { return []; } } };
  const [loc, spp] = await Promise.all([get('locations'), get('species')]);
  ERA.S.lists = { t: Date.now(), locations: loc.map(r => ({ id: r.id, name: r.name, latitude: r.latitude, longitude: r.longitude })), species: spp.map(r => ({ id: r.id, name: r.scientificName })) };
  return ERA.S.lists;
}
function addPicker() {
  const ks = Object.keys(SCH()).filter(k => Auth.can(SCH()[k].perm));
  const m = Modal.open({ title: 'Tambah data baru', body: `<div class="grid g2" style="gap:10px">${ks.map(k => `<button class="qa" data-k="${k}">${icon(ENT_IC[k] || 'file')}<div><b>${esc(SCH()[k].label)}</b><small>Buat draf baru</small></div></button>`).join('')}</div>` });
  m.el.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { m.close(); Router.go('/app/new/' + b.dataset.k); } });
}
async function previewModal(entity, id) {
  try {
    const d = await API.call('content.get', { entity: entity, id: id }), r = d.row, ex = await extraFor(entity, r);
    const m = Modal.open({ size: 'lg', title: 'Pratinjau — ' + titleOf(entity, r), body: `<div class="row" style="margin-bottom:14px">${stPill(r.status)}<span class="mono xs muted">${esc(r.id)}</span></div><div class="wm" id="pvx">${detailHtml(entity, r, ex)}</div>` });
    bindDetail($('#pvx', m.el), entity, r, ex);
  } catch (e) { toast(e.message, 'err'); }
}
async function extraFor(entity, r) {
  const x = {};
  try {
    const L = await loadLists();
    if (r.locationId) { const l = L.locations.filter(z => z.id === r.locationId)[0]; if (l) x.location = { name: l.name, latitude: l.latitude, longitude: l.longitude }; }
    if (entity === 'species' && r.id) { const d = await API.call('content.list', { entity: 'distribution', size: 100, status: 'all', filterField: 'speciesId', filterValue: r.id }); x.distribution = d.rows; }
  } catch (e) { }
  return x;
}

/* ============================================================
   DASHBOARD
   ============================================================ */
Pages.dash = async function (p, q, T) {
  const me = ERA.S.me, adm = me.role === 'admin', main = Shell.admin('dash', adm ? 'Console Desk' : 'My Workspace');
  main.innerHTML = Views.loading(4, 'g4');
  let d; try { d = await API.call('dash.get', {}); } catch (e) { if (T.ok()) main.innerHTML = errBox(e); return; }
  if (!T.ok()) return; Shell.applyBadges(d);
  if (adm) dashAdmin(main, d); else dashMember(main, d);
};
function dashAdmin(main, d) {
  const k = d.kpi, kp = [['flask', 'Active Research', k.research, 'projects', ''], ['compass', 'Expeditions', k.expeditions, 'campaigns', ''], ['book', 'Publications', k.publications, 'papers', ''], ['fish', 'Documented Taxa', k.species, 'taxa', ''], ['clip', 'Pending Approvals', k.pending, 'awaiting review', 'a1'], ['inbox', 'Public Inquiries', k.inquiriesNew, 'new · ' + k.inquiriesTotal + ' total', 'a2']];
  main.innerHTML = head('Ekspedisi Riset Akuatik · Executive Desk', 'Operational Command & Scientific Overview', 'Agregasi data langsung dari seluruh modul riset, ekspedisi, dan alur persetujuan editorial.', `<a class="btn btn-o" href="#/app/pdf">${icon('file', 's16')} Generate PDF</a><button class="btn btn-p" id="addb">${icon('plus', 's16')} New Scientific Entry</button>`) +
    (!d.setup.googleClient ? `<div class="notice warn" style="margin-top:12px">${icon('alert')}<div><b>Login Google belum aktif.</b> Isi Google Client ID agar anggota dapat masuk. <a href="#/app/settings?tab=security">Buka Settings → Security</a></div></div>` : '') +
    (d.setup.emergencyDefault ? `<div class="notice warn" style="margin-top:12px">${icon('key')}<div><b>Kredensial darurat masih bawaan.</b> Segera rotasi sandi akses darurat. <a href="#/app/settings?tab=security">Rotasi sekarang</a></div></div>` : '') +
    `<div class="kpis">${kp.map(x => `<div class="kpi ${x[4]}"><span class="ico">${icon(x[0])}</span><small>${x[1]}</small><b>${fmtNum(x[2])}</b><span>${x[3]}</span></div>`).join('')}</div>
    <div class="grid" style="grid-template-columns:1.6fr 1fr;gap:24px"><div class="pnl"><div class="pnl-h"><div><h2>Content & Data Submissions Velocity</h2><div class="muted sm">Entri baru vs. entri terbit per bulan (6 bulan terakhir)</div></div></div><div class="chart-box"><canvas id="c1" aria-label="Grafik velocity"></canvas></div></div>
    <div class="pnl"><div class="pnl-h"><div><h2>Biodiversity by Organism Group</h2><div class="muted sm">Distribusi taksa terdaftar</div></div></div><div class="chart-box"><canvas id="c2" aria-label="Grafik kelompok organisme"></canvas></div></div></div>
    <div class="grid" style="grid-template-columns:1.4fr 1fr;gap:24px"><div class="pnl"><div class="pnl-h"><div><h2>Awaiting Editorial Approval</h2><div class="muted sm">${d.awaiting.length} entri menunggu keputusan</div></div><a class="btn btn-o btn-sm" href="#/app/queue">Lihat semua ${icon('arrowR', 's16')}</a></div>${d.awaiting.length ? `<div class="tbl-w"><table class="tbl"><thead><tr><th>Title</th><th>Category</th><th>Submitter</th><th>Updated</th><th></th></tr></thead><tbody>${d.awaiting.map(a => `<tr><td><b>${esc(a.title)}</b><div class="code">${esc(a.id)}</div></td><td><span class="badge">${esc(a.entityLabel)}</span></td><td>${esc(a.createdByName || '—')}</td><td class="muted sm">${esc(ago(a.updatedAt))}</td><td><a class="btn btn-p btn-sm" href="#/app/review/${a.entity}/${a.id}">Review</a></td></tr>`).join('')}</tbody></table></div>` : Views.empty('Semua beres', 'Tidak ada entri yang menunggu persetujuan.', '', 'checkC')}</div>
    <div class="pnl"><div class="pnl-h"><div><h2>Public & Institutional Inquiries</h2><div class="muted sm">${k.inquiriesNew} baru</div></div><a class="btn btn-o btn-sm" href="#/app/inquiries">Inbox ${icon('arrowR', 's16')}</a></div>${d.inquiries.length ? d.inquiries.map(i => `<a class="qa" href="#/app/inquiries" style="text-decoration:none"><div style="flex:1;min-width:0"><b>${esc(i.name)}</b><small>${esc(i.organization || '—')} · ${esc(i.type)}</small></div><span class="badge ${i.status === 'new' ? 'b-solid' : ''}">${esc(i.status.replace('_', ' '))}</span></a>`).join('') : Views.empty('Belum ada pengajuan', '', '', 'inbox')}</div></div>
    <div class="grid" style="grid-template-columns:1.6fr 1fr;gap:24px"><div class="pnl"><div class="pnl-h"><div><h2>Audit & Publication Ledger Stream</h2><div class="muted sm">Jejak perubahan tak terhapus</div></div><a class="btn btn-o btn-sm" href="#/app/audit">Semua log</a></div><div class="logst">${d.logs.map(l => `<div class="it"><span class="badge b-navy" style="align-self:flex-start">${esc(String(l.action).replace(/_/g, ' '))}</span><div style="flex:1"><b>${esc(l.name || l.email)}</b> <span class="muted">· ${esc(l.entity || '')}</span><div class="sm muted">${esc(l.detail || '')}</div></div><span class="mono xs muted">${esc(fmtDT(l.time))}</span></div>`).join('') || '<p class="muted">Belum ada aktivitas.</p>'}</div></div>
    <div class="pnl"><div class="pnl-h"><h2>Administrative Quick Tasks</h2></div>${[['users', 'Provision Internal User', 'Daftarkan peneliti / pengulas', '/app/users'], ['file', 'Generate Report PDF', 'Susun laporan terstruktur', '/app/pdf'], ['folder', 'File Manager', 'Berkas & hak akses', '/app/files'], ['cog', 'Settings & Security', 'Identitas, kredensial, backup', '/app/settings']].map(t => `<a class="qa" href="#${t[3]}" style="text-decoration:none">${icon(t[0])}<div><b>${t[1]}</b><small>${t[2]}</small></div></a>`).join('')}</div></div>`;
  $('#addb').onclick = addPicker;
  Charts.make($('#c1'), { type: 'bar', data: { labels: d.velocity.map(v => v.month), datasets: [{ label: 'Verified / Published', data: d.velocity.map(v => v.verified), backgroundColor: Charts.pal[0], borderRadius: 6 }, { label: 'Raw Submissions', data: d.velocity.map(v => v.raw), backgroundColor: Charts.pal[2], borderRadius: 6 }] }, options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
  const g = Object.keys(d.groups); Charts.make($('#c2'), { type: 'doughnut', data: { labels: g, datasets: [{ data: g.map(x => d.groups[x]), backgroundColor: Charts.pal, borderWidth: 0 }] }, options: { cutout: '62%', plugins: { legend: { position: 'right' } } } });
}
function dashMember(main, d) {
  const me = ERA.S.me, cats = String(me.categories || '').split(',').filter(Boolean), c = d.counts;
  main.innerHTML = head('Station workspace', 'Field Researcher & Contributor Workspace', 'Selamat datang kembali, ' + (me.nama || me.email) + '.', `<button class="btn btn-p" id="addb">${icon('plus', 's16')} Add New Content</button>`) +
    `<div class="row" style="margin:6px 0 0"><span class="muted sm">Permitted domains:</span>${cats.map(k => `<a class="badge" href="#/app/content/${k}">${esc(entLabel(k))}</a>`).join('') || '<span class="muted sm">Belum ada — hubungi admin.</span>'}</div>
    <div class="kpis">${[['edit', 'Local Drafts', c.draft, 'unpublished working copies', ''], ['send', 'Submitted to Editorial', c.submitted, 'under admin review', ''], ['alert', 'Needs Revision', c.returned, 'action required', 'a3'], ['checkC', 'Published', c.published, 'live in portal', '']].map(x => `<div class="kpi ${x[4]}"><span class="ico">${icon(x[0])}</span><small>${x[1]}</small><b>${fmtNum(x[2])}</b><span>${x[3]}</span></div>`).join('')}</div>
    ${d.revisions.map(r => `<div class="notice ret" style="margin-bottom:14px;align-items:flex-start">${icon('alert')}<div style="flex:1"><b>Revision requested: ${esc(r.title)}</b> <span class="badge b-ret">${esc(r.entityLabel)}</span><div class="sm" style="margin-top:6px"><i>“${esc(r.reviewNote || '—')}”</i></div><div class="xs muted" style="margin-top:4px">${esc(r.reviewedBy || 'Admin')} · ${esc(ago(r.updatedAt))}</div></div><a class="btn btn-p btn-sm" href="#/app/edit/${r.entity}/${r.id}">Edit & Resubmit</a></div>`).join('')}
    <div class="pnl"><div class="pnl-h"><div><h2>Content & Specimen Repository</h2><div class="muted sm">Entri terbaru Anda</div></div></div>${d.mine.length ? `<div class="tbl-w"><table class="tbl"><thead><tr><th>Title</th><th>Category</th><th>Updated</th><th>Status</th><th></th></tr></thead><tbody>${d.mine.map(m => `<tr><td><b>${esc(m.title)}</b><div class="code">${esc(m.id)}</div></td><td><span class="badge">${esc(m.entityLabel)}</span></td><td class="muted sm">${esc(ago(m.updatedAt))}</td><td>${stPill(m.status)}</td><td class="acts">${['draft', 'returned'].indexOf(m.status) >= 0 ? `<a class="btn btn-o btn-sm" href="#/app/edit/${m.entity}/${m.id}">${icon('edit', 's16')} Edit</a>` : `<button class="btn btn-o btn-sm" data-pv="${m.entity}|${m.id}">${icon('eye', 's16')} Lihat</button>`}</td></tr>`).join('')}</tbody></table></div>` : Views.empty('Belum ada kontribusi', 'Mulai dengan menambahkan konten baru.', '', 'plus')}</div>
    <div class="pnl"><div class="pnl-h"><h2>Active Expedition Members</h2></div><div class="grid g4" style="gap:10px">${(d.team || []).map(t => `<div class="row" style="flex-wrap:nowrap"><span class="badge" style="width:34px;height:34px;justify-content:center">${esc((t.name || '?')[0])}</span><div><b class="sm">${esc(t.name)}</b><div class="xs muted">${esc(t.title || t.role)}</div></div></div>`).join('')}</div></div>`;
  $('#addb').onclick = addPicker;
  main.onclick = e => { const b = e.target.closest('[data-pv]'); if (b) { const [en, id] = b.dataset.pv.split('|'); previewModal(en, id); } };
}

/* ============================================================
   DAFTAR KONTEN
   ============================================================ */
Pages.content = async function (p, q, T) {
  const k = p.entity, E = SCH()[k];
  if (!E || !Auth.can(E.perm)) { toast('Anda tidak memiliki akses ke kategori ini.', 'warn'); Router.go('/app', true); return; }
  const adm = Auth.isAdmin, me = ERA.S.me, main = Shell.admin('c-' + k, E.label);
  const st = { status: q.get('status') || 'all', q: q.get('q') || '', page: 1, filter: '', sel: new Set() }; let rows = [], seq = 0;
  main.innerHTML = head('Content & collections', E.label, 'Kelola, ajukan, dan terbitkan entri ' + E.label.toLowerCase() + '.', `<button class="btn btn-o" id="xp">${icon('download', 's16')} Export CSV</button><a class="btn btn-p" href="#/app/new/${k}">${icon('plus', 's16')} Add New</a>`) +
    `<div class="pnl" style="margin-top:20px"><div class="ct-tabs" id="tabs"></div><div class="filters" style="grid-template-columns:2fr 1fr auto;box-shadow:none;margin-bottom:16px"><div><label class="f" for="fq">Cari</label><div class="inp-ic">${icon('search')}<input class="inp" id="fq" type="search" value="${esc(st.q)}" placeholder="Judul, kode, kata kunci…"></div></div>${E.filter ? `<div><label class="f" for="ff2">${esc((E.fields.filter(f => f.n === E.filter)[0] || {}).l || 'Filter')}</label><select class="inp" id="ff2"><option value="">Semua</option>${((E.fields.filter(f => f.n === E.filter)[0] || {}).opts || []).map(o => `<option>${esc(o)}</option>`).join('')}</select></div>` : '<span></span>'}<button class="btn btn-o" id="fr">Reset</button></div><div id="bulk" class="notice hide" style="margin-bottom:12px;align-items:center"></div><div id="tb">${Views.lines(5)}</div></div>`;
  const tb = $('#tb', main);
  async function load() {
    const my = ++seq;
    try {
      const d = await API.call('content.list', { entity: k, status: st.status, q: st.q, page: st.page, size: 15, filterField: st.filter ? E.filter : '', filterValue: st.filter });
      if (my !== seq || !T.ok()) return; rows = d.rows; draw(d);
    } catch (e) { if (my === seq && T.ok()) tb.innerHTML = errBox(e); }
  }
  function draw(d) {
    const tabs = [['all', 'All Records'], ['draft', 'Draft'], ['submitted', 'Submitted'], ['returned', 'Returned'], ['approved', 'Approved'], ['published', 'Published'], ['rejected', 'Rejected'], ['archived', 'Archived']];
    $('#tabs', main).innerHTML = tabs.map(t => `<button data-s="${t[0]}" class="${st.status === t[0] ? 'on' : ''}">${t[1]}<i>${d.counts[t[0]] === undefined ? 0 : d.counts[t[0]]}</i></button>`).join('');
    const own = r => adm || (r.createdBy === me.email);
    tb.innerHTML = d.rows.length ? `<div class="tbl-w"><table class="tbl"><thead><tr><th style="width:36px"><input type="checkbox" id="sa" aria-label="Pilih semua"></th><th>${esc(E.fields.filter(f => f.n === E.title)[0].l)}</th>${E.filter ? `<th>${esc((E.fields.filter(f => f.n === E.filter)[0] || {}).l || '')}</th>` : ''}<th>Contributor</th><th>Updated</th><th>Status</th><th>Actions</th></tr></thead><tbody>${d.rows.map(r => {
      const editable = adm || (r.createdBy === me.email && ['draft', 'returned'].indexOf(r.status) >= 0);
      return `<tr data-id="${esc(r.id)}" class="${st.sel.has(r.id) ? 'sel' : ''} ${r.status === 'returned' ? 'ret' : ''}"><td><input type="checkbox" data-sel="${esc(r.id)}" ${st.sel.has(r.id) ? 'checked' : ''} aria-label="Pilih"></td><td><div class="row" style="flex-wrap:nowrap;gap:12px">${E.cover ? `<div class="thumb">${img(r[E.cover], '', r.id, ENT_IC[k] === 'fish' ? 'fish' : 'wave')}</div>` : ''}<div style="min-width:0"><b>${esc(titleOf(k, r))}</b><div class="code">${esc(r.id)}</div></div></div></td>${E.filter ? `<td>${r[E.filter] ? `<span class="badge">${esc(r[E.filter])}</span>` : '—'}</td>` : ''}<td class="sm">${esc(r.createdByName || '—')}</td><td class="muted sm">${esc(ago(r.updatedAt))}</td><td>${stPill(r.status)}</td><td class="acts"><button class="btn btn-o btn-sm btn-ic" data-a="view" aria-label="Lihat" title="Lihat">${icon('eye', 's16')}</button>${editable ? `<a class="btn btn-o btn-sm btn-ic" href="#/app/edit/${k}/${esc(r.id)}" aria-label="Ubah" title="Ubah">${icon('edit', 's16')}</a>` : ''}${own(r) && ['draft', 'returned'].indexOf(r.status) >= 0 ? `<button class="btn btn-o btn-sm btn-ic" data-a="submit" aria-label="Ajukan" title="Ajukan untuk review">${icon('send', 's16')}</button>` : ''}${adm && ['submitted', 'approved'].indexOf(r.status) >= 0 ? `<a class="btn btn-p btn-sm" href="#/app/review/${k}/${esc(r.id)}">Review</a>` : ''}${adm && r.status === 'archived' ? `<button class="btn btn-o btn-sm" data-a="restore">Restore</button>` : ''}${(adm && r.status !== 'archived') || (!adm && r.createdBy === me.email && r.status === 'draft') ? `<button class="btn btn-d btn-sm btn-ic" data-a="del" aria-label="${adm ? 'Arsipkan' : 'Hapus'}" title="${adm ? 'Arsipkan' : 'Hapus draf'}">${icon('trash', 's16')}</button>` : ''}${adm && r.status === 'archived' ? `<button class="btn btn-d btn-sm btn-ic" data-a="perm" aria-label="Hapus permanen" title="Hapus permanen">${icon('x', 's16')}</button>` : ''}</td></tr>`;
    }).join('')}</tbody></table></div>` + pager(d.total, d.page, d.size) + `<div class="muted sm" style="margin-top:10px">Menampilkan ${d.rows.length} dari ${d.total} entri</div>` : Views.empty('Belum ada entri', st.q || st.status !== 'all' ? 'Tidak ada entri yang cocok dengan filter.' : 'Mulai dengan menambahkan entri pertama.', `<a class="btn btn-p btn-sm" href="#/app/new/${k}">${icon('plus', 's16')} Tambah baru</a>`, ENT_IC[k]);
    bulk();
  }
  function bulk() {
    const b = $('#bulk', main), n = st.sel.size; b.classList.toggle('hide', !n);
    b.innerHTML = `<b>${n} dipilih</b><span class="right row"><button class="btn btn-d btn-sm" data-a="bulkdel">${icon('trash', 's16')} ${adm ? 'Arsipkan' : 'Hapus draf'}</button><button class="btn btn-o btn-sm" data-a="bulkclr">Batal</button></span>`;
  }
  main.addEventListener('click', async e => {
    const t = e.target.closest('[data-s]'); if (t && t.parentNode.id === 'tabs') { st.status = t.dataset.s; st.page = 1; st.sel.clear(); load(); return; }
    const pg = e.target.closest('[data-p]'); if (pg && !pg.disabled) { st.page = Number(pg.dataset.p); load(); return; }
    const a = e.target.closest('[data-a]'); if (!a) return;
    const tr = a.closest('tr'), id = tr && tr.dataset.id, row = rows.filter(r => r.id === id)[0];
    switch (a.dataset.a) {
      case 'view': previewModal(k, id); break;
      case 'submit': if (await Modal.confirm({ title: 'Ajukan untuk review?', msg: 'Entri akan dikirim ke admin dan tidak dapat diubah selama diperiksa.', ok: 'Ajukan' })) { tr.style.opacity = .5; await guard(a, () => API.call('content.submit', { entity: k, id: id }), 'Terkirim untuk diperiksa admin.'); load(); Shell.refreshBadges(true); } break;
      case 'restore': await guard(a, () => API.call('content.review', { entity: k, id: id, decision: 'restore' }), 'Dipulihkan sebagai draft.'); load(); break;
      case 'del': case 'perm': {
        const perm = a.dataset.a === 'perm';
        if (await Modal.confirm({ title: perm ? 'Hapus permanen?' : (adm ? 'Arsipkan entri?' : 'Hapus draf?'), html: '<b>' + esc(titleOf(k, row)) + '</b><br>' + (perm ? 'Tindakan ini tidak dapat dibatalkan.' : adm ? 'Entri dipindahkan ke arsip dan ditarik dari situs publik.' : 'Draf akan dihapus.'), danger: true, ok: perm ? 'Hapus permanen' : (adm ? 'Arsipkan' : 'Hapus') })) {
          tr.style.opacity = .4;   // optimistis
          try { await API.call('content.delete', { entity: k, id: id, permanent: perm || undefined }); toast(perm ? 'Dihapus permanen.' : 'Selesai.'); } catch (er) { toast(er.message, 'err'); }
          load();
        } break;
      }
      case 'bulkdel': if (await Modal.confirm({ title: 'Proses ' + st.sel.size + ' entri?', msg: adm ? 'Entri terpilih akan diarsipkan.' : 'Draf terpilih akan dihapus.', danger: true, ok: 'Lanjutkan' })) { try { const r = await API.call('content.bulk', { entity: k, ids: Array.from(st.sel) }); toast(r.done + ' entri diproses.'); } catch (er) { toast(er.message, 'err'); } st.sel.clear(); load(); } break;
      case 'bulkclr': st.sel.clear(); load(); break;
    }
  });
  main.addEventListener('change', e => {
    const s = e.target.closest('[data-sel]'); if (s) { s.checked ? st.sel.add(s.dataset.sel) : st.sel.delete(s.dataset.sel); s.closest('tr').classList.toggle('sel', s.checked); bulk(); return; }
    if (e.target.id === 'sa') { rows.forEach(r => e.target.checked ? st.sel.add(r.id) : st.sel.delete(r.id)); $$('[data-sel]', main).forEach(c => { c.checked = e.target.checked; c.closest('tr').classList.toggle('sel', e.target.checked); }); bulk(); return; }
    if (e.target.id === 'ff2') { st.filter = e.target.value; st.page = 1; load(); }
  });
  $('#fq', main).addEventListener('input', debounce(e => { st.q = e.target.value.trim(); st.page = 1; load(); }, 350));
  $('#fr', main).onclick = () => { st.q = ''; st.filter = ''; st.status = 'all'; st.page = 1; $('#fq', main).value = ''; const f = $('#ff2', main); if (f) f.value = ''; load(); };
  $('#xp', main).onclick = async e => { const d = await guard(e.currentTarget, () => API.call('export.data', { entity: k, status: st.status, q: st.q })); if (d) { downloadText(d.filename, d.csv, 'text/csv;charset=utf-8'); toast(d.rows + ' baris diekspor.'); } };
  load();
};

/* ============================================================
   EDITOR (tambah / ubah)
   ============================================================ */
const UP_CAT = { research: { img: 'research', file: 'research_reports' }, expeditions: { img: 'expedition_photos', file: 'expedition_reports' }, species: { img: 'species_photos', file: 'species_photos' }, specimens: { img: 'species_photos', file: 'specimen_docs' }, conservation: { img: 'conservation', file: 'conservation' }, publications: { img: 'infographics', file: 'articles' }, team: { img: 'team' }, partners: { img: 'partners' } };
const catFor = (e, t) => ((UP_CAT[e] || {})[t === 'img' ? 'img' : 'file']) || 'media';
function ctl(f, v, L) {
  const n = 'f_' + f.n, val = v === undefined || v === null ? '' : v, full = ['long', 'img', 'file', 'url'].indexOf(f.t) >= 0;
  let c;
  switch (f.t) {
    case 'long': c = `<textarea class="inp" id="${n}" name="${n}" rows="${/content|findings|methods|description|body|morphology|ecology/i.test(f.n) ? 9 : 5}" maxlength="20000">${esc(val)}</textarea><div class="help">Format: <code>## Subjudul</code>, <code>- daftar</code>, <code>**tebal**</code> · <span data-cc="${n}">${String(val).length}</span>/20000</div>`; break;
    case 'select': c = `<select class="inp" id="${n}" name="${n}"><option value="">— pilih —</option>${f.opts.map(o => `<option value="${esc(o)}" ${String(val) === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`; break;
    case 'date': c = `<input class="inp" id="${n}" name="${n}" type="date" value="${esc(String(val).slice(0, 10))}">`; break;
    case 'num': c = `<input class="inp" id="${n}" name="${n}" type="number" step="any" value="${esc(val)}" inputmode="decimal">`; break;
    case 'bool': c = `<label class="row" style="gap:12px;min-height:44px"><span class="tog"><input type="checkbox" id="${n}" name="${n}" ${val === 'yes' ? 'checked' : ''}><span></span></span><span class="sm muted">${val === 'yes' ? 'Ya' : 'Tidak'}</span></label>`; break;
    case 'tags': c = `<input class="inp" id="${n}" name="${n}" value="${esc(val)}" placeholder="pisahkan dengan koma"><div class="row" style="margin-top:6px;gap:6px" data-tg="${n}">${String(val).split(',').filter(x => x.trim()).map(x => `<span class="badge">${esc(x.trim())}</span>`).join('')}</div>`; break;
    case 'loc': c = `<select class="inp" id="${n}" name="${n}"><option value="">— tidak ditentukan —</option>${L.locations.map(o => `<option value="${esc(o.id)}" ${String(val) === o.id ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select>`; break;
    case 'spp': c = `<select class="inp" id="${n}" name="${n}"><option value="">— pilih spesies —</option>${L.species.map(o => `<option value="${esc(o.id)}" ${String(val) === o.id ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select>`; break;
    case 'img': case 'file': case 'url': c = `<div class="upl"><input class="inp" id="${n}" name="${n}" value="${esc(val)}" placeholder="https://… atau unggah berkas" inputmode="url">${f.t !== 'url' ? `<button type="button" class="btn btn-o" data-up="${n}" data-t="${f.t}">${icon('upload', 's16')} Unggah</button><input type="file" hidden data-fi="${n}" accept="${f.t === 'img' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.pptx'}">` : ''}</div><div data-pv="${n}">${f.t === 'img' && val ? `<div class="prevbox">${img(val, '', n, 'wave')}</div>` : ''}</div>`; break;
    default: c = `<input class="inp" id="${n}" name="${n}" value="${esc(val)}" maxlength="300">`;
  }
  return `<div class="${full ? 'full' : ''}"><label class="f" for="${n}">${esc(f.l)}${f.req ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>${c}<div class="fe hide" data-e="${n}"></div></div>`;
}
function collect(form, E, id) {
  const rec = {}; if (id) rec.id = id;
  E.fields.forEach(f => { if (f.auto) return; const el = form.elements['f_' + f.n]; if (!el) return; rec[f.n] = f.t === 'bool' ? (el.checked ? 'yes' : 'no') : el.value; });
  return rec;
}
Pages.edit = async function (p, q, T) {
  const k = p.entity, E = SCH()[k], isNew = !p.id;
  if (!E || !Auth.can(E.perm)) { toast('Anda tidak memiliki akses ke kategori ini.', 'warn'); Router.go('/app', true); return; }
  const main = Shell.admin('c-' + k, E.label + (isNew ? ' / New' : ' / Edit')), adm = Auth.isAdmin;
  main.innerHTML = Views.lines(8);
  let row = {}, L;
  try { L = await loadLists(); if (!isNew) { const d = await API.call('content.get', { entity: k, id: p.id }); row = d.row; if (!d.canEdit) { toast('Entri ini tidak dapat diubah (status: ' + row.status + ').', 'warn'); Router.go('/app/content/' + k, true); return; } } } catch (e) { if (T.ok()) main.innerHTML = errBox(e); return; }
  if (!T.ok()) return;
  const key = 'era.draft.' + k + '.' + (p.id || 'new');
  let local = null; try { local = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { }
  if (local && (isNew ? Object.keys(local.rec).some(x => local.rec[x] && x !== 'id') : local.t > new Date(row.updatedAt).getTime())) {
    if (await Modal.confirm({ title: 'Pulihkan draf lokal?', msg: 'Ditemukan perubahan yang belum tersimpan dari ' + fmtDT(local.t) + '. Pulihkan?', ok: 'Pulihkan' })) row = Object.assign({}, row, local.rec); else localStorage.removeItem(key);
  }
  const secs = [], idx = {}; E.fields.forEach(f => { if (f.auto) return; const s = f.s || 'Details'; if (idx[s] === undefined) { idx[s] = secs.length; secs.push({ name: s, fields: [] }); } secs[idx[s]].fields.push(f); });
  const hasCoord = E.fields.some(f => f.n === 'latitude') && E.fields.some(f => f.n === 'longitude');
  main.innerHTML = `<div class="row sp" style="margin-bottom:8px"><a class="sm" href="#/app/content/${k}">${icon('arrowL', 's16')} Kembali ke ${esc(E.label)}</a><div class="row"><span class="badge b-info" id="saved">Belum ada perubahan</span>${!isNew ? `<button class="btn btn-o btn-sm" data-vh>${icon('hist', 's16')} Riwayat</button>` : ''}</div></div>
  <div class="row" style="margin-bottom:6px"><h1 style="margin:0">${isNew ? 'Add New ' + esc(E.label) : esc(titleOf(k, row))}</h1>${stPill(row.status || 'draft')}</div>${!isNew ? `<div class="mono xs muted">${esc(row.id)} · v${row.version || 1}</div>` : ''}
  ${row.status === 'returned' && row.reviewNote ? `<div class="notice ret" style="margin:16px 0;align-items:flex-start">${icon('alert')}<div><b>Administrative action required — revision note${row.reviewedBy ? ' dari ' + esc(row.reviewedBy) : ''}</b><div style="margin-top:6px"><i>“${esc(row.reviewNote)}”</i></div></div></div>` : ''}
  <form id="ef" novalidate style="margin-top:18px">${secs.map((s, i) => `<section class="fsec"><h2><span class="nn">${String(i + 1).padStart(2, '0')}</span>${esc(s.name)}</h2><div class="fgrid">${s.fields.map(f => ctl(f, row[f.n], L)).join('')}${s.name === 'Location' && hasCoord ? '<div class="full"><div class="map" id="pick" style="height:260px"></div><div class="help">Klik peta atau seret penanda untuk menetapkan koordinat (WGS84).</div></div>' : ''}</div></section>`).join('')}
  ${k === 'species' ? `<section class="fsec" id="dsec"><h2><span class="nn">${String(secs.length + 1).padStart(2, '0')}</span>Distribution Points</h2><div id="dist"></div></section>` : ''}
  <div class="actbar"><button type="button" class="btn btn-d" id="dsc">${icon('trash', 's16')} Discard</button><span class="muted sm right" id="ls"></span><button type="button" class="btn btn-o" id="pvw">${icon('eye', 's16')} Preview</button><button type="button" class="btn btn-o" id="sd">${icon('check', 's16')} Save Draft</button>${adm ? `<button type="button" class="btn btn-o" id="pb">${icon('globe', 's16')} Publish</button>` : ''}<button type="button" class="btn btn-p" id="sb">${icon('send', 's16')} Submit for Review</button></div></form>`;
  const form = $('#ef', main); let id = p.id || '', dirty = false;
  const markSaved = t => { $('#saved').textContent = t; };
  // koordinat + peta pemilih
  if (hasCoord) {
    const lat = form.elements.f_latitude, lng = form.elements.f_longitude, el = $('#pick'), pt = () => (isFinite(parseFloat(lat.value)) && isFinite(parseFloat(lng.value))) ? [parseFloat(lat.value), parseFloat(lng.value)] : null;
    const m = MapKit.create(el, { center: pt() || [-2.2, 120.8], zoom: pt() ? 10 : 7 });
    if (m) { let mk = null; const put = ll => { if (mk) mk.setLatLng(ll); else { mk = L_marker(ll, m, c => { lat.value = c.lat.toFixed(6); lng.value = c.lng.toFixed(6); form.dispatchEvent(new Event('input')); }); } }; if (pt()) put(pt()); m.on('click', e => { lat.value = e.latlng.lat.toFixed(6); lng.value = e.latlng.lng.toFixed(6); put([e.latlng.lat, e.latlng.lng]); form.dispatchEvent(new Event('input')); }); [lat, lng].forEach(i => i.addEventListener('change', () => { const c = pt(); if (c) { put(c); m.setView(c, Math.max(m.getZoom(), 10)); } })); }
  }
  form.addEventListener('change', e => {
    if (e.target.name === 'f_locationId' && hasCoord) { const l = L.locations.filter(x => x.id === e.target.value)[0]; if (l && isFinite(l.latitude) && !form.elements.f_latitude.value) { form.elements.f_latitude.value = l.latitude; form.elements.f_longitude.value = l.longitude; form.elements.f_latitude.dispatchEvent(new Event('change')); } }
    if (e.target.type === 'checkbox' && e.target.closest('.tog')) e.target.closest('label').querySelector('.sm').textContent = e.target.checked ? 'Ya' : 'Tidak';
    if (e.target.dataset.fi) upload(e.target);
  });
  form.addEventListener('input', e => {
    dirty = true; markSaved('Perubahan belum disimpan');
    const cc = e.target.name && $('[data-cc="' + e.target.name + '"]', form); if (cc) cc.textContent = e.target.value.length;
    const tg = e.target.name && $('[data-tg="' + e.target.name + '"]', form); if (tg) tg.innerHTML = e.target.value.split(',').filter(x => x.trim()).map(x => `<span class="badge">${esc(x.trim())}</span>`).join('');
    const pv = e.target.name && $('[data-pv="' + e.target.name + '"]', form); if (pv && e.target.closest('.upl') && e.target.type !== 'file') pv.innerHTML = validUrl(e.target.value) && /image|thumbnail|\.(png|jpe?g|webp|gif)/i.test(e.target.value + e.target.name) ? `<div class="prevbox">${img(e.target.value, '', e.target.name, 'wave')}</div>` : '';
    autosave();
  });
  const autosave = debounce(() => { try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), rec: collect(form, E, id) })); $('#ls').textContent = 'Disimpan lokal ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); } catch (e) { } }, 900);
  form.addEventListener('click', e => { const b = e.target.closest('[data-up]'); if (b) form.querySelector('[data-fi="' + b.dataset.up + '"]').click(); });
  async function upload(inp) {
    const file = inp.files[0]; if (!file) return; const n = inp.dataset.fi, t = form.querySelector('[data-up="' + n + '"]').dataset.t, btn = form.querySelector('[data-up="' + n + '"]');
    btn.disabled = true; btn.innerHTML = 'Mengunggah…';
    try { const b64 = await readFileB64(file, 9 * 1048576); const r = await API.call('file.upload', { name: file.name, b64: b64, category: catFor(k, t), entity: k }); form.elements[n].value = r.url; form.elements[n].dispatchEvent(new Event('input', { bubbles: true })); toast('Berkas diunggah (' + r.access + ').'); }
    catch (er) { toast(er.message, 'err'); } finally { btn.disabled = false; btn.innerHTML = icon('upload', 's16') + ' Unggah'; inp.value = ''; }
  }
  function validate(full) {
    $$('.inp.err', form).forEach(i => i.classList.remove('err')); $$('.fe', form).forEach(x => { x.classList.add('hide'); x.textContent = ''; });
    const miss = []; const rec = collect(form, E, id);
    E.fields.forEach(f => { if (f.auto) return; const need = full ? f.req : f.n === E.title; if (need && !String(rec[f.n] || '').trim() && !(k === 'specimens' && f.n === 'code')) { miss.push(f); const el = form.elements['f_' + f.n], er = $('[data-e="f_' + f.n + '"]', form); if (el) el.classList.add('err'); if (er) { er.textContent = f.l + ' wajib diisi.'; er.classList.remove('hide'); } } });
    ['latitude', 'longitude'].forEach(c => { const v = rec[c]; if (v !== undefined && v !== '' && (!isFinite(Number(v)) || Math.abs(Number(v)) > (c === 'latitude' ? 90 : 180))) { miss.push({ l: c }); const er = $('[data-e="f_' + c + '"]', form); if (er) { er.textContent = 'Nilai ' + c + ' tidak valid.'; er.classList.remove('hide'); } } });
    if (miss.length) { toast('Lengkapi: ' + miss.map(m => m.l).slice(0, 4).join(', ') + (miss.length > 4 ? '…' : ''), 'err'); const first = $('.inp.err', form); if (first) first.focus(); }
    return !miss.length;
  }
  async function save(full) {
    if (!validate(full)) return null;
    const r = await API.call('content.save', { entity: k, record: collect(form, E, id) });
    id = r.id; dirty = false; localStorage.removeItem(key); markSaved('Tersimpan ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })); return r;
  }
  $('#sd').onclick = async e => { const r = await guard(e.currentTarget, () => save(false), 'Draf tersimpan.'); if (r && isNew) Router.go('/app/edit/' + k + '/' + id, true); };
  $('#sb').onclick = async e => { const b = e.currentTarget; if (!validate(true)) return; if (!await Modal.confirm({ title: 'Ajukan untuk review?', msg: 'Perubahan disimpan dan dikirim ke admin. Entri tidak dapat diubah selama diperiksa.', ok: 'Ajukan' })) return; await guard(b, async () => { await save(true); await API.call('content.submit', { entity: k, id: id }); toast('Terkirim untuk diperiksa admin.'); Router.go('/app/content/' + k); Shell.refreshBadges(true); }); };
  if (adm) $('#pb').onclick = async e => { if (!validate(true)) return; if (!await Modal.confirm({ title: 'Terbitkan sekarang?', msg: 'Entri akan langsung tampil di situs publik.', ok: 'Terbitkan' })) return; await guard(e.currentTarget, async () => { await save(true); if (row.status === 'submitted' || row.status === 'draft' || row.status === 'returned' || row.status === 'approved' || !row.status) await API.call('content.review', { entity: k, id: id, decision: 'publish' }); toast('Diterbitkan.'); Router.go('/app/content/' + k); }); };
  $('#dsc').onclick = async () => { if (!dirty || await Modal.confirm({ title: 'Buang perubahan?', msg: 'Perubahan yang belum disimpan akan hilang.', danger: true, ok: 'Buang' })) { localStorage.removeItem(key); Router.go('/app/content/' + k); } };
  $('#pvw').onclick = async () => { const rec = collect(form, E, id), ex = await extraFor(k, Object.assign({}, row, rec)); const m = Modal.open({ size: 'lg', title: 'Pratinjau (belum tersimpan)', body: `<div class="notice" style="margin-bottom:16px">${icon('info')}<div>Tampilan berikut seperti di portal publik setelah diterbitkan.</div></div><div class="wm" id="pvx">${detailHtml(k, rec, ex)}</div>` }); bindDetail($('#pvx', m.el), k, rec, ex); };
  const vh = $('[data-vh]', main); if (vh) vh.onclick = () => versionsModal(k, id);
  if (k === 'species') distEditor($('#dist'), id, L, adm);
  window.onbeforeunload = () => dirty ? 'Perubahan belum disimpan' : undefined; Router.cleanup(() => { window.onbeforeunload = null; });
};
function L_marker(ll, map, onDrag) { const m = L.marker(ll, { draggable: true }).addTo(map); m.on('dragend', () => onDrag(m.getLatLng())); return m; }
async function versionsModal(k, id) {
  try { const d = await API.call('versions.list', { entity: k, id: id }); Modal.open({ title: 'Riwayat versi', body: d.versions.length ? `<div class="vtl">${d.versions.map(v => `<div><b>v${v.version}</b> · ${esc(v.note || '')}<div class="muted xs">${esc(v.savedBy)} · ${esc(fmtDT(v.savedAt))}</div></div>`).join('')}</div>` : '<p class="muted">Belum ada versi tersimpan (dibuat saat diajukan/diterbitkan).</p>' }); } catch (e) { toast(e.message, 'err'); }
}

/* ---- editor titik distribusi (spesies) ---- */
async function distEditor(host, speciesId, L, adm) {
  if (!speciesId) { host.innerHTML = '<div class="notice">' + icon('info') + '<div>Simpan draf spesies terlebih dahulu, lalu tambahkan titik distribusi (lokasi, koordinat, kedalaman).</div></div>'; return; }
  let rows = [];
  const draw = () => {
    host.innerHTML = `<div class="tbl-w"><table class="tbl"><thead><tr><th>Location</th><th>Latitude</th><th>Longitude</th><th>Depth (m)</th><th>Date</th><th></th></tr></thead><tbody>${rows.map((r, i) => `<tr data-i="${i}"><td><select class="inp" data-f="locationId"><option value="">—</option>${L.locations.map(l => `<option value="${esc(l.id)}" ${r.locationId === l.id ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select></td><td><input class="inp" data-f="latitude" type="number" step="any" value="${esc(r.latitude)}"></td><td><input class="inp" data-f="longitude" type="number" step="any" value="${esc(r.longitude)}"></td><td><input class="inp" data-f="depth" type="number" step="any" value="${esc(r.depth)}" style="max-width:90px"></td><td><input class="inp" data-f="collectedDate" type="date" value="${esc(String(r.collectedDate || '').slice(0, 10))}"></td><td class="acts"><button type="button" class="btn btn-p btn-sm" data-sv>${icon('check', 's16')}</button><button type="button" class="btn btn-d btn-sm btn-ic" data-rm aria-label="Hapus">${icon('trash', 's16')}</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted tc">Belum ada titik distribusi.</td></tr>'}</tbody></table></div><div class="row" style="margin-top:12px"><button type="button" class="btn btn-o btn-sm" data-add>${icon('plus', 's16')} Tambah titik</button><span class="muted sm">Titik ikut tayang di peta publik saat spesies diterbitkan.</span></div>`;
  };
  try { rows = (await API.call('content.list', { entity: 'distribution', size: 100, status: 'all', filterField: 'speciesId', filterValue: speciesId })).rows; } catch (e) { }
  draw();
  host.addEventListener('click', async e => {
    if (e.target.closest('[data-add]')) { rows.push({ speciesId: speciesId, locationId: '', latitude: '', longitude: '', depth: '', collectedDate: '' }); draw(); return; }
    const tr = e.target.closest('tr[data-i]'); if (!tr) return; const i = Number(tr.dataset.i), r = rows[i];
    if (e.target.closest('[data-sv]')) {
      $$('[data-f]', tr).forEach(inp => { r[inp.dataset.f] = inp.value; });
      if (r.latitude === '' || r.longitude === '') { toast('Isi latitude dan longitude.', 'warn'); return; }
      await guard(e.target.closest('button'), async () => { const s = await API.call('content.save', { entity: 'distribution', record: { id: r.id, speciesId: speciesId, locationId: r.locationId, latitude: r.latitude, longitude: r.longitude, depth: r.depth, collectedDate: r.collectedDate } }); r.id = s.id; if (adm) { try { await API.call('content.review', { entity: 'distribution', id: r.id, decision: 'publish' }); } catch (x) { } } }, 'Titik tersimpan.');
    }
    if (e.target.closest('[data-rm]')) { if (r.id) { try { await API.call('content.delete', { entity: 'distribution', id: r.id, permanent: true }); } catch (x) { toast(x.message, 'err'); return; } } rows.splice(i, 1); draw(); }
  });
  host.addEventListener('change', e => { const tr = e.target.closest('tr[data-i]'); if (tr && e.target.dataset.f === 'locationId') { const l = L.locations.filter(x => x.id === e.target.value)[0], r = rows[Number(tr.dataset.i)]; if (l && isFinite(l.latitude)) { const la = $('[data-f=latitude]', tr), lo = $('[data-f=longitude]', tr); if (!la.value) la.value = l.latitude; if (!lo.value) lo.value = l.longitude; } void r; } });
}

/* ============================================================
   ANTREAN & REVISI
   ============================================================ */
Pages.queue = async function (p, q, T) {
  const main = Shell.admin('queue', 'Approvals'); let tab = q.get('tab') || 'submitted'; main.innerHTML = Views.lines(6);
  async function load() {
    let d; try { d = await API.call('queue.list', { tab: tab }); } catch (e) { if (T.ok()) main.innerHTML = errBox(e); return; }
    if (!T.ok()) return;
    const tabs = [['submitted', 'Submitted'], ['returned', 'Returned for Revision'], ['approved', 'Approved & Ready'], ['rejected', 'Rejected / Archived']];
    main.innerHTML = head('Triage', 'Editorial Peer Review & Approval Workbench', 'Pemeriksaan kelengkapan, kualitas data, dan keputusan penerbitan.') + `<div class="pnl" style="margin-top:20px"><div class="ct-tabs">${tabs.map(t => `<button data-t="${t[0]}" class="${tab === t[0] ? 'on' : ''}">${t[1]}<i>${d.counts[t[0]]}</i></button>`).join('')}</div>${d.rows.length ? `<div class="tbl-w"><table class="tbl"><thead><tr><th>Title</th><th>Category</th><th>Submitter</th><th>Ver.</th><th>Updated</th><th>Status</th><th></th></tr></thead><tbody>${d.rows.map(r => `<tr><td><b>${esc(r.title)}</b><div class="code">${esc(r.id)}</div>${r.reviewNote && tab === 'returned' ? `<div class="xs muted" style="margin-top:4px"><i>“${esc(r.reviewNote.slice(0, 90))}”</i></div>` : ''}</td><td><span class="badge">${esc(r.entityLabel)}</span></td><td class="sm">${esc(r.createdByName || '—')}</td><td class="mono xs">v${r.version}</td><td class="muted sm">${esc(ago(r.updatedAt))}</td><td>${stPill(r.status)}</td><td><a class="btn btn-p btn-sm" href="#/app/review/${r.entity}/${esc(r.id)}">${tab === 'submitted' ? 'Review' : 'Buka'}</a></td></tr>`).join('')}</tbody></table></div>` : Views.empty(tab === 'submitted' ? 'All caught up' : 'Tidak ada entri', tab === 'submitted' ? 'Tidak ada konten yang menunggu review.' : '', '', 'checkC')}</div>`;
    main.querySelector('.ct-tabs').onclick = e => { const b = e.target.closest('[data-t]'); if (b) { tab = b.dataset.t; load(); } };
    Shell.refreshBadges(true);
  }
  load();
};
Pages.revisions = async function (p, q, T) {
  const main = Shell.admin('rev', 'Revisions'); main.innerHTML = Views.lines(4);
  try {
    const d = await API.call('dash.get', {}); if (!T.ok()) return;
    const all = d.mine.filter(m => m.status === 'returned').concat(d.revisions.filter(r => !d.mine.some(m => m.id === r.id)));
    main.innerHTML = head('Editorial feedback', 'Revision Requests', 'Catatan dari admin untuk entri yang dikembalikan.') + (all.length ? all.map(r => `<div class="notice ret" style="margin:14px 0;align-items:flex-start">${icon('alert')}<div style="flex:1"><b>${esc(r.title)}</b> <span class="badge b-ret">${esc(r.entityLabel)}</span><div class="sm" style="margin-top:6px"><i>“${esc(r.reviewNote || '—')}”</i></div><div class="xs muted" style="margin-top:4px">${esc(r.reviewedBy || 'Admin')} · ${esc(ago(r.updatedAt))}</div></div><a class="btn btn-p btn-sm" href="#/app/edit/${r.entity}/${esc(r.id)}">Edit & Resubmit</a></div>`).join('') : `<div class="pnl">${Views.empty('Tidak ada revisi', 'Semua entri Anda sudah sesuai.', '', 'checkC')}</div>`);
  } catch (e) { main.innerHTML = errBox(e); }
};

/* ============================================================
   REVIEW WORKBENCH
   ============================================================ */
function qualityChecks(E, r) {
  const out = [], miss = E.fields.filter(f => f.req && !String(r[f.n] === undefined ? '' : r[f.n]).trim()).map(f => f.l);
  out.push(miss.length ? ['b', 'Kolom wajib belum lengkap', miss.join(', ')] : ['o', 'Kolom wajib lengkap', 'Semua field bertanda * terisi.']);
  if (E.fields.some(f => f.n === 'latitude')) { const la = Number(r.latitude), lo = Number(r.longitude), has = r.latitude !== '' && r.longitude !== '' && r.latitude !== undefined; out.push(has && Math.abs(la) <= 90 && Math.abs(lo) <= 180 ? ['o', 'Koordinat WGS84 valid', coord(la, 'N', 'S') + ' · ' + coord(lo, 'E', 'W')] : ['w', 'Koordinat belum lengkap', 'Latitude/longitude kosong atau di luar rentang.']); }
  if (E.cover) out.push(r[E.cover] ? ['o', 'Media utama terlampir', 'Gambar sampul/foto tersedia.'] : ['w', 'Belum ada media utama', 'Tambahkan foto agar tampil optimal di situs.']);
  if (E.key === 'species') { out.push(/^[A-Z][a-z]+ [a-z-]+/.test(String(r.scientificName || '')) ? ['o', 'Nama binomial valid', r.scientificName] : ['w', 'Format nama ilmiah', 'Gunakan Genus species (mis. Oryzias nigrimas).']); const tx = ['kingdom', 'phylum', 'className', 'orderName', 'family', 'genus'].filter(x => !r[x]); out.push(tx.length ? ['w', 'Hierarki taksonomi belum lengkap', 'Kosong: ' + tx.join(', ')] : ['o', 'Hierarki taksonomi lengkap', 'Kingdom → Genus terisi.']); }
  const long = E.fields.filter(f => f.t === 'long' && f.req).filter(f => String(r[f.n] || '').length < 60); if (long.length) out.push(['w', 'Teks terlalu singkat', long.map(f => f.l).join(', ')]);
  return out;
}
function diffRows(E, cur, prev) {
  const ch = E.fields.filter(f => String(cur[f.n] === undefined ? '' : cur[f.n]) !== String(prev[f.n] === undefined ? '' : prev[f.n]));
  return ch.length ? `<div class="tbl-w"><table class="tbl"><thead><tr><th>Field</th><th>Sebelumnya</th><th>Sekarang</th></tr></thead><tbody>${ch.map(f => `<tr><td><b>${esc(f.l)}</b></td><td><span class="diff-old">${esc(prev[f.n] || '—')}</span></td><td><span class="diff-new">${esc(cur[f.n] || '—')}</span></td></tr>`).join('')}</tbody></table></div>` : Views.empty('Tidak ada perbedaan', 'Belum ada versi sebelumnya untuk dibandingkan.', '', 'checkC');
}
Pages.review = async function (p, q, T) {
  const k = p.entity, E = SCH()[k]; if (!E) { Router.go('/app', true); return; }
  const main = Shell.admin('queue', 'Approvals / Review'); main.innerHTML = Views.lines(8);
  let d, v, r, ex;
  try { d = await API.call('content.get', { entity: k, id: p.id }); r = d.row; [v, ex] = await Promise.all([API.call('versions.list', { entity: k, id: p.id }), extraFor(k, r)]); } catch (e) { if (T.ok()) main.innerHTML = errBox(e); return; }
  if (!T.ok()) return;
  const chk = qualityChecks(E, r), pass = chk.filter(c => c[0] === 'o').length, blocked = chk.some(c => c[0] === 'b'), prev = v.versions.filter(x => x.snapshot && String(x.version) !== String(r.version))[0];
  const dec = r.status;
  main.innerHTML = `<div class="row sp" style="margin-bottom:8px"><a class="sm" href="#/app/queue">${icon('arrowL', 's16')} Kembali ke antrean</a><span class="mono xs muted">${esc(E.label.toUpperCase())} · ${esc(r.id)}</span></div>
  <div class="row" style="margin-bottom:16px"><h1 style="margin:0">${esc(titleOf(k, r))}</h1>${stPill(dec)}<span class="badge">v${r.version || 1}</span></div>
  <div class="rev"><div><div class="pnl" style="padding:0"><div class="tabs" style="padding:0 16px;margin:0" id="rt"><button data-t="pv" class="on">Public Portal Preview</button><button data-t="dw">Darwin Core JSON</button><button data-t="df">Diff View${prev ? ' (v' + prev.version + ' → v' + (r.version || 1) + ')' : ''}</button></div><div style="padding:24px"><div data-pane="pv" class="wm" id="pvx">${detailHtml(k, r, ex)}</div><div data-pane="dw" class="hide"><pre class="json" tabindex="0">${esc(JSON.stringify(dwc(k, r), null, 2))}</pre></div><div data-pane="df" class="hide">${prev ? diffRows(E, r, prev.snapshot) : Views.empty('Belum ada versi sebelumnya', 'Perbandingan tersedia setelah entri diajukan lebih dari sekali.', '', 'hist')}</div></div></div></div>
  <aside class="col"><div class="pnl" style="margin:0"><div class="eyebrow">Submitting contributor</div><div class="row" style="margin-top:10px;flex-wrap:nowrap"><span class="badge b-navy" style="width:44px;height:44px;justify-content:center;font-size:15px">${esc((r.createdByName || '?').split(' ').map(x => x[0]).slice(0, 2).join(''))}</span><div><b>${esc(r.createdByName || '—')}</b><div class="xs muted">${esc(r.createdBy)} · dibuat ${esc(fmtDate(r.createdAt))}</div></div></div></div>
  <div class="pnl" style="margin:0"><div class="pnl-h" style="margin-bottom:10px"><h2 style="font-size:17px">Data Quality & Darwin Core</h2><span class="badge">${pass}/${chk.length} PASS</span></div>${chk.map(c => `<div class="chk-i ${c[0] === 'w' ? 'w' : c[0] === 'b' ? 'b' : ''}">${icon(c[0] === 'o' ? 'checkC' : 'alert')}<div><b>${esc(c[1])}</b><div class="xs muted">${esc(c[2])}</div></div></div>`).join('')}</div>
  <div class="pnl" style="margin:0"><div class="pnl-h" style="margin-bottom:10px"><h2 style="font-size:17px">Audit Trail & Versions</h2></div>${v.versions.length ? `<div class="vtl">${v.versions.map(x => `<div><b>v${x.version}</b> · ${esc(x.note || '')}<div class="xs muted">${esc(x.savedBy)} · ${esc(fmtDT(x.savedAt))}</div></div>`).join('')}</div>` : '<p class="muted sm">Belum ada riwayat versi.</p>'}${r.reviewNote ? `<div class="notice ret" style="margin-top:12px">${icon('info')}<div class="sm"><b>Catatan terakhir:</b> ${esc(r.reviewNote)}</div></div>` : ''}</div>
  <div class="pnl" style="margin:0"><div class="eyebrow" style="margin-bottom:12px">Editorial decision suite</div>
    ${['submitted', 'approved', 'returned', 'rejected', 'draft'].indexOf(dec) >= 0 ? `<label class="row" style="gap:12px;background:var(--surface);padding:12px;border-radius:12px;margin-bottom:12px"><span class="tog"><input type="checkbox" id="pubnow" ${!blocked ? 'checked' : ''}><span></span></span><div><b class="sm">Publish immediately</b><div class="xs muted">Langsung tayang di portal publik setelah disetujui.</div></div></label>` : ''}
    ${dec === 'submitted' ? `<button class="btn btn-p btn-block" data-d="approve" style="margin-bottom:8px" ${blocked ? 'title="Ada kolom wajib kosong"' : ''}>${icon('checkC', 's16')} Approve Submission</button><button class="btn btn-o btn-block" data-d="return" style="margin-bottom:8px">${icon('edit', 's16')} Return for Revision…</button><button class="btn btn-d btn-block" data-d="reject">${icon('x', 's16')} Reject & Archive</button>` : ''}
    ${dec === 'approved' ? `<button class="btn btn-p btn-block" data-d="publish" style="margin-bottom:8px">${icon('globe', 's16')} Publish Now</button><button class="btn btn-o btn-block" data-d="return">Return for Revision…</button>` : ''}
    ${['draft', 'returned', 'rejected'].indexOf(dec) >= 0 ? `<button class="btn btn-p btn-block" data-d="publish" style="margin-bottom:8px">${icon('globe', 's16')} Publish Directly</button><a class="btn btn-o btn-block" href="#/app/edit/${k}/${esc(r.id)}">${icon('edit', 's16')} Edit entry</a>` : ''}
    ${dec === 'published' ? `<button class="btn btn-o btn-block" data-d="unpublish" style="margin-bottom:8px">Unpublish (tarik dari situs)</button><a class="btn btn-o btn-block" href="#/app/edit/${k}/${esc(r.id)}">${icon('edit', 's16')} Edit live entry</a><a class="btn btn-p btn-block" style="margin-top:8px" href="#/view/${k}/${esc(r.id)}" target="_blank">Buka halaman publik ${icon('ext', 's16')}</a>` : ''}
    ${dec === 'archived' ? `<button class="btn btn-o btn-block" data-d="restore">Restore as draft</button>` : ''}
    <div class="xs muted" style="margin-top:12px">${icon('lock', 's16')} Keputusan tercatat di Audit Log · notifikasi email ke kontributor.</div></div></aside></div>`;
  bindDetail($('#pvx', main), k, r, ex);
  $('#rt', main).addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; $$('#rt [data-t]', main).forEach(x => x.classList.toggle('on', x === b)); $$('.rev [data-pane]', main).forEach(x => { if (['pv', 'dw', 'df'].indexOf(x.dataset.pane) >= 0 && !x.closest('.wm .wm')) x.classList.toggle('hide', x.dataset.pane !== b.dataset.t && ['pv', 'dw', 'df'].indexOf(x.dataset.pane) >= 0); }); if (b.dataset.t === 'pv') $('#pvx', main)._onMap && $('#pvx', main)._onMap(); });
  main.addEventListener('click', async e => {
    const b = e.target.closest('[data-d]'); if (!b) return; const dc = b.dataset.d; let note = '', pub = false;
    if (dc === 'return' || dc === 'reject') { note = await Modal.prompt({ title: dc === 'return' ? 'Kembalikan untuk revisi' : 'Tolak & arsipkan', label: 'Catatan untuk kontributor', required: true, placeholder: 'Jelaskan apa yang perlu diperbaiki…', ok: dc === 'return' ? 'Kirim revisi' : 'Tolak', danger: dc === 'reject' }); if (note === null) return; }
    else if (dc === 'unpublish' && !await Modal.confirm({ title: 'Tarik dari situs publik?', msg: 'Entri kembali berstatus Approved dan tidak lagi tampil di publik.', ok: 'Tarik' })) return;
    else if (dc === 'approve') pub = !!($('#pubnow') || {}).checked;
    else if (dc === 'publish' && !await Modal.confirm({ title: 'Terbitkan sekarang?', msg: 'Entri akan tampil di situs publik.', ok: 'Terbitkan' })) return;
    await guard(b, async () => { await API.call('content.review', { entity: k, id: r.id, decision: dc, note: note, publish: pub || undefined }); toast({ approve: pub ? 'Disetujui & diterbitkan.' : 'Disetujui.', return: 'Dikembalikan ke kontributor.', reject: 'Ditolak & diarsipkan.', publish: 'Diterbitkan.', unpublish: 'Ditarik dari publik.', restore: 'Dipulihkan.' }[dc]); Shell.refreshBadges(true); Router.go(['approve', 'return', 'reject'].indexOf(dc) >= 0 ? '/app/queue' : '/app/review/' + k + '/' + r.id); });
  });
};
