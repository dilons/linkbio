// Formulário de captura de email na página pública (F05, S11, S15, S17) e a
// lista de inscritos (F07, S10). Nos dados dos inscritos o criador é o
// controlador e o app é operador (LGPD): o texto de consentimento que o
// visitante aceitou fica gravado com cada inscrição, como prova.
import { and, asc, desc, eq, gt, inArray, isNull, lte, min, or, sql } from "drizzle-orm";
import { z } from "zod";
import { donoDoPerfil, perfisDaConta } from "@/lib/authz";
import { db } from "@/lib/db";
import { events, forms, links, profiles, submissions } from "@/lib/db/schema";
import { ehRobo, hashDoDia, type InfoVisitante } from "./eventos";

export type ConfigFormulario = { pedirNome: boolean; consentimento: string; sucesso: string };

export const SUCESSO_PADRAO = "Pronto! Você está na lista.";
export const consentimentoPadrao = (pagina: string) =>
  `Quero receber novidades de ${pagina} por email. Posso pedir para sair da lista quando quiser.`;

export const formularioSchema = z.object({
  titulo: z.string().trim().min(1, "Dê um título ao formulário.").max(100, "Use no máximo 100 caracteres."),
  pedirNome: z.boolean(),
  consentimento: z
    .string()
    .trim()
    .min(20, "Diga em uma frase para que o email vai ser usado.")
    .max(300, "Use no máximo 300 caracteres."),
  sucesso: z.string().trim().min(1, "Escreva o que aparece depois do envio.").max(200, "Use no máximo 200 caracteres."),
});

type Campo = { type: "email" | "nome"; label: string; required: boolean };

const camposDe = (pedirNome: boolean): Campo[] => [
  { type: "email", label: "Email", required: true },
  ...(pedirNome ? [{ type: "nome" as const, label: "Nome", required: false }] : []),
];

export const pedeNome = (campos: unknown) => Array.isArray(campos) && campos.some((c) => (c as Campo)?.type === "nome");

/** Cria um bloco de formulário no topo da página, com textos padrão. */
export async function adicionarFormulario(accountId: string, profileId: string, nomeDaPagina: string): Promise<string | null> {
  const conn = await db();
  return conn.transaction(async (tx) => {
    if (!(await donoDoPerfil(tx, accountId, profileId))) return null;
    const [{ topo }] = await tx.select({ topo: min(links.position) }).from(links).where(eq(links.profileId, profileId));
    const [l] = await tx
      .insert(links)
      .values({ profileId, kind: "form", title: "Receba novidades por email", position: (topo ?? 1) - 1 })
      .returning({ id: links.id });
    await tx.insert(forms).values({
      linkId: l.id,
      fields: camposDe(false),
      consentText: consentimentoPadrao(nomeDaPagina),
      successMessage: SUCESSO_PADRAO,
    });
    return l.id;
  });
}

export async function editarFormulario(accountId: string, linkId: string, dados: z.infer<typeof formularioSchema>): Promise<boolean> {
  const conn = await db();
  return conn.transaction(async (tx) => {
    const r = await tx
      .update(links)
      .set({ title: dados.titulo, updatedAt: sql`now()` })
      .where(and(eq(links.id, linkId), eq(links.kind, "form"), inArray(links.profileId, perfisDaConta(tx, accountId))))
      .returning({ id: links.id });
    if (!r.length) return false;
    await tx
      .update(forms)
      .set({ fields: camposDe(dados.pedirNome), consentText: dados.consentimento, successMessage: dados.sucesso, updatedAt: sql`now()` })
      .where(eq(forms.linkId, linkId));
    return true;
  });
}

export type ResultadoInscricao = "ok" | "indisponivel";

/**
 * Grava a inscrição. O mesmo email de novo não duplica e a resposta é igual
 * (não revela quem já está na lista). Robôs recebem "ok" e nada é gravado.
 */
export async function inscrever(
  linkId: string,
  dados: { email: string; nome?: string },
  info: InfoVisitante,
): Promise<ResultadoInscricao> {
  const conn = await db();
  const agora = new Date().toISOString();
  const [alvo] = await conn
    .select({ profileId: links.profileId, consentimento: forms.consentText, campos: forms.fields })
    .from(links)
    .innerJoin(forms, eq(forms.linkId, links.id))
    .innerJoin(profiles, eq(profiles.id, links.profileId))
    .where(
      and(
        eq(links.id, linkId),
        eq(links.kind, "form"),
        eq(links.enabled, true),
        isNull(profiles.deletedAt),
        or(isNull(links.startsAt), lte(links.startsAt, agora)),
        or(isNull(links.endsAt), gt(links.endsAt, agora)),
      ),
    )
    .limit(1);
  if (!alvo) return "indisponivel";
  if (ehRobo(info.userAgent)) return "ok";
  const nome = pedeNome(alvo.campos) ? dados.nome?.trim().slice(0, 100) || null : null;
  const novo = await conn
    .insert(submissions)
    .values({ profileId: alvo.profileId, linkId, email: dados.email, name: nome, consentText: alvo.consentimento })
    .onConflictDoNothing()
    .returning({ id: submissions.id });
  if (novo.length) {
    await conn.insert(events).values({
      profileId: alvo.profileId,
      linkId,
      type: "signup",
      visitorHash: await hashDoDia(info.ip, info.userAgent, alvo.profileId),
    });
  }
  return "ok";
}

export type Inscrito = { id: string; email: string; nome: string | null; formulario: string | null; em: string; consentimento: string };

/** Inscritos do perfil, os mais novos primeiro. Só do dono. */
export async function listarInscritos(accountId: string, profileId: string, limite = 1000): Promise<Inscrito[]> {
  const conn = await db();
  if (!(await donoDoPerfil(conn, accountId, profileId))) return [];
  return conn
    .select({
      id: submissions.id,
      email: submissions.email,
      nome: submissions.name,
      formulario: links.title,
      em: submissions.createdAt,
      consentimento: submissions.consentText,
    })
    .from(submissions)
    .leftJoin(links, eq(links.id, submissions.linkId))
    .where(eq(submissions.profileId, profileId))
    .orderBy(desc(submissions.createdAt), asc(submissions.email))
    .limit(limite);
}

export async function contarInscritos(accountId: string, profileId: string): Promise<number> {
  const conn = await db();
  if (!(await donoDoPerfil(conn, accountId, profileId))) return 0;
  const [r] = await conn.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(submissions).where(eq(submissions.profileId, profileId));
  return r.n;
}

/** Tira uma pessoa da lista (pedido dela ao criador, por exemplo). Só do dono. */
export async function removerInscrito(accountId: string, inscritoId: string): Promise<boolean> {
  const conn = await db();
  const r = await conn
    .delete(submissions)
    .where(and(eq(submissions.id, inscritoId), inArray(submissions.profileId, perfisDaConta(conn, accountId))))
    .returning({ id: submissions.id });
  return r.length > 0;
}

/** Célula de CSV segura: aspas escapadas e fórmula neutralizada (=, +, -, @ no começo viram texto). */
export function celulaCsv(valor: string | null | undefined): string {
  let v = valor ?? "";
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return `"${v.replace(/"/g, '""')}"`;
}
