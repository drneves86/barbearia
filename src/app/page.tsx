import Link from "next/link";
import { RegistrationForm } from "@/components/registration-form";
import { formatPrice } from "@/lib/config";
import { listServices, getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  let services: { name: string; priceCents: number; emoji: string }[] = [];
  try {
    services = await listServices(true);
  } catch {
    services = [];
  }

  let settings: Record<string, string> = {};
  try {
    settings = await getSettings();
  } catch {
    settings = {};
  }

  const shopName = settings.barbershop_name || "Minha Barbearia";
  const shopIcon = settings.barbershop_icon || "💈";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:max-w-lg">
      <header className="pt-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/40 bg-panel text-3xl shadow-[0_0_40px_rgba(212,175,55,0.25)]">
          {shopIcon}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-cream">
          {shopName}
        </h1>
        <p className="mt-2 text-muted">
          Agende seu corte em segundos, sem ligação e sem fila.
        </p>
      </header>

      <section className="rounded-3xl border border-line bg-ink-soft/80 p-5 shadow-2xl backdrop-blur-sm">
        <h2 className="mb-1 text-lg font-bold text-gold">Criar agendamento</h2>
        <p className="mb-4 text-sm text-muted">
          Preencha seus dados para começar o agendamento.
        </p>
        <RegistrationForm barbershopName={shopName} />
      </section>

      {services.length > 0 ? (
        <section className="rounded-3xl border border-line bg-ink-soft/60 p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
            Serviços
          </h2>
          <ul className="divide-y divide-line">
            {services.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between py-2.5"
              >
                <span className="flex items-center gap-2 text-cream">
                  <span className="text-lg">{s.emoji}</span>
                  {s.name}
                </span>
                <span className="font-semibold text-gold">
                  {formatPrice(s.priceCents)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="pb-6 text-center text-xs text-muted/60">
        <div className="space-y-1">
          <p>Segunda a sexta, 08h às 18h</p>
          <Link href="/admin" className="underline hover:text-gold">
            Acesso administrativo
          </Link>
        </div>
        <div className="mt-6 space-y-0.5">
          <p>{settings.footer_copyright}</p>
          <p>{settings.footer_credit}</p>
        </div>
      </footer>
    </div>
  );
}
