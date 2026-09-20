"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// `inline`: renders as a plain pill for embedding in existing layout (e.g. the
// quiz page's status bar). Default renders fixed in the corner for pages that
// don't already have UI there.
export default function LogoutButton({ inline = false }: { inline?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`${
        inline ? "" : "absolute right-4 top-4 z-20 sm:right-6 sm:top-6"
      } rounded-full border-b-4 border-red-800 bg-red-600 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-red-500 active:translate-y-1 active:border-b-0 disabled:opacity-50 sm:px-7 sm:py-3 sm:text-base`}
    >
      {loading ? "..." : "Keluar"}
    </button>
  );
}
