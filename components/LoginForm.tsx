"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [nrp, setNrp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nrp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan, coba lagi.");
        return;
      }
      router.push(data.isAdmin ? "/admin" : "/mulai");
    } catch {
      setError("Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="relative">
        <IdIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
        <input
          id="nrp"
          type="text"
          inputMode="numeric"
          placeholder="NRP"
          aria-label="NRP"
          required
          value={nrp}
          onChange={(e) => setNrp(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-10 pr-3 text-base text-white placeholder-slate-300 focus:border-white/50 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-slate-900 py-2.5 text-base font-semibold text-white transition hover:bg-slate-950 disabled:opacity-50"
      >
        {loading ? "Memeriksa..." : "Login"}
      </button>
    </form>
  );
}

function IdIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="12" r="2" />
      <path d="M13 10h5M13 14h5" />
    </svg>
  );
}
