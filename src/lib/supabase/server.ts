import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { env } from "@/lib/env";
import { OPCOES_DO_COOKIE } from "./cookies";

/**
 * Cliente do Supabase Auth com a sessão do pedido (cookies httpOnly). Um novo
 * por pedido, nunca compartilhado. Usado só para login; os dados do app vão
 * pelo Drizzle.
 */
export async function supabaseDoPedido() {
  // o cliente lê o relógio ao abrir a sessão: isso é sempre da hora do pedido
  await connection();
  const jar = await cookies();
  return createServerClient(env.supabaseUrl(), env.supabaseChavePublica(), {
    cookieOptions: OPCOES_DO_COOKIE,
    cookies: {
      getAll: () => jar.getAll(),
      setAll(lista) {
        try {
          for (const { name, value, options } of lista) jar.set(name, value, options);
        } catch {
          // Em Server Component não dá para gravar cookie; o proxy renova a sessão.
        }
      },
    },
  });
}

/** Cliente com a chave secreta, para o que só o servidor faz (excluir usuário, Storage). */
export function supabaseAdmin() {
  return createClient(env.supabaseUrl(), env.supabaseChaveSecreta(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
