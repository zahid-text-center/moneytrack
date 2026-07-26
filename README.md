# Ledger — Web Money Management

Aplikasi manajemen keuangan pribadi: dashboard, transaksi, rekening, laporan (print/export PDF), lengkap dengan login, registrasi, dan logout.

Dibangun dengan **Next.js** (frontend) + **Supabase** (login & database, gratis) — bisa di-deploy gratis ke **Vercel**.

## 1. Siapkan database & login (Supabase — gratis)

1. Buka https://supabase.com, daftar/masuk, klik **New Project**.
2. Catat **Project URL** dan **anon public key** (Settings > API).
3. Buka **SQL Editor** di dashboard Supabase, tempel isi file `supabase/schema.sql`, lalu jalankan (Run). Ini akan membuat tabel `accounts` dan `transactions` beserta aturan keamanan (setiap user hanya bisa melihat datanya sendiri).
4. Di **Authentication > Providers**, pastikan **Email** aktif (default sudah aktif). Kalau tidak mau user perlu konfirmasi email, matikan "Confirm email" di **Authentication > Settings**.

## 2. Jalankan di komputer kamu

Pastikan sudah install [Node.js](https://nodejs.org) versi 18+.

```bash
cd moneytrack
npm install
cp .env.local.example .env.local
```

Buka `.env.local`, isi dengan URL dan anon key dari langkah 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
```

Lalu jalankan:

```bash
npm run dev
```

Buka http://localhost:3000 — daftar akun baru, lalu mulai pakai.

## 3. Deploy gratis supaya bisa diakses dari mana saja

Rekomendasi: **Vercel** (pembuat Next.js, gratis untuk proyek personal).

1. Push folder ini ke repository GitHub (buat repo baru, `git init`, `git add .`, `git commit`, `git push`).
2. Buka https://vercel.com, daftar dengan akun GitHub, klik **Add New Project**, pilih repo kamu.
3. Saat setup, tambahkan Environment Variables yang sama seperti di `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Setelah selesai, kamu dapat URL publik (mis. `ledger-kamu.vercel.app`) yang bisa diakses dari HP atau komputer manapun.

Alternatif lain yang juga gratis: **Netlify** atau **Cloudflare Pages** — caranya mirip (hubungkan repo GitHub, isi environment variables, deploy).

### Mengaktifkan Vercel Analytics

Kode untuk analytics sudah terpasang, tapi perlu diaktifkan sekali di dashboard Vercel:
1. Buka project kamu di https://vercel.com
2. Klik tab **Analytics**
3. Klik **Enable**

Setelah itu, statistik kunjungan (jumlah pengunjung, halaman yang paling sering dibuka, dll) akan mulai muncul di tab tersebut — gratis untuk pemakaian dasar di paket Hobby.

## Fitur

- **Dashboard** — rekap hari ini, ringkasan saldo, pemasukan/pengeluaran bulan & tahun ini, grafik arus kas, pie chart pengeluaran per kategori, dan ringkasan anggaran.
- **Transaksi** — input pemasukan/pengeluaran per rekening & kategori, daftar riwayat.
- **Rekening** — tambah rekening (bank, dompet, e-wallet) dan saldo awal; saldo otomatis ter-update tiap ada transaksi.
- **Anggaran** — atur budget bulanan per kategori, lihat progress pemakaian & peringatan kalau sudah lewat batas.
- **Laporan** — pilih bulan & tahun, lihat total pemasukan/pengeluaran, rincian per kategori, tabel transaksi, dan tombol **Print / Export PDF**.
- **Tema warna** — 5 pilihan tampilan: Klasik, Gelap, Cerah, Pink Lembut, Blue Jeans (tersimpan otomatis per device).
- **Login / Register / Logout** — via Supabase Auth. Data tiap user terpisah dan aman lewat Row Level Security.

## Kalau proyek Supabase kamu sudah pernah dibuat sebelumnya

Untuk mengaktifkan fitur **Anggaran per kategori**, jalankan `supabase/migration_budget.sql` di SQL Editor Supabase.
Untuk mengaktifkan fitur **Total anggaran bulanan**, jalankan juga `supabase/migration_total_budget.sql` di SQL Editor Supabase.
Untuk mengaktifkan fitur **Kategori kustom**, jalankan juga `supabase/migration_categories.sql` di SQL Editor Supabase.
Untuk mengaktifkan fitur **Transfer antar rekening**, jalankan juga `supabase/migration_transfers.sql` di SQL Editor Supabase.

Kalau baru mulai dari nol, cukup jalankan `supabase/schema.sql` seperti biasa (sudah termasuk semuanya).


## Struktur proyek

```
moneytrack/
├── pages/
│   ├── index.js          # Dashboard
│   ├── transactions.js   # Transaksi
│   ├── accounts.js       # Rekening
│   ├── reports.js        # Laporan
│   ├── login.js
│   ├── register.js
│   └── _app.js
├── components/
│   └── Layout.js         # Sidebar navigasi + proteksi halaman
├── lib/
│   ├── supabaseClient.js
│   └── AuthContext.js
├── supabase/
│   └── schema.sql        # Jalankan di Supabase SQL Editor
└── styles/globals.css
```

## Catatan

- Semua kalkulasi saldo dihitung dari sisi client saat transaksi ditambahkan — cukup untuk pemakaian personal. Kalau nanti mau dipakai banyak orang sekaligus dalam skala besar, saldo sebaiknya dihitung via database trigger.
- Kalau butuh fitur tambahan (edit/hapus transaksi, kategori kustom, multi-mata uang, dsb), tinggal bilang saja.
