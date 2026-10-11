// Apoio dos testes do backend. Rodam contra o Supabase local
// (npm run db:start && npm run db:reset) com as variáveis do .env.local.
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

export const sufixo = () => randomUUID().slice(0, 8);

/** Usuário de teste com email já confirmado. A conta nasce pelo gatilho criar_conta. */
export async function criarUsuario(nome = "teste"): Promise<{ id: string; email: string; senha: string }> {
  const email = `${nome}.${sufixo()}@exemplo.com`;
  const senha = `senha-${sufixo()}`;
  const { data, error } = await admin().auth.admin.createUser({ email, password: senha, email_confirm: true });
  if (error || !data.user) throw error ?? new Error("sem usuário");
  return { id: data.user.id, email, senha };
}

export async function apagarUsuarioDeTeste(id: string): Promise<void> {
  const conn = await db();
  await conn.execute(sql`delete from auth.users where id = ${id}`);
}
