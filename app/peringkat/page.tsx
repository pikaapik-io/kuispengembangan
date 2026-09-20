import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLeaderboard } from "@/lib/leaderboard";
import Leaderboard from "@/components/Leaderboard";
import PageBackground from "@/components/PageBackground";
import LogoutButton from "@/components/LogoutButton";

export default async function PeringkatPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const { top, own, ownInTop, total } = await getLeaderboard(session.nrp, session.nama, session.departemen);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-slate-900 px-4 py-12">
      <PageBackground />
      <LogoutButton />
      <div className="relative z-10 w-full max-w-2xl">
        <Leaderboard top={top} own={own} ownInTop={ownInTop} total={total} currentNrp={session.nrp} />
      </div>
    </main>
  );
}
