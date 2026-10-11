// "Esta conta pode mexer neste registro?" Toda consulta de dono passa por aqui
// (architecture.md, "Regra de acesso"). Os ids são UUID e a checagem vai na
// própria consulta, então não há janela entre conferir e gravar.
import { and, eq, isNull } from "drizzle-orm";
import type { Banco } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

// O banco ou uma transação aberta: os dois sabem fazer select.
type Leitor = Pick<Banco, "select">;

/** Subconsulta com os ids dos perfis ativos da conta, para usar em `inArray`. */
export function perfisDaConta(conn: Leitor, accountId: string) {
  return conn
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.accountId, accountId), isNull(profiles.deletedAt)));
}

/** Condição "o perfil é desta conta e não foi excluído". */
export function eDonoDoPerfil(accountId: string, profileId: string) {
  return and(eq(profiles.id, profileId), eq(profiles.accountId, accountId), isNull(profiles.deletedAt));
}

/** true se o perfil existe, não foi excluído e é da conta. */
export async function donoDoPerfil(conn: Leitor, accountId: string, profileId: string): Promise<boolean> {
  const r = await conn.select({ id: profiles.id }).from(profiles).where(eDonoDoPerfil(accountId, profileId)).limit(1);
  return r.length > 0;
}
