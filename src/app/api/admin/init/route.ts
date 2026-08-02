import { hash } from "bcryptjs";
import { countAdmins, createAdmin } from "@/lib/db";
import { loginSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// Cria o primeiro administrador. Protegido por ADMIN_SETUP_KEY (definido no .env).
export async function POST(request: Request) {
  const setupKey = process.env.ADMIN_SETUP_KEY;
  if (!setupKey) {
    return Response.json(
      { error: "ADMIN_SETUP_KEY não configurada no servidor." },
      { status: 500 }
    );
  }

  const provided = request.headers.get("x-admin-setup-key");
  if (provided !== setupKey) {
    return Response.json({ error: "Chave de configuração inválida." }, { status: 403 });
  }

  const existing = await countAdmins();
  if (existing > 0) {
    return Response.json(
      { error: "Um administrador já foi criado." },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "E-mail e senha são obrigatórios (mín. 1 caractere)." },
      { status: 400 }
    );
  }

  const passwordHash = await hash(parsed.data.password, 10);
  try {
    const admin = await createAdmin({
      email: parsed.data.email,
      passwordHash,
      name: "Administrador",
    });
    return Response.json({ ok: true, admin });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erro interno" },
      { status: 500 }
    );
  }
}
