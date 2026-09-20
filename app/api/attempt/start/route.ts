import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getQuizConfig } from "@/lib/config";
import { db } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  const config = await getQuizConfig();
  if (!config.kuisDibuka) {
    return NextResponse.json({ error: "Kuis belum dibuka" }, { status: 403 });
  }

  const { data: attempts, error: fetchError } = await db
    .from("attempt")
    .select("attempt_ke, waktu_submit, lulus")
    .eq("nrp", session.nrp)
    .order("attempt_ke");
  if (fetchError) return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });

  if (attempts?.some((a) => a.lulus)) {
    return NextResponse.json({ error: "Kamu sudah lulus" }, { status: 403 });
  }

  const active = attempts?.find((a) => a.waktu_submit === null);
  if (active) {
    return NextResponse.json({ ok: true, resumed: true });
  }

  const submitted = (attempts ?? []).filter((a) => a.waktu_submit !== null);
  const nextAttemptKe = submitted.length > 0 ? Math.max(...submitted.map((a) => a.attempt_ke)) + 1 : 1;
  const now = new Date();

  if (nextAttemptKe === 1) {
    if (config.windowMulaiTutup === null || now > config.windowMulaiTutup) {
      return NextResponse.json({ error: "Waktu pengerjaan sudah ditutup" }, { status: 403 });
    }
  } else {
    const lastAttempt = submitted.find((a) => a.attempt_ke === nextAttemptKe - 1);
    if (lastAttempt) {
      const cooldownEnds = new Date(
        new Date(lastAttempt.waktu_submit as string).getTime() + config.cooldownDetik * 1000
      );
      if (now < cooldownEnds) {
        return NextResponse.json({ error: "Masih dalam masa cooldown" }, { status: 403 });
      }
    }
    if (config.deadline !== null && now > config.deadline) {
      return NextResponse.json({ error: "Batas waktu pengerjaan sudah berakhir" }, { status: 403 });
    }
  }

  const seed = Math.floor(Math.random() * 0xffffffff);
  const { error: insertError } = await db.from("attempt").insert({
    nrp: session.nrp,
    attempt_ke: nextAttemptKe,
    seed,
  });

  if (insertError) {
    // Unique-violation on satu_attempt_aktif: a race (double click / two tabs)
    // already created the active attempt — treat this as a resume instead of an error.
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true, resumed: true });
    }
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, resumed: false });
}
