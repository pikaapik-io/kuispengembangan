import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

const VALIDATION_ERROR = "NRP wajib diisi.";
const NRP_NOT_FOUND_ERROR = "NRP tidak terdaftar, hubungi mentormu.";
const DATA_INCOMPLETE_ERROR = "Data kamu belum lengkap di sistem, hubungi panitia.";

export async function POST(req: NextRequest) {
  // TODO(rate-limit): limit by IP (e.g. 5/menit) once a DB-backed limiter exists.
  const body = await req.json().catch(() => null);
  const nrp = typeof body?.nrp === "string" ? body.nrp.trim() : "";

  if (!nrp) {
    return NextResponse.json({ error: VALIDATION_ERROR }, { status: 400 });
  }

  // nama & departemen are managed entirely by panitia directly in the
  // `peserta` table — maba only ever types their NRP to log in.
  const { data: peserta, error } = await db
    .from("peserta")
    .select("nrp, nama, departemen, is_admin")
    .eq("nrp", nrp)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Terjadi kesalahan, coba lagi." }, { status: 500 });
  }

  if (!peserta) {
    return NextResponse.json({ error: NRP_NOT_FOUND_ERROR }, { status: 401 });
  }

  if (!peserta.nama || !peserta.departemen) {
    return NextResponse.json({ error: DATA_INCOMPLETE_ERROR }, { status: 403 });
  }

  await setSessionCookie({
    nrp: peserta.nrp,
    nama: peserta.nama,
    departemen: peserta.departemen,
    isAdmin: peserta.is_admin === true,
  });

  return NextResponse.json({ ok: true });
}
