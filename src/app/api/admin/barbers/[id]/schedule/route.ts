import type { NextRequest } from "next/server";
import { getBarberSchedule, setBarberSchedule } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sp = request.nextUrl.searchParams;
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";

  if (!from || !to) {
    return Response.json({ error: "Parâmetros from e to são obrigatórios" }, { status: 400 });
  }

  try {
    const schedule = await getBarberSchedule(id, from, to);
    return Response.json({ schedule });
  } catch {
    return Response.json({ error: "Erro ao consultar agenda" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const { date, available, startTime, endTime } = body as {
    date?: string;
    available?: boolean;
    startTime?: string | null;
    endTime?: string | null;
  };

  if (!date || typeof available !== "boolean") {
    return Response.json({ error: "date e available são obrigatórios" }, { status: 400 });
  }

  try {
    const entry = await setBarberSchedule({
      barberId: id,
      date,
      available,
      startTime: startTime ?? null,
      endTime: endTime ?? null,
    });
    return Response.json({ schedule: entry });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erro ao salvar agenda" },
      { status: 500 }
    );
  }
}
