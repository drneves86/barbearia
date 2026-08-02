import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-20 text-center">
      <div className="text-6xl">🔍</div>
      <h1 className="mt-4 text-2xl font-extrabold text-cream">
        Não encontramos isso
      </h1>
      <p className="mt-2 text-muted">
        O link pode estar inválido ou o agendamento já foi cancelado.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-gold px-6 font-semibold text-ink"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
