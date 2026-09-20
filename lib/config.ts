import { db } from "./db";

const CACHE_TTL_MS = 30_000;

let cache: Record<string, string> | null = null;
let cachedAt = 0;

async function loadConfig(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cache && now - cachedAt < CACHE_TTL_MS) return cache;

  const { data, error } = await db.from("config").select("key, value");
  if (error) throw error;

  const next: Record<string, string> = {};
  for (const row of data ?? []) next[row.key] = row.value;
  cache = next;
  cachedAt = now;
  return next;
}

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
