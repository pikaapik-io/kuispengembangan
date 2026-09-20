import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getQuizConfig } from "@/lib/config";
import { getAllSoal } from "@/lib/soal";
import { topikBreakdownFromBenar } from "@/lib/scoring";
import { db } from "@/lib/db";
import CountdownButton from "@/components/CountdownButton";

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
  const topikBreakdown = topikBreakdownFromBenar(benarRows ?? [], soalList);

  const config = await getQuizConfig();
  const cooldownEnds = new Date(new Date(last.waktu_submit as string).getTime() + config.cooldownDetik * 1000);
  const now = new Date();
  const deadlinePassed = config.deadline !== null && now > config.deadline;

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-12 text-center">
      <div>
        <p className="text-5xl font-bold text-red-600">{last.skor}</p>
        <p className="mt-1 text-gray-600">Belum memenuhi KKM {config.kkm}</p>
        {last.auto_submit && (
          <p className="mt-1 text-xs text-gray-400">Waktu habis — kuis disubmit otomatis.</p>
        )}
      </div>

      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 text-left">
        <p className="mb-3 text-sm font-semibold text-gray-700">Rekap per topik</p>
        <ul className="space-y-2">
          {topikBreakdown.map((t) => (
            <li key={t.topik} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{t.topik}</span>
              <span className="font-medium text-gray-900">
                {t.benar}/{t.total}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="max-w-sm text-sm text-gray-500">
        Pelajari lagi materi terkait topik yang masih kurang, lalu coba lagi.
      </p>

      {deadlinePassed ? (
        <button disabled className="rounded-lg bg-gray-300 px-8 py-3 text-base font-bold text-gray-600">
          Batas waktu pengerjaan sudah berakhir
        </button>
      ) : now < cooldownEnds ? (
        <CountdownButton label="Ulangi" untilIso={cooldownEnds.toISOString()} />
      ) : (
        <Link
          href="/mulai"
          className="rounded-lg bg-blue-600 px-8 py-3 text-base font-bold text-white transition hover:bg-blue-700"
        >
          Ulangi
        </Link>
      )}
    </main>
  );
}
