import { db, violouUnico } from "./db";
import { normalizarUsername, problemaNoUsername } from "./validacao";

export type Perfil = {
  id: string;
  account_id: string;
  username: string;
  title: string | null;
  bio: string | null;
  avatar_path: string | null;
  social_position: "top" | "bottom";
  sensitive_label: "none" | "sensitive" | "18" | "21" | "25";
};

export type LinkPublico = { id: string; title: string; highlight: string; lock: string; lock_min_age: number | null };
export type RedePublica = { platform: string; url: string };
export type PaginaPublica = {
  perfil: Perfil;
  tema: string;
  links: LinkPublico[];
  redes: RedePublica[];
};

const COLUNAS = "id, account_id, username::text, title, bio, avatar_path, social_position, sensitive_label";

export type Disponibilidade = { livre: boolean; username: string; motivo?: string };

/** Checa formato, lista de reservados e se alguém já usa. */
export async function verificarUsername(bruto: string): Promise<Disponibilidade> {
  const username = normalizarUsername(bruto);
  const problema = problemaNoUsername(username);
  if (problema) return { livre: false, username, motivo: problema };
  const conn = await db();
  const { rows } = await conn.query<{ reservado: boolean; usado: boolean }>(
    `select exists (select 1 from reserved_usernames where username = $1) as reservado,
            exists (select 1 from profiles where username = $1) as usado`,
    [username],
  );
  if (rows[0].reservado) return { livre: false, username, motivo: "Esse endereço é reservado. Tente outro." };
  if (rows[0].usado) return { livre: false, username, motivo: "Alguém já usa esse endereço. Tente outro." };
  return { livre: true, username };
}

export async function criarPerfil(
  accountId: string,
  bruto: string,
): Promise<{ ok: true; perfil: Perfil } | { ok: false; erro: string }> {
  const check = await verificarUsername(bruto);
  if (!check.livre) return { ok: false, erro: check.motivo ?? "Endereço indisponível." };
  const conn = await db();
  try {
    const perfil = await conn.transaction(async (tx) => {
      const { rows } = await tx.query<Perfil>(
        // username é citext e title é text: o mesmo $n nas duas colunas não passa
        `insert into profiles (account_id, username, title) values ($1, $2, $3) returning ${COLUNAS}`,
        [accountId, check.username, check.username],
      );
      await tx.query("insert into appearances (profile_id) values ($1)", [rows[0].id]);
      return rows[0];
    });
    return { ok: true, perfil };
  } catch (e) {
    // dois cadastros no mesmo instante: o banco recusa o segundo
    if (violouUnico(e)) return { ok: false, erro: "Alguém acabou de pegar esse endereço. Tente outro." };
    throw e;
  }
}

/** O perfil da conta (por enquanto, um por conta). */
export async function perfilDaConta(accountId: string): Promise<Perfil | null> {
  const conn = await db();
  const { rows } = await conn.query<Perfil>(
    `select ${COLUNAS} from profiles where account_id = $1 and deleted_at is null order by created_at limit 1`,
    [accountId],
  );
  return rows[0] ?? null;
}

export async function atualizarCabecalho(
  accountId: string,
  profileId: string,
  dados: { titulo: string; bio: string },
): Promise<boolean> {
  const conn = await db();
  const r = await conn.query(
    `update profiles set title = nullif($3, ''), bio = nullif($4, ''), updated_at = now()
      where id = $2 and account_id = $1 and deleted_at is null`,
    [accountId, profileId, dados.titulo, dados.bio],
  );
  return (r.affectedRows ?? 0) > 0;
}

/** O que o visitante vê: só links ligados e dentro da janela de agendamento. */
export async function paginaPublica(bruto: string): Promise<PaginaPublica | null> {
  const username = normalizarUsername(bruto);
  if (problemaNoUsername(username)) return null;
  const conn = await db();
  const { rows } = await conn.query<Perfil & { theme: string }>(
    `select p.id, p.account_id, p.username::text, p.title, p.bio, p.avatar_path, p.social_position,
            p.sensitive_label, coalesce(a.theme, 'papel') as theme
       from profiles p left join appearances a on a.profile_id = p.id
      where p.username = $1 and p.deleted_at is null`,
    [username],
  );
  const perfil = rows[0];
  if (!perfil) return null;
  const links = await conn.query<LinkPublico>(
    `select id, title, highlight, lock, lock_min_age from links
      where profile_id = $1 and enabled and kind = 'link'
        and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())
      order by position`,
    [perfil.id],
  );
  const redes = await conn.query<RedePublica>(
    "select platform, url from social_links where profile_id = $1 order by position",
    [perfil.id],
  );
  const { theme, ...resto } = perfil;
  return { perfil: resto, tema: theme === "padrao" ? "papel" : theme, links: links.rows, redes: redes.rows };
}
