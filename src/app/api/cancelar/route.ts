import { cancelAppointmentByToken } from "@/lib/db";
import { buildWaLink, cancellationMessage } from "@/lib/whatsapp";
import { BARBERSHOP_NAME } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }
  const token = (body as { token?: string })?.token;
  if (!token || typeof token !== "string") {
    return Response.json({ error: "Token inválido." }, { status: 400 });
  }

  const appointment = await cancelAppointmentByToken(token);
  if (!appointment) {
    return Response.json(
      { error: "Agendamento não encontrado ou já cancelado." },
      { status: 404 }
    );
  }

  const message = cancellationMessage({
    barbershop: BARBERSHOP_NAME,
    barberName: appointment.barberName,
    date: appointment.date,
    time: appointment.time,
  });

  return Response.json({
    ok: true,
    waLink: buildWaLink(appointment.userPhone, message),
  });
}
