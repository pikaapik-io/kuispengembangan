import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./session-cookie";

const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h — comfortably covers one event day

export type SessionPayload = {
  nrp: string;
  nama: string;
  departemen: string;
  isAdmin: boolean;
};

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET must be set");
  return new TextEncoder().encode(secret);
}

async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.nrp === "string" &&
      typeof payload.nama === "string" &&
      typeof payload.departemen === "string"
    ) {
      // isAdmin didn't exist in sessions issued before this field was added —
      // default to false instead of invalidating everyone's active session.
      return {
        nrp: payload.nrp,
        nama: payload.nama,
        departemen: payload.departemen,
        isAdmin: payload.isAdmin === true,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// For use in Server Components and Route Handlers (read-only in the former).
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

// Route Handlers only — Server Components can't set cookies.
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
