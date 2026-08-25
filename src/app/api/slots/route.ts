import type { NextRequest } from "next/server";
import { getBarberDaySchedule, getBookedTimes } from "@/lib/db";
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
    const [booked, schedule] = await Promise.all([
      getBookedTimes(date, barberId),
      getBarberDaySchedule(barberId, date),
    ]);
    return Response.json({ slots: availableSlotsFor(date, booked, schedule) });
  } catch {
    return Response.json({ error: "Erro ao consultar disponibilidade" }, { status: 500 });
  }
}
