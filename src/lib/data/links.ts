import { and, asc, eq, inArray, min } from "drizzle-orm";
import { donoDoPerfil, perfisDaConta } from "@/lib/authz";
import { db } from "@/lib/db";
import { forms, links } from "@/lib/db/schema";
import { pedeNome, type ConfigFormulario } from "./formularios";
import { travaParaBanco, type Trava } from "./validacao";

export type Link = {
  id: string;
  title: string;
  url: string | null;
  enabled: boolean;
  position: number;
  starts_at: string | null;
  ends_at: string | null;
  lock: string;
  lock_min_age: number | null;
  /** preenchido nos blocos de formulário de email */
  formulario: ConfigFormulario | null;
};

/** Os tipos que aparecem na lista do editor e na página (cabeçalho e vídeo vêm depois). */
export const TIPOS_NA_LISTA = ["link", "form"];

const COLUNAS = {
  id: links.id,
  title: links.title,
  url: links.url,
  enabled: links.enabled,
  position: links.position,
  starts_at: links.startsAt,
  ends_at: links.endsAt,
  lock: links.lock,
  lock_min_age: links.lockMinAge,
};

// Toda consulta passa pelo dono (lib/authz.ts): o link só é visto ou mudado se
// o perfil dele é da conta da sessão.

export async function listarLinks(accountId: string, profileId: string): Promise<Link[]> {
  const conn = await db();
  const linhas = await conn
    .select({ ...COLUNAS, kind: links.kind, campos: forms.fields, consentimento: forms.consentText, sucesso: forms.successMessage })
    .from(links)
    .leftJoin(forms, eq(forms.linkId, links.id))
    .where(and(eq(links.profileId, profileId), inArray(links.kind, TIPOS_NA_LISTA), inArray(links.profileId, perfisDaConta(conn, accountId))))
    .orderBy(asc(links.position));
  return linhas.map(({ kind, campos, consentimento, sucesso, ...l }) => ({
    ...l,
    formulario: kind === "form" ? { pedirNome: pedeNome(campos), consentimento: consentimento ?? "", sucesso: sucesso ?? "" } : null,
  }));
}

/** O link novo entra no topo da lista. */
export async function adicionarLink(
  accountId: string,
  profileId: string,
  dados: { titulo: string; url: string },
): Promise<Link | null> {
  const conn = await db();
  return conn.transaction(async (tx) => {
    if (!(await donoDoPerfil(tx, accountId, profileId))) return null;
    const [{ topo }] = await tx.select({ topo: min(links.position) }).from(links).where(eq(links.profileId, profileId));
    const [novo] = await tx
      .insert(links)
      .values({ profileId, title: dados.titulo, url: dados.url, position: (topo ?? 1) - 1 })
      .returning(COLUNAS);
    return { ...novo, formulario: null };
  });
}

const doDono = (conn: Awaited<ReturnType<typeof db>>, accountId: string, linkId: string) =>
  and(eq(links.id, linkId), inArray(links.profileId, perfisDaConta(conn, accountId)));

export async function editarLink(
  accountId: string,
  linkId: string,
  dados: { titulo: string; url: string; trava?: Trava },
): Promise<boolean> {
  const conn = await db();
  const r = await conn
    .update(links)
    .set({ title: dados.titulo, url: dados.url, ...(dados.trava ? travaParaBanco(dados.trava) : {}), updatedAt: new Date().toISOString() })
    .where(and(doDono(conn, accountId, linkId), eq(links.kind, "link")))
    .returning({ id: links.id });
  return r.length > 0;
}

export async function alternarLink(accountId: string, linkId: string, ativo: boolean): Promise<boolean> {
  const conn = await db();
  const r = await conn
    .update(links)
    .set({ enabled: ativo, updatedAt: new Date().toISOString() })
    .where(doDono(conn, accountId, linkId))
    .returning({ id: links.id });
  return r.length > 0;
}

export async function excluirLink(accountId: string, linkId: string): Promise<boolean> {
  const conn = await db();
  const r = await conn.delete(links).where(doDono(conn, accountId, linkId)).returning({ id: links.id });
  return r.length > 0;
}

/** Grava a nova ordem numa transação. Recusa se a lista não for exatamente a do perfil. */
export async function reordenarLinks(accountId: string, profileId: string, ids: string[]): Promise<boolean> {
  const conn = await db();
  return conn.transaction(async (tx) => {
    if (!(await donoDoPerfil(tx, accountId, profileId))) return false;
    const atuais = new Set(
      (await tx.select({ id: links.id }).from(links).where(and(eq(links.profileId, profileId), inArray(links.kind, TIPOS_NA_LISTA)))).map((l) => l.id),
    );
    if (atuais.size !== ids.length || !ids.every((id) => atuais.has(id))) return false;
    const agora = new Date().toISOString();
    for (const [i, id] of ids.entries()) {
      await tx.update(links).set({ position: i, updatedAt: agora }).where(eq(links.id, id));
    }
    return true;
  });
}
