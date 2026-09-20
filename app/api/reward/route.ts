import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getQuizConfig } from "@/lib/config";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  const { data: lulusRow } = await db
    .from("attempt")
    .select("id")
    .eq("nrp", session.nrp)
    .eq("lulus", true)
    .maybeSingle();

  if (!lulusRow) {
    return NextResponse.json({ error: "Kamu belum lulus" }, { status: 403 });
  }

  const config = await getQuizConfig();
  return NextResponse.json({ link: config.linkReward });
}
