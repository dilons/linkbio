// Limites de uso por chave e janela (cadastro, login, emails, checagem de
// endereço, visitas). A chave leva só hashes (do dia), nunca IP ou email em
// claro; a tabela é limpa pelo job diário.
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";
import { hashDoDia } from "./eventos";

/** Monta a chave: "login:ip:<hash>". */
export async function chaveDe(tipo: string, ...partes: string[]): Promise<string> {
  return `${tipo}:${(await hashDoDia(tipo, ...partes)).toString("base64url").slice(0, 32)}`;
}

/** Conta mais uma tentativa e diz se ainda está dentro do limite. Atômico. */
export async function limitar(chave: string, maximo: number, janelaSegundos: number): Promise<boolean> {
  const conn = await db();
  const janela = janelaSegundos * 1000;
  const inicio = new Date(Math.floor(Date.now() / janela) * janela).toISOString();
  const [r] = await conn
    .insert(rateLimits)
    .values({ key: chave, windowStart: inicio, count: 1 })
    .onConflictDoUpdate({ target: [rateLimits.key, rateLimits.windowStart], set: { count: sql`${rateLimits.count} + 1` } })
    .returning({ n: rateLimits.count });
  return r.n <= maximo;
}

/** Atalho: várias regras de uma vez; passa só se todas passarem. */
export async function dentroDosLimites(regras: Array<[tipo: string, valor: string, maximo: number, janelaSegundos: number]>): Promise<boolean> {
  let ok = true;
  for (const [tipo, valor, maximo, janela] of regras) {
    if (!(await limitar(await chaveDe(tipo, valor), maximo, janela))) ok = false;
  }
  return ok;
}
