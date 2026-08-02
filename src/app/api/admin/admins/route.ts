import { hash } from "bcryptjs";
import { getAdminSession } from "@/lib/auth";
import { createAdmin, listAdmins } from "@/lib/db";
import { firstErrorMessage, loginSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  return Response.json({ admins: await listAdmins() });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

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

  try {
    const passwordHash = await hash(parsed.data.password, 10);
    const admin = await createAdmin({
      email: parsed.data.email,
      passwordHash,
      name: "Administrador",
    });
    return Response.json({ ok: true, admin }, { status: 201 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erro interno" },
      { status: 500 }
    );
  }
}
