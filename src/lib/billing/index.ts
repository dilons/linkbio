// Assinatura do plano Pro pelo Asaas (Pix, cartão ou boleto). O estado da
// assinatura mora no nosso banco, atualizado pelos webhooks; a tela lê daqui e
// nunca confia no navegador. Pagamento acontece na página do próprio Asaas:
// o app não vê nem guarda dados de cartão. O CPF ou CNPJ vai direto para o
// Asaas (exigência da cobrança) e não fica no nosso banco.
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { billingEvents, subscriptions } from "@/lib/db/schema";
import { asaas, ErroAsaas, type FormaAsaas } from "./asaas";
import { MARCA } from "@/lib/marca";

export type Forma = "pix" | "card" | "boleto";
const FORMAS: Record<Forma, FormaAsaas> = { pix: "PIX", card: "CREDIT_CARD", boleto: "BOLETO" };

/** Preço provisório (a /replica-entrepreneur decide o definitivo). */
export const precoProCentavos = () => Number(process.env.PRECO_PRO_CENTAVOS ?? 1900);

export type Assinatura = {
  status: "pending" | "active" | "past_due" | "canceled";
  forma: Forma;
  precoCentavos: number;
  fimDoPeriodo: string | null;
  cancelaNoFim: boolean;
  temCliente: boolean;
};

export async function assinaturaDaConta(accountId: string): Promise<Assinatura | null> {
  const conn = await db();
  const [s] = await conn.select().from(subscriptions).where(eq(subscriptions.accountId, accountId)).limit(1);
  if (!s) return null;
  return {
    status: s.status as Assinatura["status"],
    forma: s.billingType as Forma,
    precoCentavos: s.priceCents,
    fimDoPeriodo: s.currentPeriodEnd,
    cancelaNoFim: s.cancelAtPeriodEnd,
    temCliente: Boolean(s.providerCustomerId),
  };
}

/**
 * Pro enquanto paga, enquanto vence (até o job rebaixar) e até o fim do período
 * já pago, mesmo depois de cancelar ou durante uma assinatura nova pendente.
 */
export function ehPro(a: Pick<Assinatura, "status" | "fimDoPeriodo"> | null, agora = Date.now()): boolean {
  if (!a) return false;
  if (a.status === "active" || a.status === "past_due") return true;
  return a.fimDoPeriodo !== null && Date.parse(a.fimDoPeriodo) > agora;
}

export async function planoDaConta(accountId: string): Promise<"pro" | "gratis"> {
  return ehPro(await assinaturaDaConta(accountId)) ? "pro" : "gratis";
}

/** Data de hoje em São Paulo, no formato que o Asaas espera (AAAA-MM-DD). */
function hojeEmSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

async function linkDaCobrancaEmAberto(assinaturaId: string): Promise<string | null> {
  const { data } = await asaas.cobrancasDaAssinatura(assinaturaId);
  const aberta = data.find((c) => c.status === "PENDING" || c.status === "OVERDUE") ?? data[0];
  return aberta?.invoiceUrl ?? null;
}

export type ResultadoCheckout = { ok: true; url: string } | { ok: false; erro: string };

type Transacao = Parameters<Parameters<Awaited<ReturnType<typeof db>>["transaction"]>[0]>[0];

/**
 * Uma operação de cobrança por conta de cada vez (trava do Postgres que dura a
 * transação). Sem isto, duas abas assinando juntas criavam dois clientes e
 * duas assinaturas no Asaas, e uma delas ficava cobrando sem o app saber
 * (BUG-001). A segunda aba espera a primeira e reaproveita a mesma cobrança.
 */
async function comTravaDaConta<T>(accountId: string, fn: (tx: Transacao) => Promise<T>): Promise<T> {
  const conn = await db();
  return conn.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`cobranca:${accountId}`}))`);
    return fn(tx);
  });
}

/**
 * Cria (ou reaproveita) o cliente e a assinatura no Asaas e devolve o link da
 * primeira cobrança, na página de pagamento do Asaas.
 */
export async function iniciarAssinatura(
  accountId: string,
  email: string,
  dados: { forma: Forma; nome?: string; documento?: string },
): Promise<ResultadoCheckout> {
  return comTravaDaConta(accountId, (tx) => iniciarAssinaturaTravada(tx, accountId, email, dados));
}

async function iniciarAssinaturaTravada(
  conn: Transacao,
  accountId: string,
  email: string,
  dados: { forma: Forma; nome?: string; documento?: string },
): Promise<ResultadoCheckout> {
  const [atual] = await conn.select().from(subscriptions).where(eq(subscriptions.accountId, accountId)).limit(1);
  const estado = atual
    ? { status: atual.status as Assinatura["status"], fimDoPeriodo: atual.currentPeriodEnd }
    : null;
  if (estado && (estado.status === "active" || estado.status === "past_due")) {
    return { ok: false, erro: "Sua conta já está no Pro." };
  }
  try {
    // mesma forma de pagamento e ainda pendente: manda de volta para a mesma cobrança
    if (atual?.status === "pending" && atual.providerSubscriptionId && atual.billingType === dados.forma) {
      const url = await linkDaCobrancaEmAberto(atual.providerSubscriptionId);
      if (url) return { ok: true, url };
    }
    if (atual?.status === "pending" && atual.providerSubscriptionId) {
      await asaas.cancelarAssinatura(atual.providerSubscriptionId).catch(() => undefined);
    }
    let cliente = atual?.providerCustomerId;
    if (!cliente) {
      if (!dados.nome || !dados.documento) return { ok: false, erro: "Informe o nome e o CPF ou CNPJ de quem paga." };
      cliente = (await asaas.criarCliente({ name: dados.nome, cpfCnpj: dados.documento, email, externalReference: accountId })).id;
    }
    const preco = precoProCentavos();
    const nova = await asaas.criarAssinatura({
      customer: cliente,
      billingType: FORMAS[dados.forma],
      value: preco / 100,
      nextDueDate: hojeEmSaoPaulo(),
      cycle: "MONTHLY",
      description: `${MARCA.plano} (mensal)`,
      externalReference: accountId,
    });
    const valores = {
      providerCustomerId: cliente,
      providerSubscriptionId: nova.id,
      plan: "pro",
      billingType: dados.forma,
      status: "pending",
      priceCents: preco,
      cancelAtPeriodEnd: false,
      updatedAt: new Date().toISOString(),
    };
    await conn
      .insert(subscriptions)
      .values({ accountId, ...valores })
      .onConflictDoUpdate({ target: subscriptions.accountId, set: valores });
    const url = await linkDaCobrancaEmAberto(nova.id);
    return url ? { ok: true, url } : { ok: false, erro: "A assinatura foi criada, mas o link de pagamento ainda não saiu. Tente de novo em instantes." };
  } catch (e) {
    if (e instanceof ErroAsaas && e.status === 400) return { ok: false, erro: "O Asaas recusou os dados. Confira o nome e o CPF ou CNPJ." };
    console.error("asaas: falha ao iniciar assinatura", e instanceof ErroAsaas ? e.status : e);
    return { ok: false, erro: "Não deu para falar com o sistema de pagamento agora. Tente de novo em instantes." };
  }
}

/**
 * Cancela em um clique: o Asaas para de gerar cobranças e o Pro continua até o
 * fim do período já pago. Chamar duas vezes não faz mal.
 */
export async function cancelarAssinatura(accountId: string): Promise<boolean> {
  return comTravaDaConta(accountId, (tx) => cancelarAssinaturaTravada(tx, accountId));
}

async function cancelarAssinaturaTravada(conn: Transacao, accountId: string): Promise<boolean> {
  const [s] = await conn.select().from(subscriptions).where(eq(subscriptions.accountId, accountId)).limit(1);
  if (!s || s.status === "canceled") return true;
  if (s.providerSubscriptionId) {
    try {
      await asaas.cancelarAssinatura(s.providerSubscriptionId);
    } catch (e) {
      // já removida no Asaas: segue o cancelamento aqui
      if (!(e instanceof ErroAsaas && e.status === 404)) {
        console.error("asaas: falha ao cancelar", e instanceof ErroAsaas ? e.status : e);
        return false;
      }
    }
  }
  await conn
    .update(subscriptions)
    .set({ status: "canceled", cancelAtPeriodEnd: true, updatedAt: new Date().toISOString() })
    .where(eq(subscriptions.accountId, accountId));
  return true;
}

// ------------------------------------------------------------------ webhooks

export type EventoAsaas = {
  id: string;
  event: string;
  payment?: { id?: string; subscription?: string | null; dueDate?: string; status?: string };
  subscription?: { id?: string; status?: string };
};

export type Efeito = "repetido" | "ignorado" | "ativou" | "renovou" | "venceu" | "cancelou" | "estornou";

/**
 * Aplica um evento do Asaas. Idempotente: o id do evento é chave em
 * billing_events, e cada efeito grava um estado (não soma nada), então o mesmo
 * evento duas vezes, ou fora de ordem, termina no mesmo lugar.
 */
export async function processarEvento(
  evento: EventoAsaas,
): Promise<{ efeito: Efeito; accountId: string | null; fimDoPeriodo?: string | null }> {
  const conn = await db();
  return conn.transaction(async (tx) => {
    await tx
      .insert(billingEvents)
      .values({ providerEventId: evento.id, type: evento.event, payload: evento })
      .onConflictDoNothing();
    // trava a linha: dois envios simultâneos do mesmo evento não passam juntos
    const [registro] = await tx.execute<{ processed_at: string | null }>(
      sql`select processed_at from ${billingEvents} where ${billingEvents.providerEventId} = ${evento.id} for update`,
    );
    if (registro?.processed_at) return { efeito: "repetido" as const, accountId: null };

    const assinaturaId = evento.payment?.subscription ?? evento.subscription?.id ?? null;
    const [s] = assinaturaId
      ? await tx.select().from(subscriptions).where(eq(subscriptions.providerSubscriptionId, assinaturaId)).limit(1)
      : [];

    let efeito: Efeito = "ignorado";
    let fimDoPeriodo: string | null = null;
    if (s) {
      const agora = new Date().toISOString();
      const daAssinatura = eq(subscriptions.id, s.id);
      switch (evento.event) {
        case "PAYMENT_CONFIRMED":
        case "PAYMENT_RECEIVED": {
          // paga até um mês depois do vencimento desta cobrança, com 3 dias de folga
          // para o Pix da próxima; nunca encurta um período já maior
          const vence = evento.payment?.dueDate ?? agora.slice(0, 10);
          const fim = sql`(${vence}::date + interval '1 month 3 days')::timestamptz`;
          const [depois] = await tx
            .update(subscriptions)
            .set({
              status: sql`case when ${subscriptions.cancelAtPeriodEnd} then 'canceled' else 'active' end`,
              currentPeriodEnd: sql`greatest(coalesce(${subscriptions.currentPeriodEnd}, ${fim}), ${fim})`,
              updatedAt: agora,
            })
            .where(daAssinatura)
            .returning({ fim: subscriptions.currentPeriodEnd });
          fimDoPeriodo = depois?.fim ?? null;
          // a primeira confirmação (ou a volta depois de vencer) avisa; as renovações não
          efeito = s.status === "active" ? "renovou" : "ativou";
          break;
        }
        case "PAYMENT_OVERDUE":
          await tx.update(subscriptions).set({ status: "past_due", updatedAt: agora }).where(and(daAssinatura, eq(subscriptions.status, "active")));
          efeito = "venceu";
          break;
        case "PAYMENT_REFUNDED":
        case "PAYMENT_CHARGEBACK_REQUESTED":
          await tx.update(subscriptions).set({ status: "canceled", currentPeriodEnd: agora, updatedAt: agora }).where(daAssinatura);
          efeito = "estornou";
          break;
        case "SUBSCRIPTION_DELETED":
        case "SUBSCRIPTION_INACTIVATED":
          await tx.update(subscriptions).set({ status: "canceled", cancelAtPeriodEnd: true, updatedAt: agora }).where(daAssinatura);
          efeito = "cancelou";
          break;
      }
    }
    await tx.update(billingEvents).set({ processedAt: new Date().toISOString() }).where(eq(billingEvents.providerEventId, evento.id));
    return { efeito, accountId: s?.accountId ?? null, fimDoPeriodo };
  });
}
