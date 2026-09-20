"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-900 p-6 text-center">
      <div className="relative z-10 flex flex-col items-center gap-4 rounded-xl border border-red-400/30 bg-red-500/10 px-6 py-8">
        <p className="text-lg font-semibold text-red-200">Server sedang sibuk, coba lagi sebentar.</p>
        <button
          onClick={reset}
          className="rounded-lg border-b-4 border-red-700 bg-red-500 px-6 py-2.5 text-base font-bold uppercase tracking-wide text-white transition hover:bg-red-400 active:translate-y-1 active:border-b-0"
        >
          Coba lagi
        </button>
      </div>
    </main>
  );
}
