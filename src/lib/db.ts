import { supabaseAdmin } from "./supabase/server";
import { isDateSelectable, generateAllSlots } from "./slots";
import { LUNCH_BREAK } from "./config";
import type {
  AppointmentRecord,
  AppointmentWithDetails,
  Barber,
  Service,
  UserRecord,
} from "./types";

function normalizeTime(value: string): string {
  return value.slice(0, 5);
}

// ------------------------------------------------------------
// Catálogo
// ------------------------------------------------------------
export async function listServices(activeOnly = true): Promise<Service[]> {
  let q = supabaseAdmin()
    .from("services")
    .select("id, name, price_cents, emoji, image_url, active")
    .order("price_cents", { ascending: true });
  if (activeOnly) q = q.eq("active", true);
  const { data } = await q;
  return ((data ?? []) as { id: string; name: string; price_cents: number; emoji: string; image_url: string | null; active: boolean }[]).map(
    (r) => ({
      id: r.id,
      name: r.name,
      priceCents: r.price_cents,
      emoji: r.emoji,
      imageUrl: r.image_url,
      active: r.active,
    })
  );
}

export async function listBarbers(activeOnly = true): Promise<Barber[]> {
  let q = supabaseAdmin()
    .from("barbers")
    .select("id, name, phone, active")
    .order("name", { ascending: true });
  if (activeOnly) q = q.eq("active", true);
  const { data } = await q;
  return ((data ?? []) as { id: string; name: string; phone: string | null; active: boolean }[]).map(
    (r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone ?? "",
      active: r.active,
    })
  );
}

// ------------------------------------------------------------
// Usuários
// ------------------------------------------------------------
type UserRow = {
  id: string;
  name: string;
  last_name: string | null;
  email: string | null;
  phone: string;
};

export async function findOrCreateUser(input: {
  name: string;
  lastName: string;
  email?: string;
  phone: string;
}): Promise<UserRecord> {
  const email = (input.email ?? "").trim().toLowerCase() || null;
  const last_name = input.lastName.trim() || null;

  let existing: UserRow | null = null;

  if (email) {
    const { data } = await supabaseAdmin()
      .from("users")
      .select("id, name, last_name, email, phone")
      .eq("email", email)
      .maybeSingle();
    existing = (data as UserRow | null) ?? null;
  } else {
    const { data } = await supabaseAdmin()
      .from("users")
      .select("id, name, last_name, email, phone")
      .eq("phone", input.phone.trim())
      .limit(1);
    existing = (data?.[0] as UserRow | undefined) ?? null;
  }

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      lastName: existing.last_name ?? "",
      email: existing.email ?? "",
      phone: existing.phone,
    };
  }

  const { data: created, error } = await supabaseAdmin()
    .from("users")
    .insert({
      name: input.name.trim(),
      last_name,
      email,
      phone: input.phone.trim(),
    })
    .select("id, name, last_name, email, phone")
    .single();

  if (error) {
    throw new Error("Não foi possível salvar seus dados. Tente novamente.");
  }
  return {
    id: created.id as string,
    name: created.name as string,
    lastName: (created.last_name as string) ?? "",
    email: (created.email as string) ?? "",
    phone: created.phone as string,
  };
}

// ------------------------------------------------------------
// Disponibilidade
// ------------------------------------------------------------
export async function getBookedTimes(
  date: string,
  barberId: string
): Promise<string[]> {
  const { data } = await supabaseAdmin()
    .from("appointments")
    .select("time")
    .eq("date", date)
    .eq("barber_id", barberId)
    .eq("status", "confirmed");

  return (data ?? []).map((row) => normalizeTime(row.time as string));
}

// ------------------------------------------------------------
// Agendamentos
// ------------------------------------------------------------
export async function createAppointment(input: {
  userId: string;
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
}): Promise<AppointmentRecord> {
  if (!isDateSelectable(input.date)) {
    throw new Error("Esta data não está disponível para agendamento.");
  }
  const slots = generateAllSlots();
  const isLunch = input.time >= LUNCH_BREAK.start && input.time < LUNCH_BREAK.end;
  if (!slots.includes(input.time) || isLunch) {
    throw new Error("Horário inválido.");
  }

  const booked = await getBookedTimes(input.date, input.barberId);
  if (booked.includes(input.time)) {
    throw new Error(
      "Este horário acabou de ser reservado por outra pessoa. Escolha outro."
    );
  }

  const { data, error } = await supabaseAdmin()
    .from("appointments")
    .insert({
      user_id: input.userId,
      service_id: input.serviceId,
      barber_id: input.barberId,
      date: input.date,
      time: input.time,
      status: "confirmed",
    })
    .select("id, user_id, service_id, barber_id, date, time, status, cancel_token, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "Este horário acabou de ser reservado por outra pessoa. Escolha outro."
      );
    }
    throw new Error("Não foi possível concluir o agendamento. Tente novamente.");
  }
  return {
    id: data.id as string,
    userId: data.user_id as string,
    serviceId: data.service_id as string,
    barberId: data.barber_id as string,
    date: data.date as string,
    time: normalizeTime(data.time as string),
    status: data.status as AppointmentRecord["status"],
    cancelToken: data.cancel_token as string,
    createdAt: data.created_at as string,
    cancelledAt: null,
  };
}

const APPOINTMENT_SELECT = `
  id,
  user_id,
  service_id,
  barber_id,
  date,
  time,
  status,
  cancel_token,
  created_at,
  cancelled_at,
  users ( name, last_name, email, phone ),
  services ( name, price_cents, emoji ),
  barbers ( name, phone )
`;

type NestedUsers = { name: string; last_name: string | null; email: string | null; phone: string };
type NestedServices = { name: string; price_cents: number; emoji: string };
type NestedBarbers = { name: string; phone: string | null };

type AppointmentRow = {
  id: string;
  user_id: string;
  service_id: string;
  barber_id: string;
  date: string;
  time: string;
  status: "confirmed" | "cancelled";
  cancel_token: string;
  created_at: string;
  cancelled_at: string | null;
  users: NestedUsers | NestedUsers[] | null;
  services: NestedServices | NestedServices[] | null;
  barbers: NestedBarbers | NestedBarbers[] | null;
};

function first<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function mapAppointment(row: AppointmentRow): AppointmentWithDetails {
  const users = first(row.users);
  const services = first(row.services);
  const barbers = first(row.barbers);
  return {
    id: row.id,
    userId: row.user_id,
    serviceId: row.service_id,
    barberId: row.barber_id,
    date: row.date as string,
    time: normalizeTime(row.time as string),
    status: row.status,
    cancelToken: row.cancel_token,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
    userName: users?.name ?? "",
    userLastName: users?.last_name ?? "",
    userEmail: users?.email ?? "",
    userPhone: users?.phone ?? "",
    serviceName: services?.name ?? "",
    serviceEmoji: services?.emoji ?? "💈",
    priceCents: services?.price_cents ?? 0,
    barberName: barbers?.name ?? "",
    barberPhone: barbers?.phone ?? "",
  };
}

export async function getAppointmentByToken(
  token: string
): Promise<AppointmentWithDetails | null> {
  const { data, error } = await supabaseAdmin()
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("cancel_token", token)
    .maybeSingle();

  if (error || !data) return null;
  return mapAppointment(data as AppointmentRow);
}

export async function cancelAppointmentByToken(
  token: string
): Promise<AppointmentWithDetails | null> {
  const { data, error } = await supabaseAdmin()
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("cancel_token", token)
    .eq("status", "confirmed")
    .select(APPOINTMENT_SELECT)
    .maybeSingle();

  if (error || !data) return null;
  return mapAppointment(data as AppointmentRow);
}

export async function getAppointmentById(
  id: string
): Promise<AppointmentWithDetails | null> {
  const { data, error } = await supabaseAdmin()
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapAppointment(data as AppointmentRow);
}

// ------------------------------------------------------------
// Admin
// ------------------------------------------------------------
export async function findAdminByEmail(email: string) {
  const { data } = await supabaseAdmin()
    .from("admin_users")
    .select("id, email, password_hash, name")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  return data as
    | { id: string; email: string; password_hash: string; name: string }
    | null;
}

export async function countAdmins(): Promise<number> {
  const { count } = await supabaseAdmin()
    .from("admin_users")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

export async function createAdmin(input: {
  email: string;
  passwordHash: string;
  name: string;
}) {
  const { data, error } = await supabaseAdmin()
    .from("admin_users")
    .insert({
      email: input.email.toLowerCase().trim(),
      password_hash: input.passwordHash,
      name: input.name,
    })
    .select("id, email, name")
    .single();
  if (error) throw new Error("Não foi possível criar o administrador.");
  return data;
}

export async function listAdmins() {
  const { data } = await supabaseAdmin()
    .from("admin_users")
    .select("id, email, name")
    .order("created_at", { ascending: true });
  return (data ?? []) as { id: string; email: string; name: string }[];
}

export async function updateAdmin(
  id: string,
  patch: { email?: string; passwordHash?: string; name?: string }
): Promise<boolean> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.email !== undefined) dbPatch.email = patch.email.toLowerCase().trim();
  if (patch.passwordHash !== undefined) dbPatch.password_hash = patch.passwordHash;
  if (patch.name !== undefined) dbPatch.name = patch.name;

  const { error } = await supabaseAdmin().from("admin_users").update(dbPatch).eq("id", id);
  return !error;
}

export async function deleteAdmin(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin().from("admin_users").delete().eq("id", id);
  return !error;
}

export async function listAppointments(filters: {
  from?: string;
  to?: string;
  barberId?: string;
  status?: string;
}): Promise<AppointmentWithDetails[]> {
  let q = supabaseAdmin()
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .order("date", { ascending: true })
    .order("time", { ascending: true })
    .limit(500);

  if (filters.from) q = q.gte("date", filters.from);
  if (filters.to) q = q.lte("date", filters.to);
  if (filters.barberId) q = q.eq("barber_id", filters.barberId);
  if (filters.status) q = q.eq("status", filters.status);

  const { data } = await q;
  return ((data ?? []) as AppointmentRow[]).map(mapAppointment);
}

export async function adminCancelAppointment(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "confirmed");
  return !error;
}

// Barbeiros (CRUD admin)
export async function createBarber(name: string, phone = ""): Promise<Barber> {
  const { data, error } = await supabaseAdmin()
    .from("barbers")
    .insert({ name: name.trim(), phone: phone.trim() || null })
    .select("id, name, phone, active")
    .single();
  if (error) throw new Error("Não foi possível criar o barbeiro.");
  return {
    id: data.id as string,
    name: data.name as string,
    phone: (data.phone as string) ?? "",
    active: data.active as boolean,
  };
}

export async function updateBarber(
  id: string,
  patch: { name?: string; phone?: string; active?: boolean }
): Promise<Barber> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name.trim();
  if (patch.phone !== undefined) dbPatch.phone = patch.phone.trim() || null;
  if (patch.active !== undefined) dbPatch.active = patch.active;

  const { data, error } = await supabaseAdmin()
    .from("barbers")
    .update(dbPatch)
    .eq("id", id)
    .select("id, name, phone, active")
    .single();
  if (error) throw new Error("Não foi possível atualizar o barbeiro.");
  return {
    id: data.id as string,
    name: data.name as string,
    phone: (data.phone as string) ?? "",
    active: data.active as boolean,
  };
}

export async function deleteBarber(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin().from("barbers").delete().eq("id", id);
  return !error;
}

// Serviços (CRUD admin)
export async function createService(input: {
  name: string;
  priceCents: number;
  emoji: string;
  imageUrl?: string;
}): Promise<Service> {
  const { data, error } = await supabaseAdmin()
    .from("services")
    .insert({
      name: input.name.trim(),
      price_cents: input.priceCents,
      emoji: input.emoji || "💈",
      image_url: input.imageUrl || null,
    })
    .select("id, name, price_cents, emoji, image_url, active")
    .single();
  if (error) throw new Error("Não foi possível criar o serviço.");
  return {
    id: data.id as string,
    name: data.name as string,
    priceCents: data.price_cents as number,
    emoji: data.emoji as string,
    imageUrl: data.image_url as string | null,
    active: data.active as boolean,
  };
}

export async function updateService(
  id: string,
  patch: { name?: string; priceCents?: number; emoji?: string; imageUrl?: string | null; active?: boolean }
): Promise<Service> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name.trim();
  if (patch.priceCents !== undefined) dbPatch.price_cents = patch.priceCents;
  if (patch.emoji !== undefined) dbPatch.emoji = patch.emoji;
  if (patch.imageUrl !== undefined) dbPatch.image_url = patch.imageUrl;
  if (patch.active !== undefined) dbPatch.active = patch.active;

  const { data, error } = await supabaseAdmin()
    .from("services")
    .update(dbPatch)
    .eq("id", id)
    .select("id, name, price_cents, emoji, image_url, active")
    .single();
  if (error) throw new Error("Não foi possível atualizar o serviço.");
  return {
    id: data.id as string,
    name: data.name as string,
    priceCents: data.price_cents as number,
    emoji: data.emoji as string,
    imageUrl: data.image_url as string | null,
    active: data.active as boolean,
  };
}

export async function deleteService(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin().from("services").delete().eq("id", id);
  return !error;
}

export async function deleteAppointment(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .from("appointments")
    .delete()
    .eq("id", id);
  return !error;
}

// ------------------------------------------------------------
// Configurações (rodapé, editável pelo admin)
// ------------------------------------------------------------
export type SettingsMap = Record<string, string>;

const DEFAULT_SETTINGS: SettingsMap = {
  barbershop_name: "Minha Barbearia",
  barbershop_icon: "💈",
  barbershop_location:
    "https://maps.google.com/?q=Rua%20S%C3%A3o%20Bento%20do%20Sapuca%C3%AD%2C%20594%2C%20Pindamonhangaba-SP%2C%2012420-190",
  barbershop_address: "Rua São Bento do Sapucaí, 594 - Pindamonhangaba-SP, 12420-190",
  footer_copyright: "© 2026 MinhaBarbearia - Todos os direitos reservados",
  footer_credit: "Desenvolvido por DIEGO NEVES",
};

export async function getSettings(): Promise<SettingsMap> {
  const { data } = await supabaseAdmin()
    .from("settings")
    .select("key, value");
  const map: SettingsMap = { ...DEFAULT_SETTINGS };
  for (const row of (data ?? []) as { key: string; value: string }[]) {
    map[row.key] = row.value;
  }
  return map;
}

export async function saveSettings(patch: Record<string, string>): Promise<void> {
  const rows = Object.entries(patch)
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => ({ key, value }));
  if (rows.length === 0) return;
  await supabaseAdmin().from("settings").upsert(rows, { onConflict: "key" });
}
