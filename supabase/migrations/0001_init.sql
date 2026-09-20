-- Kuis Temu FTEIC — schema init
-- Run this in the Supabase SQL editor (or via `supabase db push`) before seeding.

create extension if not exists pgcrypto;

-- nama & departemen are nullable: panitia pre-loads valid nrp (whitelist for
-- login), then the maba's own nama & departemen are filled in / overwritten
-- on login — see app/api/login/route.ts.
create table peserta (
  nrp          text primary key,
  nama         text,
  departemen   text,
  created_at   timestamptz default now()
);

create table soal (
  id        int primary key,        -- 1..15, nomor tampil
  topik     text not null,
  teks      text not null,
  opsi      jsonb not null,         -- [{key:"a", teks:"..."}, ...]
  kunci     text not null           -- "a" | "b" | "c" | "d"
);

create table attempt (
  id            uuid primary key default gen_random_uuid(),
  nrp           text not null references peserta(nrp),
  attempt_ke    int not null,
  waktu_mulai   timestamptz not null default now(),
  waktu_submit  timestamptz,
  durasi_detik  int,
  skor          numeric(5,2),
  lulus         boolean,
  auto_submit   boolean default false,
  seed          int not null,
  ragu_ragu     int[] default '{}',
  unique (nrp, attempt_ke)
);

create table attempt_jawaban (
  attempt_id  uuid not null references attempt(id) on delete cascade,
  soal_id     int  not null references soal(id),
  jawaban     text,
  benar       boolean,
  primary key (attempt_id, soal_id)
);

create table config (
  key    text primary key,
  value  text not null
);

-- satu attempt aktif per NRP
create unique index satu_attempt_aktif
  on attempt (nrp) where waktu_submit is null;

-- leaderboard: attempt 1 saja
create index idx_leaderboard
  on attempt (skor desc, durasi_detik asc) where attempt_ke = 1;

create index idx_attempt_nrp on attempt (nrp);

-- RLS: default deny on every table. Route handlers use the service role key
-- (bypasses RLS) — this is a defense-in-depth layer in case an anon key leaks.
alter table peserta enable row level security;
alter table soal enable row level security;
alter table attempt enable row level security;
alter table attempt_jawaban enable row level security;
alter table config enable row level security;

-- config defaults per brief §6/§8.
-- window_mulai_tutup and deadline are intentionally left unset: the app
-- treats a missing value as "belum dijadwalkan" and blocks attempt #1 start
-- until panitia sets a real timestamp here.
insert into config (key, value) values
  ('kkm', '80'),
  ('jumlah_soal', '15'),
  ('durasi_detik', '300'),
  ('cooldown_detik', '300'),
  ('link_reward', ''),
  ('kuis_dibuka', 'false');
