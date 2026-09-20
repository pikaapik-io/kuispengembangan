"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageBackground from "@/components/PageBackground";
import LogoutButton from "@/components/LogoutButton";

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
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-900 p-6 text-center">
        <PageBackground />
        <p className="relative z-10 rounded-xl border border-red-400/30 bg-red-500/10 px-6 py-4 text-red-200">
          {loadError}
        </p>
      </main>
    );
  }

  if (!soal) {
    return (
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-900 p-6">
        <PageBackground />
        <p className="relative z-10 text-white">Memuat kuis...</p>
      </main>
    );
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
    current: "ring-2 ring-sky-400 bg-white/10 text-white border-transparent",
    answered: "bg-sky-500 text-white border-sky-400",
    ragu: "bg-amber-400 text-amber-950 border-amber-300",
    empty: "bg-white/5 text-slate-300 border-white/15",
  };

  function NavigatorGrid({ onPick }: { onPick?: () => void }) {
    return (
      <div className="grid grid-cols-5 gap-2.5">
        {soal!.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setCurrentIndex(i);
              onPick?.();
            }}
            className={`relative h-12 rounded-md border text-base font-semibold ${boxClasses[boxState(s.id)]}`}
          >
            {s.id}
            {raguSet.has(s.id) && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-slate-900">
      <PageBackground />

      <div
        className={`sticky top-0 z-20 border-b border-white/10 px-4 py-4 backdrop-blur-xl ${
          isLowTime ? "bg-red-950/60" : "bg-slate-900/70"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <span className="text-base text-slate-300">
            Terjawab {answeredCount}/{soal.length}
          </span>
          <div className="flex items-center gap-4">
            <span className={`text-2xl font-bold tabular-nums ${isLowTime ? "text-red-300" : "text-white"}`}>
              {formatMMSS(remaining)}
            </span>
            <LogoutButton inline />
          </div>
        </div>
      </div>

      {/* Mobile collapsible navigator bar */}
      <div className="relative z-10 border-b border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setNavigatorOpen((v) => !v)}
          className="flex w-full items-center justify-between text-base font-medium text-slate-100"
        >
          <span>
            Soal {current.id} dari {soal.length}
          </span>
          <span>{navigatorOpen ? "Tutup ▲" : "Navigator ▼"}</span>
        </button>
        {navigatorOpen && (
          <div className="mt-2">
            <NavigatorGrid onPick={() => setNavigatorOpen(false)} />
          </div>
        )}
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 lg:flex-row lg:p-6">
        <section className="flex-1 lg:w-[70%]">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
              Soal {current.id} · {current.topik}
            </p>
            <p className="mb-6 text-xl font-medium text-white">{current.teks}</p>

            <div className="space-y-3">
              {current.opsi.map((opt) => (
                <label
                  key={opt.key}
                  className={`flex cursor-pointer items-center gap-4 rounded-xl border px-6 py-4 text-lg transition ${
                    jawaban[current.id] === opt.key
                      ? "border-sky-300 bg-sky-500 text-white shadow-lg"
                      : "border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name={`soal-${current.id}`}
                    checked={jawaban[current.id] === opt.key}
                    onChange={() => saveJawaban(current.id, opt.key)}
                    className="h-5 w-5 accent-sky-400"
                  />
                  {opt.teks}
                </label>
              ))}
            </div>

            <button
              onClick={() => toggleRagu(current.id)}
              className={`mt-6 rounded-full border px-5 py-2 text-sm font-semibold transition ${
                raguSet.has(current.id)
                  ? "border-amber-300 bg-amber-400 text-amber-950"
                  : "border-white/20 text-slate-300 hover:bg-white/10"
              }`}
            >
              {raguSet.has(current.id) ? "✓ Ditandai ragu" : "Tandai ragu"}
            </button>

            <div className="mt-8 flex justify-between">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="rounded-lg border border-white/20 px-5 py-2.5 text-base font-medium text-slate-100 transition hover:bg-white/10 disabled:opacity-30"
              >
                ← Sebelumnya
              </button>
              <button
                disabled={currentIndex === soal.length - 1}
                onClick={() => setCurrentIndex((i) => Math.min(soal.length - 1, i + 1))}
                className="rounded-lg border border-white/20 px-5 py-2.5 text-base font-medium text-slate-100 transition hover:bg-white/10 disabled:opacity-30"
              >
                Berikutnya →
              </button>
            </div>
          </div>
        </section>

        {/* Desktop sticky navigator sidebar */}
        <aside className="hidden lg:block lg:w-[30%]">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <p className="mb-4 text-base font-semibold text-slate-100">Navigator soal</p>
            <NavigatorGrid />
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 z-20 flex justify-center px-4 pb-6 pt-4">
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="rounded-full border-b-4 border-sky-700 bg-sky-500 px-16 py-4 text-lg font-bold uppercase tracking-wide text-white shadow-2xl transition hover:bg-sky-400 active:translate-y-1 active:border-b-0 disabled:opacity-50"
        >
          {submitting ? "Mengirim..." : "Submit"}
        </button>
      </div>
    </main>
  );
}
