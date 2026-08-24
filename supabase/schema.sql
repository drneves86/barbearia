-- ============================================================
-- Barbearia — Schema + Seed
-- Execute este arquivo no SQL Editor do Supabase.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabela: users (clientes)
-- ------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  last_name text,
  email text unique,
  phone text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabela: barbers (barbeiros, editável pelo admin)
-- ------------------------------------------------------------
create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabela: services (serviços, editável pelo admin)
-- ------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_cents integer not null default 0,
  emoji text not null default '💈',
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabela: appointments (agendamentos)
-- ------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  service_id uuid not null references public.services(id),
  barber_id uuid not null references public.barbers(id),
  date date not null,
  time time not null,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled')),
  cancel_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

-- Índice único parcial: impede o mesmo barbeiro+data+horário
-- ser reservado duas vezes e libera o slot ao cancelar.
create unique index if not exists idx_appointments_unique_slot
  on public.appointments (barber_id, date, time)
  where status = 'confirmed';

create index if not exists idx_appointments_date on public.appointments (date);
create index if not exists idx_appointments_token on public.appointments (cancel_token);

-- ------------------------------------------------------------
-- Tabela: admin_users (acesso ao painel)
-- ------------------------------------------------------------
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null default 'Administrador',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Seed: serviços (preços em centavos)
-- ------------------------------------------------------------
insert into public.services (name, price_cents, emoji) values
  ('Corte Masculino', 3500, '💇‍♂️'),
  ('Corte Navalhado', 4000, '✂️'),
  ('Cabelo + Barba', 5500, '🧔'),
  ('Barba na Navalha', 3500, '🪒'),
  ('Barba na Máquina', 2500, '⚙️'),
  ('Pezinho', 1500, '🦶'),
  ('Sobrancelha', 1000, '👁️')
on conflict do nothing;

-- ------------------------------------------------------------
-- Seed: barbeiros
-- ------------------------------------------------------------
insert into public.barbers (name) values
  ('Ramon'),
  ('Barber2'),
  ('Barber3')
on conflict do nothing;

-- ------------------------------------------------------------
-- Tabela: settings (configurações editáveis pelo admin)
-- ------------------------------------------------------------
create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Seed: texto do rodapé (editável em Painel -> Configurações)
-- ------------------------------------------------------------
insert into public.settings (key, value) values
  ('footer_copyright', '© 2026 MinhaBarbearia - Todos os direitos reservados'),
  ('footer_credit', 'Desenvolvido por DIEGO NEVES')
on conflict (key) do nothing;

-- ------------------------------------------------------------
-- Acesso via Data API (requerido desde mai/2026: tabelas em
-- public não são mais expostas automaticamente ao PostgREST).
-- O app usa apenas a secret key (service_role) no servidor.
-- ------------------------------------------------------------
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;

-- ------------------------------------------------------------
-- Migração (bancos já criados antes da versão que tornou
-- sobrenome e e-mail opcionais):
--   alter table public.users alter column last_name drop not null;
--   alter table public.users alter column email drop not null;
-- Se você já rodou este arquivo antes de 03/2026 com as colunas
-- NOT NULL, execute as duas linhas acima no SQL Editor.
-- ------------------------------------------------------------
-- Migração para a coluna de telefone do barbeiro (para o WhatsApp):
--   alter table public.barbers add column if not exists phone text;
-- ------------------------------------------------------------
-- Migração para a coluna de imagem do serviço:
--   alter table public.services add column if not exists image_url text;
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- Observação: o primeiro usuário administrador NÃO entra aqui.
-- Use o endpoint POST /api/admin/init com o ADMIN_SETUP_KEY
-- (veja .env.example) ou o painel para gerenciá-lo.
-- ------------------------------------------------------------
