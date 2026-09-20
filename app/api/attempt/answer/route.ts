import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getQuizConfig } from "@/lib/config";
import { getSoalById } from "@/lib/soal";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const soalId = Number(body?.soal_id);
  const jawaban = body?.jawaban === null || body?.jawaban === undefined ? null : String(body.jawaban);
  const ragu = typeof body?.ragu === "boolean" ? body.ragu : undefined;

  if (!Number.isInteger(soalId)) {
    return NextResponse.json({ error: "soal_id tidak valid" }, { status: 400 });
  }

  const soal = await getSoalById(soalId);
  if (!soal) return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 400 });
  if (jawaban !== null && !soal.opsi.some((o) => o.key === jawaban)) {
    return NextResponse.json({ error: "Jawaban tidak valid" }, { status: 400 });
  }

  const { data: active, error } = await db
    .from("attempt")
    .select("id, waktu_mulai, ragu_ragu")
    .eq("nrp", session.nrp)
    .is("waktu_submit", null)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  if (!active) return NextResponse.json({ error: "Tidak ada attempt aktif" }, { status: 409 });

  const config = await getQuizConfig();
  const cutoff = new Date(active.waktu_mulai).getTime() + (config.durasiDetik + 5) * 1000;
  if (Date.now() > cutoff) {
    return NextResponse.json({ error: "Waktu sudah habis" }, { status: 403 });
  }

  if (body?.jawaban !== undefined) {
    const { error: upsertError } = await db
      .from("attempt_jawaban")
      .upsert({ attempt_id: active.id, soal_id: soalId, jawaban }, { onConflict: "attempt_id,soal_id" });
    if (upsertError) return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }

  if (ragu !== undefined) {
    const current: number[] = active.ragu_ragu ?? [];
    const next = ragu ? Array.from(new Set([...current, soalId])) : current.filter((id) => id !== soalId);
    const { error: updateError } = await db.from("attempt").update({ ragu_ragu: next }).eq("id", active.id);
    if (updateError) return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
