"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, ErrorBox, Spinner } from "@/components/ui";
import { formatDateBR } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/config";

export type CancelAppointmentInfo = {
  token: string;
  barberName: string;
  barberPhotoUrl: string;
  date: string;
  time: string;
  serviceEmoji: string;
  serviceName: string;
  serviceImageUrl: string;
  priceCents: number;
  userName: string;
  userLastName: string;
};

export function CancelForm(props: CancelAppointmentInfo) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  async function onCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: props.token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível cancelar.");
        return;
      }
      setCancelled(true);
      if (data.waLink) {
        window.location.href = data.waLink;
      }
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (cancelled) {
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
            Seu agendamento com o barbeiro {props.barberName} no dia{" "}
            {formatDateBR(props.date)} às {props.time} foi removido da agenda.
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
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <h1 className="text-2xl font-extrabold text-crimson">
        Cancelar agendamento
      </h1>
      <p className="mt-2 text-muted">
        Confira os dados abaixo. Tem certeza que deseja cancelar?
      </p>

      <div className="mt-6 rounded-2xl border border-crimson/30 bg-panel p-4">
        <ul className="divide-y divide-line text-sm">
          <li className="flex items-center justify-between py-2.5">
            <span className="text-muted">Serviço</span>
            <span className="flex items-center gap-2 font-semibold text-cream">
              {props.serviceImageUrl ? (
                <img
                  src={props.serviceImageUrl}
                  alt={props.serviceName}
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                <span>{props.serviceEmoji}</span>
              )}
              {props.serviceName}
            </span>
          </li>
          <li className="flex justify-between py-2.5">
            <span className="text-muted">Valor</span>
            <span className="font-semibold text-gold">
              {formatPrice(props.priceCents)}
            </span>
          </li>
          <li className="flex items-center justify-between py-2.5">
            <span className="text-muted">Barbeiro</span>
            <span className="flex items-center gap-2 font-semibold text-cream">
              {props.barberPhotoUrl ? (
                <img
                  src={props.barberPhotoUrl}
                  alt={props.barberName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : null}
              {props.barberName}
            </span>
          </li>
          <li className="flex justify-between py-2.5">
            <span className="text-muted">Data</span>
            <span className="font-semibold text-cream">
              {formatDateBR(props.date)}
            </span>
          </li>
          <li className="flex justify-between py-2.5">
            <span className="text-muted">Horário</span>
            <span className="font-bold text-gold">{props.time}</span>
          </li>
          <li className="flex justify-between py-2.5">
            <span className="text-muted">Cliente</span>
            <span className="text-right font-semibold text-cream">
              {props.userName} {props.userLastName}
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-6">
        <ErrorBox message={error} />
        <div className="flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            disabled={loading}
            onClick={onCancel}
          >
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
    </div>
  );
}
