"use client";

import { useMemo, useState } from "react";
import type { AdminRow } from "@/lib/admin";

type SortKey = "nrp" | "nama" | "departemen" | "jumlahAttempt" | "status" | "skorTerbaik";
type SortDir = "asc" | "desc";
type StatusFilter = "Semua" | "Lulus" | "Belum lulus" | "Belum mulai";

function statusLabel(row: AdminRow): "Lulus" | "Belum lulus" | "Belum mulai" {
  if (row.lulus) return "Lulus";
  if (row.jumlahAttempt > 0) return "Belum lulus";
  return "Belum mulai";
}

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "nrp", label: "NRP" },
  { key: "nama", label: "Nama" },
  { key: "departemen", label: "Departemen" },
  { key: "jumlahAttempt", label: "Attempt" },
  { key: "status", label: "Status" },
  { key: "skorTerbaik", label: "Skor Terbaik" },
];

export default function AdminTable({ rows }: { rows: AdminRow[] }) {
  const [departemen, setDepartemen] = useState("Semua");
  const [status, setStatus] = useState<StatusFilter>("Semua");
  const [sortKey, setSortKey] = useState<SortKey>("nrp");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const departemenList = useMemo(
    () => ["Semua", ...Array.from(new Set(rows.map((r) => r.departemen))).sort()],
    [rows]
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (departemen !== "Semua" && r.departemen !== departemen) return false;
        if (status !== "Semua" && statusLabel(r) !== status) return false;
        return true;
      }),
    [rows, departemen, status]
  );

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "nrp":
          cmp = a.nrp.localeCompare(b.nrp);
          break;
        case "nama":
          cmp = a.nama.localeCompare(b.nama);
          break;
        case "departemen":
          cmp = a.departemen.localeCompare(b.departemen);
          break;
        case "jumlahAttempt":
          cmp = a.jumlahAttempt - b.jumlahAttempt;
          break;
        case "status":
          cmp = statusLabel(a).localeCompare(statusLabel(b));
          break;
        case "skorTerbaik":
          cmp = (a.skorTerbaik ?? -1) - (b.skorTerbaik ?? -1);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function downloadCsv() {
    const header = ["NRP", "Nama", "Departemen", "Jumlah Attempt", "Status", "Skor Terbaik"];
    const lines = [header.join(",")];
    for (const r of sorted) {
      lines.push(
        [
          csvEscape(r.nrp),
          csvEscape(r.nama),
          csvEscape(r.departemen),
          csvEscape(r.jumlahAttempt),
          csvEscape(statusLabel(r)),
          csvEscape(r.skorTerbaik ?? ""),
        ].join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap-peserta-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const total = rows.length;
  const totalLulus = rows.filter((r) => r.lulus).length;
  const totalBelumMulai = rows.filter((r) => r.jumlahAttempt === 0).length;
  const totalBelumLulus = total - totalLulus - totalBelumMulai;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total peserta" value={total} />
        <StatCard label="Lulus" value={totalLulus} accent="text-green-300" />
        <StatCard label="Belum lulus" value={totalBelumLulus} accent="text-amber-300" />
        <StatCard label="Belum mulai" value={totalBelumMulai} accent="text-slate-400" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={departemen}
          onChange={(e) => setDepartemen(e.target.value)}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-slate-100"
        >
          {departemenList.map((d) => (
            <option key={d} value={d} className="text-slate-900">
              {d}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-slate-100"
        >
          {(["Semua", "Lulus", "Belum lulus", "Belum mulai"] as const).map((s) => (
            <option key={s} value={s} className="text-slate-900">
              {s}
            </option>
          ))}
        </select>

        <span className="text-sm text-slate-400">{sorted.length} peserta ditampilkan</span>

        <button
          onClick={downloadCsv}
          className="ml-auto rounded-lg border-b-4 border-sky-700 bg-sky-500 px-5 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-sky-400 active:translate-y-1 active:border-b-0"
        >
          Download CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm text-slate-100">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
            <tr>
              {COLUMNS.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="cursor-pointer select-none whitespace-nowrap px-4 py-3 hover:text-white"
                >
                  {label}
                  {sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.nrp} className="border-t border-white/10">
                <td className="whitespace-nowrap px-4 py-2.5">{r.nrp}</td>
                <td className="px-4 py-2.5">{r.nama}</td>
                <td className="px-4 py-2.5">{r.departemen}</td>
                <td className="px-4 py-2.5">{r.jumlahAttempt}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      r.lulus ? "text-green-300" : r.jumlahAttempt > 0 ? "text-amber-300" : "text-slate-400"
                    }
                  >
                    {statusLabel(r)}
                  </span>
                </td>
                <td className="px-4 py-2.5">{r.skorTerbaik ?? "-"}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-6 text-center text-slate-400">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ?? "text-white"}`}>{value}</p>
    </div>
  );
}
