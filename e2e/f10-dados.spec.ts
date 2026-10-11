// LGPD na S13: baixar meus dados (acesso e portabilidade) e com quem compartilhamos.
import { readFileSync } from "node:fs";
import { capturar, contaPronta, entrarNoPainel, expect, semRolagemLateral, semViolacoes, sql, test } from "./apoio";

test.describe("S13 privacidade e dados", () => {
  test("S13-L1 baixar meus dados: JSON com a página e os links, e o pedido registrado", async ({ page }) => {
    const c = await contaPronta("meusdados", [["Encomendas", "https://exemplo.com.br/encomendas"]]);
    await entrarNoPainel(page, c);
    await page.goto("/admin/conta");
    await expect(page.getByRole("heading", { name: "Privacidade e dados" })).toBeVisible();
    await expect(page.getByRole("table", { name: "Fornecedores que tratam dados em nome do app" }).getByText("Asaas")).toBeVisible();
    await semViolacoes(page, "S13 privacidade");
    await capturar(page, "S13");
    const baixar = page.waitForEvent("download");
    await page.getByRole("link", { name: "Baixar meus dados" }).click();
    const arquivo = await baixar;
    expect(arquivo.suggestedFilename()).toMatch(/^meus-dados-\d{4}-\d{2}-\d{2}\.json$/);
    const dados = JSON.parse(readFileSync(await arquivo.path(), "utf8"));
    expect(dados.conta.email).toBe(c.email);
    expect(dados.paginas[0].endereco).toBe(c.username);
    expect(dados.links.map((l: { titulo: string }) => l.titulo)).toEqual(["Encomendas"]);
    expect(await sql`select kind from data_requests where account_id = ${c.id}`).toEqual([{ kind: "export" }]);
  });

  test("S13-L2 sem sessão não há cópia de nada", async ({ request }) => {
    const r = await request.get("/api/me/export");
    expect(r.status()).toBe(401);
  });

  test("S13-L3 a 390 px a tabela de fornecedores não estica a página", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const c = await contaPronta("dados390");
    await entrarNoPainel(page, c);
    await page.goto("/admin/conta");
    await page.getByRole("heading", { name: "Privacidade e dados" }).waitFor();
    await semRolagemLateral(page);
    await capturar(page, "S13");
  });
});
