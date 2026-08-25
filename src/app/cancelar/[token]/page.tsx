import { notFound } from "next/navigation";
import Link from "next/link";
import { getAppointmentByToken } from "@/lib/db";
import { CancelForm } from "@/components/cancel-form";

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
        <h1 className="text-2xl font-extrabold text-cream">
          Agendamento cancelado
        </h1>
        <div className="mt-6 rounded-2xl border border-crimson/30 bg-panel p-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-crimson/15 text-4xl font-bold text-crimson">
            ✕
          </div>
          <p className="text-sm text-muted">
            Este agendamento já foi cancelado.
          </p>
        </div>
        <Link
          href="/"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gold font-semibold text-ink transition hover:brightness-110"
        >
          Agendar novo horário
        </Link>
      </div>
    );
  }

  return (
    <CancelForm
      token={token}
      barberName={appointment.barberName}
      barberPhotoUrl={appointment.barberPhotoUrl}
      date={appointment.date}
      time={appointment.time}
      serviceEmoji={appointment.serviceEmoji}
      serviceName={appointment.serviceName}
      serviceImageUrl={appointment.serviceImageUrl}
      priceCents={appointment.priceCents}
      userName={appointment.userName}
      userLastName={appointment.userLastName ?? ""}
    />
  );
}
