import { and, asc, eq, gt, inArray, isNotNull, isNull, lte, or } from "drizzle-orm";
import { eDonoDoPerfil } from "@/lib/authz";
import { assinaturaDaConta, ehPro } from "@/lib/billing";
import { db, violouUnico } from "@/lib/db";
import { appearances, forms, links, profiles, reservedUsernames, socialLinks } from "@/lib/db/schema";
import { pedeNome, type ConfigFormulario } from "./formularios";
import { TIPOS_NA_LISTA } from "./links";
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

export type LinkPublico = {
  id: string;
  title: string;
  highlight: string;
  lock: string;
  lock_min_age: number | null;
  /** preenchido nos blocos de formulário de email */
  formulario: ConfigFormulario | null;
};
export type RedePublica = { platform: string; url: string };
export type PaginaPublica = {
  perfil: Perfil;
  /** plano pago: a página sai sem a marca do linkbio no rodapé */
  pro: boolean;
  tema: string;
  links: LinkPublico[];
  redes: RedePublica[];
};

const COLUNAS = {
  id: profiles.id,
  account_id: profiles.accountId,
  username: profiles.username,
  title: profiles.title,
  bio: profiles.bio,
  avatar_path: profiles.avatarPath,
  social_position: profiles.socialPosition,
  sensitive_label: profiles.sensitiveLabel,
};

export type Disponibilidade = { livre: boolean; username: string; motivo?: string };

/**
 * Checa formato, lista de reservados e se alguém já usa. O endereço de uma
 * página excluída fica guardado 14 dias; nesse tempo só a conta que era dona
 * pode retomá-lo (`accountId`).
 */
export async function verificarUsername(bruto: string, accountId?: string): Promise<Disponibilidade> {
  const username = normalizarUsername(bruto);
  const problema = problemaNoUsername(username);
  if (problema) return { livre: false, username, motivo: problema };
  const conn = await db();
  const [reservado, usado] = await Promise.all([
    conn.select({ u: reservedUsernames.username }).from(reservedUsernames).where(eq(reservedUsernames.username, username)).limit(1),
    conn
      .select({ id: profiles.id, dono: profiles.accountId, excluido: profiles.deletedAt })
      .from(profiles)
      .where(eq(profiles.username, username))
      .limit(1),
  ]);
  if (reservado.length) return { livre: false, username, motivo: "Esse endereço é reservado. Tente outro." };
  const [u] = usado;
  if (u && u.excluido && accountId && u.dono === accountId) return { livre: true, username };
  if (u) return { livre: false, username, motivo: "Alguém já usa esse endereço. Tente outro." };
  return { livre: true, username };
}

export async function criarPerfil(
  accountId: string,
  bruto: string,
): Promise<{ ok: true; perfil: Perfil } | { ok: false; erro: string }> {
  const check = await verificarUsername(bruto, accountId);
  if (!check.livre) return { ok: false, erro: check.motivo ?? "Endereço indisponível." };
  const conn = await db();
  try {
    const perfil = await conn.transaction(async (tx) => {
      // a página excluída desta conta que guardava o endereço (já vazia) sai antes
      await tx
        .delete(profiles)
        .where(and(eq(profiles.username, check.username), eq(profiles.accountId, accountId), isNotNull(profiles.deletedAt)));
      const [p] = await tx
        .insert(profiles)
        .values({ accountId, username: check.username, title: check.username })
        .returning(COLUNAS);
      await tx.insert(appearances).values({ profileId: p.id });
      return p as Perfil;
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
  const [p] = await conn
    .select(COLUNAS)
    .from(profiles)
    .where(and(eq(profiles.accountId, accountId), isNull(profiles.deletedAt)))
    .orderBy(asc(profiles.createdAt))
    .limit(1);
  return (p as Perfil | undefined) ?? null;
}

export async function atualizarCabecalho(
  accountId: string,
  profileId: string,
  dados: { titulo: string; bio: string },
): Promise<boolean> {
  const conn = await db();
  const r = await conn
    .update(profiles)
    .set({ title: dados.titulo || null, bio: dados.bio || null, updatedAt: new Date().toISOString() })
    .where(eDonoDoPerfil(accountId, profileId))
    .returning({ id: profiles.id });
  return r.length > 0;
}

/** O que o visitante vê: só links ligados e dentro da janela de agendamento. */
export async function paginaPublica(bruto: string): Promise<PaginaPublica | null> {
  const username = normalizarUsername(bruto);
  if (problemaNoUsername(username)) return null;
  const conn = await db();
  const [linha] = await conn
    .select({ ...COLUNAS, theme: appearances.theme })
    .from(profiles)
    .leftJoin(appearances, eq(appearances.profileId, profiles.id))
    .where(and(eq(profiles.username, username), isNull(profiles.deletedAt)))
    .limit(1);
  if (!linha) return null;
  const agora = new Date().toISOString();
  const [ls, redes, assinatura] = await Promise.all([
    conn
      .select({
        id: links.id,
        title: links.title,
        highlight: links.highlight,
        lock: links.lock,
        lock_min_age: links.lockMinAge,
        kind: links.kind,
        campos: forms.fields,
        consentimento: forms.consentText,
        sucesso: forms.successMessage,
      })
      .from(links)
      .leftJoin(forms, eq(forms.linkId, links.id))
      .where(
        and(
          eq(links.profileId, linha.id),
          eq(links.enabled, true),
          inArray(links.kind, TIPOS_NA_LISTA),
          or(isNull(links.startsAt), lte(links.startsAt, agora)),
          or(isNull(links.endsAt), gt(links.endsAt, agora)),
        ),
      )
      .orderBy(asc(links.position)),
    conn
      .select({ platform: socialLinks.platform, url: socialLinks.url })
      .from(socialLinks)
      .where(eq(socialLinks.profileId, linha.id))
      .orderBy(asc(socialLinks.position)),
    linha.account_id ? assinaturaDaConta(linha.account_id) : null,
  ]);
  const { theme, ...perfil } = linha;
  const tema = !theme || theme === "padrao" ? "papel" : theme;
  const publicos = ls.map(({ kind, campos, consentimento, sucesso, ...l }) => ({
    ...l,
    formulario: kind === "form" ? { pedirNome: pedeNome(campos), consentimento: consentimento ?? "", sucesso: sucesso ?? "" } : null,
  }));
  return { perfil: perfil as Perfil, pro: ehPro(assinatura), tema, links: publicos, redes };
}
