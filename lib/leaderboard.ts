import { db } from "./db";

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
  skor: number;
  durasi_detik: number;
  peserta: { nama: string; departemen: string } | { nama: string; departemen: string }[] | null;
};

function flattenPeserta(row: Row) {
  const p = Array.isArray(row.peserta) ? row.peserta[0] : row.peserta;
  return { nama: p?.nama ?? "-", departemen: p?.departemen ?? "-" };
}

export async function getLeaderboard(nrp: string, nama: string, departemen: string) {
  const { data: topRows, error } = await db
    .from("attempt")
    .select("nrp, skor, durasi_detik, peserta(nama, departemen)")
    .eq("attempt_ke", 1)
    .not("waktu_submit", "is", null)
    .order("skor", { ascending: false })
    .order("durasi_detik", { ascending: true })
    .limit(20);
  if (error) throw error;

  const top: LeaderboardRow[] = (topRows as Row[]).map((row, i) => ({
    rank: i + 1,
    nrp: row.nrp,
    skor: row.skor,
    durasiDetik: row.durasi_detik,
    ...flattenPeserta(row),
  }));

  const ownInTop = top.some((r) => r.nrp === nrp);
  let own: LeaderboardRow | null = null;

  if (!ownInTop) {
    const { data: ownRow } = await db
      .from("attempt")
      .select("nrp, skor, durasi_detik")
      .eq("attempt_ke", 1)
      .eq("nrp", nrp)
      .not("waktu_submit", "is", null)
      .maybeSingle();

    if (ownRow) {
      const { count } = await db
        .from("attempt")
        .select("*", { count: "exact", head: true })
        .eq("attempt_ke", 1)
        .not("waktu_submit", "is", null)
        .or(`skor.gt.${ownRow.skor},and(skor.eq.${ownRow.skor},durasi_detik.lt.${ownRow.durasi_detik})`);

      own = {
        rank: (count ?? 0) + 1,
        nrp: ownRow.nrp,
        skor: ownRow.skor,
        durasiDetik: ownRow.durasi_detik,
        nama,
        departemen,
      };
    }
  }

  return { top, own, ownInTop };
}
