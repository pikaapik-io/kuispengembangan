import { unstable_cache } from "next/cache";
import { db, fetchAllRows } from "./db";

export type LeaderboardRow = {
  rank: number;
  nrp: string;
  nama: string;
  departemen: string;
  skor: number;
  durasiDetik: number;
};

type Row = {
  nrp: string;
  attempt_ke: number;
  skor: number;
  durasi_detik: number;
  peserta: { nama: string; departemen: string } | { nama: string; departemen: string }[] | null;
};

function flattenPeserta(row: Row) {
  const p = Array.isArray(row.peserta) ? row.peserta[0] : row.peserta;
  return { nama: p?.nama ?? "-", departemen: p?.departemen ?? "-" };
}

// Ranking is based on each participant's LATEST submitted attempt (not their
// first) — a maba who fails attempt #1 but passes on a retry should show
// their retry result, not the one they've since moved past.
//
// The DB query + ranking is shared across all viewers via Next.js's Data
// Cache (unkeyed by viewer) so 1400 people refreshing /peringkat don't each
// trigger their own full table scan + join — only per-viewer slicing below
// (their own rank) runs on every request.
const getSortedAttempts = unstable_cache(
  async (): Promise<Row[]> => {
    const rows = await fetchAllRows<Row>((from, to) =>
      db
        .from("attempt")
        .select("nrp, attempt_ke, skor, durasi_detik, peserta(nama, departemen)")
        .not("waktu_submit", "is", null)
        .range(from, to)
    );

    const latestByNrp = new Map<string, Row>();
    for (const row of rows) {
      const existing = latestByNrp.get(row.nrp);
      if (!existing || row.attempt_ke > existing.attempt_ke) {
        latestByNrp.set(row.nrp, row);
      }
    }

    return Array.from(latestByNrp.values()).sort((a, b) => {
      if (b.skor !== a.skor) return b.skor - a.skor;
      return a.durasi_detik - b.durasi_detik;
    });
  },
  ["leaderboard-sorted"],
  { revalidate: 20 }
);

export async function getLeaderboard(nrp: string, nama: string, departemen: string) {
  const sorted = await getSortedAttempts();

  const top: LeaderboardRow[] = sorted.slice(0, 20).map((row, i) => ({
    rank: i + 1,
    nrp: row.nrp,
    skor: row.skor,
    durasiDetik: row.durasi_detik,
    ...flattenPeserta(row),
  }));

  const ownIndex = sorted.findIndex((row) => row.nrp === nrp);
  const ownInTop = ownIndex !== -1 && ownIndex < 20;

  let own: LeaderboardRow | null = null;
  if (ownIndex !== -1 && !ownInTop) {
    const row = sorted[ownIndex];
    own = {
      rank: ownIndex + 1,
      nrp: row.nrp,
      skor: row.skor,
      durasiDetik: row.durasi_detik,
      nama,
      departemen,
    };
  }

  return { top, own, ownInTop, total: sorted.length };
}
