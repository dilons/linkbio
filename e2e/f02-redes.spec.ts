// F02 (continuação) Criador põe os ícones das redes e confere a página no celular:
// S06 redes sociais -> prévia (ao lado no computador, em tela cheia no celular) -> S15.
import { capturar, contaPronta, entrarNoPainel, expect, semRolagemLateral, semViolacoes, sql, test } from "./apoio";

const redesNoBanco = async (perfil: string) =>
  (await sql`select platform, url from social_links where profile_id = ${perfil} order by position`).map((r) => `${r.platform} ${r.url}`);

test.describe("F02 redes sociais e prévia", () => {
  test("F02-H3 pôr pelo @ e pelo número, reordenar, mudar de lugar e tirar, com a prévia e a página acompanhando", async ({ page }) => {
    const c = await contaPronta("redes", [["Loja", "https://exemplo.com.br"]]);
    await entrarNoPainel(page, c);
    const secao = page.getByRole("region", { name: "Redes sociais" });
    await expect(secao.getByText("Ponha os ícones")).toBeVisible();

    await secao.getByRole("button", { name: "Adicionar rede" }).click();
    let dlg = page.getByRole("dialog", { name: "Adicionar rede" });
    await dlg.getByLabel("Rede").selectOption("instagram");
    await dlg.getByLabel("Seu @ no Instagram").fill("@doces.da.ana");
    await dlg.getByRole("button", { name: "Salvar" }).click();
    await expect(dlg).toBeHidden();
    await expect(page.getByText("Rede salva")).toBeVisible();

    await secao.getByRole("button", { name: "Adicionar rede" }).click();
    dlg = page.getByRole("dialog", { name: "Adicionar rede" });
    await expect(dlg.getByLabel("Rede").locator("option", { hasText: "Instagram" })).toHaveCount(0);
    await dlg.getByLabel("Rede").selectOption("whatsapp");
    await dlg.getByLabel("Seu WhatsApp com DDD").fill("(11) 91234-5678");
    await dlg.getByRole("button", { name: "Salvar" }).click();
    await expect(secao.getByText("https://wa.me/5511912345678")).toBeVisible();
    expect(await redesNoBanco(c.perfil)).toEqual(["instagram https://www.instagram.com/doces.da.ana", "whatsapp https://wa.me/5511912345678"]);

    const previa = page.getByRole("figure");
    await expect(previa.locator("a[aria-label]")).toHaveCount(2);
    expect(await previa.locator("a[aria-label]").evaluateAll((as) => as.map((a) => a.getAttribute("aria-label")))).toEqual(["Instagram", "WhatsApp"]);
    await semViolacoes(page, "S06 redes");
    await capturar(page, "S06-redes");

    // reordenar só com teclado
    await secao.getByRole("button", { name: "Mover WhatsApp" }).focus();
    for (const tecla of ["Space", "ArrowUp", "Space"]) {
      await page.keyboard.press(tecla);
      await page.waitForTimeout(150);
    }
    await expect(page.getByText("Ordem salva")).toBeVisible();
    await expect.poll(() => redesNoBanco(c.perfil)).toEqual(["whatsapp https://wa.me/5511912345678", "instagram https://www.instagram.com/doces.da.ana"]);

    await secao.getByLabel("No rodapé").check();
    await expect(page.getByText("Ícones no rodapé")).toBeVisible();
    expect((await sql`select social_position from profiles where id = ${c.perfil}`)[0].social_position).toBe("bottom");

    await page.goto(`/${c.username}`);
    const insta = page.getByRole("link", { name: "Instagram" });
    await expect(insta).toHaveAttribute("href", "https://www.instagram.com/doces.da.ana");
    await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", "https://wa.me/5511912345678");
    const yLoja = (await page.getByRole("link", { name: "Loja" }).boundingBox())!.y;
    expect((await insta.boundingBox())!.y, "no rodapé, os ícones vêm depois dos links").toBeGreaterThan(yLoja);

    await page.goto("/admin");
    await page.getByRole("region", { name: "Redes sociais" }).getByRole("button", { name: "Tirar Instagram" }).click();
    await page.getByRole("dialog", { name: "Tirar esta rede?" }).getByRole("button", { name: "Tirar" }).click();
    await expect(page.getByText("Instagram saiu da página")).toBeVisible();
    await expect.poll(() => redesNoBanco(c.perfil)).toEqual(["whatsapp https://wa.me/5511912345678"]);
  });

  test("F02-E11 endereço de outro site, @ inválido ou número sem DDD são recusados e nada é gravado", async ({ page }) => {
    const c = await contaPronta("redesinval");
    await entrarNoPainel(page, c);
    await page.getByRole("button", { name: "Adicionar rede" }).click();
    const dlg = page.getByRole("dialog", { name: "Adicionar rede" });
    const salvar = dlg.getByRole("button", { name: "Salvar" });
    await dlg.getByLabel("Rede").selectOption("instagram");
    const campo = dlg.getByLabel("Seu @ no Instagram");
    await campo.fill("https://instagram.com.golpe.example/ana");
    await salvar.click();
    await expect(dlg.getByText("Esse endereço não é do Instagram.")).toBeVisible();
    await expect(campo).toHaveValue("https://instagram.com.golpe.example/ana");
    await campo.fill("doces da ana");
    await salvar.click();
    await expect(dlg.getByText("Confira o seu @ no Instagram.")).toBeVisible();
    await dlg.getByLabel("Rede").selectOption("whatsapp");
    await dlg.getByLabel("Seu WhatsApp com DDD").fill("91234-5678");
    await salvar.click();
    await expect(dlg.getByText(/Confira o número/)).toBeVisible();
    await semViolacoes(page, "S06 rede com erro");
    expect(await redesNoBanco(c.perfil)).toEqual([]);
  });

  test("F02-E12 a 390 px a prévia abre em tela cheia, acompanha o que mudou e fecha no Esc", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const c = await contaPronta("previa", [["Loja", "https://exemplo.com.br"]]);
    await sql`insert into social_links (profile_id, platform, url, position) values (${c.perfil}, 'instagram', 'https://www.instagram.com/previa', 0)`;
    await entrarNoPainel(page, c);
    await expect(page.getByRole("figure")).toBeHidden();
    await semRolagemLateral(page);

    const botao = page.getByRole("button", { name: "Prévia", exact: true });
    await botao.click();
    const dlg = page.getByRole("dialog", { name: "Prévia da sua página" });
    await expect(dlg.getByText("Loja")).toBeVisible();
    await expect(dlg.locator('a[aria-label="Instagram"]')).toBeVisible();
    await semRolagemLateral(page);
    await semViolacoes(page, "S06 prévia no celular");
    await capturar(page, "S06-previa", { paginaInteira: false });
    await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();
    await expect(botao).toBeFocused();

    await page.getByLabel("Título", { exact: true }).fill("Cardápio da semana");
    await page.getByLabel("Endereço", { exact: true }).fill("exemplo.com.br/cardapio");
    await page.getByRole("button", { name: "Adicionar", exact: true }).click();
    await expect(page.getByText("Link adicionado")).toBeVisible();
    await botao.click();
    await expect(dlg.getByText("Cardápio da semana")).toBeVisible();
    await dlg.getByRole("button", { name: "Fechar" }).click();
    await expect(dlg).toBeHidden();
  });
});
