"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, ErrorBox, Input, Spinner } from "@/components/ui";
import { buildWaLink, formatDateBR } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/config";
import { todayInTZ } from "@/lib/date";
import { generateAllSlots } from "@/lib/slots";
import type { AppointmentWithDetails, Barber, BarberSchedule, Service } from "@/lib/types";

type Tab = "appointments" | "barbers" | "services" | "settings";

async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error((data as { error?: string })?.error ?? "Erro na requisição");
  }
  return res.json();
}

export function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("appointments");

  useEffect(() => {
    localStorage.setItem("admin-tab", tab);
  }, [tab]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-cream">Painel administrativo</h1>
          <p className="text-sm text-muted">{adminEmail}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("settings")}
            title="Configurações"
            aria-label="Configurações"
            className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition ${
              tab === "settings"
                ? "border-gold/60 bg-gold/10 text-gold"
                : "border-line text-cream hover:border-gold/50 hover:text-gold"
            }`}
          >
            ⚙️
          </button>
          <Link
            href="/"
            className="flex h-10 items-center justify-center rounded-lg border border-line px-4 text-sm text-cream transition hover:border-gold/50"
          >
            Ver site
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex h-10 items-center justify-center rounded-lg border border-line px-4 text-sm text-crimson transition hover:bg-crimson/10"
          >
            Sair
          </button>
        </div>
      </header>

      <nav className="mb-6 flex gap-2 rounded-2xl border border-line bg-panel p-1.5">
        {(
          [
            ["appointments", "Agendamentos"],
            ["barbers", "Barbeiros"],
            ["services", "Serviços"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              tab === key
                ? "bg-gold text-ink"
                : "text-muted hover:bg-panel-2 hover:text-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "appointments" ? <AppointmentsTab /> : null}
      {tab === "barbers" ? <BarbersTab /> : null}
      {tab === "services" ? <ServicesTab /> : null}
      {tab === "settings" ? <SettingsTab /> : null}
    </div>
  );
}

// ------------------------------------------------------------
// Agendamentos
// ------------------------------------------------------------
function AppointmentsTab() {
  const [items, setItems] = useState<AppointmentWithDetails[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [status, setStatus] = useState("");
  const [barberId, setBarberId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "calendar">(() => {
    if (typeof window === "undefined") return "calendar";
    const saved = window.localStorage.getItem("admin-appointments-view");
    if (saved === "list" || saved === "calendar") return saved;
    return "calendar";
  });
  const [calendarDay, setCalendarDay] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem("admin-appointments-view", view);
  }, [view]);

  async function fetchList(): Promise<AppointmentWithDetails[]> {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (barberId) params.set("barberId", barberId);
    const data = await api<{ appointments: AppointmentWithDetails[] }>(
      `/api/admin/appointments?${params.toString()}`
    );
    return data.appointments;
  }

  useEffect(() => {
    let cancelled = false;
    api<{ barbers: Barber[] }>("/api/admin/barbers")
      .then((d) => {
        if (!cancelled) setBarbers(d.barbers);
      })
      .catch(() => {
        if (!cancelled) setBarbers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const list = await fetchList();
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erro ao carregar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [status, barberId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function cancel(id: string) {
    if (!confirm("Cancelar este agendamento?")) return;
    try {
      await api(`/api/admin/appointments/${id}`, { method: "PATCH" });
      setItems(await fetchList());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cancelar.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este agendamento definitivamente?")) return;
    try {
      await api(`/api/admin/appointments/${id}`, { method: "DELETE" });
      setItems(await fetchList());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 rounded-xl border border-line bg-panel px-3 text-sm text-cream outline-none focus:border-gold/60"
        >
          <option value="">Todos os status</option>
          <option value="confirmed">Confirmados</option>
          <option value="cancelled">Cancelados</option>
        </select>
        <select
          value={barberId}
          onChange={(e) => setBarberId(e.target.value)}
          className="h-11 rounded-xl border border-line bg-panel px-3 text-sm text-cream outline-none focus:border-gold/60"
        >
          <option value="">Todos os barbeiros</option>
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <div className="ml-auto flex rounded-xl border border-line bg-panel p-1">
          {(
            [
              ["list", "Lista"],
              ["calendar", "Calendário"],
            ] as [typeof view, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setView(key);
                if (key === "calendar") setCalendarDay(null);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                view === key
                  ? "bg-gold text-ink"
                  : "text-muted hover:text-cream"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ErrorBox message={error} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8 text-gold" />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-line bg-panel p-8 text-center text-muted">
          Nenhum agendamento encontrado.
        </p>
      ) : view === "list" ? (
        <div className="space-y-2">
          {items.map((a) => (
            <AppointmentCard key={a.id} a={a} onCancel={cancel} onRemove={remove} />
          ))}
        </div>
      ) : (
        <AppointmentsCalendar
          items={items}
          selectedDay={calendarDay}
          onSelectDay={setCalendarDay}
          onCancel={cancel}
          onRemove={remove}
        />
      )}
    </div>
  );
}

function AppointmentCard({
  a,
  onCancel,
  onRemove,
}: {
  a: AppointmentWithDetails;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-2xl border bg-panel p-4 ${
        a.status === "cancelled" ? "border-crimson/30 opacity-60" : "border-line"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-cream">
            {formatDateBR(a.date)} às <span className="text-gold">{a.time}</span>
          </p>
          <p className="text-sm text-muted">
            {a.serviceEmoji} {a.serviceName} • {a.barberName}
          </p>
          <p className="text-xs text-muted/70">
            {a.userName} {a.userLastName} • {a.userPhone} • {a.userEmail}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {a.userPhone ? (
            <a
              href={buildWaLink(a.userPhone, `Olá, ${a.userName}!`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 items-center gap-1.5 rounded-lg bg-[#25D366]/15 px-3 text-xs font-semibold text-[#25D366] transition hover:bg-[#25D366]/25"
            >
              💬 WhatsApp
            </a>
          ) : null}
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              a.status === "confirmed"
                ? "bg-gold/15 text-gold"
                : "bg-crimson/15 text-red-300"
            }`}
          >
            {a.status === "confirmed" ? "Confirmado" : "Cancelado"}
          </span>
          {a.status === "confirmed" ? (
            <button
              type="button"
              onClick={() => onCancel(a.id)}
              className="rounded-lg border border-crimson/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-crimson/10"
            >
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRemove(a.id)}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-crimson/40 hover:text-red-300"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AppointmentsCalendar({
  items,
  selectedDay,
  onSelectDay,
  onCancel,
  onRemove,
}: {
  items: AppointmentWithDetails[];
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const first = items[0]?.date;
    return first ? new Date(first + "T12:00:00") : new Date();
  });
  const [dayStatus, setDayStatus] = useState<"" | "confirmed" | "cancelled">("");
  const today = useMemo(() => todayInTZ(), []);

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentWithDetails[]>();
    for (const a of items) {
      const list = map.get(a.date) ?? [];
      list.push(a);
      map.set(a.date, list);
    }
    return map;
  }, [items]);

  const days = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const cells: (Date | null)[] = [];
    const leading = first.getDay();
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(y, m, d));
    return cells;
  }, [cursor]);

  const visible = useMemo(() => {
    let list = selectedDay
      ? items.filter((a) => a.date === selectedDay)
      : items;
    if (selectedDay && dayStatus) list = list.filter((a) => a.status === dayStatus);
    return [...list].sort(
      (x, y) => x.date.localeCompare(y.date) || x.time.localeCompare(y.time)
    );
  }, [items, selectedDay, dayStatus]);

  const monthLabel = `${monthsBR[cursor.getMonth()]} ${cursor.getFullYear()}`;

  function toggleDay(day: Date) {
    const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    onSelectDay(selectedDay === dateStr ? null : dateStr);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-cream transition hover:border-gold/50 hover:text-gold"
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <p className="text-base font-semibold capitalize text-cream">{monthLabel}</p>
          <button
            type="button"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-cream transition hover:border-gold/50 hover:text-gold"
            aria-label="Próximo mês"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_SHORT.map((d, i) => (
            <div
              key={i}
              className="pb-1 text-center text-xs font-semibold uppercase text-muted"
            >
              {d}
            </div>
          ))}
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
            const dayItems = byDay.get(dateStr) ?? [];
            const hasConfirmed = dayItems.some((a) => a.status === "confirmed");
            const hasCancelled = dayItems.some((a) => a.status === "cancelled");
            const isSelected = selectedDay === dateStr;
            const isToday = dateStr === today;
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => toggleDay(day)}
                className={`relative flex h-11 flex-col items-center justify-center rounded-lg text-sm transition ${
                  isSelected
                    ? "bg-gold text-ink"
                    : dayItems.length > 0
                      ? "bg-panel-2 hover:border hover:border-gold/50"
                      : "text-muted/40 hover:bg-panel-2"
                } ${
                  isToday && !isSelected
                    ? "ring-1 ring-inset ring-green-500/70"
                    : ""
                }`}
              >
                <span className={dayItems.length > 0 || isSelected ? "font-semibold" : ""}>
                  {day.getDate()}
                </span>
                {dayItems.length > 0 ? (
                  <span className="absolute bottom-1 flex gap-0.5">
                    {hasConfirmed ? (
                      <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-ink" : "bg-gold"}`} />
                    ) : null}
                    {hasCancelled ? (
                      <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-ink/60" : "bg-crimson"}`} />
                    ) : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gold/30 bg-panel p-3">
            <p className="text-sm text-muted">
              Agendamentos de{" "}
              <span className="font-semibold text-cream">
                {formatDateBR(selectedDay)}
              </span>
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectDay(null);
                setDayStatus("");
              }}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-gold transition hover:border-gold/50"
            >
              Ver todos os dias
            </button>
          </div>
          <div className="flex gap-1.5 rounded-xl border border-line bg-panel p-1">
            {(
              [
                ["", "Todos"],
                ["confirmed", "Confirmados"],
                ["cancelled", "Cancelados"],
              ] as [typeof dayStatus, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDayStatus(key)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  dayStatus === key
                    ? "bg-gold text-ink"
                    : "text-muted hover:text-cream"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-line bg-panel p-6 text-center text-sm text-muted">
          {selectedDay
            ? "Nenhum agendamento neste dia."
            : "Nenhum agendamento encontrado."}
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((a) => (
            <AppointmentCard key={a.id} a={a} onCancel={onCancel} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}

const WEEKDAY_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];
const monthsBR = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// ------------------------------------------------------------
// Barbeiros
// ------------------------------------------------------------
function BarbersTab() {
  const [items, setItems] = useState<Barber[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [schedulingBarber, setSchedulingBarber] = useState<Barber | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const data = await api<{ barbers: Barber[] }>("/api/admin/barbers");
        if (!cancelled) setItems(data.barbers);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erro ao carregar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function load() {
    const data = await api<{ barbers: Barber[] }>("/api/admin/barbers");
    setItems(data.barbers);
  }

  async function add() {
    if (newName.trim().length < 2) return;
    setBusy(true);
    try {
      await api("/api/admin/barbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, phone: newPhone }),
      });
      setNewName("");
      setNewPhone("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar.");
    } finally {
      setBusy(false);
    }
  }

  async function save(
    b: Barber,
    patch: { name?: string; phone?: string; photoUrl?: string | null; active?: boolean }
  ) {
    try {
      await api(`/api/admin/barbers/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  }

  async function remove(b: Barber) {
    if (!confirm(`Excluir o barbeiro ${b.name}?`)) return;
    try {
      await api(`/api/admin/barbers/${b.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  return (
    <div className="space-y-4">
      <ErrorBox message={error} />
      <div className="flex flex-wrap gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome do novo barbeiro"
        />
        <Input
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          placeholder="WhatsApp (ex.: (12) 99600-0000)"
        />
        <Button onClick={add} disabled={busy || newName.trim().length < 2}>
          Adicionar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-7 w-7 text-gold" />
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((b) => (
            <div
              key={b.id}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-panel p-3 sm:flex-row sm:items-center sm:p-4"
            >
              <div className="flex items-center gap-3">
                {b.photoUrl ? (
                  <img
                    src={b.photoUrl}
                    alt={b.name}
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-panel-2 text-xl">
                    🧑‍💼
                  </span>
                )}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-semibold text-cream">{b.name}</p>
                  <p className="text-sm text-muted">{b.phone || "Sem WhatsApp cadastrado"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="cursor-pointer rounded-lg border border-line px-2 py-1 text-xs font-semibold text-muted transition hover:border-gold/60 hover:text-gold">
                  📷 Foto
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        setError("Arquivo muito grande. Máximo 5MB.");
                        return;
                      }
                      setBusy(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("serviceId", `barber-${b.id}`);
                        const res = await fetch("/api/admin/upload", {
                          method: "POST",
                          body: formData,
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        await save(b, { photoUrl: data.url });
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Erro ao enviar imagem.");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                </label>
                {b.photoUrl ? (
                  <button
                    type="button"
                    onClick={() => save(b, { photoUrl: null })}
                    className="text-xs text-red-400 transition hover:text-red-300"
                  >
                    🗑️
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => { setEditingBarber(b); setEditName(b.name); setEditPhone(b.phone); }}
                  className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-gold/50 hover:text-gold"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setSchedulingBarber(b)}
                  className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-gold/50 hover:text-gold"
                >
                  Agenda
                </button>
                <button
                  type="button"
                  onClick={() => save(b, { active: !b.active })}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                    b.active
                      ? "bg-gold/15 text-gold hover:bg-gold/25"
                      : "bg-crimson/15 text-red-300 hover:bg-crimson/25"
                  }`}
                >
                  {b.active ? "Ativo" : "Inativo"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(b)}
                  className="rounded-lg border border-crimson/40 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-crimson/10"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingBarber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-cream">Editar barbeiro</h3>
            <div className="space-y-3">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome"
              />
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="WhatsApp"
                inputMode="tel"
              />
            </div>
            <div className="mt-6 flex gap-2">
              <Button
                onClick={async () => {
                  await save(editingBarber, { name: editName, phone: editPhone });
                  setEditingBarber(null);
                }}
                disabled={busy || editName.trim().length < 2}
              >
                Salvar
              </Button>
              <Button variant="secondary" onClick={() => setEditingBarber(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {schedulingBarber && (
        <BarberScheduleModal
          barber={schedulingBarber}
          onClose={() => setSchedulingBarber(null)}
        />
      )}
    </div>
  );
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function BarberScheduleModal({
  barber,
  onClose,
}: {
  barber: Barber;
  onClose: () => void;
}) {
  const today = todayInTZ();
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)) - 1);
  const [schedule, setSchedule] = useState<Record<string, BarberSchedule>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [blockMode, setBlockMode] = useState<"total" | "partial">("total");
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set());

  const monthStr = String(month + 1).padStart(2, "0");
  const from = `${year}-${monthStr}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/barbers/${barber.id}/schedule?from=${from}&to=${to}`
      );
      const data = await res.json();
      const map: Record<string, BarberSchedule> = {};
      for (const entry of data.schedule ?? []) {
        map[entry.date] = entry;
      }
      setSchedule(map);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [barber.id, from, to]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  async function saveSchedule(
    date: string,
    available: boolean,
    startTime: string | null,
    endTime: string | null,
    blocked: string[] = []
  ) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/barbers/${barber.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, available, startTime, endTime, blockedSlots: blocked }),
      });
      const data = await res.json();
      if (data.schedule) {
        setSchedule((prev) => ({ ...prev, [date]: data.schedule }));
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function handleDateClick(date: string) {
    if (date < today) return;
    if (selectedDate === date) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
      const existing = schedule[date];
      if (existing) {
        if (existing.blockedSlots?.length) {
          setBlockMode("partial");
          setBlockedSlots(new Set(existing.blockedSlots));
        } else if (existing.startTime && existing.endTime) {
          setBlockMode("partial");
          setBlockedSlots(new Set());
        } else {
          setBlockMode("total");
          setBlockedSlots(new Set());
        }
      } else {
        setBlockMode("total");
        setBlockedSlots(new Set());
      }
    }
  }

  async function applyBlock() {
    if (!selectedDate) return;
    if (blockMode === "total") {
      await saveSchedule(selectedDate, false, null, null, []);
    } else {
      const slots = Array.from(blockedSlots).sort();
      await saveSchedule(selectedDate, false, null, null, slots);
    }
    setSelectedDate(null);
  }

  async function clearDay() {
    if (!selectedDate) return;
    await saveSchedule(selectedDate, true, null, null);
    setSelectedDate(null);
  }

  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) {
    cells.push(
      `${year}-${monthStr}-${String(d).padStart(2, "0")}`
    );
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const selected = selectedDate ? schedule[selectedDate] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-cream">
            Agenda — {barber.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-cream"
          >
            ✕
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg px-2 py-1 text-sm text-muted hover:text-cream"
          >
            ←
          </button>
          <span className="font-semibold text-cream">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg px-2 py-1 text-sm text-muted hover:text-cream"
          >
            →
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-muted">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-6 w-6 text-gold" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              const entry = schedule[date];
              const isPast = date < today;
              const isTotalOff = entry && !entry.available && !entry.startTime && (!entry.blockedSlots || entry.blockedSlots.length === 0);
              const isPartialOff =
                entry && !entry.available && (entry.blockedSlots?.length || (entry.startTime && entry.endTime));

              return (
                <button
                  key={date}
                  type="button"
                  disabled={isPast || saving}
                  onClick={() => handleDateClick(date)}
                  className={`relative flex h-9 items-center justify-center rounded-lg text-xs font-medium transition ${
                    isPast
                      ? "cursor-not-allowed text-muted/30"
                      : isTotalOff
                        ? "bg-crimson/30 text-red-200 hover:bg-crimson/40"
                        : isPartialOff
                          ? "bg-crimson/15 text-red-300 hover:bg-crimson/25"
                          : "text-cream hover:bg-panel-2"
                  } ${selectedDate === date ? "ring-2 ring-gold" : ""}`}
                >
                  {Number(date.slice(8))}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-crimson/30" /> Indisponível total
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-crimson/15" /> Indisponível parcial
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-panel-2" /> Padrão (08h-18h)
          </span>
        </div>

        {selectedDate && (
          <div className="mt-4 rounded-xl border border-line bg-panel-2 p-3 space-y-3">
            <p className="text-sm font-semibold text-cream">
              {formatDateBR(selectedDate)}
            </p>

            {selected && !selected.available && (
              <p className="text-xs text-muted">
                {selected.blockedSlots?.length
                  ? `${selected.blockedSlots.length} horário(s) bloqueado(s)`
                  : selected.startTime
                    ? `Bloqueado das ${selected.startTime} às ${selected.endTime}`
                    : "Bloqueado o dia todo"}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBlockMode("total")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  blockMode === "total"
                    ? "bg-crimson/30 text-red-200"
                    : "bg-panel text-muted hover:text-cream"
                }`}
              >
                Indisponível total
              </button>
              <button
                type="button"
                onClick={() => setBlockMode("partial")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  blockMode === "partial"
                    ? "bg-crimson/30 text-red-200"
                    : "bg-panel text-muted hover:text-cream"
                }`}
              >
                Indisponível parcial
              </button>
            </div>

            {blockMode === "partial" && (
              <div>
                <p className="mb-2 text-xs text-muted">Clique nos horários para bloquear/liberar:</p>
                <div className="grid grid-cols-4 gap-1">
                  {generateAllSlots().map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        setBlockedSlots((prev) => {
                          const next = new Set(prev);
                          if (next.has(slot)) {
                            next.delete(slot);
                          } else {
                            next.add(slot);
                          }
                          return next;
                        });
                      }}
                      className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                        blockedSlots.has(slot)
                          ? "bg-crimson/30 text-red-300"
                          : "bg-panel text-cream hover:bg-panel-2"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={applyBlock} disabled={saving}>
                Aplicar
              </Button>
              {selected && (
                <Button variant="secondary" onClick={clearDay} disabled={saving}>
                  Limpar dia
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Serviços
// ------------------------------------------------------------
function ServicesTab() {
  const [items, setItems] = useState<Service[]>([]);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const data = await api<{ services: Service[] }>("/api/admin/services");
        if (!cancelled) setItems(data.services);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erro ao carregar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function load() {
    const data = await api<{ services: Service[] }>("/api/admin/services");
    setItems(data.services);
  }

  async function add() {
    const priceCents = Math.round(parseFloat(newPrice.replace(",", ".")) * 100);
    if (newName.trim().length < 2 || Number.isNaN(priceCents)) return;
    setBusy(true);
    try {
      await api("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), price: priceCents, emoji: newEmoji }),
      });
      setNewName("");
      setNewPrice("");
      setNewEmoji("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar.");
    } finally {
      setBusy(false);
    }
  }

  async function save(
    s: Service,
    patch: { name?: string; price?: number; emoji?: string; imageUrl?: string | null; active?: boolean }
  ) {
    try {
      await api(`/api/admin/services/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  }

  async function remove(s: Service) {
    if (!confirm(`Excluir o serviço ${s.name}?`)) return;
    try {
      await api(`/api/admin/services/${s.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== dragOverId) setDragOverId(id);
  }

  function handleDragLeave() {
    setDragOverId(null);
  }

  async function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    setDragOverId(null);
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }

    const fromIndex = items.findIndex((s) => s.id === dragId);
    const toIndex = items.findIndex((s) => s.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDragId(null);
      return;
    }

    const reordered = [...items];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const positions = reordered.map((s, i) => ({ id: s.id, position: i }));

    setItems(reordered);
    setDragId(null);

    try {
      await api("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reordenar.");
      await load();
    }
  }

  function handleDragEnd() {
    setDragId(null);
    setDragOverId(null);
  }

  return (
    <div className="space-y-4">
      <ErrorBox message={error} />
      <div className="rounded-2xl border border-line bg-panel p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do serviço"
          />
          <Input
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="Preço (ex.: 35)"
            inputMode="decimal"
          />
          <Input
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            placeholder="Emoji"
          />
          <Button onClick={add} disabled={busy}>
            Adicionar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-7 w-7 text-gold" />
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div
              key={s.id}
              draggable={editingId !== s.id}
              onDragStart={(e) => handleDragStart(e, s.id)}
              onDragOver={(e) => handleDragOver(e, s.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, s.id)}
              onDragEnd={handleDragEnd}
              className={`rounded-2xl border bg-panel p-4 transition-all ${
                dragId === s.id
                  ? "opacity-50 border-gold/60"
                  : dragOverId === s.id
                  ? "border-gold/60 scale-[1.02]"
                  : "border-line"
              } ${editingId !== s.id ? "cursor-grab active:cursor-grabbing" : ""}`}
            >
              {editingId === s.id ? (
                <EditableService
                  service={s}
                  onCancel={() => setEditingId(null)}
                  onSave={(patch) => {
                    setEditingId(null);
                    save(s, patch);
                  }}
                />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {s.imageUrl ? (
                      <img
                        src={s.imageUrl}
                        alt={s.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{s.emoji}</span>
                    )}
                    <div>
                      <p className="font-semibold text-cream">{s.name}</p>
                      <p className="text-sm font-bold text-gold">
                        {formatPrice(s.priceCents)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-gold/60 hover:text-gold">
                      📷 Foto
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setBusy(true);
                          try {
                            const formData = new FormData();
                            formData.append("file", file);
                            formData.append("serviceId", s.id);
                            const res = await fetch("/api/admin/upload", {
                              method: "POST",
                              body: formData,
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error);
                            await save(s, { imageUrl: data.url });
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Erro ao enviar imagem.");
                          } finally {
                            setBusy(false);
                          }
                        }}
                      />
                    </label>
                    {s.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => save(s, { imageUrl: null })}
                        className="rounded-lg border border-crimson/40 px-2 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-crimson/10"
                      >
                        🗑️
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setEditingId(s.id)}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-gold"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => save(s, { active: !s.active })}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        s.active
                          ? "bg-gold/15 text-gold hover:bg-gold/25"
                          : "bg-crimson/15 text-red-300 hover:bg-crimson/25"
                      }`}
                    >
                      {s.active ? "Ativo" : "Inativo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(s)}
                      className="rounded-lg border border-crimson/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-crimson/10"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Configurações
// ------------------------------------------------------------
function SettingsTab() {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [copyright, setCopyright] = useState("");
  const [credit, setCredit] = useState("");
  const [workStart, setWorkStart] = useState("08:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [loading, setLoading] = useState(true);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savedIdentity, setSavedIdentity] = useState(false);
  const [savingFooter, setSavingFooter] = useState(false);
  const [savedFooter, setSavedFooter] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [savedHours, setSavedHours] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const data = await api<{ settings: Record<string, string> }>(
          "/api/settings"
        );
        if (!cancelled) {
          setName(data.settings.barbershop_name ?? "");
          setIcon(data.settings.barbershop_icon ?? "");
          setLocation(data.settings.barbershop_location ?? "");
          setAddress(data.settings.barbershop_address ?? "");
          setCopyright(data.settings.footer_copyright ?? "");
          setCredit(data.settings.footer_credit ?? "");
          setWorkStart(data.settings.working_hours_start ?? "08:00");
          setWorkEnd(data.settings.working_hours_end ?? "18:00");
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erro ao carregar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveIdentity() {
    setSavingIdentity(true);
    setSavedIdentity(false);
    setError(null);
    try {
      await api("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barbershop_name: name,
          barbershop_icon: icon,
          barbershop_location: location,
          barbershop_address: address,
        }),
      });
      setSavedIdentity(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSavingIdentity(false);
    }
  }

  async function saveHours() {
    setSavingHours(true);
    setSavedHours(false);
    setError(null);
    try {
      await api("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          working_hours_start: workStart,
          working_hours_end: workEnd,
        }),
      });
      setSavedHours(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSavingHours(false);
    }
  }

  async function saveFooter() {
    setSavingFooter(true);
    setSavedFooter(false);
    setError(null);
    try {
      await api("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          footer_copyright: copyright,
          footer_credit: credit,
        }),
      });
      setSavedFooter(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSavingFooter(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-panel p-5">
        <h2 className="mb-1 text-lg font-bold text-cream">Identidade da barbearia</h2>
        <p className="mb-4 text-sm text-muted">
          Estes dados aparecem na tela inicial e nas mensagens enviadas.
        </p>
        <div className="space-y-3">
          <Field label="Nome da barbearia" value={name} onChange={setName} />
          <div>
            <Field label="Ícone acima do nome" value={icon} onChange={setIcon} />
            <p className="mt-1 text-xs text-muted/60">
              Cole a URL de uma imagem ou use um emoji. Para usar imagem, faça upload abaixo.
            </p>
            <div className="mt-2 flex items-center gap-3">
              {icon ? (
                icon.startsWith("http") ? (
                  <img src={icon} alt="Logo" className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <span className="text-3xl">{icon}</span>
                )
              ) : null}
              <label className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-gold/60 hover:text-gold">
                📷 Enviar logo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      setError("Arquivo muito grande. Máximo 5MB.");
                      return;
                    }
                    setSavingIdentity(true);
                    setError(null);
                    try {
                      const formData = new FormData();
                      formData.append("file", file);
                      formData.append("serviceId", "barbershop-icon");
                      const res = await fetch("/api/admin/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);
                      setIcon(data.url);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Erro ao enviar imagem.");
                    } finally {
                      setSavingIdentity(false);
                    }
                  }}
                />
              </label>
              {icon && icon.startsWith("http") ? (
                <button
                  type="button"
                  onClick={() => setIcon("💈")}
                  className="text-xs text-red-400 transition hover:text-red-300"
                >
                  🗑️ Remover logo
                </button>
              ) : null}
            </div>
          </div>
          <Field
            label="Link do Google Maps (endereço)"
            value={location}
            onChange={setLocation}
            placeholder="https://maps.google.com/?q=..."
          />
          <Field
            label="Endereço exibido na mensagem"
            value={address}
            onChange={setAddress}
            placeholder="Rua ..., 000 - Cidade-SP, 00000-000"
          />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button onClick={saveIdentity} disabled={savingIdentity || loading}>
            {savingIdentity ? <Spinner className="h-5 w-5" /> : null}
            Salvar
          </Button>
          {savedIdentity ? <span className="text-sm font-semibold text-gold">Salvo!</span> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-panel p-5">
        <h2 className="mb-1 text-lg font-bold text-cream">Horário de funcionamento</h2>
        <p className="mb-4 text-sm text-muted">
          Horário padrão usado quando o barbeiro não tem agenda configurada.
        </p>
        <div className="flex items-center gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Abertura</label>
            <input
              type="time"
              value={workStart}
              onChange={(e) => setWorkStart(e.target.value)}
              className="h-9 rounded-lg border border-line bg-panel px-3 text-sm text-cream outline-none transition focus:border-gold/60"
            />
          </div>
          <span className="mt-5 text-muted">até</span>
          <div>
            <label className="mb-1 block text-xs text-muted">Fechamento</label>
            <input
              type="time"
              value={workEnd}
              onChange={(e) => setWorkEnd(e.target.value)}
              className="h-9 rounded-lg border border-line bg-panel px-3 text-sm text-cream outline-none transition focus:border-gold/60"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button onClick={saveHours} disabled={savingHours || loading}>
            {savingHours ? <Spinner className="h-5 w-5" /> : null}
            Salvar
          </Button>
          {savedHours ? <span className="text-sm font-semibold text-gold">Salvo!</span> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-panel p-5">
        <h2 className="mb-1 text-lg font-bold text-cream">Rodapé do site</h2>
        <p className="mb-4 text-sm text-muted">
          Estes textos aparecem no rodapé da página inicial.
        </p>
        <div className="space-y-3">
          <Field label="Texto de copyright" value={copyright} onChange={setCopyright} />
          <Field label="Crédito" value={credit} onChange={setCredit} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={saveFooter} disabled={savingFooter || loading}>
            {savingFooter ? <Spinner className="h-5 w-5" /> : null}
            Salvar
          </Button>
          {savedFooter ? <span className="text-sm font-semibold text-gold">Salvo!</span> : null}
        </div>
      </div>
      <ErrorBox message={error} />
      <AdminsSection />
    </div>
  );
}

type AdminUser = { id: string; email: string; name: string };

function AdminsSection() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  async function load() {
    const data = await api<{ admins: AdminUser[] }>("/api/admin/admins");
    setAdmins(data.admins);
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const data = await api<{ admins: AdminUser[] }>("/api/admin/admins");
        if (!cancelled) setAdmins(data.admins);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erro ao carregar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function create() {
    if (!email.trim() || password.length < 1) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      setEmail("");
      setPassword("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: string) {
    if (!editEmail.trim()) return;
    const patch: Record<string, string> = { email: editEmail.trim() };
    if (editPassword) patch.password = editPassword;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setEditingId(null);
      setEditPassword("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este administrador?")) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/admins/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <h2 className="mb-1 text-lg font-bold text-cream">Administradores</h2>
      <p className="mb-4 text-sm text-muted">
        Crie novos administradores, edite o e-mail/senha ou exclua os que não
        forem mais necessários.
      </p>

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail do novo admin"
          type="email"
          autoComplete="off"
        />
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          type="password"
          autoComplete="new-password"
        />
        <Button onClick={create} disabled={busy || !email.trim() || password.length < 1}>
          Adicionar
        </Button>
      </div>

      <ErrorBox message={error} />

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-7 w-7 text-gold" />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {admins.map((a) =>
            editingId === a.id ? (
              <div
                key={a.id}
                className="grid gap-2 rounded-2xl border border-gold/30 bg-panel-2 p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="E-mail"
                  type="email"
                  className="h-10"
                />
                <Input
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Nova senha (opcional)"
                  type="password"
                  className="h-10"
                />
                <div className="flex gap-2">
                  <Button
                    className="h-10"
                    disabled={busy || !editEmail.trim()}
                    onClick={() => saveEdit(a.id)}
                  >
                    Salvar
                  </Button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="h-10 px-2 text-muted transition hover:text-cream"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-panel-2 p-3"
              >
                <div>
                  <p className="font-semibold text-cream">{a.name}</p>
                  <p className="text-sm text-muted">{a.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(a.id);
                      setEditEmail(a.email);
                      setEditPassword("");
                    }}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-gold"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    className="rounded-lg border border-crimson/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-crimson/10"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-muted">{label}</span>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

// ------------------------------------------------------------
// Nome editável inline
// ------------------------------------------------------------
function EditableService({
  service,
  onSave,
  onCancel,
}: {
  service: Service;
  onSave: (patch: { name?: string; price?: number; emoji?: string; imageUrl?: string | null }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(service.name);
  const [price, setPrice] = useState((service.priceCents / 100).toFixed(2).replace(".", ","));
  const [emoji, setEmoji] = useState(service.emoji);
  const [uploading, setUploading] = useState(false);

  const priceCents = Math.round(parseFloat(price.replace(",", ".")) * 100);
  const valid = name.trim().length >= 2 && !Number.isNaN(priceCents) && priceCents >= 0;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("serviceId", service.id);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSave({ imageUrl: data.url });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-gold">
          {uploading ? "Enviando..." : service.imageUrl ? "📷 Trocar foto" : "📷 Enviar foto"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImageUpload}
            disabled={uploading}
          />
        </label>
        {service.imageUrl ? (
          <button
            type="button"
            onClick={() => onSave({ imageUrl: null })}
            className="text-xs text-red-400 transition hover:text-red-300"
          >
            Remover foto
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_70px_auto]">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do serviço"
          className="h-10"
        />
        <Input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Preço"
          inputMode="decimal"
          className="h-10"
        />
        <Input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="Emoji"
          className="h-10"
        />
        <div className="flex gap-2">
          <Button
            className="h-10"
            disabled={!valid}
            onClick={() => onSave({ name: name.trim(), price: priceCents, emoji })}
          >
            Salvar
          </Button>
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-2 text-muted transition hover:text-cream"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ------------------------------------------------------------
// Telefone editável inline
// ------------------------------------------------------------
function EditablePhone({
  value,
  onSave,
}: {
  value: string;
  onSave: (phone: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted">{value || "Sem WhatsApp cadastrado"}</p>
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="rounded-md border border-line px-2 py-1 text-xs text-muted transition hover:text-gold"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={draft}
        onChange={(e) => setDraft(maskPhone(e.target.value))}
        placeholder="(12) 99600-0000"
        className="h-10 w-52"
      />
      <Button
        className="h-10"
        onClick={() => {
          onSave(draft);
          setEditing(false);
        }}
      >
        Salvar
      </Button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="h-10 px-2 text-muted transition hover:text-cream"
      >
        ✕
      </button>
    </div>
  );
}

// ------------------------------------------------------------
// Nome editável inline
// ------------------------------------------------------------
function EditableName({
  value,
  onSave,
}: {
  value: string;
  onSave: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="font-semibold text-cream">{value}</p>
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="rounded-md border border-line px-2 py-1 text-xs text-muted transition hover:text-gold"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="h-10 w-52"
      />
      <Button
        className="h-10"
        disabled={draft.trim().length < 2}
        onClick={() => {
          onSave(draft.trim());
          setEditing(false);
        }}
      >
        Salvar
      </Button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="h-10 px-2 text-muted transition hover:text-cream"
      >
        ✕
      </button>
    </div>
  );
}
