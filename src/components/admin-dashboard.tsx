"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, ErrorBox, Input, Spinner } from "@/components/ui";
import { formatDateBR } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/config";
import type { AppointmentWithDetails, Barber, Service } from "@/lib/types";

type Tab = "appointments" | "barbers" | "services";

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
  const [view, setView] = useState<"list" | "calendar">("list");

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
              onClick={() => setView(key)}
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
        <AppointmentsCalendar items={items} onCancel={cancel} onRemove={remove} />
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
  onCancel,
  onRemove,
}: {
  items: AppointmentWithDetails[];
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const first = items[0]?.date;
    return first ? new Date(first + "T12:00:00") : new Date();
  });

  const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
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

  const selected = useMemo(() => {
    return items
      .filter((a) => a.date.startsWith(monthKey))
      .sort((x, y) => x.date.localeCompare(y.date) || x.time.localeCompare(y.time));
  }, [items, monthKey]);

  const monthLabel = `${monthsBR[cursor.getMonth()]} ${cursor.getFullYear()}`;

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
            return (
              <div
                key={dateStr}
                className={`relative flex h-11 flex-col items-center justify-center rounded-lg text-sm ${
                  dayItems.length > 0 ? "bg-panel-2" : "text-muted/40"
                }`}
              >
                <span className={dayItems.length > 0 ? "font-semibold text-cream" : ""}>
                  {day.getDate()}
                </span>
                {dayItems.length > 0 ? (
                  <span className="absolute bottom-1 flex gap-0.5">
                    {hasConfirmed ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    ) : null}
                    {hasCancelled ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-crimson" />
                    ) : null}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {selected.length === 0 ? (
        <p className="rounded-2xl border border-line bg-panel p-6 text-center text-sm text-muted">
          Nenhum agendamento neste mês.
        </p>
      ) : (
        <div className="space-y-2">
          {selected.map((a) => (
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
    patch: { name?: string; phone?: string; active?: boolean }
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
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel p-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <EditableName value={b.name} onSave={(name) => save(b, { name })} />
                <EditablePhone
                  value={b.phone}
                  onSave={(phone) => save(b, { phone })}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => save(b, { active: !b.active })}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
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
                  className="rounded-lg border border-crimson/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-crimson/10"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
  const [newEmoji, setNewEmoji] = useState("💈");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
      setNewEmoji("💈");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar.");
    } finally {
      setBusy(false);
    }
  }

  async function save(
    s: Service,
    patch: { name?: string; price?: number; emoji?: string; active?: boolean }
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
              className="rounded-2xl border border-line bg-panel p-4"
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
                    <span className="text-2xl">{s.emoji}</span>
                    <div>
                      <p className="font-semibold text-cream">{s.name}</p>
                      <p className="text-sm font-bold text-gold">
                        {formatPrice(s.priceCents)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
// Nome editável inline
// ------------------------------------------------------------
function EditableService({
  service,
  onSave,
  onCancel,
}: {
  service: Service;
  onSave: (patch: { name?: string; price?: number; emoji?: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(service.name);
  const [price, setPrice] = useState((service.priceCents / 100).toFixed(2).replace(".", ","));
  const [emoji, setEmoji] = useState(service.emoji);

  const priceCents = Math.round(parseFloat(price.replace(",", ".")) * 100);
  const valid = name.trim().length >= 2 && !Number.isNaN(priceCents) && priceCents >= 0;

  return (
    <div className="space-y-2">
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
