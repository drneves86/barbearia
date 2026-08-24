import Link from "next/link";
import Image from "next/image";
import { RegistrationForm } from "@/components/registration-form";
import { formatPrice } from "@/lib/config";
import { listServices, getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

function ShopIcon({ icon }: { icon: string }) {
  const isUrl = icon.startsWith("http");
  if (isUrl) {
    return (
      <div className="mx-auto mb-4 inline-flex overflow-hidden rounded-2xl border border-gold/40 shadow-[0_0_40px_rgba(212,175,55,0.25)]">
        <Image
          src={icon}
          alt="Logo"
          width={256}
          height={256}
          className="h-auto w-auto max-h-48 max-w-48 object-contain bg-panel"
          unoptimized
        />
      </div>
    );
  }
  return (
    <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-2xl border border-gold/40 bg-panel px-2 py-1 text-sm shadow-[0_0_40px_rgba(212,175,55,0.25)]">
      {icon}
    </div>
  );
}

export default async function Home() {
  let services: { name: string; priceCents: number; emoji: string; imageUrl: string | null }[] = [];
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
        <ShopIcon icon={shopIcon} />
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
                className="flex items-center gap-3 py-2.5"
              >
                {s.imageUrl ? (
                  <Image
                    src={s.imageUrl}
                    alt={s.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-lg">{s.emoji}</span>
                )}
                <span className="flex-1 text-cream">{s.name}</span>
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
