import { db } from "./db";

export type AdminRow = {
  nrp: string;
  nama: string;
  departemen: string;
  jumlahAttempt: number;
  lulus: boolean;
  skorTerbaik: number | null;
  terakhirSubmit: string | null;
};

type PesertaRow = { nrp: string; nama: string; departemen: string };
type AttemptRow = { nrp: string; skor: number | null; lulus: boolean | null; waktu_submit: string | null };

// Full rekap for panitia: every whitelisted peserta (not just those who've
// submitted, unlike the student-facing leaderboard), how many times they've
// attempted, and their best score — queried live (no cache) since this is
// low-traffic and panitia wants up-to-date numbers.
export async function getAdminOverview(): Promise<AdminRow[]> {
  const [{ data: pesertaRows, error: pesertaError }, { data: attemptRows, error: attemptError }] =
    await Promise.all([
      db.from("peserta").select("nrp, nama, departemen").eq("is_admin", false).order("nrp"),
      db.from("attempt").select("nrp, skor, lulus, waktu_submit"),
    ]);
  if (pesertaError) throw pesertaError;
  if (attemptError) throw attemptError;

  const attemptsByNrp = new Map<string, AttemptRow[]>();
  for (const row of (attemptRows ?? []) as AttemptRow[]) {
    const list = attemptsByNrp.get(row.nrp) ?? [];
    list.push(row);
    attemptsByNrp.set(row.nrp, list);
  }

  return (pesertaRows as PesertaRow[]).map((p) => {
    const attempts = attemptsByNrp.get(p.nrp) ?? [];
    const submitted = attempts.filter((a) => a.waktu_submit !== null);

    const skorTerbaik = submitted.length > 0 ? Math.max(...submitted.map((a) => a.skor ?? 0)) : null;
    const terakhirSubmit =
      submitted.length > 0
        ? submitted.reduce<string>(
            (latest, a) => ((a.waktu_submit as string) > latest ? (a.waktu_submit as string) : latest),
            submitted[0].waktu_submit as string
          )
        : null;

    return {
      nrp: p.nrp,
      nama: p.nama,
      departemen: p.departemen,
      jumlahAttempt: attempts.length,
      lulus: attempts.some((a) => a.lulus === true),
      skorTerbaik,
      terakhirSubmit,
    };
  });
}
