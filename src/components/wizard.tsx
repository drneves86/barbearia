"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, ErrorBox, Spinner } from "@/components/ui";
import { Calendar } from "@/components/calendar";
import { TimePicker } from "@/components/time-picker";
import { formatDateBR } from "@/lib/whatsapp";
import { isDateSelectable } from "@/lib/slots";
import { todayInTZ } from "@/lib/date";
import { appointmentSchema, firstErrorMessage } from "@/lib/validations";
import { formatPrice } from "@/lib/config";
import type { Barber, Service, Slot } from "@/lib/types";

const USER_KEY = "barbearia-user";
const STEPS = ["Serviço", "Barbeiro", "Data", "Horário", "Resumo"];

type UserForm = { name: string; lastName: string; phone: string };

function CancelBookingLink() {
  return (
    <Link
      href="/"
      className="mt-4 flex h-12 w-full items-center justify-center rounded-xl border border-red-500/40 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
    >
      Cancelar agendamento
    </Link>
  );
}
type Result = {
  date: string;
  time: string;
  service: string;
  barber: string;
  serviceImageUrl: string;
  barberPhotoUrl: string;
  cancelUrl: string;
  waLink: string;
  clientName: string;
  clientPhone: string;
};

export function Wizard() {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/catalog", { cache: "no-store" });
        const data = await res.json();
        if (data.services) setServices(data.services);
        if (data.barbers) setBarbers(data.barbers);
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [user, setUser] = useState<UserForm>({ name: "", lastName: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const today = useMemo(() => todayInTZ(), []);

  useEffect(() => {
    const raw = sessionStorage.getItem(USER_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<UserForm>;
        setTimeout(() => setUser((u) => ({ ...u, ...parsed })), 0);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data) => {
        setServices(data.services ?? []);
        setBarbers(data.barbers ?? []);
      })
      .catch(() => setError("Não foi possível carregar os serviços. Tente novamente."))
      .finally(() => setLoadingCatalog(false));
  }, []);

  const loadSlots = useCallback(async (barber: string, day: string) => {
    setLoadingSlots(true);
    setSlots([]);
    try {
      const res = await fetch(
        `/api/slots?barberId=${encodeURIComponent(barber)}&date=${encodeURIComponent(day)}`
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const selectedService = services.find((s) => s.id === serviceId) ?? null;
  const selectedBarber = barbers.find((b) => b.id === barberId) ?? null;

  function goToTime(day: string) {
    setDate(day);
    setTime(null);
    if (barberId) loadSlots(barberId, day);
    setStep(3);
    setPickerOpen(true);
  }

  async function confirm() {
    if (!serviceId || !barberId || !date || !time) {
      setError("Complete todas as etapas antes de confirmar.");
      return;
    }
    const parsed = appointmentSchema.safeParse({ ...user, serviceId, barberId, date, time });
    if (!parsed.success) {
      setError(firstErrorMessage(parsed.error));
      setStep(4);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível concluir o agendamento.");
        return;
      }
      sessionStorage.removeItem(USER_KEY);
      if (data.waLink) {
        window.location.href = data.waLink;
      }
      setResult({
        date: data.appointment.date,
        time: data.appointment.time,
        service: data.appointment.service,
        barber: data.appointment.barber,
        serviceImageUrl: data.appointment.serviceImageUrl,
        barberPhotoUrl: data.appointment.barberPhotoUrl,
        cancelUrl: data.cancelUrl,
        waLink: data.waLink,
        clientName: data.clientName || user.name,
        clientPhone: user.phone,
      });
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return <SuccessScreen result={result} />;
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold text-cream">Agendar horário</h1>
        <div className="mt-3 flex items-center gap-1.5">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col gap-1.5">
              <div
                className={`h-1.5 rounded-full transition ${
                  i <= step ? "bg-gold" : "bg-line"
                }`}
              />
              <span
                className={`text-[10px] font-medium uppercase tracking-wide ${
                  i === step ? "text-gold" : i < step ? "text-cream/70" : "text-muted/40"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </header>

      <ErrorBox message={error} />

      {loadingCatalog ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 text-gold" />
        </div>
      ) : (
        <>
          {/* Etapa 1 — Serviço */}
          {step === 0 && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-cream">
                Escolha o tipo de corte
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setServiceId(s.id);
                      setStep(1);
                    }}
                    className="flex flex-col items-start gap-2 rounded-2xl border border-line bg-panel p-4 text-left transition hover:border-gold/60 hover:bg-panel-2"
                  >
                    {s.imageUrl ? (
                      <img
                        src={s.imageUrl}
                        alt={s.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-3xl">{s.emoji}</span>
                    )}
                    <span className="font-semibold leading-tight text-cream">
                      {s.name}
                    </span>
                    <span className="text-sm font-bold text-gold">
                      {formatPrice(s.priceCents)}
                    </span>
                  </button>
                ))}
              </div>
              <CancelBookingLink />
            </div>
          )}

          {/* Etapa 2 — Barbeiro */}
          {step === 1 && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-cream">
                Escolha o barbeiro
              </h2>
              <div className="space-y-2">
                {barbers.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setBarberId(b.id);
                      setStep(2);
                    }}
                    className="flex w-full items-center gap-4 rounded-2xl border border-line bg-panel px-4 py-4 text-left transition hover:border-gold/60 hover:bg-panel-2"
                  >
                    {b.photoUrl ? (
                      <img
                        src={b.photoUrl}
                        alt={b.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-panel-2 text-2xl">
                        🧑‍💼
                      </span>
                    )}
                    <div>
                      <p className="font-semibold text-cream">{b.name}</p>
                      <p className="text-xs text-muted">Especialista em cortes</p>
                    </div>
                  </button>
                ))}
              </div>
              <Button variant="ghost" onClick={() => setStep(0)}>
                ← Voltar
              </Button>
              <CancelBookingLink />
            </div>
          )}

          {/* Etapa 3 — Data */}
          {step === 2 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-cream">
                Escolha a data
              </h2>
              <Calendar
                today={today}
                selected={date}
                isSelectable={isDateSelectable}
                onSelect={(d) => goToTime(d)}
              />
              <Button variant="ghost" onClick={() => setStep(1)}>
                ← Voltar
              </Button>
              <CancelBookingLink />
            </div>
          )}

          {/* Etapa 4 — Horário */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-cream">
                Escolha o horário
              </h2>
              <div className="rounded-2xl border border-line bg-panel p-4">
                <div className="flex items-center gap-4">
                  {selectedService?.imageUrl ? (
                    <img
                      src={selectedService.imageUrl}
                      alt={selectedService.name}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-panel-2 text-3xl">
                      {selectedService?.emoji}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <span className="text-muted">
                      Serviço:{" "}
                      <span className="text-cream">{selectedService?.name}</span>
                    </span>
                    <span className="text-muted">
                      Barbeiro:{" "}
                      <span className="flex items-center gap-2 text-cream">
                        {selectedBarber?.photoUrl && (
                          <img
                            src={selectedBarber.photoUrl}
                            alt={selectedBarber.name}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        )}
                        {selectedBarber?.name}
                      </span>
                    </span>
                    <span className="text-muted">
                      Data:{" "}
                      <span className="text-cream">
                        {date ? formatDateBR(date) : "—"}
                      </span>
                    </span>
                    <span className="text-muted">
                      Horário:{" "}
                      <span className="font-bold text-gold">{time ?? "—"}</span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={loadingSlots}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-gold/50 bg-gold/10 text-lg font-bold text-gold transition hover:bg-gold/20 disabled:opacity-50"
              >
                {loadingSlots ? <Spinner className="h-5 w-5" /> : "⏰"}
                {loadingSlots ? "Carregando horários..." : time ? `Horário: ${time}` : "Selecionar horário"}
              </button>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                  ← Data
                </Button>
                <Button
                  className="flex-1"
                  disabled={!time}
                  onClick={() => setStep(4)}
                >
                  Continuar →
                </Button>
              </div>

              <CancelBookingLink />

              <TimePicker
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                date={date ?? today}
                barberName={selectedBarber?.name ?? ""}
                slots={slots}
                selectedTime={time}
                onSelect={setTime}
              />
            </div>
          )}

          {/* Etapa 5 — Resumo */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-cream">
                Confirme sua reserva
              </h2>

              <div className="rounded-2xl border border-gold/30 bg-panel p-4">
                <div className="flex items-center gap-3 border-b border-line py-3">
                  <span className="text-muted">Serviço</span>
                  <span className="ml-auto flex items-center gap-2 font-semibold text-cream">
                    {selectedService?.imageUrl ? (
                      <img
                        src={selectedService.imageUrl}
                        alt={selectedService.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : null}
                    {selectedService?.name}
                  </span>
                </div>
                <ul className="divide-y divide-line text-sm">
                  <li className="flex justify-between py-2">
                    <span className="text-muted">Valor</span>
                    <span className="font-semibold text-gold">
                      {formatPrice(selectedService?.priceCents ?? 0)}
                    </span>
                  </li>
                  <li className="flex items-center justify-between py-2">
                    <span className="text-muted">Barbeiro</span>
                    <span className="flex items-center gap-2 font-semibold text-cream">
                      {selectedBarber?.photoUrl ? (
                        <img
                          src={selectedBarber.photoUrl}
                          alt={selectedBarber.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : null}
                      {selectedBarber?.name}
                    </span>
                  </li>
                  <li className="flex justify-between py-2">
                    <span className="text-muted">Data</span>
                    <span className="font-semibold text-cream">
                      {date ? formatDateBR(date) : "—"}
                    </span>
                  </li>
                  <li className="flex justify-between py-2">
                    <span className="text-muted">Horário</span>
                    <span className="font-bold text-gold">{time}</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-line bg-ink-soft/70 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
                  Seus dados
                </h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Nome</dt>
                    <dd className="font-semibold text-cream">{user.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Sobrenome</dt>
                    <dd className="font-semibold text-cream">
                      {user.lastName || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Telefone (WhatsApp)</dt>
                    <dd className="font-semibold text-cream">{user.phone}</dd>
                  </div>
                </dl>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(3)} className="flex-1">
                  ← Voltar
                </Button>
                <Button
                  className="flex-1"
                  disabled={submitting}
                  onClick={confirm}
                >
                  {submitting ? <Spinner className="h-5 w-5" /> : null}
                  Confirmar Reserva
                </Button>
              </div>

              <CancelBookingLink />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SuccessScreen({ result }: { result: Result }) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gold/15 text-5xl">
        ✅
      </div>
      <h1 className="text-2xl font-extrabold text-cream">Agendamento confirmado!</h1>
      <p className="mt-2 text-muted">
        Seu horário foi reservado com sucesso.
      </p>

      <div className="mt-6 rounded-2xl border border-gold/30 bg-panel p-4 text-left">
        <ul className="divide-y divide-line text-sm">
          <li className="flex items-center justify-between py-2">
            <span className="text-muted">Serviço</span>
            <span className="flex items-center gap-2 font-semibold text-cream">
              {result.serviceImageUrl ? (
                <img
                  src={result.serviceImageUrl}
                  alt={result.service}
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : null}
              {result.service}
            </span>
          </li>
          <li className="flex items-center justify-between py-2">
            <span className="text-muted">Barbeiro</span>
            <span className="flex items-center gap-2 font-semibold text-cream">
              {result.barberPhotoUrl ? (
                <img
                  src={result.barberPhotoUrl}
                  alt={result.barber}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : null}
              {result.barber}
            </span>
          </li>
          <li className="flex justify-between py-2">
            <span className="text-muted">Data</span>
            <span className="font-semibold text-cream">{formatDateBR(result.date)}</span>
          </li>
          <li className="flex justify-between py-2">
            <span className="text-muted">Horário</span>
            <span className="font-bold text-gold">{result.time}</span>
          </li>
          <li className="flex justify-between py-2">
            <span className="text-muted">Cliente</span>
            <span className="font-semibold text-cream">{result.clientName}</span>
          </li>
          <li className="flex justify-between py-2">
            <span className="text-muted">Telefone</span>
            <span className="font-semibold text-cream">{result.clientPhone}</span>
          </li>
        </ul>
      </div>

      <Link
        href="/"
        className="mt-6 flex h-14 w-full items-center justify-center rounded-xl bg-gold text-lg font-bold text-ink transition hover:brightness-110"
      >
        Realizar novo agendamento
      </Link>
    </div>
  );
}
