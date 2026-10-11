// Visitas e cliques. Sem cookie e sem guardar IP: o visitante único é um hash
// de (sal do dia + IP + navegador + perfil). O sal é apagado depois de um dia
// (job da architecture.md), e com ele a chance de ligar o hash a alguém.
import { createHash, randomBytes } from "node:crypto";
import { isbot } from "isbot";
import { db } from "./db";

export type InfoVisitante = {
  ip: string;
  userAgent: string;
  referer: string | null;
  pais: string | null;
  cidade: string | null;
};

const FONTES: Array<[RegExp, string]> = [
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)(x\.com|twitter\.com|t\.co)$/, "x"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "facebook"],
  [/(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com)$/, "search"],
];

export function fonteDe(referer: string | null): string {
  if (!referer) return "direct";
  try {
    const host = new URL(referer).hostname;
    return FONTES.find(([re]) => re.test(host))?.[1] ?? "other";
  } catch {
    return "other";
  }
}

export function dispositivoDe(ua: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

export const ehRobo = (ua: string) => !ua || isbot(ua);

async function hashDoVisitante(profileId: string, info: InfoVisitante): Promise<Buffer> {
  const conn = await db();
  const hoje = new Date().toISOString().slice(0, 10);
  await conn.query("insert into analytics_salts (day, salt) values ($1, $2) on conflict (day) do nothing", [
    hoje,
    randomBytes(32),
  ]);
  const { rows } = await conn.query<{ salt: Uint8Array }>("select salt from analytics_salts where day = $1", [hoje]);
  return createHash("sha256").update(rows[0].salt).update(info.ip).update(info.userAgent).update(profileId).digest();
}

async function gravar(tipo: "view" | "click", profileId: string, linkId: string | null, info: InfoVisitante) {
  const conn = await db();
  await conn.query(
    `insert into events (profile_id, link_id, type, visitor_hash, country, city, source, device)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      profileId,
      linkId,
      tipo,
      await hashDoVisitante(profileId, info),
      info.pais?.slice(0, 2).toUpperCase() ?? null,
      info.cidade,
      fonteDe(info.referer),
      dispositivoDe(info.userAgent),
    ],
  );
}

/**
 * Conta o clique (se não for robô) e devolve a URL para redirecionar. Só
 * redireciona para a URL gravada de um link ligado, dentro da janela, de um
 * perfil que existe: /r/[id] nunca vira redirecionador aberto.
 */
export async function registrarClique(linkId: string, info: InfoVisitante): Promise<string | null> {
  if (!/^[0-9a-f-]{36}$/i.test(linkId)) return null;
  const conn = await db();
  const { rows } = await conn.query<{ url: string; profile_id: string }>(
    `select l.url, l.profile_id from links l join profiles p on p.id = l.profile_id
      where l.id = $1 and l.enabled and l.kind = 'link' and p.deleted_at is null
        and (l.starts_at is null or l.starts_at <= now()) and (l.ends_at is null or l.ends_at > now())`,
    [linkId],
  );
  const link = rows[0];
  if (!link?.url) return null;
  if (!ehRobo(info.userAgent)) await gravar("click", link.profile_id, linkId, info);
  return link.url;
}

export async function registrarVisita(profileId: string, info: InfoVisitante): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(profileId) || ehRobo(info.userAgent)) return false;
  const conn = await db();
  const { rows } = await conn.query("select 1 from profiles where id = $1 and deleted_at is null", [profileId]);
  if (!rows[0]) return false;
  await gravar("view", profileId, null, info);
  return true;
}

export type Totais = {
  visitas: number;
  visitantes: number;
  cliques: number;
  porLink: Array<{ id: string; title: string; cliques: number }>;
};

/** Totais dos últimos N dias, direto dos eventos (a soma diária vem na etapa de insights). */
export async function totais(accountId: string, profileId: string, dias = 7): Promise<Totais | null> {
  const conn = await db();
  const dono = await conn.query("select 1 from profiles where id = $1 and account_id = $2", [profileId, accountId]);
  if (!dono.rows[0]) return null;
  const desde = new Date(Date.now() - dias * 86400_000).toISOString();
  const { rows } = await conn.query<{ visitas: number; visitantes: number; cliques: number }>(
    `select count(*) filter (where type = 'view')::int as visitas,
            count(distinct visitor_hash) filter (where type = 'view')::int as visitantes,
            count(*) filter (where type = 'click')::int as cliques
       from events where profile_id = $1 and occurred_at >= $2`,
    [profileId, desde],
  );
  const porLink = await conn.query<{ id: string; title: string; cliques: number }>(
    `select l.id, l.title, count(e.id)::int as cliques
       from links l left join events e on e.link_id = l.id and e.type = 'click' and e.occurred_at >= $2
      where l.profile_id = $1 and l.kind = 'link'
      group by l.id, l.title, l.position order by cliques desc, l.position`,
    [profileId, desde],
  );
  return { ...rows[0], porLink: porLink.rows };
}
