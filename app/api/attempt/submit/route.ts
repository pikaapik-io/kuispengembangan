import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getQuizConfig } from "@/lib/config";
import { getAllSoal } from "@/lib/soal";
import { scoreAttempt, topikBreakdownFromBenar } from "@/lib/scoring";
import { db } from "@/lib/db";

export async function POST() {
  // TODO(rate-limit): limit by IP/NRP (e.g. 10/menit) once a DB-backed limiter exists.
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  const soalList = await getAllSoal();

  const { data: active, error } = await db
    .from("attempt")
    .select("id, waktu_mulai")
    .eq("nrp", session.nrp)
    .is("waktu_submit", null)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });

  if (!active) {
    // No active attempt: either it was already submitted (client retry) or
    // there was never one. Replay the latest submitted result if it exists.
    const { data: last } = await db
      .from("attempt")
      .select("id, skor, lulus, auto_submit")
      .eq("nrp", session.nrp)
      .order("attempt_ke", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!last) return NextResponse.json({ error: "Tidak ada attempt untuk disubmit" }, { status: 409 });

    const { data: benarRows } = await db
      .from("attempt_jawaban")
      .select("soal_id, benar")
      .eq("attempt_id", last.id);

    return NextResponse.json({
      skor: last.skor,
      lulus: last.lulus,
      autoSubmit: last.auto_submit,
      topikBreakdown: topikBreakdownFromBenar(benarRows ?? [], soalList),
    });
  }

  const config = await getQuizConfig();

  const { data: jawabanRows } = await db
    .from("attempt_jawaban")
    .select("soal_id, jawaban")
    .eq("attempt_id", active.id);

  const jawabanBySoal = new Map((jawabanRows ?? []).map((r) => [r.soal_id, r.jawaban as string | null]));
  const jawabanList = soalList.map((s) => ({ soal_id: s.id, jawaban: jawabanBySoal.get(s.id) ?? null }));

  const result = scoreAttempt(jawabanList, soalList, config.kkm);

  const elapsedSeconds = (Date.now() - new Date(active.waktu_mulai).getTime()) / 1000;
  const autoSubmit = elapsedSeconds > config.durasiDetik + 5;
  const durasiDetikFinal = autoSubmit ? config.durasiDetik : Math.round(elapsedSeconds);

  await db.from("attempt_jawaban").upsert(
    result.perSoal.map((p) => ({
      attempt_id: active.id,
      soal_id: p.soal_id,
      jawaban: jawabanBySoal.get(p.soal_id) ?? null,
      benar: p.benar,
    })),
    { onConflict: "attempt_id,soal_id" }
  );

  const { data: updated, error: updateError } = await db
    .from("attempt")
    .update({
      waktu_submit: new Date().toISOString(),
      durasi_detik: durasiDetikFinal,
      skor: result.skor,
      lulus: result.lulus,
      auto_submit: autoSubmit,
    })
    .eq("id", active.id)
    .is("waktu_submit", null)
    .select("skor, lulus, auto_submit")
    .maybeSingle();

  if (updateError) return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });

  // If `updated` is null, we lost a race with a concurrent submit for this
  // same attempt — `result` here still reflects the correct scoring since
  // both racers compute identically from the same stored answers.
  const final = updated ?? (await db.from("attempt").select("skor, lulus, auto_submit").eq("id", active.id).single()).data!;

  return NextResponse.json({
    skor: final.skor,
    lulus: final.lulus,
    autoSubmit: final.auto_submit,
    topikBreakdown: result.topikBreakdown,
  });
}
