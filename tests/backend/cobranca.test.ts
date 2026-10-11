// Webhooks do Asaas: idempotentes, fora de ordem e em paralelo terminam no
// mesmo estado. O estado da assinatura só muda por eles.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { eq } from "drizzle-orm";
import { assinaturaDaConta, ehPro, processarEvento } from "@/lib/billing";
import { db, fecharBanco } from "@/lib/db";
import { billingEvents, subscriptions } from "@/lib/db/schema";
import { apagarUsuarioDeTeste, criarUsuario, sufixo } from "./ajuda";

let conta: string;
const assinatura = `sub_teste_${sufixo()}`;
const ev = (event: string, extra: object = {}) => ({ id: `evt_${sufixo()}`, event, ...extra });
const pagamento = (event: string, dueDate: string) => ev(event, { payment: { id: `pay_${sufixo()}`, subscription: assinatura, dueDate } });
const hoje = new Date().toISOString().slice(0, 10);
const daquiAUmMes = new Date(Date.now() + 31 * 86400_000).toISOString().slice(0, 10);

before(async () => {
  conta = (await criarUsuario("pro")).id;
  const conn = await db();
  await conn.insert(subscriptions).values({
    accountId: conta,
    providerCustomerId: "cus_teste",
    providerSubscriptionId: assinatura,
    plan: "pro",
    billingType: "pix",
    status: "pending",
    priceCents: 1900,
  });
});

after(async () => {
  await apagarUsuarioDeTeste(conta);
  await fecharBanco();
});

const estado = async () => (await assinaturaDaConta(conta))!;

test("pendente não é Pro", async () => {
  assert.equal(ehPro(await estado()), false);
});

test("pagamento confirmado ativa; o mesmo evento de novo não muda nada", async () => {
  const e = pagamento("PAYMENT_CONFIRMED", hoje);
  assert.equal((await processarEvento(e)).efeito, "ativou");
  const antes = await estado();
  assert.equal(antes.status, "active");
  assert.ok(ehPro(antes));
  assert.equal((await processarEvento(e)).efeito, "repetido");
  assert.deepEqual(await estado(), antes);
});

test("RECEIVED depois do CONFIRMED da mesma cobrança só renova, sem esticar o período", async () => {
  const antes = await estado();
  assert.equal((await processarEvento(pagamento("PAYMENT_RECEIVED", hoje))).efeito, "renovou");
  assert.equal((await estado()).fimDoPeriodo, antes.fimDoPeriodo);
});

test("o mesmo evento em paralelo é aplicado uma vez só", async () => {
  const e = pagamento("PAYMENT_RECEIVED", hoje);
  const efeitos = (await Promise.all([processarEvento(e), processarEvento(e), processarEvento(e)])).map((r) => r.efeito).sort();
  assert.deepEqual(efeitos, ["renovou", "repetido", "repetido"]);
});

test("vencida vira past_due e continua Pro; o pagamento seguinte reativa e estica o período", async () => {
  await processarEvento(pagamento("PAYMENT_OVERDUE", daquiAUmMes));
  assert.equal((await estado()).status, "past_due");
  assert.ok(ehPro(await estado()));
  const antes = (await estado()).fimDoPeriodo!;
  assert.equal((await processarEvento(pagamento("PAYMENT_CONFIRMED", daquiAUmMes))).efeito, "ativou");
  assert.ok(Date.parse((await estado()).fimDoPeriodo!) > Date.parse(antes));
});

test("evento atrasado de uma cobrança antiga não encurta o período", async () => {
  const antes = (await estado()).fimDoPeriodo;
  await processarEvento(pagamento("PAYMENT_RECEIVED", "2020-01-01"));
  assert.equal((await estado()).fimDoPeriodo, antes);
});

test("assinatura removida no Asaas cancela, mas o Pro vai até o fim do período pago", async () => {
  assert.equal((await processarEvento(ev("SUBSCRIPTION_DELETED", { subscription: { id: assinatura } }))).efeito, "cancelou");
  const s = await estado();
  assert.equal(s.status, "canceled");
  assert.equal(s.cancelaNoFim, true);
  assert.ok(ehPro(s));
  assert.equal(ehPro(s, Date.parse(s.fimDoPeriodo!) + 1000), false, "depois do fim, volta ao grátis");
});

test("estorno tira o Pro na hora", async () => {
  await processarEvento(pagamento("PAYMENT_REFUNDED", hoje));
  assert.equal(ehPro(await estado()), false);
});

test("evento de assinatura desconhecida é registrado e ignorado", async () => {
  const e = ev("PAYMENT_RECEIVED", { payment: { subscription: "sub_de_outro_sistema", dueDate: hoje } });
  assert.equal((await processarEvento(e)).efeito, "ignorado");
  const conn = await db();
  const [r] = await conn.select().from(billingEvents).where(eq(billingEvents.providerEventId, e.id));
  assert.ok(r.processedAt);
});
