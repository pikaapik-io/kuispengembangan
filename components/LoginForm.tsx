"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ departemenList }: { departemenList: string[] }) {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [nrp, setNrp] = useState("");
  const [departemen, setDepartemen] = useState("");
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
        body: JSON.stringify({ nama, nrp, departemen }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan, coba lagi.");
        return;
      }
      router.push("/mulai");
    } catch {
      setError("Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="nama" className="block text-sm font-medium text-gray-700">
          Nama lengkap
        </label>
        <input
          id="nama"
          type="text"
          required
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="nrp" className="block text-sm font-medium text-gray-700">
          NRP
        </label>
        <input
          id="nrp"
          type="text"
          inputMode="numeric"
          required
          value={nrp}
          onChange={(e) => setNrp(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="departemen" className="block text-sm font-medium text-gray-700">
          Departemen
        </label>
        <select
          id="departemen"
          required
          value={departemen}
          onChange={(e) => setDepartemen(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
        >
          <option value="" disabled>
            Pilih departemen
          </option>
          {departemenList.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 py-2.5 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}
