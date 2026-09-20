import { unstable_cache } from "next/cache";
import { db } from "./db";

// Shared across all serverless instances (Next.js Data Cache), not just the
// warm one handling this request — under high concurrency, Vercel spins up
// many isolated instances, so a per-instance cache barely cuts DB load.
const loadConfig = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const { data, error } = await db.from("config").select("key, value");
    if (error) throw error;

    const next: Record<string, string> = {};
    for (const row of data ?? []) next[row.key] = row.value;
    return next;
  },
  ["quiz-config"],
  { revalidate: 30 }
);

function asNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true";
}

function asDateOrNull(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type QuizConfig = {
  kkm: number;
  jumlahSoal: number;
  durasiDetik: number;
  cooldownDetik: number;
  windowMulaiTutup: Date | null;
  deadline: Date | null;
  linkReward: string;
  kuisDibuka: boolean;
};

export async function getQuizConfig(): Promise<QuizConfig> {
  const raw = await loadConfig();
  return {
    kkm: asNumber(raw.kkm, 80),
    jumlahSoal: asNumber(raw.jumlah_soal, 15),
    durasiDetik: asNumber(raw.durasi_detik, 300),
    cooldownDetik: asNumber(raw.cooldown_detik, 300),
    windowMulaiTutup: asDateOrNull(raw.window_mulai_tutup),
    deadline: asDateOrNull(raw.deadline),
    linkReward: raw.link_reward ?? "",
    kuisDibuka: asBoolean(raw.kuis_dibuka, false),
  };
}
