import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getQuizConfig } from "@/lib/config";
import { db } from "@/lib/db";
import StartButton from "@/components/StartButton";
import CountdownButton from "@/components/CountdownButton";
import PageBackground from "@/components/PageBackground";
import LogoutButton from "@/components/LogoutButton";

type AttemptRow = {
  attempt_ke: number;
  waktu_mulai: string;
  waktu_submit: string | null;
  skor: number | null;
  lulus: boolean | null;
};

export default async function MulaiPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.isAdmin) redirect("/admin");

  const config = await getQuizConfig();

  const { data } = await db
    .from("attempt")
    .select("attempt_ke, waktu_mulai, waktu_submit, skor, lulus")
    .eq("nrp", session.nrp)
    .order("attempt_ke");
  const attempts = (data ?? []) as AttemptRow[];

  const lulusAttempt = attempts.find((a) => a.lulus);
  const activeAttempt = attempts.find((a) => a.waktu_submit === null);
  const submitted = attempts.filter((a) => a.waktu_submit !== null);
  const nextAttemptKe = submitted.length > 0 ? Math.max(...submitted.map((a) => a.attempt_ke)) + 1 : 1;
  const now = new Date();

  let action: React.ReactNode;

  const disabledButtonClass =
    "cursor-not-allowed rounded-lg border-b-4 border-slate-500 bg-slate-400 px-8 py-3 text-lg font-bold uppercase tracking-wide text-slate-800";

  if (lulusAttempt) {
    action = (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-green-400/30 bg-green-500/10 p-8 text-center">
        <p className="text-lg font-semibold text-green-300">Kamu sudah lulus.</p>
        <Link href="/selesai" className="text-lg font-semibold text-white underline hover:text-slate-200">
          Lihat hasil →
        </Link>
      </div>
    );
  } else if (!config.kuisDibuka) {
    action = (
      <button disabled className={disabledButtonClass}>
        Kuis belum dibuka
      </button>
    );
  } else if (activeAttempt) {
    action = <StartButton label="LANJUTKAN KUIS" />;
  } else if (nextAttemptKe === 1) {
    const windowOpen = config.windowMulaiTutup !== null && now <= config.windowMulaiTutup;
    action = windowOpen ? (
      <StartButton label="ATTEMPT QUIZ" />
    ) : (
      <button disabled className={disabledButtonClass}>
        {config.windowMulaiTutup === null ? "Jadwal belum ditentukan" : "Waktu pengerjaan sudah ditutup"}
      </button>
    );
  } else {
    const lastAttempt = submitted.find((a) => a.attempt_ke === nextAttemptKe - 1)!;
    const cooldownEnds = new Date(
      new Date(lastAttempt.waktu_submit as string).getTime() + config.cooldownDetik * 1000
    );
    const deadlinePassed = config.deadline !== null && now > config.deadline;

    if (now < cooldownEnds) {
      action = <CountdownButton label={`ATTEMPT #${nextAttemptKe}`} untilIso={cooldownEnds.toISOString()} />;
    } else if (deadlinePassed) {
      action = (
        <button disabled className={disabledButtonClass}>
          Batas waktu pengerjaan sudah berakhir
        </button>
      );
    } else {
      action = <StartButton label={`ATTEMPT #${nextAttemptKe}`} />;
    }
  }

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-slate-900 px-4 py-12">
      <PageBackground />
      <LogoutButton />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-8 rounded-2xl border border-white/10 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-10 lg:p-14">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Selamat mengerjakan, {session.nama}</h1>

        <div className="w-full rounded-xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <p className="text-base text-slate-100 sm:text-lg">
            {config.jumlahSoal} soal · {Math.round(config.durasiDetik / 60)} menit · KKM {config.kkm} · pilihan ganda
          </p>
          <ul className="mt-4 space-y-2 text-left text-sm text-slate-300 sm:text-base">
            <li>Waktu berjalan begitu tombol ditekan, tidak bisa dijeda.</li>
            <li>Jawaban tersimpan otomatis setiap kali dipilih.</li>
            <li>Soal tetap sama setiap attempt.</li>
          </ul>
        </div>

        {action}
      </div>
    </main>
  );
}
