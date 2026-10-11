-- linkbio: schema inicial (Postgres no Supabase, região São Paulo).
-- Cópia de replica/schema.sql (da /replica-architect). Daqui em diante o schema
-- muda só por migrações novas nesta pasta; o Drizzle lê o resultado.
--
-- Regra de acesso: RLS ligado em todas as tabelas e NENHUMA política. A API
-- REST do Supabase (chave anon) não lê nem escreve nada. O app acessa o banco
-- só pelo servidor (Drizzle, conexão direta), e cada consulta passa pela
-- checagem de dono em lib/authz.ts.
--
-- Tempos em timestamptz (UTC). Dinheiro em centavos com moeda.

-- no Supabase as extensões moram no schema extensions (já no search_path)
create extension if not exists citext with schema extensions;

-- ------------------------------------------------------------------ contas

-- Uma linha por usuário do Supabase Auth (auth.users guarda email e senha).
create table accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table reserved_usernames (
  username citext primary key
);

create table profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts (id) on delete cascade,
  username citext not null unique
    check (username ~ '^[a-z0-9._]{3,30}$' and username !~ '^[._]|[._]$'),
  username_changed_at timestamptz,
  title text check (char_length(title) <= 60),
  bio text check (char_length(bio) <= 160),
  avatar_path text,
  header_layout text not null default 'classic'
    check (header_layout in ('classic', 'hero')),
  social_position text not null default 'top'
    check (social_position in ('top', 'bottom')),
  sensitive_label text not null default 'none'
    check (sensitive_label in ('none', 'sensitive', '18', '21', '25')),
  timezone text not null default 'America/Sao_Paulo',
  category text,
  -- excluído: dados pessoais apagados na hora; a linha fica 14 dias só para
  -- segurar o username, e o job de limpeza remove de vez.
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_account_idx on profiles (account_id);
create index profiles_deleted_idx on profiles (deleted_at) where deleted_at is not null;

-- ------------------------------------------------------------------ página

create table collections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index collections_profile_idx on collections (profile_id, position);

create table links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  collection_id uuid references collections (id) on delete set null,
  kind text not null default 'link'
    check (kind in ('link', 'header', 'video', 'form')),
  title text not null check (char_length(title) between 1 and 100),
  url text check (url is null or url ~ '^https?://[^\s]+$'),
  thumbnail_path text,
  position integer not null,
  enabled boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  lock text not null default 'none'
    check (lock in ('none', 'sensitive', 'age')),
  lock_min_age smallint check (lock_min_age in (18, 21, 25)),
  highlight text not null default 'none'
    check (highlight in ('none', 'animate', 'spotlight')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint links_window check (ends_at is null or starts_at is null or ends_at > starts_at),
  constraint links_url_needed check (kind not in ('link', 'video') or url is not null),
  constraint links_age_lock check ((lock = 'age') = (lock_min_age is not null))
);
create index links_profile_idx on links (profile_id, position);
create index links_collection_idx on links (collection_id);

create table social_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  platform text not null,
  url text not null check (url ~ '^https?://[^\s]+$'),
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, platform)
);
create index social_links_profile_idx on social_links (profile_id, position);

-- Tema pronto (theme) ou customizado (custom, validado por zod no servidor).
create table appearances (
  profile_id uuid primary key references profiles (id) on delete cascade,
  theme text not null default 'padrao',
  custom jsonb,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ audiência

-- Configuração de um link do tipo formulário.
create table forms (
  link_id uuid primary key references links (id) on delete cascade,
  fields jsonb not null default '[{"type": "email", "label": "Email", "required": true}]',
  success_message text check (char_length(success_message) <= 200),
  -- texto de consentimento mostrado ao visitante, guardado com cada inscrição
  consent_text text not null,
  updated_at timestamptz not null default now()
);

-- Dados das pessoas do criador: aqui o linkbio é operador (LGPD).
create table submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  link_id uuid references links (id) on delete set null,
  email citext not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  name text check (char_length(name) <= 100),
  phone text check (char_length(phone) <= 30),
  extra jsonb not null default '{}',
  consent_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, email)
);
create index submissions_profile_idx on submissions (profile_id, created_at desc);

-- ------------------------------------------------------------------ insights

-- Eventos brutos, guardados 90 dias. Sem IP e sem cookie: o visitante único é
-- um hash do dia (sal diário que é apagado), país e cidade vêm dos cabeçalhos
-- de geolocalização da Vercel.
create table events (
  id bigint generated always as identity primary key,
  profile_id uuid not null references profiles (id) on delete cascade,
  link_id uuid references links (id) on delete set null,
  type text not null check (type in ('view', 'click', 'signup')),
  occurred_at timestamptz not null default now(),
  visitor_hash bytea not null,
  country char(2),
  city text,
  source text not null default 'direct'
    check (source in ('instagram', 'tiktok', 'whatsapp', 'youtube', 'x', 'facebook',
                      'search', 'direct', 'other')),
  device text not null default 'mobile'
    check (device in ('mobile', 'desktop', 'tablet'))
);
create index events_profile_idx on events (profile_id, occurred_at);
create index events_link_idx on events (link_id, occurred_at);
create index events_time_idx on events (occurred_at);

-- Um sal por dia. O job apaga os de mais de um dia, e com eles a chance de
-- ligar o hash a uma pessoa.
create table analytics_salts (
  day date primary key,
  salt bytea not null,
  created_at timestamptz not null default now()
);

-- Totais por dia no fuso do perfil. link_id nulo = a página toda.
create table daily_stats (
  profile_id uuid not null references profiles (id) on delete cascade,
  day date not null,
  link_id uuid references links (id) on delete cascade,
  views integer not null default 0,
  unique_views integer not null default 0,
  clicks integer not null default 0,
  unique_clicks integer not null default 0,
  signups integer not null default 0
);
create unique index daily_stats_key
  on daily_stats (profile_id, day, coalesce(link_id, '00000000-0000-0000-0000-000000000000'));

create table daily_breakdowns (
  profile_id uuid not null references profiles (id) on delete cascade,
  day date not null,
  dimension text not null check (dimension in ('source', 'country', 'city', 'device')),
  value text not null,
  views integer not null default 0,
  clicks integer not null default 0,
  primary key (profile_id, day, dimension, value)
);

-- ------------------------------------------------------------------ cobrança

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references accounts (id) on delete cascade,
  provider text not null default 'asaas' check (provider in ('asaas')),
  provider_customer_id text not null,
  provider_subscription_id text unique,
  plan text not null check (plan in ('pro')),
  billing_type text not null check (billing_type in ('pix', 'card', 'boleto')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'past_due', 'canceled')),
  price_cents integer not null check (price_cents > 0),
  currency char(3) not null default 'BRL',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Webhooks chegam repetidos: o id do evento é único, e reprocessar não muda nada.
create table billing_events (
  provider_event_id text primary key,
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

-- ------------------------------------------------------------------ operação

-- Contador simples de tentativas por chave e janela (cadastro, formulário,
-- eventos, checagem de username). Limpo pelo job diário.
create table rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  primary key (key, window_start)
);

-- Pedidos dos titulares (LGPD): prova de que o prazo foi cumprido.
create table data_requests (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts (id) on delete set null,
  requester_email citext not null,
  kind text not null check (kind in ('access', 'export', 'correct', 'delete', 'revoke', 'other')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text
);
create index data_requests_open_idx on data_requests (requested_at) where completed_at is null;

-- ------------------------------------------------------------------ RLS

alter table accounts enable row level security;
alter table reserved_usernames enable row level security;
alter table profiles enable row level security;
alter table collections enable row level security;
alter table links enable row level security;
alter table social_links enable row level security;
alter table appearances enable row level security;
alter table forms enable row level security;
alter table submissions enable row level security;
alter table events enable row level security;
alter table analytics_salts enable row level security;
alter table daily_stats enable row level security;
alter table daily_breakdowns enable row level security;
alter table subscriptions enable row level security;
alter table billing_events enable row level security;
alter table rate_limits enable row level security;
alter table data_requests enable row level security;

-- ------------------------------------------------------------------ dados fixos

insert into reserved_usernames (username) values
  ('admin'), ('api'), ('app'), ('ajuda'), ('blog'), ('cadastro'), ('comecar'),
  ('confirmar'), ('conta'), ('design'), ('entrar'), ('linkbio'), ('login'),
  ('planos'), ('precos'), ('privacidade'), ('r'), ('sair'), ('suporte'),
  ('termos'), ('www');
