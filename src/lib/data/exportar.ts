// LGPD art. 18 (acesso e portabilidade): todos os dados da conta num arquivo
// JSON que a pessoa baixa na tela Conta (S13). Só o que é desta conta, lido
// pelo dono; o pedido fica registrado em data_requests (prova do prazo).
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appearances,
  collections,
  dailyStats,
  dataRequests,
  forms,
  links,
  profiles,
  socialLinks,
  submissions,
  subscriptions,
} from "@/lib/db/schema";

export const VERSAO_DO_ARQUIVO = 1;

export async function dadosDaConta(accountId: string, email: string) {
  const conn = await db();
  const paginas = await conn.select().from(profiles).where(eq(profiles.accountId, accountId)).orderBy(asc(profiles.createdAt));
  const ids = paginas.map((p) => p.id);
  const dosPerfis = <T>(consulta: () => Promise<T[]>) => (ids.length ? consulta() : Promise.resolve([] as T[]));
  const [ls, redes, aparencias, colecoes, formularios, inscritos, estatisticas, assinatura, pedidos] = await Promise.all([
    dosPerfis(() => conn.select().from(links).where(inArray(links.profileId, ids)).orderBy(asc(links.position))),
    dosPerfis(() => conn.select().from(socialLinks).where(inArray(socialLinks.profileId, ids)).orderBy(asc(socialLinks.position))),
    dosPerfis(() => conn.select().from(appearances).where(inArray(appearances.profileId, ids))),
    dosPerfis(() => conn.select().from(collections).where(inArray(collections.profileId, ids))),
    dosPerfis(() =>
      conn
        .select({ link_id: forms.linkId, campos: forms.fields, mensagem_de_sucesso: forms.successMessage, texto_do_consentimento: forms.consentText })
        .from(forms)
        .innerJoin(links, eq(links.id, forms.linkId))
        .where(inArray(links.profileId, ids)),
    ),
    dosPerfis(() =>
      conn
        .select({ perfil: submissions.profileId, formulario: submissions.linkId, email: submissions.email, nome: submissions.name, consentimento: submissions.consentText, em: submissions.createdAt })
        .from(submissions)
        .where(inArray(submissions.profileId, ids))
        .orderBy(asc(submissions.createdAt)),
    ),
    dosPerfis(() => conn.select().from(dailyStats).where(inArray(dailyStats.profileId, ids)).orderBy(asc(dailyStats.day))),
    conn
      .select({
        plano: subscriptions.plan,
        forma: subscriptions.billingType,
        situacao: subscriptions.status,
        valor_em_centavos: subscriptions.priceCents,
        moeda: subscriptions.currency,
        periodo_ate: subscriptions.currentPeriodEnd,
        cancela_no_fim: subscriptions.cancelAtPeriodEnd,
        criada_em: subscriptions.createdAt,
      })
      .from(subscriptions)
      .where(eq(subscriptions.accountId, accountId)),
    conn
      .select({ tipo: dataRequests.kind, pedido_em: dataRequests.requestedAt, atendido_em: dataRequests.completedAt })
      .from(dataRequests)
      .where(eq(dataRequests.accountId, accountId))
      .orderBy(asc(dataRequests.requestedAt)),
  ]);
  return {
    sobre:
      "Seus dados no Chamaqui, como estavam na hora em que você baixou. Os inscritos dos formulários são das pessoas da sua lista: você é quem decide sobre eles. A senha não vem (guardamos só um código que não volta à senha). O CPF ou CNPJ da cobrança fica com o Asaas, não com a gente.",
    versao: VERSAO_DO_ARQUIVO,
    gerado_em: new Date().toISOString(),
    conta: { email },
    paginas: paginas.map((p) => ({
      endereco: p.username,
      titulo: p.title,
      bio: p.bio,
      foto: p.avatarPath,
      fuso: p.timezone,
      aviso_de_conteudo: p.sensitiveLabel,
      redes_no: p.socialPosition,
      endereco_trocado_em: p.usernameChangedAt,
      excluida_em: p.deletedAt,
      criada_em: p.createdAt,
    })),
    links: ls.map((l) => ({
      titulo: l.title,
      endereco: l.url,
      tipo: l.kind,
      ligado: l.enabled,
      aparece_em: l.startsAt,
      some_em: l.endsAt,
      fuso_do_agendamento: l.scheduleTz,
      aviso: l.lock === "age" ? `${l.lockMinAge}+` : l.lock,
      criado_em: l.createdAt,
    })),
    redes: redes.map((r) => ({ rede: r.platform, endereco: r.url })),
    aparencia: aparencias.map((a) => ({ tema: a.theme, personalizado: a.custom })),
    colecoes: colecoes.map((c) => ({ titulo: c.title })),
    formularios,
    inscritos,
    estatisticas_por_dia: estatisticas.map((e) => ({
      dia: e.day,
      link: e.linkId,
      visitas: e.views,
      visitantes_no_dia: e.uniqueViews,
      cliques: e.clicks,
      cliques_unicos_no_dia: e.uniqueClicks,
      inscricoes: e.signups,
    })),
    assinatura: assinatura[0] ?? null,
    pedidos_de_dados: pedidos,
  };
}

/** Registra o pedido de cópia (já atendido: o arquivo sai na hora). */
export async function registrarExportacao(accountId: string, email: string): Promise<void> {
  const conn = await db();
  const agora = new Date().toISOString();
  await conn.insert(dataRequests).values({ accountId, requesterEmail: email, kind: "export", requestedAt: agora, completedAt: agora, notes: "pelo app, tela Conta" });
}
