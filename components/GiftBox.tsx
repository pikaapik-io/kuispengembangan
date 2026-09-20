"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function GiftBox({ nama, skor }: { nama: string; skor: number }) {
  const [opened, setOpened] = useState(false);
  const [hover, setHover] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleOpen() {
    if (opened) return;
    setOpened(true);
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    try {
      const res = await fetch("/api/reward");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan.");
        return;
      }
      setLink(data.link);
    } catch {
      setError("Terjadi kesalahan, muat ulang halaman.");
    }
  }

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

  if (!opened) {
    return (
      <motion.button
        onClick={handleOpen}
        onHoverStart={() => setHover(true)}
        onHoverEnd={() => setHover(false)}
        animate={hover ? { rotate: [0, -6, 6, -6, 0] } : { y: [0, -10, 0] }}
        transition={hover ? { duration: 0.4, repeat: Infinity } : { duration: 2, repeat: Infinity }}
        className="text-8xl"
        aria-label="Buka hadiah"
      >
        🎁
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex w-full max-w-sm flex-col items-center gap-5 text-center"
    >
      <div className="text-6xl">🎉</div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Selamat, {nama}!</h1>
        <p className="mt-1 text-gray-600">Skor kamu {skor}.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {link && (
        <>
          <div className="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
            <span className="flex-1 truncate text-sm text-gray-700">{link}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-md bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-300"
            >
              {copied ? "Tersalin" : "Salin"}
            </button>
          </div>

          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-lg bg-blue-600 py-3 text-base font-bold text-white transition hover:bg-blue-700"
          >
            BUKA MATERI
          </a>

          <p className="text-xs font-medium text-red-500">
            Screenshot atau salin link ini sekarang. Halaman ini tidak muncul lagi setelah ditutup.
          </p>

          <Link href="/peringkat" className="text-sm text-blue-600 hover:underline">
            Lihat peringkat →
          </Link>
        </>
      )}
    </motion.div>
  );
}
