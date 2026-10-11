// F02 Criador adiciona e organiza links: S06 adicionar -> S07 título e URL -> reordenar.
import type { Page } from "@playwright/test";
import { capturar, contaPronta, entrarNoPainel, expect, semRolagemLateral, semViolacoes, sql, test } from "./apoio";

const titulo = (page: Page) => page.getByRole("textbox", { name: "Título" });
const endereco = (page: Page) => page.getByRole("textbox", { name: "Endereço" });
const adicionar = (page: Page) => page.getByRole("button", { name: "Adicionar", exact: true });
async function ordem(page: Page) {
  await page.getByRole("button", { name: /^Mover / }).first().waitFor();
  return page.getByRole("button", { name: /^Mover / }).evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")!.slice(6)));
}

/** Envia e espera a resposta voltar (o botão deixa de estar ocupado). */
async function enviar(page: Page) {
  await adicionar(page).click();
  await expect(adicionar(page)).not.toHaveAttribute("aria-busy", "true");
}

async function novoLink(page: Page, t: string, u: string) {
  await titulo(page).fill(t);
  await endereco(page).fill(u);
  await adicionar(page).click();
  await expect(page.getByRole("button", { name: `Mover ${t}`, exact: true })).toBeVisible();
}

async function linksNoBanco(perfil: string) {
  return sql`select title, url, enabled from links where profile_id = ${perfil} order by position`;
}

test.describe("F02 adiciona e organiza links", () => {
  test("F02-H1 adicionar, editar, reordenar, desligar e excluir, com a prévia e a página pública acompanhando", async ({ page }) => {
    const c = await contaPronta("h1");
    await entrarNoPainel(page, c);
    await novoLink(page, "Loja", "exemplo.com.br/loja");
    await novoLink(page, "Cardápio", "https://exemplo.com.br/cardapio");
    expect(await ordem(page)).toEqual(["Cardápio", "Loja"]);
    const previa = page.getByRole("complementary", { name: "Prévia" });
    await expect(previa.getByRole("navigation").getByRole("link")).toHaveText(["Cardápio", "Loja"]);

    await page.getByRole("button", { name: "Editar Loja" }).click();
    await page.getByRole("dialog").getByLabel("Título").fill("Loja online");
    await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("button", { name: "Mover Loja online" })).toBeVisible();

    // arrastar com o mouse: Loja online para o topo
    const alca = page.getByRole("button", { name: "Mover Loja online" });
    const topo = page.getByRole("button", { name: "Mover Cardápio" });
    const a = (await alca.boundingBox())!;
    const b = (await topo.boundingBox())!;
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2, a.y - 10, { steps: 5 });
    await page.mouse.move(b.x + b.width / 2, b.y - 20, { steps: 10 });
    await page.mouse.up();
    await expect(page.getByText("Ordem salva")).toBeVisible();
    expect((await linksNoBanco(c.perfil)).map((l) => l.title)).toEqual(["Loja online", "Cardápio"]);

    await page.getByRole("switch", { name: "Mostrar Cardápio na página" }).click();
    await expect(page.getByText("Desligado")).toBeVisible();
    await expect(previa.getByRole("navigation").getByRole("link")).toHaveText(["Loja online"]);
    await semViolacoes(page, "S06");
    await capturar(page, "S06");

    await page.goto(`/${c.username}`);
    await expect(page.getByRole("navigation", { name: /Links de/ }).getByRole("link")).toHaveText(["Loja online"]);

    await page.goto("/admin");
    await page.getByRole("button", { name: "Excluir Loja online" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByText("Link excluído")).toBeVisible();
    expect((await linksNoBanco(c.perfil)).map((l) => l.title)).toEqual(["Cardápio"]);
  });

  test("F02-H2 reordenar só com teclado (espaço, setas, espaço)", async ({ page }) => {
    const c = await contaPronta("h2", [["Um", "https://exemplo.com.br/1"], ["Dois", "https://exemplo.com.br/2"], ["Três", "https://exemplo.com.br/3"]]);
    await entrarNoPainel(page, c);
    await page.getByRole("button", { name: "Mover Três" }).focus();
    // no ritmo de uma pessoa: cada tecla depois que o item terminou de andar
    for (const tecla of ["Space", "ArrowUp", "ArrowUp", "Space"]) {
      await page.keyboard.press(tecla);
      await page.waitForTimeout(150);
    }
    await expect(page.getByText("Ordem salva")).toBeVisible();
    await page.reload();
    expect(await ordem(page)).toEqual(["Três", "Um", "Dois"]);
  });

  test("F02-E1 endereço sem https é completado; com espaços nas pontas, aparado", async ({ page }) => {
    const c = await contaPronta("e1");
    await entrarNoPainel(page, c);
    await novoLink(page, "  Site  ", "  exemplo.com.br  ");
    expect(await linksNoBanco(c.perfil)).toEqual([{ title: "Site", url: "https://exemplo.com.br/", enabled: true }]);
  });

  test("F02-E2 endereços inválidos ou perigosos são recusados", async ({ page }) => {
    const c = await contaPronta("e2");
    await entrarNoPainel(page, c);
    for (const ruim of ["isso não é url", "javascript:alert(1)", "http://localhost", "ftp://exemplo.com.br", "data:text/html,oi"]) {
      await titulo(page).fill("Teste");
      await endereco(page).fill(ruim);
      await enviar(page);
      await expect(page.getByText("Esse endereço não parece um link válido.")).toBeVisible();
    }
    expect(await linksNoBanco(c.perfil)).toHaveLength(0);
  });

  test("F02-E3 título vazio, só espaços ou longo demais é recusado; 100 caracteres passa", async ({ page }) => {
    const c = await contaPronta("e3");
    await entrarNoPainel(page, c);
    for (const t of ["", "   "]) {
      await titulo(page).fill(t);
      await endereco(page).fill("exemplo.com.br");
      await enviar(page);
      await expect(page.getByText("Dê um título ao link.")).toBeVisible();
    }
    await titulo(page).fill("a".repeat(101));
    await endereco(page).fill("exemplo.com.br");
    await enviar(page);
    await expect(page.getByText("Use no máximo 100 caracteres.")).toBeVisible();
    await novoLink(page, "b".repeat(100), "exemplo.com.br");
    await semRolagemLateral(page);
  });

  test("F02-E4 emoji, acentos e HTML no título aparecem como texto na página pública", async ({ page }) => {
    const c = await contaPronta("e4");
    await entrarNoPainel(page, c);
    const t = 'Bolo de coração 🎂 & <img src=x onerror="window.invadido=1">';
    await novoLink(page, t, "exemplo.com.br/bolo");
    await page.goto(`/${c.username}`);
    await expect(page.getByRole("link", { name: t })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { invadido?: number }).invadido)).toBeUndefined();
  });

  test("F02-E5 o mesmo endereço duas vezes vira dois links", async ({ page }) => {
    const c = await contaPronta("e5");
    await entrarNoPainel(page, c);
    await novoLink(page, "Primeiro", "exemplo.com.br");
    await novoLink(page, "Segundo", "exemplo.com.br");
    expect(await linksNoBanco(c.perfil)).toHaveLength(2);
  });

  test("F02-E6 cem links: painel e página pública abrem, e o último sobe para o topo", async ({ page }) => {
    const links = Array.from({ length: 100 }, (_, i) => [`Link ${i + 1}`, `https://exemplo.com.br/${i + 1}`] as [string, string]);
    const c = await contaPronta("e6", links);
    await entrarNoPainel(page, c);
    await expect(page.getByRole("button", { name: /^Mover / })).toHaveCount(100);
    const ultimo = page.getByRole("button", { name: "Mover Link 100", exact: true });
    await ultimo.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("Home");
    for (let i = 0; i < 99; i++) await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Space");
    await expect(page.getByText("Ordem salva")).toBeVisible();
    expect((await linksNoBanco(c.perfil))[0].title).toBe("Link 100");
    await page.goto(`/${c.username}`);
    await expect(page.getByRole("navigation", { name: /Links de/ }).getByRole("link")).toHaveCount(100);
  });

  test("F02-E7 dois cliques seguidos em Adicionar criam um link só", async ({ page }) => {
    const c = await contaPronta("e7");
    await entrarNoPainel(page, c);
    await titulo(page).fill("Uma vez");
    await endereco(page).fill("exemplo.com.br");
    await adicionar(page).dblclick();
    await expect(page.getByRole("button", { name: "Mover Uma vez" }).first()).toBeVisible();
    await page.waitForTimeout(1000);
    expect(await linksNoBanco(c.perfil)).toHaveLength(1);
  });

  test.describe(() => {
    // sem rede, o próprio Chrome registra no console os pedidos que não saíram
    test.use({ consoleEsperado: [/ERR_INTERNET_DISCONNECTED/] });
  test("F02-E8 sem rede: adicionar e ligar avisam e o painel continua de pé", async ({ page, context }) => {
    const c = await contaPronta("e8", [["Ligado", "https://exemplo.com.br/1"]]);
    await entrarNoPainel(page, c);
    // os pré-carregamentos das rotas do menu terminam antes de cair a rede (senão o chunk em voo falha no console)
    await page.waitForLoadState("networkidle");
    await context.setOffline(true);
    await titulo(page).fill("Sem rede");
    await endereco(page).fill("exemplo.com.br");
    await adicionar(page).click();
    await expect(page.getByText("Sem internet agora").first()).toBeVisible();
    await expect(titulo(page), "o que foi digitado continua").toHaveValue("Sem rede");
    const chave = page.getByRole("switch", { name: "Mostrar Ligado na página" });
    await chave.click();
    await expect(page.getByText("Sem internet agora").first()).toBeVisible();
    await expect(chave, "volta ao estado salvo").toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("heading", { name: "Adicionar link" })).toBeVisible();
    await context.setOffline(false);
    await adicionar(page).click();
    await expect(page.getByRole("button", { name: "Mover Sem rede" })).toBeVisible();
  });
  });

  test("F02-E9 duas abas: excluído numa, editar na outra avisa que o link não existe mais", async ({ page, context }) => {
    const c = await contaPronta("e9", [["Some", "https://exemplo.com.br/1"]]);
    await entrarNoPainel(page, c);
    const outra = await context.newPage();
    await outra.goto("/admin");
    await outra.getByRole("button", { name: "Editar Some" }).click();
    await page.getByRole("button", { name: "Excluir Some" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByText("Link excluído")).toBeVisible();
    await outra.getByRole("dialog").getByLabel("Título").fill("Editado");
    await outra.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();
    await expect(outra.getByText("Esse link não existe mais.")).toBeVisible();
  });

  test("F02-E10 título e bio longos: limites respeitados e nada vaza a 390 px", async ({ page }) => {
    const c = await contaPronta("e10", [["Fale comigo no WhatsApp com um título bem comprido para ver a quebra de linha", "https://exemplo.com.br"]]);
    await page.setViewportSize({ width: 390, height: 844 });
    await entrarNoPainel(page, c);
    await page.getByRole("button", { name: "Editar título e bio" }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByLabel("Título").fill("x".repeat(60));
    await dlg.getByLabel("Bio").fill("y".repeat(160));
    await dlg.getByRole("button", { name: "Salvar" }).click();
    await expect(dlg).toBeHidden();
    await semRolagemLateral(page);
    await capturar(page, "S06");
    await page.goto(`/${c.username}`);
    await semRolagemLateral(page);
  });

  test("F02-N1 sessão perdida no meio: salvar leva ao login sem perder o painel dos outros", async ({ page, context }) => {
    const c = await contaPronta("n1");
    await entrarNoPainel(page, c);
    await context.clearCookies();
    await titulo(page).fill("Depois");
    await endereco(page).fill("exemplo.com.br");
    await adicionar(page).click();
    await page.waitForURL("**/entrar");
    expect(await linksNoBanco(c.perfil)).toHaveLength(0);
  });
});
