// F09 Criador assina um plano: S14 -> pagamento no Asaas -> Pro liberado; cancelar em um clique.
import type { APIRequestContext, Page } from "@playwright/test";
import { ASAAS, capturar, contaPronta, emailPara, entrarNoPainel, expect, semViolacoes, sql, sufixo, test } from "./apoio";

const TOKEN = process.env.ASAAS_WEBHOOK_TOKEN ?? "token-local-do-webhook";
const hoje = () => new Date().toISOString().slice(0, 10);

type Pedido = { metodo: string; caminho: string; corpo?: { externalReference?: string; customer?: string } };
const pedidos = async (): Promise<Pedido[]> => (await fetch(`${ASAAS}/__pedidos`)).json();
const assinaturasCriadas = async (conta: string) =>
  (await pedidos()).filter((p) => p.metodo === "POST" && p.caminho === "/v3/subscriptions" && p.corpo?.externalReference === conta);

function webhook(request: APIRequestContext, corpo: unknown, token: string | null = TOKEN) {
  return request.post("/api/webhooks/asaas", { data: corpo, headers: token ? { "asaas-access-token": token } : {} });
}

async function assinar(page: Page, forma = "Pix", documento = "529.982.247-25", nome = "Beatriz Teste") {
  await page.goto("/admin/plano");
  await page.getByLabel(forma).check();
  if (await page.getByLabel("CPF ou CNPJ").count()) {
    await page.getByLabel("Nome de quem paga").fill(nome);
    await page.getByLabel("CPF ou CNPJ").fill(documento);
  }
  await page.getByRole("button", { name: "Assinar e ir para o pagamento" }).click();
}

const assinaturaDe = async (conta: string) => (await sql`select * from subscriptions where account_id = ${conta}`)[0];

test.describe("F09 assina o plano", () => {
  test("F09-H1 assina por Pix, paga, perde a marca e cancela em um clique", async ({ page, request }) => {
    const c = await contaPronta("pro", [["Loja", "https://exemplo.com.br"]]);
    await entrarNoPainel(page, c);
    await page.goto("/admin/plano");
    await semViolacoes(page, "S14");
    await capturar(page, "S14");
    await assinar(page);
    await page.waitForURL(/127\.0\.0\.1:4010\/i\/sub_/);
    const sub = new URL(page.url()).pathname.split("/").pop()!;
    const pedido = (await assinaturasCriadas(c.id))[0] as Pedido & { corpo: Record<string, unknown> };
    expect(pedido.corpo).toMatchObject({ billingType: "PIX", cycle: "MONTHLY", value: 19, nextDueDate: expect.any(String) });

    await page.goto("/admin/plano");
    await expect(page.getByText("Aguardando pagamento")).toBeVisible();
    await page.goto(`/${c.username}`);
    await expect(page.getByText("Faça a sua no")).toBeVisible();

    const r = await webhook(request, { id: `evt_${sufixo()}`, event: "PAYMENT_CONFIRMED", payment: { subscription: sub, dueDate: hoje() } });
    expect(await r.json()).toMatchObject({ efeito: "ativou" });
    await emailPara(c.email, "Pro está ativo");
    await page.goto(`/${c.username}`);
    await expect(page.getByText("Faça a sua no")).toHaveCount(0);

    await page.goto("/admin/plano");
    await expect(page.getByText("Ativo", { exact: true })).toBeVisible();
    await capturar(page, "S14-pro");
    await page.getByRole("button", { name: "Cancelar assinatura" }).click();
    await expect(page.getByText(/O Pro continua até/)).toBeVisible();
    expect((await pedidos()).some((p) => p.metodo === "DELETE" && p.caminho === `/v3/subscriptions/${sub}`)).toBe(true);
    await page.goto(`/${c.username}`);
    await expect(page.getByText("Faça a sua no")).toHaveCount(0);
  });

  test("F09-E1 CPF inválido é recusado antes de falar com o Asaas", async ({ page }) => {
    const c = await contaPronta("cpf");
    await entrarNoPainel(page, c);
    await assinar(page, "Pix", "111.111.111-11");
    await expect(page.getByText("Confira o CPF ou CNPJ.")).toBeVisible();
    expect(await assinaturasCriadas(c.id)).toHaveLength(0);
  });

  test("F09-E2 dois cliques seguidos em Assinar criam uma assinatura só no Asaas", async ({ page }) => {
    const c = await contaPronta("duplo");
    await entrarNoPainel(page, c);
    await page.goto("/admin/plano");
    await page.getByLabel("Pix").check();
    await page.getByLabel("Nome de quem paga").fill("Duplo Clique");
    await page.getByLabel("CPF ou CNPJ").fill("529.982.247-25");
    await page.getByRole("button", { name: "Assinar e ir para o pagamento" }).dblclick();
    await page.waitForURL(/127\.0\.0\.1:4010\/i\/sub_/);
    await page.waitForTimeout(1500);
    expect(await assinaturasCriadas(c.id)).toHaveLength(1);
  });

  test("F09-E8 duas abas assinando ao mesmo tempo criam uma assinatura só no Asaas", async ({ page, context }) => {
    const c = await contaPronta("abas");
    await entrarNoPainel(page, c);
    const outra = await context.newPage();
    for (const p of [page, outra]) {
      await p.goto("/admin/plano");
      await p.getByLabel("Pix").check();
      await p.getByLabel("Nome de quem paga").fill("Duas Abas");
      await p.getByLabel("CPF ou CNPJ").fill("529.982.247-25");
    }
    await Promise.all([
      page.getByRole("button", { name: "Assinar e ir para o pagamento" }).click(),
      outra.getByRole("button", { name: "Assinar e ir para o pagamento" }).click(),
    ]);
    await page.waitForURL(/127\.0\.0\.1:4010\/i\/sub_/);
    await outra.waitForURL(/127\.0\.0\.1:4010\/i\/sub_/);
    expect(await assinaturasCriadas(c.id)).toHaveLength(1);
    expect(page.url()).toBe(outra.url());
  });

  test("F09-E3 assinatura pendente: assinar de novo com a mesma forma volta para a mesma cobrança", async ({ page }) => {
    const c = await contaPronta("pend");
    await entrarNoPainel(page, c);
    await assinar(page);
    await page.waitForURL(/127\.0\.0\.1:4010\/i\/sub_/);
    const primeira = page.url();
    await assinar(page);
    await page.waitForURL(/127\.0\.0\.1:4010\/i\/sub_/);
    expect(page.url()).toBe(primeira);
    expect(await assinaturasCriadas(c.id)).toHaveLength(1);
  });

  test("F09-E4 trocar a forma enquanto pendente cancela a cobrança anterior no Asaas", async ({ page }) => {
    const c = await contaPronta("troca");
    await entrarNoPainel(page, c);
    await assinar(page, "Pix");
    await page.waitForURL(/127\.0\.0\.1:4010\/i\/sub_/);
    const primeira = new URL(page.url()).pathname.split("/").pop();
    await assinar(page, "Boleto");
    await page.waitForURL(/127\.0\.0\.1:4010\/i\/sub_/);
    expect(new URL(page.url()).pathname.split("/").pop()).not.toBe(primeira);
    expect((await pedidos()).some((p) => p.metodo === "DELETE" && p.caminho === `/v3/subscriptions/${primeira}`)).toBe(true);
    expect((await assinaturaDe(c.id)).billing_type).toBe("boleto");
  });

  test("F09-E5 estorno devolve a página ao grátis (marca volta), sem apagar nada", async ({ page, request }) => {
    const c = await contaPronta("estorno", [["Loja", "https://exemplo.com.br"]]);
    await entrarNoPainel(page, c);
    await assinar(page);
    await page.waitForURL(/127\.0\.0\.1:4010\/i\/sub_/);
    const sub = new URL(page.url()).pathname.split("/").pop()!;
    await webhook(request, { id: `evt_${sufixo()}`, event: "PAYMENT_RECEIVED", payment: { subscription: sub, dueDate: hoje() } });
    await page.goto(`/${c.username}`);
    await expect(page.getByText("Faça a sua no")).toHaveCount(0);
    await webhook(request, { id: `evt_${sufixo()}`, event: "PAYMENT_REFUNDED", payment: { subscription: sub, dueDate: hoje() } });
    await page.goto(`/${c.username}`);
    await expect(page.getByText("Faça a sua no")).toBeVisible();
    await expect(page.getByRole("link", { name: "Loja" })).toBeVisible();
  });

  test("F09-E6 Asaas fora do ar: mensagem clara e nada gravado", async ({ page }) => {
    const c = await contaPronta("fora");
    await entrarNoPainel(page, c);
    await assinar(page, "Pix", "529.982.247-25", "falha-simulada");
    await expect(page.getByText("Não deu para falar com o sistema de pagamento agora")).toBeVisible();
    expect(await assinaturaDe(c.id)).toBeUndefined();
  });

  test("F09-E7 webhook: sem token ou token errado 401, corpo inválido 400, repetido e em paralelo aplicado uma vez", async ({ page, request }) => {
    const c = await contaPronta("hook");
    await entrarNoPainel(page, c);
    await assinar(page);
    await page.waitForURL(/127\.0\.0\.1:4010\/i\/sub_/);
    const sub = new URL(page.url()).pathname.split("/").pop()!;
    const ev = { id: `evt_${sufixo()}`, event: "PAYMENT_CONFIRMED", payment: { subscription: sub, dueDate: hoje() } };
    expect((await webhook(request, ev, null)).status()).toBe(401);
    expect((await webhook(request, ev, "errado")).status()).toBe(401);
    expect((await webhook(request, { nada: 1 })).status()).toBe(400);
    const efeitos = await Promise.all([1, 2, 3].map(async () => (await (await webhook(request, ev)).json()).efeito));
    expect(efeitos.sort()).toEqual(["ativou", "repetido", "repetido"]);
    expect((await assinaturaDe(c.id)).status).toBe("active");
  });
});
