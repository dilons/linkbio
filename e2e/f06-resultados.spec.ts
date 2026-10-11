// F06 Criador acompanha os resultados: S09 com período, totais, série, ranking, origens e locais.
import { capturar, contaPronta, DEMO, entrarNoPainel, expect, semRolagemLateral, semViolacoes, test } from "./apoio";

test.describe("F06 acompanha os resultados", () => {
  test("F06-H1 a demo vê os totais, a série por dia e o ranking dos links", async ({ page }) => {
    await entrarNoPainel(page, DEMO);
    await page.getByRole("link", { name: "Insights" }).click();
    await page.getByRole("heading", { name: "Links mais clicados" }).waitFor();
    await expect(page.getByRole("link", { name: "28 dias" })).toHaveAttribute("aria-current", "page");
    const texto = await page.getByRole("main").innerText();
    const n = (rotulo: string) => Number(texto.match(new RegExp(`${rotulo}\\n([\\d.]+)`))?.[1]?.replace(".", ""));
    expect(n("Visitas")).toBeGreaterThanOrEqual(203);
    expect(n("Cliques")).toBeGreaterThanOrEqual(103);
    expect(n("Cliques únicos")).toBeGreaterThan(0);
    expect(n("Cliques únicos")).toBeLessThanOrEqual(n("Cliques"));
    await expect(page.getByRole("figure", { name: "Visitas por dia" })).toBeVisible();
    const links = page.getByRole("table", { name: /Cliques por link/ });
    await expect(links.getByRole("row").nth(1)).toContainText("Faça sua encomenda");
    await semViolacoes(page, "S09");
    await capturar(page, "S09-demo");
  });

  test("F06-E1 sem dados ainda: zeros, taxa sem número, e convite quando não há links", async ({ page }) => {
    const c = await contaPronta("zero");
    await entrarNoPainel(page, c);
    await page.goto("/admin/insights");
    await expect(page.getByText("Ainda não há links. Ponha o primeiro no editor e volte aqui.")).toBeVisible();
    await expect(page.getByText("Sem visitas neste período.").first()).toBeVisible();
    const texto = await page.getByRole("main").innerText();
    expect(texto).toMatch(/Visitas\n0\b/);
    expect(texto).toMatch(/Taxa de clique\n–/);
    await semViolacoes(page, "S09 vazio");
    await capturar(page, "S09");
  });

  test("F06-E2 outra conta só vê os próprios números", async ({ page }) => {
    const c = await contaPronta("outra", [["Só meu", "https://exemplo.com.br"]]);
    await entrarNoPainel(page, c);
    await page.goto("/admin/insights");
    await page.getByRole("heading", { name: "Insights" }).waitFor();
    await expect(page.getByText("Faça sua encomenda")).toHaveCount(0);
    await expect(page.getByRole("table", { name: /Cliques por link/ }).getByRole("row").nth(1)).toContainText("Só meu");
  });

  test("F06-E4 o período muda a janela e a série: 7 dias por dia, 90 por semana, 12 meses por mês; valor estranho vira 28", async ({ page }) => {
    await entrarNoPainel(page, DEMO);
    await page.goto("/admin/insights");
    await page.getByRole("link", { name: "7 dias" }).click();
    await expect(page.getByRole("link", { name: "7 dias" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText(/^De \d{2}\/\d{2} a \d{2}\/\d{2}, no horário da sua página/)).toBeVisible();
    await page.getByRole("figure", { name: "Visitas por dia" }).getByText("Ver em tabela").click();
    await expect(page.getByRole("table", { name: "Visitas por dia" }).getByRole("row")).toHaveCount(8);
    await page.getByRole("link", { name: "90 dias" }).click();
    await expect(page.getByRole("figure", { name: "Visitas por semana" })).toBeVisible();
    await page.getByRole("link", { name: "12 meses" }).click();
    await expect(page.getByRole("figure", { name: "Visitas por mês" })).toBeVisible();
    await semViolacoes(page, "S09 12 meses");
    await page.goto("/admin/insights?periodo=30");
    await expect(page.getByRole("link", { name: "28 dias" })).toHaveAttribute("aria-current", "page");
  });

  test("F06-E5 origens, aparelhos e país da demo; cidade vazia diz que não há dado", async ({ page }) => {
    await entrarNoPainel(page, DEMO);
    await page.goto("/admin/insights");
    const origem = page.getByRole("table", { name: "Origem" });
    await expect(origem.getByRole("row").nth(1)).toContainText("Instagram");
    for (const nome of ["WhatsApp", "TikTok", "Direto ou sem origem"]) await expect(origem.getByText(nome)).toBeVisible();
    await expect(page.getByRole("table", { name: "Aparelho" }).getByText("Celular")).toBeVisible();
    await expect(page.getByRole("table", { name: "País" }).getByText("Brasil")).toBeVisible();
    await expect(page.getByText("Sem dados de cidade neste período.")).toBeVisible();
  });

  test("F06-E6 a visita que veio pelo QR code aparece como origem \"QR code\"", async ({ page, browser }) => {
    const c = await contaPronta("origemqr", [["Loja", "https://exemplo.com.br/loja"]]);
    const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36" });
    const v = await ctx.newPage();
    const visita = v.waitForResponse((r) => r.url().endsWith("/api/e") && r.status() === 204);
    await v.goto(`/${c.username}?origem=qr`);
    await visita;
    await ctx.close();
    await entrarNoPainel(page, c);
    await page.goto("/admin/insights?periodo=7");
    await expect(page.getByRole("table", { name: "Origem" }).getByRole("row").nth(1)).toContainText("QR code");
  });

  test("F06-E7 a 390 px: nada vaza e a tabela da série abre pelo teclado", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await entrarNoPainel(page, DEMO);
    await page.goto("/admin/insights");
    await page.getByRole("heading", { name: "Links mais clicados" }).waitFor();
    await semRolagemLateral(page);
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press("Tab");
      if ((await page.evaluate(() => document.activeElement?.textContent ?? "")) === "Ver em tabela") break;
    }
    await page.keyboard.press("Enter");
    await expect(page.getByRole("table", { name: "Visitas por dia" })).toBeVisible();
    await semRolagemLateral(page);
    await capturar(page, "S09-demo");
  });
});
