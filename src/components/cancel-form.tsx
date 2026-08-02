"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, ErrorBox, Spinner } from "@/components/ui";

export function CancelForm({
  token,
  barberName,
  date,
  time,
}: {
  token: string;
  barberName: string;
  date: string;
  time: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [waLink, setWaLink] = useState<string | null>(null);

  async function onCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível cancelar.");
        return;
      }
      setWaLink(data.waLink);
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (waLink) {
    return (
      <div className="mt-8 rounded-2xl border border-gold/30 bg-panel p-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-3xl">
          ✔️
        </div>
        <h2 className="text-xl font-bold text-cream">Horário cancelado!</h2>
        <p className="mt-2 text-sm text-muted">
          Seu agendamento com o barbeiro {barberName} no dia {date} às {time}{" "}
          foi removido da agenda.
        </p>
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] font-bold text-white transition hover:brightness-110"
          >
            Avisar no WhatsApp
          </a>
        ) : (
          <p className="mt-5 rounded-xl border border-line bg-ink-soft/70 p-4 text-center text-sm text-muted">
            O barbeiro ainda não cadastrou o número de WhatsApp.
          </p>
        )}
        <Link
          href="/"
          className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl border border-line text-cream transition hover:border-gold/50 hover:text-gold"
        >
          Agendar novo horário
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <ErrorBox message={error} />
      <div className="flex gap-3">
        <Button variant="danger" className="flex-1" disabled={loading} onClick={onCancel}>
          {loading ? <Spinner className="h-5 w-5" /> : null}
          SIM, cancelar
        </Button>
        <Link
          href="/"
          className="flex h-12 flex-1 items-center justify-center rounded-xl border border-line text-cream transition hover:border-gold/50 hover:text-gold"
        >
          NÃO, voltar
        </Link>
      </div>
    </div>
  );
}
