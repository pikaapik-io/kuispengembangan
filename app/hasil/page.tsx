import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getQuizConfig } from "@/lib/config";
import { getAllSoal } from "@/lib/soal";
import { perSoalFromBenar } from "@/lib/scoring";
import { getLeaderboard } from "@/lib/leaderboard";
import { db } from "@/lib/db";
import CountdownButton from "@/components/CountdownButton";
import PageBackground from "@/components/PageBackground";
import Leaderboard from "@/components/Leaderboard";
import LogoutButton from "@/components/LogoutButton";
import HasilCard from "@/components/HasilCard";

export default async function HasilPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const { data: last } = await db
    .from("attempt")
    .select("id, attempt_ke, skor, lulus, auto_submit, waktu_submit")
    .eq("nrp", session.nrp)
    .not("waktu_submit", "is", null)
    .order("attempt_ke", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!last) redirect("/mulai");
  if (last.lulus) redirect("/selesai");

  const soalList = await getAllSoal();
  const { data: benarRows } = await db
    .from("attempt_jawaban")
    .select("soal_id, benar")
    .eq("attempt_id", last.id);
  const perSoal = perSoalFromBenar(benarRows ?? [], soalList);

  const config = await getQuizConfig();
  const cooldownEnds = new Date(new Date(last.waktu_submit as string).getTime() + config.cooldownDetik * 1000);
  const now = new Date();
  const deadlinePassed = config.deadline !== null && now > config.deadline;

  const { top, own, ownInTop, total } = await getLeaderboard(session.nrp, session.nama, session.departemen);

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden bg-slate-900 px-4 py-12">
      <PageBackground />
      <LogoutButton />

      <div className="relative z-10 grid w-full max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
        <HasilCard skor={last.skor} lulus={false} kkm={config.kkm} perSoal={perSoal} autoSubmit={last.auto_submit}>
          {deadlinePassed ? (
            <button
              disabled
              className="cursor-not-allowed rounded-lg border-b-4 border-slate-500 bg-slate-400 px-10 py-4 text-lg font-bold uppercase tracking-wide text-slate-800"
            >
              Batas waktu pengerjaan sudah berakhir
            </button>
          ) : now < cooldownEnds ? (
            <CountdownButton label="Ulangi" untilIso={cooldownEnds.toISOString()} />
          ) : (
            <Link
              href="/mulai"
              className="rounded-lg border-b-4 border-slate-950 bg-slate-900 px-10 py-4 text-lg font-bold uppercase tracking-wide text-white transition hover:bg-slate-800 active:translate-y-1 active:border-b-0"
            >
              Ulangi
            </Link>
          )}
        </HasilCard>

        <Leaderboard top={top} own={own} ownInTop={ownInTop} total={total} currentNrp={session.nrp} />
      </div>
    </main>
  );
}
