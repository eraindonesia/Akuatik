/**
 * Fungsi serverless Vercel — mengembalikan KODE NEGARA pengunjung dari header geolokasi Vercel.
 * Alamat IP tidak dibaca, disimpan, maupun dikirim ke mana pun. Hanya aktif di Vercel;
 * di hosting lain (mis. GitHub Pages) portal otomatis memakai sumber cadangan.
 */
module.exports = (req, res) => {
  const cc = String(req.headers['x-vercel-ip-country'] || '').toUpperCase();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).end(JSON.stringify({ country: /^[A-Z]{2}$/.test(cc) ? cc : null }));
};
