import type { SoalInternal } from "./soal";

export type JawabanInput = {
  soal_id: number;
  jawaban: string | null;
};

export type TopikBreakdown = {
  topik: string;
  benar: number;
  total: number;
};

export type ScoreResult = {
  skor: number;
  lulus: boolean;
  benarCount: number;
  perSoal: { soal_id: number; benar: boolean }[];
  topikBreakdown: TopikBreakdown[];
};

export function scoreAttempt(
  jawabanList: JawabanInput[],
  soalList: SoalInternal[],
  kkm: number
): ScoreResult {
  const jawabanBySoal = new Map(jawabanList.map((j) => [j.soal_id, j.jawaban]));

  const perSoal = soalList.map((soal) => ({
    soal_id: soal.id,
    benar: jawabanBySoal.get(soal.id) === soal.kunci,
  }));

  const benarCount = perSoal.filter((p) => p.benar).length;
  const skor = Math.round((benarCount / soalList.length) * 100 * 100) / 100;
  const lulus = skor >= kkm;

  const topikMap = new Map<string, { benar: number; total: number }>();
  for (const soal of soalList) {
    const entry = topikMap.get(soal.topik) ?? { benar: 0, total: 0 };
    entry.total += 1;
    if (perSoal.find((p) => p.soal_id === soal.id)?.benar) entry.benar += 1;
    topikMap.set(soal.topik, entry);
  }
  const topikBreakdown: TopikBreakdown[] = Array.from(topikMap.entries()).map(
    ([topik, v]) => ({ topik, ...v })
  );

  return { skor, lulus, benarCount, perSoal, topikBreakdown };
}

export type PerSoalResult = {
  id: number;
  topik: string;
  benar: boolean;
};

export function perSoalFromBenar(
  rows: { soal_id: number; benar: boolean | null }[],
  soalList: SoalInternal[]
): PerSoalResult[] {
  const benarBySoal = new Map(rows.map((r) => [r.soal_id, Boolean(r.benar)]));
  return soalList.map((s) => ({ id: s.id, topik: s.topik, benar: benarBySoal.get(s.id) ?? false }));
}

export function topikBreakdownFromBenar(
  rows: { soal_id: number; benar: boolean | null }[],
  soalList: SoalInternal[]
): TopikBreakdown[] {
  const benarBySoal = new Map(rows.map((r) => [r.soal_id, Boolean(r.benar)]));
  const topikMap = new Map<string, { benar: number; total: number }>();
  for (const soal of soalList) {
    const entry = topikMap.get(soal.topik) ?? { benar: 0, total: 0 };
    entry.total += 1;
    if (benarBySoal.get(soal.id)) entry.benar += 1;
    topikMap.set(soal.topik, entry);
  }
  return Array.from(topikMap.entries()).map(([topik, v]) => ({ topik, ...v }));
}
