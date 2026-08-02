import type { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { adminCancelAppointment, deleteAppointment } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin/appointments/[id]">
) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const ok = await adminCancelAppointment(id);
  if (!ok) {
    return Response.json(
      { error: "Agendamento não encontrado ou já cancelado." },
      { status: 404 }
    );
  }
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin/appointments/[id]">
) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const ok = await deleteAppointment(id);
  if (!ok) {
    return Response.json(
      { error: "Não foi possível excluir o agendamento." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}
