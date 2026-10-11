// Cliente mínimo da API v3 do Asaas (https://docs.asaas.com). Só o que o
// app usa: cliente, assinatura, cobranças da assinatura e cancelamento.
// Sandbox por padrão; produção só com ASAAS_API_URL=https://api.asaas.com/v3
// e a chave de produção, na /replica-deploy.
import { MARCA } from "@/lib/marca";

export class ErroAsaas extends Error {
  constructor(
    readonly status: number,
    readonly corpo: string,
  ) {
    super(`Asaas respondeu ${status}`);
  }
}

const base = () => (process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3").replace(/\/$/, "");

async function chamar<T>(metodo: "GET" | "POST" | "DELETE", caminho: string, corpo?: unknown): Promise<T> {
  const chave = process.env.ASAAS_API_KEY;
  if (!chave) throw new Error("ASAAS_API_KEY não está definida. Veja o .env.example.");
  const r = await fetch(`${base()}${caminho}`, {
    method: metodo,
    headers: {
      access_token: chave,
      "content-type": "application/json",
      // contas criadas a partir de 06/11/2024 precisam mandar User-Agent
      "user-agent": MARCA.nome,
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!r.ok) throw new ErroAsaas(r.status, (await r.text()).slice(0, 500));
  return (await r.json()) as T;
}

export type FormaAsaas = "PIX" | "CREDIT_CARD" | "BOLETO";
export type CobrancaAsaas = { id: string; status: string; dueDate: string; invoiceUrl: string; value: number };

export const asaas = {
  criarCliente: (d: { name: string; cpfCnpj: string; email: string; externalReference: string }) =>
    chamar<{ id: string }>("POST", "/customers", { ...d, notificationDisabled: false }),

  criarAssinatura: (d: {
    customer: string;
    billingType: FormaAsaas;
    value: number;
    nextDueDate: string;
    cycle: "MONTHLY";
    description: string;
    externalReference: string;
  }) => chamar<{ id: string; status: string }>("POST", "/subscriptions", d),

  /** Só as cobranças já geradas; a primeira nasce junto com a assinatura. */
  cobrancasDaAssinatura: (id: string) =>
    chamar<{ data: CobrancaAsaas[] }>("GET", `/subscriptions/${encodeURIComponent(id)}/payments`),

  /** Remove a assinatura: as cobranças futuras deixam de ser geradas. */
  cancelarAssinatura: (id: string) => chamar<{ deleted: boolean; id: string }>("DELETE", `/subscriptions/${encodeURIComponent(id)}`),
};
