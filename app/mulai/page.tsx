import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getQuizConfig } from "@/lib/config";
import { db } from "@/lib/db";
import StartButton from "@/components/StartButton";
import CountdownButton from "@/components/CountdownButton";

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

  if (lulusAttempt) {
    action = (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="font-semibold text-green-800">Kamu sudah lulus.</p>
        <Link
          href="/selesai"
          className="rounded-lg bg-green-600 px-8 py-3 text-base font-bold text-white transition hover:bg-green-700"
        >
          AMBIL LINK MATERI
        </Link>
      </div>
    );
  } else if (!config.kuisDibuka) {
    action = (
      <button disabled className="rounded-lg bg-gray-300 px-8 py-3 text-base font-bold text-gray-600">
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
      <button disabled className="rounded-lg bg-gray-300 px-8 py-3 text-base font-bold text-gray-600">
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
        <button disabled className="rounded-lg bg-gray-300 px-8 py-3 text-base font-bold text-gray-600">
          Batas waktu pengerjaan sudah berakhir
        </button>
      );
    } else {
      action = <StartButton label={`ATTEMPT #${nextAttemptKe}`} />;
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Selamat mengerjakan, {session.nama}</h1>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-700">
          {config.jumlahSoal} soal · {Math.round(config.durasiDetik / 60)} menit · KKM {config.kkm} · pilihan ganda
        </p>
        <ul className="mt-3 space-y-1 text-left text-sm text-gray-500">
          <li>Waktu berjalan begitu tombol ditekan, tidak bisa dijeda.</li>
          <li>Jawaban tersimpan otomatis setiap kali dipilih.</li>
          <li>Soal tetap sama setiap attempt.</li>
        </ul>
      </div>

      {action}
    </main>
  );
}
