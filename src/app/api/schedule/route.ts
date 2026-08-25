import type { NextRequest } from "next/server";
import { getBarberSchedule } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const barberId = sp.get("barberId") ?? "";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";

  if (!barberId || !from || !to) {
    return Response.json({ schedule: [] });
  }

  try {
    const schedule = await getBarberSchedule(barberId, from, to);
    return Response.json({ schedule });
  } catch {
    return Response.json({ schedule: [] });
  }
}
