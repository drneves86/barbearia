import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";

function secret(): Uint8Array {
  const value = process.env.ADMIN_SECRET || "dev-admin-secret-change-me";
  return new TextEncoder().encode(value);
}

export type AdminSession = { sub: string; email: string };

export async function createSessionToken(
  payload: AdminSession
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySessionToken(
  token: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return { sub: String(payload.sub ?? ""), email: String(payload.email ?? "") };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function isAdmin(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}
