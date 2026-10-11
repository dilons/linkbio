// Camada de dados provisória: um Postgres de verdade (PGlite, dentro do processo
// do Node) com o mesmo replica/schema.sql que vai para o Supabase. A
// /replica-backend troca esta conexão e o login provisório por Supabase +
// Drizzle + Supabase Auth; as funções de src/lib/data mantêm as assinaturas, e
// nenhuma tela muda.
import { PGlite } from "@electric-sql/pglite";
import { connection } from "next/server";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { semearDemo } from "./seed";

// O que o Supabase Auth fornece (auth.users) e as sessões do login provisório.
const AUTH_PROVISORIO = `
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  password_hash text not null,
  email_confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists auth.sessions (
  token_hash text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
`;

type Global = typeof globalThis & { __linkbioDb?: Promise<PGlite> };

async function abrir(): Promise<PGlite> {
  const dir = process.env.LINKBIO_DB_DIR ?? path.join(process.cwd(), ".data", "pglite");
  await mkdir(dir, { recursive: true });
  const db = await PGlite.create({ dataDir: dir, extensions: { citext } });
  const { rows } = await db.query<{ existe: boolean }>("select to_regclass('public.profiles') is not null as existe");
  if (!rows[0].existe) {
    await db.exec("create extension if not exists citext;");
    await db.exec(AUTH_PROVISORIO);
    await db.exec(await readFile(path.join(process.cwd(), "replica", "schema.sql"), "utf8"));
    // Dados de demonstração: sempre em desenvolvimento; em produção só se pedir.
    const demo = process.env.LINKBIO_DEMO ?? (process.env.NODE_ENV === "production" ? "0" : "1");
    if (demo === "1") await semearDemo(db);
  }
  return db;
}

/** A conexão, aberta uma vez por processo. */
export async function db(): Promise<PGlite> {
  // O PGlite roda dentro do processo e responde sem I/O de rede, então o Next
  // acharia que a consulta cabe na pré-renderização (e tropeçaria no relógio
  // que o Postgres usa). connection() deixa toda consulta para a hora do pedido.
  await connection();
  const g = globalThis as Global;
  g.__linkbioDb ??= abrir();
  return g.__linkbioDb;
}

/** Erro de violação de unicidade do Postgres (23505). */
export function violouUnico(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}
