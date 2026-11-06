# Panduan Instalasi — Portal ERA (Ekspedisi Riset Akuatik)

Arsitektur: **Frontend statis** (GitHub Pages) + **Backend REST API** (Google Apps Script) + **Database** (Google Sheets) + **Berkas** (Google Drive).
Waktu pengerjaan: ±30–45 menit. Urutan wajib: **A → B → C → D**.

```
Browser ──► GitHub Pages (index.html, css/, js/)
               │  fetch() JSON
               ▼
        Google Apps Script  (Kode.gs, Skema.gs, Data.gs, Layanan.gs, Seed.gs)
               │
       Google Sheets + Drive + Gmail
```

---

## A. Backend — Google Apps Script

1. Buka <https://script.google.com> → **New project**. Beri nama `ERA Backend`.
2. Buat **5 file skrip** (ikon **+** → *Script*) dengan nama persis: `Kode`, `Skema`, `Data`, `Layanan`, `Seed`. Hapus isi bawaan `Code.gs`, lalu tempel isi masing-masing berkas `.gs` yang Anda unduh.
3. **Project Settings (ikon roda gigi)** → centang **Show "appsscript.json" manifest file in editor**. Kembali ke Editor, buka `appsscript.json`, ganti seluruh isinya dengan berkas `appsscript.json` yang Anda unduh. Simpan.
4. Pilih fungsi **`setupAppEnvironment`** pada menu di atas editor → **Run**.
   - Pertama kali Google meminta izin: *Review permissions* → pilih akun Anda → *Advanced* → *Go to ERA Backend (unsafe)* → **Allow**. (Peringatan ini normal untuk skrip pribadi.)
   - Setup membuat folder Drive `ERA/…`, Spreadsheet `ERA — Database`, semua sheet, pengaturan bawaan, **data contoh**, dan **admin pertama = akun Anda**.
5. Buka **Execution log** (di bawah editor). Catat baris:
   ```
   🔐 AKSES DARURAT
      Nama pengguna : darurat
      Kata sandi    : xxxxxxxxxxxxxxxx
   ```
   Kata sandi **hanya tampil sekali**. Simpan di pengelola kata sandi. (Hilang? jalankan `resetAksesDarurat`.)
6. **Deploy → New deployment → ⚙ Select type: Web app**
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - **Deploy** → salin **Web app URL** (berakhiran `/exec`).
7. Opsional tapi disarankan — jalankan sekali dari editor:
   - **`pasangTriggerPemanasan`** → cache publik dipanaskan tiap 10 menit, sehingga pengunjung tidak pernah menanggung "cold start" Apps Script (**paling berpengaruh pada kecepatan**).
   - **`pasangTriggerBackup`** → cadangan otomatis harian.

> **Setiap kali Anda mengubah kode backend:** *Deploy → Manage deployments → ✏ → Version: New version → Deploy*. URL tetap sama.

---

## B. Frontend — GitHub Pages

### B1. Isi alamat backend
Buka `js/config.js` dengan Notepad/VS Code dan ganti:

```js
GAS_URL: 'PASTE_URL_WEB_APP_ANDA_DI_SINI',
```
dengan URL `/exec` dari langkah A6. Simpan.

### B2. Pastikan Anda berada di folder yang benar (GERBANG PENTING)
Ekstrak ZIP. Folder hasil ekstraksi **itulah** folder proyek. Buka terminal **di dalam folder itu** lalu cek isinya:

```bash
# Windows (PowerShell/CMD)          # macOS / Linux
dir                                  ls
```
**`index.html`, folder `css` dan `js` HARUS terlihat di daftar.** Jika yang terlihat justru folder lain (mis. `frontend`), Anda satu level terlalu tinggi — masuk dulu (`cd`) sampai `index.html` terlihat. Jangan lanjut sebelum benar: git tidak akan memperingatkan, dan situs akan 404.

### B3. Kirim ke GitHub (lewat terminal — jangan lewat tombol "Upload files" di web)
Upload via web menggugurkan struktur folder `css/` dan `js/` sehingga halaman tanpa gaya.

1. Pasang Git: <https://git-scm.com/downloads>. Buat akun <https://github.com> dan repository **kosong** baru (mis. `era-portal`, Public, tanpa README).
2. Di terminal (di folder proyek):
   ```bash
   git init
   git add .
   git commit -m "Portal ERA"
   git branch -M main
   git remote add origin https://github.com/USERNAME/era-portal.git
   git push -u origin main
   ```
   Saat diminta sandi, gunakan **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens → *Tokens (classic)* → centang `repo`), bukan kata sandi akun.
3. Di GitHub: repo → **Settings → Pages** → *Source: Deploy from a branch* → Branch **main** / folder **/ (root)** → Save.
4. Tunggu 1–3 menit. Situs: `https://USERNAME.github.io/era-portal/`

**Update berikutnya:** `git add .` → `git commit -m "update"` → `git push`.
> Setelah mengubah berkas `js/` atau `css/`, naikkan angka `?v=...` pada tag `<script>`/`<link>` di `index.html` (mis. `2026.11.2` → `2026.11.3`) agar browser pengunjung mengambil versi baru, bukan salinan lama.

---

## C. Login Google untuk Admin & Anggota

Selama Client ID belum diisi, hanya **akses darurat** yang bisa masuk — itu normal.

1. <https://console.cloud.google.com> → buat project → **APIs & Services → OAuth consent screen** (External, isi nama aplikasi & email) → tambahkan akun Anda sebagai *Test user* (atau *Publish app* bila siap).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
   - *Authorized JavaScript origins*: alamat situs Anda **persis**, tanpa path dan tanpa garis miring di akhir. Contoh:
     - GitHub Pages: `https://USERNAME.github.io`
     - Vercel: `https://nama-proyek.vercel.app`
     - Domain sendiri: `https://www.contoh.id`
     - Alamat yang harus didaftarkan juga ditampilkan di halaman login (**Login Google bermasalah?**) dan di **Settings → Security**, lengkap dengan tombol Salin.
     - Setiap alamat berbeda (domain utama, domain kustom, atau URL *preview* Vercel) harus didaftarkan sendiri-sendiri.
3. Salin **Client ID** (berakhiran `.apps.googleusercontent.com`).
4. Buka portal → `#/login` → **Gunakan akses darurat** (kredensial dari A5) → **Settings → Security** → tempel Client ID → **Simpan**.
5. Segera **rotasi kredensial darurat** pada kartu di sebelahnya.
6. **Users → Add User**: daftarkan email Google para peneliti (maks. 3 Admin + 5 Member, dapat diubah di Settings). Anggota hanya bisa mengelola kategori yang Anda centang.

---

## D. Data awal

- Portal berisi **data contoh** (spesies, danau, berita, tim, dll) agar tampilan langsung hidup. Pita kuning "Mode data contoh" muncul di situs publik. **Nama peneliti, angka, dan status IUCN pada data contoh hanyalah ilustrasi — jangan dipublikasikan sebagai fakta.**
- Jika sudah siap memakai data asli: di Apps Script jalankan **`hapusDataContoh`** (menghapus semua baris bertanda contoh), lalu isi lewat CMS.
- Isi dulu: **Settings → Identity / Contact / Organization Profile**, lalu **Locations**, **Species**, **Team**, **Partners**.
- Foto: unggah lewat tombol *Unggah* pada formulir konten (berkas awalnya **internal**, otomatis menjadi publik saat kontennya diterbitkan), atau tempel URL gambar. Video: gunakan tautan YouTube / Google Drive.

### Alur konten
`Draft → Submitted → (Approved | Returned for Revision | Rejected) → Published`
Member menyimpan draf & mengajukan; Admin memutuskan di **Approvals**. Admin boleh menerbitkan langsung.

---

## Keamanan — ringkas
- Semua rahasia (kunci sesi, hash sandi darurat, Client ID) hanya di **Script Properties**, tidak di kode/Sheets/frontend.
- Sesi bertanda tangan HMAC, kedaluwarsa 12 jam; peran diperiksa ulang di server pada setiap permintaan.
- Formulir publik: honeypot, jeda minimum, batas 5 pengajuan/jam/email, validasi & lampiran ≤ 4 MB (PDF/DOC/DOCX/JPG/PNG).
- Seluruh teks pengguna di-escape di frontend. Audit log mencatat login, perubahan, keputusan, ekspor, dan unggahan.
- Percobaan login darurat gagal 5× → terkunci 15 menit.

## Batas layanan Google (perlu diketahui)
| Hal | Akun Gmail biasa | Google Workspace |
|---|---|---|
| Email terkirim / hari | ±100 | ±1.500 |
| Waktu eksekusi per permintaan | 6 menit | 6 menit |
| Cache publik | otomatis, berversi | otomatis, berversi |

Lalu lintas ±1.000 pengunjung/hari aman: halaman publik dilayani dari cache server & cache browser.

---

## Pemecahan masalah
| Gejala | Penyebab & solusi |
|---|---|
| Layar "Backend belum terhubung" | `GAS_URL` belum diisi / salah. Harus berakhiran `/exec`. |
| "Tidak dapat terhubung ke server" | Deployment bukan *Anyone*, atau belum *New version* setelah ubah kode. |
| Halaman tanpa gaya, console 404 `css/…` | Struktur folder rusak (upload via web). Ulangi B2–B3 lewat terminal. |
| **Error 400: origin_mismatch** (Akses diblokir) | Alamat situs belum terdaftar di *Authorized JavaScript origins* pada OAuth Client ID. Tambahkan alamat persis (lihat C-2), simpan, tunggu 5 menit–beberapa jam, lalu muat ulang dengan Ctrl+F5. Pastikan jenis klien **Web application**. |
| Tombol Google tidak muncul | Client ID belum diisi, atau *Authorized JavaScript origins* tidak cocok persis dengan alamat situs. |
| "Access blocked: app has not completed verification" | OAuth consent screen masih mode *Testing*: tambahkan email Anda di **Test users**, atau tekan *Publish app*. |
| "Email … belum terdaftar" | Tambahkan email itu di **Users** (harus sama dengan akun Google yang dipakai). |
| Unggah gambar gagal | Format tidak diizinkan / > batas MB; atau kebijakan Workspace melarang berbagi publik (ubah ke berkas internal / kebijakan Drive). |
| PDF gagal | Buka Apps Script → **Executions** untuk pesan galat; pastikan izin Documents sudah diberikan (jalankan ulang fungsi apa pun dan *Allow*). |
| Data baru tidak muncul di publik | Cache publik ± hingga 15 menit di browser pengunjung; muat ulang keras (Ctrl+F5). |
| Lupa kata sandi darurat | Apps Script → jalankan `resetAksesDarurat` → lihat log. |

## Tampilan ponsel
- **Navigasi bawah ala aplikasi**: situs publik (Beranda · Riset · Katalog · Berita · Menu) dan CMS (Beranda · Approval/Revisi · **＋ Tambah** · Berkas · Menu).
- Filter katalog, filter peta, dan panel samping muncul sebagai **lembar dari bawah** (*bottom sheet*); modal juga naik dari bawah.
- **Tabel otomatis menjadi kartu** di ponsel (label kolom diambil dari judul kolom), katalog spesies tampil 2 kolom, filter lanjutan dapat dilipat.
- Kolom isian berukuran 16 px (iPhone tidak memperbesar layar saat mengetik), target sentuh ≥ 44 px, dan area aman *notch* diperhatikan.
- **Pasang di layar utama** (tampil layar penuh seperti aplikasi): Android Chrome → menu ⋮ → *Tambahkan ke layar utama*; iPhone Safari → ikon Bagikan → *Tambah ke Layar Utama*.

## Kecepatan — cara kerjanya
- Halaman **tampil seketika** dari kerangka + data tersimpan di browser (stale-while-revalidate); data baru menyusul di latar belakang.
- Permintaan data beranda dimulai di `<head>`, paralel dengan unduhan skrip. Peta (Leaflet) dan grafik (Chart.js) hanya dimuat saat dibutuhkan.
- Cache server berversi bertahan hingga 6 jam dan **dibangun ulang otomatis saat Anda menerbitkan/mengubah konten** (juga tiap 10 menit bila trigger pemanasan dipasang).
- Panel CMS memakai *batch* (beberapa data dalam satu round-trip), cache per pengguna, dan prefetch saat kursor mendekati menu.
- Bila Anda mengubah struktur data di `Skema.gs`, naikkan `SCHEMA_VER`; frontend akan mengambil skema baru otomatis.

## Daftar fungsi pemeliharaan (jalankan dari editor Apps Script)
`setupAppEnvironment` (aman diulang) · `hapusDataContoh` · `pasangTriggerPemanasan` · `pasangTriggerBackup` · `resetAksesDarurat` · `rotasiSecretSesi` (mencabut semua sesi)

## Batasan yang jujur
- Tampilan memakai **ilustrasi pengganti** sampai Anda mengunggah foto asli.
- Routing memakai `#/…` sehingga mesin pencari hanya mengindeks halaman beranda; judul tab diperbarui per halaman.
- Peta memakai ubin OpenStreetMap / Esri (wajib atribusi — sudah ditampilkan). Untuk trafik tinggi gunakan penyedia ubin berbayar.
- Video tidak diunggah ke Drive lewat portal; gunakan tautan YouTube/Drive.
