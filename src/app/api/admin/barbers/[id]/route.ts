import type { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateBarber } from "@/lib/db";

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

  const { name, active } = body as { name?: string; active?: boolean };
  if (name !== undefined && name.trim().length < 2) {
    return Response.json({ error: "Nome inválido." }, { status: 400 });
  }

  try {
    const barber = await updateBarber(id, {
      name: name !== undefined ? name.trim() : undefined,
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
