// S16: aviso de conteúdo sensível e trava de idade, na página toda ou num
// link (F11). Quem visita confirma num formulário que funciona sem
// JavaScript; a resposta fica num cookie de sessão só daquele alvo, sem dado
// pessoal. A data de nascimento serve para a conta e não é gravada.
import { cookies } from "next/headers";
import { and, eq, gt, isNull, lte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { appearances, links, profiles } from "@/lib/db/schema";

export type Rotulo = "sensivel" | "18" | "21" | "25";
export type Alvo = { tipo: "p" | "l"; id: string };
export type EstadoDoAviso = "ok" | "negado" | null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "p:<id do perfil>" ou "l:<id do link>", como vai no formulário. */
export function lerAlvo(bruto: unknown): Alvo | null {
  const m = /^([pl]):(.+)$/.exec(String(bruto ?? ""));
  if (!m || !UUID.test(m[2])) return null;
  return { tipo: m[1] as "p" | "l", id: m[2].toLowerCase() };
}

export const alvoComoTexto = (a: Alvo) => `${a.tipo}:${a.id}`;
export const nomeDoCookie = (a: Alvo) => `aviso_${a.tipo}_${a.id}`;

/** Rótulo da página (coluna `sensitive_label`). */
export function rotuloDaPagina(label: string | null | undefined): Rotulo | null {
  if (label === "sensitive") return "sensivel";
  if (label === "18" || label === "21" || label === "25") return label;
  return null;
}

/** Trava de um link (colunas `lock` e `lock_min_age`). */
export function rotuloDoLink(lock: string | null | undefined, idade: number | null | undefined): Rotulo | null {
  if (lock === "sensitive") return "sensivel";
  if (lock === "age" && (idade === 18 || idade === 21 || idade === 25)) return String(idade) as Rotulo;
  return null;
}

export const idadeMinima = (r: Rotulo): number | null => (r === "sensivel" ? null : Number(r));

/**
 * Idade completa em `hoje` (no fuso de Brasília), para uma data AAAA-MM-DD.
 * Data inválida, no futuro ou de antes de 1900: null.
 */
export function idadeEm(nascimento: string, hoje = new Date(), fuso = "America/Sao_Paulo"): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nascimento.trim());
  if (!m) return null;
  const [a, me, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const data = new Date(Date.UTC(a, me - 1, d));
  if (data.getUTCFullYear() !== a || data.getUTCMonth() !== me - 1 || data.getUTCDate() !== d || a < 1900) return null;
  const [ha, hm, hd] = new Intl.DateTimeFormat("en-CA", { timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(hoje)
    .split("-")
    .map(Number);
  if (a > ha || (a === ha && (me > hm || (me === hm && d > hd)))) return null;
  let idade = ha - a;
  if (hm < me || (hm === me && hd < d)) idade -= 1;
  return idade;
}

/** O que a pessoa já respondeu para este alvo nesta sessão do navegador. */
export async function estadoDoAviso(alvo: Alvo): Promise<EstadoDoAviso> {
  const v = (await cookies()).get(nomeDoCookie(alvo))?.value;
  return v === "ok" || v === "negado" ? v : null;
}

export type InfoDoAlvo = {
  rotulo: Rotulo | null;
  /** para onde a pessoa volta depois de responder */
  volta: string;
  /** onde o aviso aparece (para voltar com o erro da data) */
  pergunta: string;
  username: string;
  titulo: string;
  tema: string;
  /** o aviso da página toda, que vale antes do de qualquer link */
  rotuloDaPagina: Rotulo | null;
  perfilId: string;
};

const temaDe = (t: string | null) => (!t || t === "padrao" ? "papel" : t);

/**
 * O alvo do aviso, lido do banco (nunca do formulário): página que existe, ou
 * link ligado, dentro da janela, de uma página que existe.
 */
export async function infoDoAlvo(alvo: Alvo): Promise<InfoDoAlvo | null> {
  const conn = await db();
  if (alvo.tipo === "p") {
    const [p] = await conn
      .select({ id: profiles.id, username: profiles.username, title: profiles.title, label: profiles.sensitiveLabel, theme: appearances.theme })
      .from(profiles)
      .leftJoin(appearances, eq(appearances.profileId, profiles.id))
      .where(and(eq(profiles.id, alvo.id), isNull(profiles.deletedAt)))
      .limit(1);
    if (!p) return null;
    const rotulo = rotuloDaPagina(p.label);
    return { rotulo, rotuloDaPagina: rotulo, volta: `/${p.username}`, pergunta: `/${p.username}`, username: p.username, titulo: p.title || p.username, tema: temaDe(p.theme), perfilId: p.id };
  }
  const agora = new Date().toISOString();
  const [l] = await conn
    .select({
      lock: links.lock,
      idade: links.lockMinAge,
      perfilId: profiles.id,
      username: profiles.username,
      title: profiles.title,
      label: profiles.sensitiveLabel,
      theme: appearances.theme,
    })
    .from(links)
    .innerJoin(profiles, eq(profiles.id, links.profileId))
    .leftJoin(appearances, eq(appearances.profileId, profiles.id))
    .where(
      and(
        eq(links.id, alvo.id),
        eq(links.enabled, true),
        eq(links.kind, "link"),
        isNull(profiles.deletedAt),
        or(isNull(links.startsAt), lte(links.startsAt, agora)),
        or(isNull(links.endsAt), gt(links.endsAt, agora)),
      ),
    )
    .limit(1);
  if (!l) return null;
  return {
    rotulo: rotuloDoLink(l.lock, l.idade),
    rotuloDaPagina: rotuloDaPagina(l.label),
    volta: `/r/${alvo.id}`,
    pergunta: `/r/${alvo.id}/aviso`,
    username: l.username,
    titulo: l.title || l.username,
    tema: temaDe(l.theme),
    perfilId: l.perfilId,
  };
}
