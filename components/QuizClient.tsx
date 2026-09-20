"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Opsi = { key: string; teks: string };
type Soal = { id: number; topik: string; teks: string; opsi: Opsi[] };

type StateResponse =
  | { status: "no_active_attempt" }
  | { status: "lulus" }
  | {
      status: "active";
      sisaDetik: number;
      durasiDetik: number;
      soal: Soal[];
      jawaban: Record<number, string>;
      raguRagu: number[];
    };

function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function QuizClient() {
  const router = useRouter();
  const [soal, setSoal] = useState<Soal[] | null>(null);
  const [jawaban, setJawaban] = useState<Record<number, string>>({});
  const [raguSet, setRaguSet] = useState<Set<number>>(new Set());
  const [remaining, setRemaining] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const submittedRef = useRef(false);
  const debounceRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/attempt/state")
      .then((res) => res.json())
      .then((data: StateResponse) => {
        if (cancelled) return;
        if (data.status === "no_active_attempt") {
          router.replace("/mulai");
          return;
        }
        if (data.status === "lulus") {
          router.replace("/selesai");
          return;
        }
        setSoal(data.soal);
        setJawaban(data.jawaban);
        setRaguSet(new Set(data.raguRagu));
        setRemaining(data.sisaDetik);
      })
      .catch(() => setLoadError("Gagal memuat kuis. Muat ulang halaman."));
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = useCallback(
    async (auto: boolean) => {
      if (submittedRef.current) return;
      if (!auto) {
        const answeredCount = soal ? soal.filter((s) => jawaban[s.id]).length : 0;
        const totalCount = soal?.length ?? 0;
        if (answeredCount < totalCount) {
          const ok = window.confirm(
            `Masih ada ${totalCount - answeredCount} soal belum dijawab. Yakin ingin submit?`
          );
          if (!ok) return;
        }
      }
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const res = await fetch("/api/attempt/submit", { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.error ?? "Terjadi kesalahan saat submit.");
          submittedRef.current = false;
          setSubmitting(false);
          return;
        }
        router.push(data.lulus ? "/selesai" : "/hasil");
      } catch {
        setLoadError("Terjadi kesalahan saat submit.");
        submittedRef.current = false;
        setSubmitting(false);
      }
    },
    [soal, jawaban, router]
  );

  useEffect(() => {
    if (soal === null) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [soal, handleSubmit]);

  function saveJawaban(soalId: number, value: string) {
    setJawaban((prev) => ({ ...prev, [soalId]: value }));
    if (debounceRef.current[soalId]) clearTimeout(debounceRef.current[soalId]);
    debounceRef.current[soalId] = setTimeout(() => {
      fetch("/api/attempt/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soal_id: soalId, jawaban: value }),
      }).catch(() => {});
    }, 400);
  }

  function toggleRagu(soalId: number) {
    setRaguSet((prev) => {
      const next = new Set(prev);
      const willBeRagu = !next.has(soalId);
      if (willBeRagu) next.add(soalId);
      else next.delete(soalId);
      fetch("/api/attempt/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soal_id: soalId, ragu: willBeRagu }),
      }).catch(() => {});
      return next;
    });
  }

  const answeredCount = useMemo(
    () => (soal ? soal.filter((s) => jawaban[s.id]).length : 0),
    [soal, jawaban]
  );

  if (loadError) {
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-center text-red-600">
        {loadError}
      </main>
    );
  }

  if (!soal) {
    return <main className="flex flex-1 items-center justify-center p-6">Memuat kuis...</main>;
  }

  const current = soal[currentIndex];
  const isLowTime = remaining <= 60;

  function boxState(id: number): "current" | "answered" | "ragu" | "empty" {
    if (soal![currentIndex].id === id) return "current";
    if (raguSet.has(id)) return "ragu";
    if (jawaban[id]) return "answered";
    return "empty";
  }

  const boxClasses: Record<string, string> = {
    current: "ring-2 ring-blue-600 bg-white text-gray-900",
    answered: "bg-blue-600 text-white border-blue-600",
    ragu: "bg-yellow-100 text-yellow-800 border-yellow-400",
    empty: "bg-white text-gray-500 border-gray-300",
  };

  function NavigatorGrid({ onPick }: { onPick?: () => void }) {
    return (
      <div className="grid grid-cols-5 gap-2">
        {soal!.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setCurrentIndex(i);
              onPick?.();
            }}
            className={`relative h-10 rounded-md border text-sm font-semibold ${boxClasses[boxState(s.id)]}`}
          >
            {s.id}
            {raguSet.has(s.id) && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-yellow-500" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <div
        className={`sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 ${
          isLowTime ? "bg-red-50" : "bg-white"
        }`}
      >
        <span className="text-sm text-gray-500">Terjawab {answeredCount}/{soal.length}</span>
        <span className={`text-xl font-bold tabular-nums ${isLowTime ? "text-red-600" : "text-gray-900"}`}>
          {formatMMSS(remaining)}
        </span>
      </div>

      {/* Mobile collapsible navigator bar */}
      <div className="border-b bg-gray-50 px-4 py-2 lg:hidden">
        <button
          onClick={() => setNavigatorOpen((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-medium text-gray-700"
        >
          <span>Soal {current.id} dari {soal.length}</span>
          <span>{navigatorOpen ? "Tutup ▲" : "Navigator ▼"}</span>
        </button>
        {navigatorOpen && (
          <div className="mt-2">
            <NavigatorGrid onPick={() => setNavigatorOpen(false)} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-6 p-4 lg:flex-row lg:p-6">
        <section className="flex-1 lg:w-[70%]">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Soal {current.id} · {current.topik}
            </p>
            <p className="mb-4 text-base font-medium text-gray-900">{current.teks}</p>

            <div className="space-y-2">
              {current.opsi.map((opt) => (
                <label
                  key={opt.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                    jawaban[current.id] === opt.key
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`soal-${current.id}`}
                    checked={jawaban[current.id] === opt.key}
                    onChange={() => saveJawaban(current.id, opt.key)}
                    className="h-4 w-4"
                  />
                  {opt.teks}
                </label>
              ))}
            </div>

            <button
              onClick={() => toggleRagu(current.id)}
              className={`mt-4 rounded-full border px-4 py-1.5 text-xs font-semibold ${
                raguSet.has(current.id)
                  ? "border-yellow-400 bg-yellow-100 text-yellow-800"
                  : "border-gray-300 text-gray-500"
              }`}
            >
              {raguSet.has(current.id) ? "✓ Ditandai ragu" : "Tandai ragu"}
            </button>

            <div className="mt-6 flex justify-between">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                ← Sebelumnya
              </button>
              <button
                disabled={currentIndex === soal.length - 1}
                onClick={() => setCurrentIndex((i) => Math.min(soal.length - 1, i + 1))}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Berikutnya →
              </button>
            </div>
          </div>
        </section>

        {/* Desktop sticky navigator sidebar */}
        <aside className="hidden lg:block lg:w-[30%]">
          <div className="sticky top-20 rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-gray-700">Navigator soal</p>
            <NavigatorGrid />
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 border-t bg-white p-4">
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-3 text-base font-bold text-white disabled:opacity-50"
        >
          {submitting ? "Mengirim..." : "Submit"}
        </button>
      </div>
    </main>
  );
}
