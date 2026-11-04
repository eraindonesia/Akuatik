# Portal ERA — Frontend (GitHub Pages)

Frontend statis untuk **Ekspedisi Riset Akuatik (ERA)**. HTML + CSS + JavaScript murni, tanpa proses build.

```
index.html            ← harus berada di ROOT repository
css/style.css         ← sistem desain (token DESIGN.md, mode terang/gelap)
js/config.js          ← SATU-SATUNYA file yang diedit: URL Web App Google Apps Script
js/core.js            ← util, API client (cache SWR), sesi, router, toast/modal
js/components.js      ← kerangka halaman publik & CMS, peta, grafik
js/public.js, pages2.js   ← halaman publik
js/admin.js, admin2.js    ← CMS (admin & anggota)
js/main.js            ← boot & daftar rute
PANDUAN-INSTALASI.md  ← langkah lengkap (backend → GitHub Pages → login Google)
```

Mulai dari **PANDUAN-INSTALASI.md**. Backend (`*.gs`) tidak termasuk dalam ZIP ini — dibagikan terpisah.
