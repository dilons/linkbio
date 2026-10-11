-- Contas ligadas ao Supabase Auth, exclusão que apaga de verdade, e a API
-- pública do Supabase fechada para as tabelas do app.

-- ------------------------------------------------------------------ conta nasce com o usuário

-- Todo usuário do Auth (email ou Google) ganha sua linha em accounts, sem
-- depender do app lembrar de criar.
create function public.criar_conta() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.accounts (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger criar_conta after insert on auth.users
  for each row execute function public.criar_conta();

-- ------------------------------------------------------------------ exclusão (LGPD)

-- Apaga na hora os dados de um perfil (links, redes, aparência, inscrições,
-- estatísticas, título, bio, foto). A linha do perfil fica 14 dias só com o
-- username, para ninguém tomar o endereço logo depois; o job de limpeza a
-- remove. Os arquivos do Storage são apagados pelo app antes de chamar isto.
create function public.apagar_perfil(perfil uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.links where profile_id = perfil;
  delete from public.collections where profile_id = perfil;
  delete from public.social_links where profile_id = perfil;
  delete from public.appearances where profile_id = perfil;
  delete from public.submissions where profile_id = perfil;
  delete from public.events where profile_id = perfil;
  delete from public.daily_stats where profile_id = perfil;
  delete from public.daily_breakdowns where profile_id = perfil;
  update public.profiles
     set deleted_at = coalesce(deleted_at, now()), title = null, bio = null,
         avatar_path = null, category = null, updated_at = now()
   where id = perfil;
end;
$$;

-- O perfil sobrevive à conta (sem dono) durante os 14 dias.
alter table public.profiles alter column account_id drop not null;
alter table public.profiles drop constraint profiles_account_id_fkey;
alter table public.profiles add constraint profiles_account_id_fkey
  foreign key (account_id) references public.accounts (id) on delete set null;
alter table public.profiles add constraint profiles_sem_dono_so_excluido
  check (account_id is not null or deleted_at is not null);

-- Apagar o usuário no Auth (pelo app, pelo painel do Supabase ou pela API)
-- passa por aqui: os perfis são esvaziados antes de perderem o dono.
create function public.antes_de_apagar_conta() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  p uuid;
begin
  for p in select id from public.profiles where account_id = old.id loop
    perform public.apagar_perfil(p);
  end loop;
  return old;
end;
$$;

create trigger antes_de_apagar_conta before delete on public.accounts
  for each row execute function public.antes_de_apagar_conta();

-- ------------------------------------------------------------------ jobs

-- Cada execução dos jobs do Vercel Cron. Falha depois das tentativas fica aqui
-- com o erro (a fila de mortos), para alguém olhar.
create table public.job_runs (
  id bigint generated always as identity primary key,
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  attempts smallint not null default 1,
  ok boolean,
  error text,
  result jsonb
);
create index job_runs_job_idx on public.job_runs (job, started_at desc);
create index job_runs_falhas_idx on public.job_runs (started_at desc) where ok is false;
alter table public.job_runs enable row level security;

-- ------------------------------------------------------------------ endereços reservados

insert into public.reserved_usernames (username) values ('auth'), ('dev')
on conflict do nothing;

-- ------------------------------------------------------------------ API pública fechada

-- RLS sem políticas já barra a API REST. Tirar as permissões é a segunda
-- tranca: anon e authenticated não enxergam nem as tabelas do app.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from public, anon, authenticated;
