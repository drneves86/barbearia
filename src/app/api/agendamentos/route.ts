import { createAppointment, findOrCreateUser, getSettings, listBarbers, listServices } from "@/lib/db";
import { appointmentSchema, firstErrorMessage } from "@/lib/validations";
import { buildWaLink, confirmationMessage } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: firstErrorMessage(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const user = await findOrCreateUser({
      name: data.name,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    });

    const appointment = await createAppointment({
      userId: user.id,
      serviceId: data.serviceId,
      barberId: data.barberId,
      date: data.date,
      time: data.time,
    });

    const [services, barbers] = await Promise.all([
      listServices(false),
      listBarbers(false),
    ]);
    const service = services.find((s) => s.id === data.serviceId);
    const barber = barbers.find((b) => b.id === data.barberId);

    const baseUrl = (process.env.BASE_URL || `https://${request.headers.get("host")}`).replace(/\/+$/, "");
    const cancelUrl = `${baseUrl}/cancelar/${appointment.cancelToken}`;

    const clientName = [user.name, user.lastName].filter(Boolean).join(" ").trim() || user.name;

    const settings = await getSettings().catch(() => ({} as Record<string, string>));
    const shopName = settings.barbershop_name || "Minha Barbearia";

    const message = confirmationMessage({
      barbershop: shopName,
      barberName: barber?.name ?? "a barbearia",
      clientName,
      serviceName: service?.name ?? "",
      price: formatPrice(service?.priceCents ?? 0),
      date: appointment.date,
      time: appointment.time,
      address: settings.barbershop_address || "",
      location: settings.barbershop_location || "",
      cancelUrl,
    });

    const barberPhone = barber?.phone ?? "";
    const waLink = barberPhone
      ? buildWaLink(barberPhone, message)
      : "";

    return Response.json({
      ok: true,
      appointment: {
        id: appointment.id,
        date: appointment.date,
        time: appointment.time,
        service: service?.name ?? "",
        barber: barber?.name ?? "",
        cancelToken: appointment.cancelToken,
      },
      waLink,
      cancelUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro interno";
    const status = message.includes("reservado") ? 409 : 500;
    return Response.json({ error: message }, { status });
  }
}
