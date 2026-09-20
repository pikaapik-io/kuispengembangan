# Kuis Temu FTEIC

Kuis penugasan untuk Temu FTEIC ITS Angkatan 2026 — gate kelulusan penugasan sebelum peserta mendapat link materi. Lihat brief lengkap untuk konteks bisnis; dokumen ini hanya panduan setup teknis.

## Setup

1. Buat project di [Supabase](https://supabase.com).
2. Jalankan `supabase/migrations/0001_init.sql` lewat SQL editor Supabase (bukan CLI ini, cukup copy-paste).
3. (Opsional, untuk dev/testing) jalankan `supabase/seed.sql` untuk data dummy 15 soal + 10 peserta.
4. Copy `.env.example` ke `.env.local` dan isi:
   - `SUPABASE_URL` — dari Project Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` — dari Project Settings → API (service_role, **bukan** anon key)
   - `SESSION_SECRET` — string acak panjang, misal hasil `openssl rand -base64 32`
5. `npm install`
6. `npm run dev` lalu buka http://localhost:3000

## Sebelum acara berlangsung

Set nilai di tabel `config` (lewat SQL editor Supabase, tanpa perlu deploy ulang):

- `kuis_dibuka` → `'true'` untuk membuka akses
- `window_mulai_tutup` → timestamp batas mulai attempt pertama (kosong = kuis dianggap belum terjadwal)
- `deadline` → timestamp batas akhir seluruh pengerjaan (termasuk retry)
- `link_reward` → link materi (sudah dipendekkan) yang didapat peserta yang lulus
- `kkm`, `durasi_detik`, `cooldown_detik` bisa diubah kapan saja sesuai kebutuhan

## Catatan implementasi

- Semua penilaian dan pengecekan waktu terjadi di server (Route Handlers di `app/api/**`) — client tidak pernah dipercaya.
- Rate limiting di `/api/login` dan `/api/attempt/submit` sengaja **belum** diimplementasikan untuk MVP ini (lihat `// TODO(rate-limit)` di kedua file). Tambahkan sebelum acara berskala besar berlangsung.
- Load test (simulasi ~100 submit bersamaan) belum dilakukan — disarankan sebelum hari-H.
