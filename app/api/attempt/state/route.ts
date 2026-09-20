import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getQuizConfig } from "@/lib/config";
import { getSoalPublic } from "@/lib/soal";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  try {
    const { data: active, error } = await db
      .from("attempt")
      .select("id, waktu_mulai, seed, ragu_ragu")
      .eq("nrp", session.nrp)
      .is("waktu_submit", null)
      .maybeSingle();
    if (error) return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });

    if (!active) {
      const { data: lulusRow } = await db
        .from("attempt")
        .select("id")
        .eq("nrp", session.nrp)
        .eq("lulus", true)
        .maybeSingle();
      return NextResponse.json({ status: lulusRow ? "lulus" : "no_active_attempt" });
    }

    const config = await getQuizConfig();
    const elapsedMs = Date.now() - new Date(active.waktu_mulai).getTime();
    const sisaDetik = Math.max(0, config.durasiDetik - Math.floor(elapsedMs / 1000));

    const { data: jawabanRows } = await db
      .from("attempt_jawaban")
      .select("soal_id, jawaban")
      .eq("attempt_id", active.id);

    const jawaban: Record<number, string> = {};
    for (const row of jawabanRows ?? []) {
      if (row.jawaban) jawaban[row.soal_id] = row.jawaban;
    }

    const soal = await getSoalPublic(active.seed);

    return NextResponse.json({
      status: "active",
      sisaDetik,
      durasiDetik: config.durasiDetik,
      soal,
      jawaban,
      raguRagu: active.ragu_ragu ?? [],
    });
  } catch {
    // Supabase unreachable/timed out (see lib/db.ts fetch timeout) — fail fast
    // instead of hanging until Vercel's own function timeout.
    return NextResponse.json({ error: "Server sedang sibuk, coba lagi." }, { status: 503 });
  }
}
