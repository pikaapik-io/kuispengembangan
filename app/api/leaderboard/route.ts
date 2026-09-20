import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLeaderboard } from "@/lib/leaderboard";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  const result = await getLeaderboard(session.nrp, session.nama, session.departemen);
  return NextResponse.json(result);
}
