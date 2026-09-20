import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import GiftBox from "@/components/GiftBox";

export default async function SelesaiPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const { data: lulusAttempt } = await db
    .from("attempt")
    .select("skor")
    .eq("nrp", session.nrp)
    .eq("lulus", true)
    .maybeSingle();

  if (!lulusAttempt) redirect("/mulai");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <GiftBox nama={session.nama} skor={lulusAttempt.skor} />
    </main>
  );
}
