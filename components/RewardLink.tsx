"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";

// `link` is undefined while loading, null once loaded if panitia hasn't set
// a reward link yet, or the URL string once available.
export default function RewardLink() {
  const [link, setLink] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    fetch("/api/reward")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok) {
          setError(data.error ?? "Terjadi kesalahan.");
          return;
        }
        setLink(data.link || null);
      })
      .catch(() => setError("Terjadi kesalahan, muat ulang halaman."));
  }, []);

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — user can still select the text manually
    }
  }

  if (error) return <p className="text-base text-red-300">{error}</p>;

  if (link === undefined) {
    return <p className="text-base text-slate-300">Menyiapkan link materi...</p>;
  }

  if (link === null) {
    return (
      <p className="text-base text-slate-300">
        
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-3">
        <span className="flex-1 truncate text-sm text-slate-100 sm:text-base">{link}</span>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-md bg-white/20 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/30"
        >
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>

      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full rounded-lg border-b-4 border-green-800 bg-green-600 py-4 text-center text-lg font-bold uppercase tracking-wide text-white transition hover:bg-green-500 active:translate-y-1 active:border-b-0"
      >
        BUKA MATERI
      </a>

      <p className="text-sm font-medium text-red-300">
        Screenshot atau salin link ini sekarang. Halaman ini tidak muncul lagi setelah ditutup.
      </p>

      <Link href="/peringkat" className="text-base text-slate-200 underline hover:text-white">
        Lihat peringkat lengkap →
      </Link>
    </div>
  );
}
