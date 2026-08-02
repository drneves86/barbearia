import type { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateService } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/services/[id]">
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

  const { name, price, emoji, active } = body as {
    name?: string;
    price?: number;
    emoji?: string;
    active?: boolean;
  };

  if (name !== undefined && name.trim().length < 2) {
    return Response.json({ error: "Nome inválido." }, { status: 400 });
  }
  if (price !== undefined && (Number.isNaN(Number(price)) || Number(price) < 0)) {
    return Response.json({ error: "Preço inválido." }, { status: 400 });
  }

  try {
    const service = await updateService(id, {
      name: name !== undefined ? name.trim() : undefined,
      priceCents: price !== undefined ? Math.round(Number(price)) : undefined,
      emoji,
      active,
    });
    return Response.json({ service });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erro interno" },
      { status: 500 }
    );
  }
}
