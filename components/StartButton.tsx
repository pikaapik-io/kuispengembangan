"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StartButton({ label }: { label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attempt/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan, coba lagi.");
        return;
      }
      router.push("/kuis");
    } catch {
      setError("Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg border-b-4 border-slate-950 bg-slate-900 px-10 py-4 text-lg font-bold uppercase tracking-wide text-white transition hover:bg-slate-800 active:translate-y-1 active:border-b-0 disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4"
      >
        {loading ? "Menyiapkan..." : label}
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
