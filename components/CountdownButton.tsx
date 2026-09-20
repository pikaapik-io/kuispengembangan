"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

// Disabled button that counts down to `untilIso`, then refreshes the page
// so the server can recompute state (cooldown elapsed -> button becomes active).
export default function CountdownButton({
  label,
  untilIso,
}: {
  label: string;
  untilIso: string;
}) {
  const router = useRouter();
  const until = new Date(untilIso).getTime();
  const [remaining, setRemaining] = useState(() => (until - Date.now()) / 1000);

  useEffect(() => {
    const id = setInterval(() => {
      const secs = (until - Date.now()) / 1000;
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(id);
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [until, router]);

  return (
    <button
      disabled
      className="cursor-not-allowed rounded-lg border-b-4 border-gray-400 bg-gray-300 px-10 py-4 text-lg font-bold uppercase tracking-wide text-gray-600"
    >
      {label} · {formatMMSS(remaining)}
    </button>
  );
}
