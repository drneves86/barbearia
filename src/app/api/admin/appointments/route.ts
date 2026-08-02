import type { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listAppointments } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const appointments = await listAppointments({
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    barberId: params.get("barberId") ?? undefined,
    status: params.get("status") ?? undefined,
  });

  return Response.json({ appointments });
}
