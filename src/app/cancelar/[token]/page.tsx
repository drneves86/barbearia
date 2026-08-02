import { notFound } from "next/navigation";
import Link from "next/link";
import { getAppointmentByToken } from "@/lib/db";
import { CancelForm } from "@/components/cancel-form";
import { formatDateBR } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function CancelarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const appointment = await getAppointmentByToken(token);

  if (!appointment) {
    notFound();
  }

  if (appointment.status === "cancelled") {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-10 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-panel text-4xl">
          🗓️
        </div>
        <h1 className="text-2xl font-extrabold text-cream">
          Este agendamento já foi cancelado
        </h1>
        <p className="mt-2 text-muted">
          Se desejar, você pode agendar um novo horário.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-gold px-6 font-semibold text-ink"
        >
          Agendar novo horário
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <h1 className="text-2xl font-extrabold text-crimson">
        Cancelar agendamento
      </h1>
      <p className="mt-2 text-muted">
        Confira os dados abaixo. Tem certeza que deseja cancelar?
      </p>

      <div className="mt-6 rounded-2xl border border-crimson/30 bg-panel p-4">
        <ul className="divide-y divide-line text-sm">
          <li className="flex justify-between py-2.5">
            <span className="text-muted">Serviço</span>
            <span className="font-semibold text-cream">
              {appointment.serviceEmoji} {appointment.serviceName}
            </span>
          </li>
          <li className="flex justify-between py-2.5">
            <span className="text-muted">Valor</span>
            <span className="font-semibold text-gold">
              {formatPrice(appointment.priceCents)}
            </span>
          </li>
          <li className="flex justify-between py-2.5">
            <span className="text-muted">Barbeiro</span>
            <span className="font-semibold text-cream">
              {appointment.barberName}
            </span>
          </li>
          <li className="flex justify-between py-2.5">
            <span className="text-muted">Data</span>
            <span className="font-semibold text-cream">
              {formatDateBR(appointment.date)}
            </span>
          </li>
          <li className="flex justify-between py-2.5">
            <span className="text-muted">Horário</span>
            <span className="font-bold text-gold">{appointment.time}</span>
          </li>
          <li className="flex justify-between py-2.5">
            <span className="text-muted">Cliente</span>
            <span className="text-right font-semibold text-cream">
              {appointment.userName} {appointment.userLastName}
            </span>
          </li>
        </ul>
      </div>

      <CancelForm
        token={token}
        barberName={appointment.barberName}
        date={appointment.date}
        time={appointment.time}
      />
    </div>
  );
}
