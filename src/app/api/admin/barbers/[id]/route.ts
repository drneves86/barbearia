import type { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { deleteBarber, updateBarber } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/barbers/[id]">
) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { name, phone, active } = body as {
    name?: string;
    phone?: string;
    active?: boolean;
  };
  if (name !== undefined && name.trim().length < 2) {
    return Response.json({ error: "Nome inválido." }, { status: 400 });
  }

  try {
    const barber = await updateBarber(id, {
      name: name !== undefined ? name.trim() : undefined,
      phone: phone !== undefined ? phone.trim() : undefined,
      active,
    });
    return Response.json({ barber });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erro interno" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin/barbers/[id]">
) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const ok = await deleteBarber(id);
  if (!ok) {
    return Response.json(
      { error: "Não foi possível excluir o barbeiro." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}
