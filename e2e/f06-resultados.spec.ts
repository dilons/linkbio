// F06 Criador acompanha os resultados: S09 com totais e ranking.
import { capturar, contaPronta, DEMO, entrarNoPainel, expect, semViolacoes, test } from "./apoio";

test.describe("F06 acompanha os resultados", () => {
  test("F06-H1 a demo vê os totais da semana e o ranking dos links", async ({ page }) => {
    await entrarNoPainel(page, DEMO);
    await page.getByRole("link", { name: "Insights" }).click();
    await page.getByRole("heading", { name: "Links mais clicados" }).waitFor();
    const texto = await page.getByRole("main").innerText();
    const n = (rotulo: string) => Number(texto.match(new RegExp(`${rotulo}\\n([\\d.]+)`))?.[1]?.replace(".", ""));
    expect(n("Visitas")).toBeGreaterThanOrEqual(203);
    expect(n("Cliques")).toBeGreaterThanOrEqual(103);
    const linhas = page.getByRole("row");
    await expect(linhas.nth(1)).toContainText("Faça sua encomenda");
    await semViolacoes(page, "S09");
    await capturar(page, "S09-demo");
  });

  test("F06-E1 sem dados ainda: zeros, taxa sem número, e convite quando não há links", async ({ page }) => {
    const c = await contaPronta("zero");
    await entrarNoPainel(page, c);
    await page.goto("/admin/insights");
    await expect(page.getByText("Ainda não há cliques. Ponha o endereço da sua página na bio e volte aqui.")).toBeVisible();
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
  });
});
