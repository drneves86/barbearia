import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { findAdminByEmail } from "@/lib/db";
import { createSessionToken, ADMIN_COOKIE } from "@/lib/auth";
import { firstErrorMessage, loginSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: firstErrorMessage(parsed.error) }, { status: 400 });
  }

  const admin = await findAdminByEmail(parsed.data.email);
  if (!admin) {
    return Response.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const match = await compare(parsed.data.password, admin.password_hash);
  if (!match) {
    return Response.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const token = await createSessionToken({ sub: admin.id, email: admin.email });

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return Response.json({ ok: true, name: admin.name });
}
