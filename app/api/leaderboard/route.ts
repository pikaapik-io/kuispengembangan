import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLeaderboard } from "@/lib/leaderboard";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  try {
    const result = await getLeaderboard(session.nrp, session.nama, session.departemen);
    return NextResponse.json(result);
  } catch {
    // Supabase unreachable/timed out (see lib/db.ts fetch timeout) — fail fast
    // instead of hanging until Vercel's own function timeout.
    return NextResponse.json({ error: "Server sedang sibuk, coba lagi." }, { status: 503 });
  }
}
