import { db } from "./db";

export type Opsi = { key: string; teks: string };

export type SoalInternal = {
  id: number;
  topik: string;
  teks: string;
  opsi: Opsi[];
  kunci: string;
};

export type SoalPublic = {
  id: number;
  topik: string;
  teks: string;
  opsi: Opsi[]; // shuffled per attempt seed, kunci stripped
};

// Static content — loaded once per warm lambda instance instead of per request.
let cache: SoalInternal[] | null = null;

export async function getAllSoal(): Promise<SoalInternal[]> {
  if (cache) return cache;
  const { data, error } = await db.from("soal").select("id, topik, teks, opsi, kunci").order("id");
  if (error) throw error;
  cache = data as SoalInternal[];
  return cache;
}

export async function getSoalById(id: number): Promise<SoalInternal | undefined> {
  const all = await getAllSoal();
  return all.find((s) => s.id === id);
}

// Deterministic PRNG so the same attempt seed always reproduces the same
// shuffle (needed so a page reload shows options in the same order).
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function subSeed(seed: number, soalId: number): number {
  return (seed ^ Math.imul(soalId + 1, 0x9e3779b9)) >>> 0;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// The value a student submits is always the option's canonical key (a/b/c/d),
// regardless of the on-screen order below — so scoring never needs to
// remap positions back, it just compares the submitted key to soal.kunci.
export async function getSoalPublic(seed: number): Promise<SoalPublic[]> {
  const all = await getAllSoal();
  return all.map((s) => ({
    id: s.id,
    topik: s.topik,
    teks: s.teks,
    opsi: shuffle(s.opsi, mulberry32(subSeed(seed, s.id))),
  }));
}
