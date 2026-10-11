import { db } from "./db";

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
};

const COLUNAS = "l.id, l.title, l.url, l.enabled, l.position, l.starts_at, l.ends_at, l.lock, l.lock_min_age";

// Toda consulta passa pelo dono: o link só é visto ou mudado se o perfil dele
// é da conta da sessão (architecture.md, "Regra de acesso").

export async function listarLinks(accountId: string, profileId: string): Promise<Link[]> {
  const conn = await db();
  const { rows } = await conn.query<Link>(
    `select ${COLUNAS} from links l join profiles p on p.id = l.profile_id
      where l.profile_id = $2 and p.account_id = $1 and l.kind = 'link'
      order by l.position`,
    [accountId, profileId],
  );
  return rows;
}

/** O link novo entra no topo da lista. */
export async function adicionarLink(
  accountId: string,
  profileId: string,
  dados: { titulo: string; url: string },
): Promise<Link | null> {
  const conn = await db();
  const { rows } = await conn.query<Link>(
    `insert into links (profile_id, title, url, position)
     select p.id, $3, $4, coalesce((select min(position) from links where profile_id = p.id), 1) - 1
       from profiles p where p.id = $2 and p.account_id = $1 and p.deleted_at is null
     returning id, title, url, enabled, position, starts_at, ends_at, lock, lock_min_age`,
    [accountId, profileId, dados.titulo, dados.url],
  );
  return rows[0] ?? null;
}

export async function editarLink(accountId: string, linkId: string, dados: { titulo: string; url: string }): Promise<boolean> {
  const conn = await db();
  const r = await conn.query(
    `update links l set title = $3, url = $4, updated_at = now()
       from profiles p where l.id = $2 and p.id = l.profile_id and p.account_id = $1`,
    [accountId, linkId, dados.titulo, dados.url],
  );
  return (r.affectedRows ?? 0) > 0;
}

export async function alternarLink(accountId: string, linkId: string, ativo: boolean): Promise<boolean> {
  const conn = await db();
  const r = await conn.query(
    `update links l set enabled = $3, updated_at = now()
       from profiles p where l.id = $2 and p.id = l.profile_id and p.account_id = $1`,
    [accountId, linkId, ativo],
  );
  return (r.affectedRows ?? 0) > 0;
}

export async function excluirLink(accountId: string, linkId: string): Promise<boolean> {
  const conn = await db();
  const r = await conn.query(
    `delete from links l using profiles p where l.id = $2 and p.id = l.profile_id and p.account_id = $1`,
    [accountId, linkId],
  );
  return (r.affectedRows ?? 0) > 0;
}

/** Grava a nova ordem numa transação. Recusa se a lista não for exatamente a do perfil. */
export async function reordenarLinks(accountId: string, profileId: string, ids: string[]): Promise<boolean> {
  const conn = await db();
  return conn.transaction(async (tx) => {
    const { rows } = await tx.query<{ id: string }>(
      `select l.id from links l join profiles p on p.id = l.profile_id
        where l.profile_id = $2 and p.account_id = $1 and l.kind = 'link'`,
      [accountId, profileId],
    );
    const atuais = new Set(rows.map((r) => r.id));
    if (atuais.size !== ids.length || !ids.every((id) => atuais.has(id))) return false;
    for (const [i, id] of ids.entries()) {
      await tx.query("update links set position = $2, updated_at = now() where id = $1", [id, i]);
    }
    return true;
  });
}
