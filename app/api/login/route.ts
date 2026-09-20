import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeNama } from "@/lib/normalize";
import { setSessionCookie } from "@/lib/auth";

const GENERIC_ERROR = "Data tidak sesuai, hubungi mentormu.";

export async function POST(req: NextRequest) {
  // TODO(rate-limit): limit by IP (e.g. 5/menit) once a DB-backed limiter exists.
  const body = await req.json().catch(() => null);
  const nama = typeof body?.nama === "string" ? body.nama.trim() : "";
  const nrp = typeof body?.nrp === "string" ? body.nrp.trim() : "";
  const departemen = typeof body?.departemen === "string" ? body.departemen.trim() : "";

  if (!nama || !nrp || !departemen) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const { data: peserta, error } = await db
    .from("peserta")
    .select("nrp, nama, departemen")
    .eq("nrp", nrp)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Terjadi kesalahan, coba lagi." }, { status: 500 });
  }

  if (
    !peserta ||
    normalizeNama(peserta.nama) !== normalizeNama(nama) ||
    peserta.departemen !== departemen
  ) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  await setSessionCookie({
    nrp: peserta.nrp,
    nama: peserta.nama,
    departemen: peserta.departemen,
  });

  return NextResponse.json({ ok: true });
}
