import { hash } from "bcryptjs";
import { getAdminSession } from "@/lib/auth";
import { deleteAdmin, updateAdmin } from "@/lib/db";
import { loginSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { email, password } = (body as { email?: string; password?: string }) ?? {};
  const patch: { email?: string; passwordHash?: string } = {};

  if (email !== undefined) {
    const parsed = loginSchema.safeParse({ email, password: "x" });
    if (!parsed.success) {
      return Response.json({ error: "E-mail inválido." }, { status: 400 });
    }
    patch.email = email;
  }

  if (password !== undefined) {
    if (typeof password !== "string" || password.length < 1) {
      return Response.json({ error: "Informe uma senha." }, { status: 400 });
    }
    patch.passwordHash = await hash(password, 10);
  }

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  try {
    const ok = await updateAdmin(id, patch);
    if (!ok) {
      return Response.json({ error: "Não foi possível atualizar." }, { status: 500 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erro interno" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;

  if (id === session.sub) {
    return Response.json(
      { error: "Você não pode excluir o próprio usuário." },
      { status: 400 }
    );
  }

  try {
    const ok = await deleteAdmin(id);
    if (!ok) {
      return Response.json({ error: "Não foi possível excluir." }, { status: 500 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erro interno" },
      { status: 500 }
    );
  }
}
