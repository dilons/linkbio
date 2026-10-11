// Visitas e cliques. Sem cookie e sem guardar IP: o visitante único é um hash
// de (sal do dia + IP + navegador + perfil). O sal é apagado depois de um dia
// (job /api/cron/sal), e com ele a chance de ligar o hash a alguém.
import { createHash, randomBytes } from "node:crypto";
import { and, asc, count, desc, eq, gt, gte, isNull, lte, or, sql } from "drizzle-orm";
import { isbot } from "isbot";
import { donoDoPerfil } from "@/lib/authz";
import { db } from "@/lib/db";
import { analyticsSalts, events, links, profiles } from "@/lib/db/schema";

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** O sal de hoje (UTC). Criado aqui se o job ainda não criou. */
export async function salDoDia(): Promise<Buffer> {
  const conn = await db();
  const hoje = new Date().toISOString().slice(0, 10);
  await conn.insert(analyticsSalts).values({ day: hoje, salt: randomBytes(32) }).onConflictDoNothing();
  const [r] = await conn.select({ salt: analyticsSalts.salt }).from(analyticsSalts).where(eq(analyticsSalts.day, hoje));
  return r.salt;
}

/** hash(sal do dia + partes). Serve para o visitante único e para as chaves dos limites de uso. */
export async function hashDoDia(...partes: string[]): Promise<Buffer> {
  const h = createHash("sha256").update(await salDoDia());
  for (const p of partes) h.update("\u0000").update(p);
  return h.digest();
}

async function gravar(tipo: "view" | "click", profileId: string, linkId: string | null, info: InfoVisitante) {
  const conn = await db();
  await conn.insert(events).values({
    profileId,
    linkId,
    type: tipo,
    visitorHash: await hashDoDia(info.ip, info.userAgent, profileId),
    country: info.pais?.slice(0, 2).toUpperCase() ?? null,
    city: info.cidade?.slice(0, 100) ?? null,
    source: fonteDe(info.referer),
    device: dispositivoDe(info.userAgent),
  });
}

/**
 * Conta o clique (se não for robô) e devolve a URL para redirecionar. Só
 * redireciona para a URL gravada de um link ligado, dentro da janela, de um
 * perfil que existe: /r/[id] nunca vira redirecionador aberto.
 */
export async function registrarClique(linkId: string, info: InfoVisitante, contar = true): Promise<string | null> {
  if (!UUID.test(linkId)) return null;
  const conn = await db();
  const agora = new Date().toISOString();
  const [link] = await conn
    .select({ url: links.url, profileId: links.profileId })
    .from(links)
    .innerJoin(profiles, eq(profiles.id, links.profileId))
    .where(
      and(
        eq(links.id, linkId),
        eq(links.enabled, true),
        eq(links.kind, "link"),
        isNull(profiles.deletedAt),
        or(isNull(links.startsAt), lte(links.startsAt, agora)),
        or(isNull(links.endsAt), gt(links.endsAt, agora)),
      ),
    )
    .limit(1);
  if (!link?.url) return null;
  if (contar && !ehRobo(info.userAgent)) await gravar("click", link.profileId, linkId, info);
  return link.url;
}

export async function registrarVisita(profileId: string, info: InfoVisitante): Promise<boolean> {
  if (!UUID.test(profileId) || ehRobo(info.userAgent)) return false;
  const conn = await db();
  const [p] = await conn
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, profileId), isNull(profiles.deletedAt)))
    .limit(1);
  if (!p) return false;
  await gravar("view", profileId, null, info);
  return true;
}

export type Totais = {
  visitas: number;
  visitantes: number;
  cliques: number;
  porLink: Array<{ id: string; title: string; cliques: number }>;
};

/** Totais dos últimos N dias, direto dos eventos (a soma diária fica em daily_stats, pelo job). */
export async function totais(accountId: string, profileId: string, dias = 7): Promise<Totais | null> {
  const conn = await db();
  if (!(await donoDoPerfil(conn, accountId, profileId))) return null;
  const desde = new Date(Date.now() - dias * 86400_000).toISOString();
  const doPeriodo = and(eq(events.profileId, profileId), gte(events.occurredAt, desde));
  const [t] = await conn
    .select({
      visitas: sql<number>`count(*) filter (where ${events.type} = 'view')`.mapWith(Number),
      visitantes: sql<number>`count(distinct ${events.visitorHash}) filter (where ${events.type} = 'view')`.mapWith(Number),
      cliques: sql<number>`count(*) filter (where ${events.type} = 'click')`.mapWith(Number),
    })
    .from(events)
    .where(doPeriodo);
  const porLink = await conn
    .select({ id: links.id, title: links.title, cliques: count(events.id) })
    .from(links)
    .leftJoin(events, and(eq(events.linkId, links.id), eq(events.type, "click"), gte(events.occurredAt, desde)))
    .where(and(eq(links.profileId, profileId), eq(links.kind, "link")))
    .groupBy(links.id, links.title, links.position)
    .orderBy(desc(count(events.id)), asc(links.position));
  return { ...t, porLink };
}

