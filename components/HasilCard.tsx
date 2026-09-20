import type { PerSoalResult } from "@/lib/scoring";

export default function HasilCard({
  skor,
  lulus,
  kkm,
  perSoal,
  autoSubmit,
  children,
}: {
  skor: number;
  lulus: boolean;
  kkm: number;
  perSoal: PerSoalResult[];
  autoSubmit?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
      <div>
        <p
          className={`text-6xl font-bold sm:text-7xl ${lulus ? "text-green-400" : "text-red-400"}`}
        >
          {skor}
        </p>

        {lulus ? (
          <>
            <p className="mt-3 text-xl font-bold text-white sm:text-2xl">
              🎉 Selamat, kamu lulus!
            </p>
            <p className="mt-2 text-base text-slate-200 sm:text-lg">
              Kamu berhasil menyelesaikan kuis ini dan memenuhi KKM {kkm}. Pertahankan semangat
              belajarmu!
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 text-xl font-bold text-white sm:text-2xl">Belum memenuhi KKM {kkm}</p>
            <p className="mt-2 text-base text-slate-200 sm:text-lg">
              Jangan menyerah!! pelajari lagi materinya, lalu ulangi kuis ini untuk mencoba lagi.
            </p>
          </>
        )}

        {autoSubmit && (
          <p className="mt-2 text-sm text-slate-400">Waktu habis, kuis disubmit otomatis.</p>
        )}
      </div>

      <details className="w-full rounded-xl border border-white/10 bg-white/5 text-left">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-base font-semibold text-slate-100 sm:text-lg [&::-webkit-details-marker]:hidden">
          Lihat hasil tiap soal
          <span className="text-sm text-slate-400 transition group-open:rotate-180">▾</span>
        </summary>
        <ul className="space-y-2 px-5 pb-5">
          {perSoal.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 text-sm sm:text-base">
              <span className="text-slate-300">
                Soal {s.id} · {s.topik}
              </span>
              <span className={`shrink-0 font-semibold ${s.benar ? "text-green-400" : "text-red-400"}`}>
                {s.benar ? "Benar" : "Salah"}
              </span>
            </li>
          ))}
        </ul>
      </details>

      {children}
    </div>
  );
}
