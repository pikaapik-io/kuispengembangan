import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

// Presence-only check (no crypto in the edge middleware runtime concerns) —
// real verification and all data gating happens per-request in the API
// routes. This just avoids a flash of a protected page before redirecting.
export function middleware(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  if (!hasSession) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/mulai", "/kuis", "/hasil", "/selesai", "/peringkat", "/admin"],
};
