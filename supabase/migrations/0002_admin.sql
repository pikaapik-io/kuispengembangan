-- Admin flag on peserta: an admin logs in through the same NRP-only flow as
-- everyone else (see app/api/login/route.ts), just with is_admin = true,
-- which unlocks /admin (see app/admin/page.tsx).
--
-- The actual admin row (which NRP is the admin) is intentionally not seeded
-- here — insert it directly via the Supabase SQL editor instead, so the
-- admin identity never sits in git history.
alter table peserta add column is_admin boolean not null default false;
