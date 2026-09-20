import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getQuizConfig } from "@/lib/config";
import { getAllSoal } from "@/lib/soal";
import { perSoalFromBenar } from "@/lib/scoring";
import { getLeaderboard } from "@/lib/leaderboard";
import { db } from "@/lib/db";
import RewardLink from "@/components/RewardLink";
import Leaderboard from "@/components/Leaderboard";
import PageBackground from "@/components/PageBackground";
import LogoutButton from "@/components/LogoutButton";
import HasilCard from "@/components/HasilCard";

export default async function SelesaiPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const { data: lulusAttempt } = await db
    .from("attempt")
    .select("id, skor, auto_submit")
    .eq("nrp", session.nrp)
    .eq("lulus", true)
    .maybeSingle();

  if (!lulusAttempt) redirect("/mulai");

  const soalList = await getAllSoal();
  const { data: benarRows } = await db
    .from("attempt_jawaban")
    .select("soal_id, benar")
    .eq("attempt_id", lulusAttempt.id);
  const perSoal = perSoalFromBenar(benarRows ?? [], soalList);
  const config = await getQuizConfig();

  const { top, own, ownInTop, total } = await getLeaderboard(session.nrp, session.nama, session.departemen);

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden bg-slate-900 px-4 py-12">
      <PageBackground />
      <LogoutButton />

      <div className="relative z-10 grid w-full max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
        <HasilCard
          skor={lulusAttempt.skor}
          lulus={true}
          kkm={config.kkm}
          perSoal={perSoal}
          autoSubmit={lulusAttempt.auto_submit}
        >
          <RewardLink />
        </HasilCard>

        <Leaderboard top={top} own={own} ownInTop={ownInTop} total={total} currentNrp={session.nrp} />
      </div>
    </main>
  );
}
