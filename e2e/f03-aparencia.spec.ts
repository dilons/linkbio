// F03 Criador personaliza a aparência: S08 escolher tema -> ver na prévia -> página pública.
import { capturar, contaPronta, entrarNoPainel, expect, semRolagemLateral, semViolacoes, sql, test } from "./apoio";

const temaNoBanco = async (perfil: string) => (await sql`select theme from appearances where profile_id = ${perfil}`)[0]?.theme;

test.describe("F03 personaliza a aparência", () => {
  test("F03-H1 escolher um tema muda a prévia na hora, salva e vale na página pública", async ({ page }) => {
    const c = await contaPronta("tema", [["Loja", "https://exemplo.com.br"]]);
    await entrarNoPainel(page, c);
    await page.getByRole("link", { name: "Aparência" }).click();
    const noite = page.getByRole("button", { name: /Noite/ });
    await expect(page.getByRole("button", { name: /Papel/ })).toHaveAttribute("aria-pressed", "true");
    await semViolacoes(page, "S08");
    await noite.click();
    await expect(noite).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("figure").locator("[data-theme]").first()).toHaveAttribute("data-theme", "noite");
    await expect(page.getByText("Tema salvo")).toBeVisible();
    expect(await temaNoBanco(c.perfil)).toBe("noite");
    await capturar(page, "S08");
    await page.reload();
    await expect(page.getByRole("button", { name: /Noite/ })).toHaveAttribute("aria-pressed", "true");
    await page.goto(`/${c.username}`);
    await expect(page.locator("[data-theme]").first()).toHaveAttribute("data-theme", "noite");
    await semViolacoes(page, "S15 noite");
  });

  test("F03-E1 cada tema pronto passa no axe na página pública (contraste)", async ({ page }) => {
    const c = await contaPronta("contr", [["Loja", "https://exemplo.com.br"]]);
    for (const tema of ["papel", "noite", "areia", "oceano", "contraste"]) {
      await sql`update appearances set theme = ${tema} where profile_id = ${c.perfil}`;
      await page.goto(`/${c.username}`);
      await expect(page.locator("[data-theme]").first()).toHaveAttribute("data-theme", tema);
      await semViolacoes(page, `S15 ${tema}`);
    }
  });

  test("F03-E2 só teclado e a 390 px: chega no tema e escolhe com Enter", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const c = await contaPronta("tecla");
    await entrarNoPainel(page, c);
    await page.goto("/admin/aparencia");
    await page.getByRole("button", { name: /Areia/ }).waitFor();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      if ((await page.evaluate(() => document.activeElement?.textContent ?? "")).startsWith("Areia")) break;
    }
    await page.keyboard.press("Enter");
    await expect(page.getByText("Tema salvo")).toBeVisible();
    expect(await temaNoBanco(c.perfil)).toBe("areia");
    await semRolagemLateral(page);
    await capturar(page, "S08");
  });

  test.describe(() => {
    test.use({ consoleEsperado: [/ERR_INTERNET_DISCONNECTED/] });
    test("F03-E3 sem rede: o tema volta ao salvo e avisa", async ({ page, context }) => {
      const c = await contaPronta("offtema");
      await entrarNoPainel(page, c);
      await page.goto("/admin/aparencia");
      await page.getByRole("button", { name: /Oceano/ }).waitFor();
      await page.waitForLoadState("networkidle"); // pré-carregamentos do menu terminam antes de cair a rede
      await context.setOffline(true);
      await page.getByRole("button", { name: /Oceano/ }).click();
      await expect(page.getByText("Sem internet agora")).toBeVisible();
      await expect(page.getByRole("button", { name: /Papel/ })).toHaveAttribute("aria-pressed", "true");
      await context.setOffline(false);
      expect(await temaNoBanco(c.perfil)).toBe("padrao");
    });
  });
});
