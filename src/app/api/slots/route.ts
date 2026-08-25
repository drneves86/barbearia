import type { NextRequest } from "next/server";
import { getBookedTimes, getSettings } from "@/lib/db";
import { availableSlotsFor, isDateSelectable } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const date = params.get("date") ?? "";
  const barberId = params.get("barberId") ?? "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !barberId) {
    return Response.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  if (!isDateSelectable(date)) {
    return Response.json({ slots: [] });
  }

  try {
    const [booked, settings] = await Promise.all([
      getBookedTimes(date, barberId),
      getSettings().catch(() => ({} as Record<string, string>)),
    ]);

    const defaultOpen = settings.working_hours_start || "08:00";
    const defaultClose = settings.working_hours_end || "18:00";
    return Response.json({ slots: availableSlotsFor(date, booked, defaultOpen, defaultClose) });
  } catch {
    return Response.json({ error: "Erro ao consultar disponibilidade" }, { status: 500 });
  }
}
