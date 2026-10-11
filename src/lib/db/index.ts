// A conexão com o Postgres do Supabase (local: `npm run db:start`). O app fala
// com o banco só pelo servidor, como dono das tabelas; a API REST do Supabase
// fica fechada (RLS sem políticas e sem permissões para anon e authenticated).
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { connection } from "next/server";
import postgres from "postgres";
import * as schema from "./schema";

export type Banco = PostgresJsDatabase<typeof schema>;

type Global = typeof globalThis & { __linkbioBanco?: Banco; __linkbioSql?: postgres.Sql };

function abrir(): Banco {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não está definida. Veja o .env.example.");
  // prepare: false porque, na Vercel, a conexão passa pelo pooler de transação
  // do Supabase (porta 6543), que não guarda comandos preparados.
  const sql = postgres(url, {
    prepare: false,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idle_timeout: 20,
    connect_timeout: 10,
  });
  (globalThis as Global).__linkbioSql = sql;
  return drizzle(sql, { schema });
}

export async function db(): Promise<Banco> {
  // Dentro do Next, consulta ao banco é sempre coisa da hora do pedido, nunca
  // da pré-renderização. Fora dele (scripts e testes) não há pedido a esperar.
  if (process.env.NEXT_RUNTIME) await connection();
  const g = globalThis as Global;
  g.__linkbioBanco ??= abrir();
  return g.__linkbioBanco;
}

/** Fecha as conexões (scripts e testes, para o processo terminar). */
export async function fecharBanco(): Promise<void> {
  const g = globalThis as Global;
  await g.__linkbioSql?.end({ timeout: 5 });
  g.__linkbioSql = undefined;
  g.__linkbioBanco = undefined;
}

/** Erro de violação de unicidade do Postgres (23505), direto ou embrulhado pelo Drizzle. */
export function violouUnico(e: unknown): boolean {
  const codigo = (x: unknown) => (typeof x === "object" && x !== null ? (x as { code?: string }).code : undefined);
  return codigo(e) === "23505" || codigo((e as { cause?: unknown })?.cause) === "23505";
}
