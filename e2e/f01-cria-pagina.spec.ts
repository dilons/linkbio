// F01 Criador cria a página e compartilha: S01 -> S02 -> S03 -> S06 -> copiar a URL.
import { capturar, contaPronta, emailPara, emailsPara, entrar, expect, linkDoEmail, semRolagemLateral, semViolacoes, sql, sufixo, test, DEMO } from "./apoio";
import { MARCA } from "../src/lib/marca";

async function cadastrar(page: import("@playwright/test").Page, email: string, senha = "senha-boa-123") {
  await page.goto("/cadastro");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar minha página" }).click();
}

test.describe("F01 cria a página e compartilha", () => {
  test("F01-H1 cadastro, confirmação por email, endereço, primeiro link e URL copiada", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const email = `ana.${sufixo()}@exemplo.com`;
    const username = `ana.${sufixo()}`;
    await page.goto("/cadastro");
    await semViolacoes(page, "S01");
    await capturar(page, "S01");
    await cadastrar(page, email);
    await expect(page.getByRole("heading", { name: "Confira seu email" })).toBeVisible();
    await semViolacoes(page, "S02");
    await capturar(page, "S02");

    await page.goto(await linkDoEmail(email, "Confirme seu email"));
    await page.waitForURL("**/comecar");
    await page.getByLabel("Seu endereço").fill(username);
    await expect(page.getByText(`${MARCA.dominio}/${username} está livre.`)).toBeVisible();
    await semViolacoes(page, "S03");
    await capturar(page, "S03");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("**/admin");
    await expect(page.getByText("Nada por aqui ainda")).toBeVisible();
    await capturar(page, "S06-vazio");

    await page.getByRole("textbox", { name: "Título" }).fill("Meu site");
    await page.getByRole("textbox", { name: "Endereço" }).fill("exemplo.com.br");
    await page.getByRole("button", { name: "Adicionar", exact: true }).click();
    await expect(page.getByRole("button", { name: "Mover Meu site" })).toBeVisible();
    await page.getByRole("button", { name: "Copiar" }).click();
    await expect(page.getByText("Copiado")).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(new RegExp(`/${username.replace(".", "\\.")}$`));
  });

  test("F01-E1 endereço em uso, reservado ou inválido avisa enquanto digita e não é aceito", async ({ page }) => {
    const email = `bia.${sufixo()}@exemplo.com`;
    await cadastrar(page, email);
    await page.goto(await linkDoEmail(email, "Confirme seu email"));
    await page.waitForURL("**/comecar");
    const campo = page.getByLabel("Seu endereço");
    for (const [valor, aviso] of [
      [DEMO.username, "Alguém já usa esse endereço"],
      ["admin", "Esse endereço é reservado"],
      ["ana silva", "Use só letras sem acento"],
      ["ana.", "Não comece nem termine com ponto"],
      ["joão", "Use só letras sem acento"],
    ]) {
      await campo.fill(valor);
      await expect(page.getByText(aviso)).toBeVisible();
    }
    await campo.fill(DEMO.username);
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText("Alguém já usa esse endereço")).toBeVisible();
    await expect(page).toHaveURL(/\/comecar$/);
    await capturar(page, "S03-erro");
    // BUG-012: depois do envio recusado, digitar outro endereço tira o erro antigo
    const livre = `bia.${sufixo()}`;
    await campo.fill(livre);
    await expect(page.getByText(`${MARCA.dominio}/${livre} está livre.`)).toBeVisible();
    await expect(page.getByText("Alguém já usa esse endereço")).toHaveCount(0);
  });

  test("F01-E2 email que já tem conta: mesma tela de quem não tem, e o dono recebe o caminho para entrar", async ({ page }) => {
    const c = await contaPronta("existe");
    await cadastrar(page, c.email, "outra-senha-qualquer");
    await expect(page.getByRole("heading", { name: "Confira seu email" })).toBeVisible();
    await expect(page.getByText(/já tem conta,\s*entre por aqui/)).toBeVisible();
    const aviso = await emailPara(c.email, `Você já tem conta no ${MARCA.nome}`);
    expect(aviso.HTML).toContain("/entrar");
    expect((await emailsPara(c.email)).filter((m) => m.Subject.includes("Confirme"))).toHaveLength(0);
  });

  test("F01-E3 abandona depois de confirmar e volta: entrar leva a escolher o endereço", async ({ page, context }) => {
    const email = `cris.${sufixo()}@exemplo.com`;
    await cadastrar(page, email);
    await page.goto(await linkDoEmail(email, "Confirme seu email"));
    await page.waitForURL("**/comecar");
    await context.clearCookies();
    await entrar(page, email, "senha-boa-123");
    await page.waitForURL("**/comecar");
    await expect(page.getByLabel("Seu endereço")).toBeVisible();
  });

  test("F01-E4 dois cliques seguidos em Criar minha página: uma conta, tela de confirmação", async ({ page }) => {
    const email = `dani.${sufixo()}@exemplo.com`;
    await page.goto("/cadastro");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Senha").fill("senha-boa-123");
    await page.getByRole("button", { name: "Criar minha página" }).dblclick();
    await expect(page.getByRole("heading", { name: "Confira seu email" })).toBeVisible();
    const [{ n }] = await sql`select count(*)::int as n from auth.users where email = ${email}`;
    expect(n).toBe(1);
  });

  test("F01-E5 email com maiúsculas e +: a conta vale em minúsculas", async ({ page, context }) => {
    const base = `edu.${sufixo()}`;
    await cadastrar(page, `${base.toUpperCase()}+Teste@Exemplo.com`);
    await expect(page.getByRole("heading", { name: "Confira seu email" })).toBeVisible();
    await page.goto(await linkDoEmail(`${base}+teste@exemplo.com`, "Confirme seu email"));
    await page.waitForURL("**/comecar");
    await context.clearCookies();
    await entrar(page, `${base}+teste@exemplo.com`, "senha-boa-123");
    await page.waitForURL("**/comecar");
  });

  test("F01-E6 duas abas escolhendo o endereço: a segunda vai para o painel, sem perfil duplicado", async ({ page, context }) => {
    const email = `fe.${sufixo()}@exemplo.com`;
    await cadastrar(page, email);
    await page.goto(await linkDoEmail(email, "Confirme seu email"));
    await page.waitForURL("**/comecar");
    const outra = await context.newPage();
    await outra.goto("/comecar");
    const u1 = `fe.um.${sufixo()}`;
    await page.getByLabel("Seu endereço").fill(u1);
    await outra.getByLabel("Seu endereço").fill(`fe.dois.${sufixo()}`);
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("**/admin");
    await outra.getByRole("button", { name: "Continuar" }).click();
    await outra.waitForURL("**/admin");
    const [{ n }] = await sql`select count(*)::int as n from profiles p join auth.users u on u.id = p.account_id where u.email = ${email}`;
    expect(n).toBe(1);
  });

  test("F01-E7 link de confirmação usado de novo: aviso, sem quebrar", async ({ page, context }) => {
    const email = `gil.${sufixo()}@exemplo.com`;
    await cadastrar(page, email);
    const link = await linkDoEmail(email, "Confirme seu email");
    await page.goto(link);
    await page.waitForURL("**/comecar");
    await context.clearCookies();
    await page.goto(link);
    await page.waitForURL("**/entrar?aviso=link-invalido");
    await expect(page.getByText("Esse link expirou ou já foi usado")).toBeVisible();
  });

  test("F01-E8 recarregar a tela de confirmação e pedir o link de novo por /confirmar", async ({ page }) => {
    const email = `hugo.${sufixo()}@exemplo.com`;
    await cadastrar(page, email);
    await expect(page.getByRole("heading", { name: "Confira seu email" })).toBeVisible();
    await page.waitForTimeout(1500); // o Auth local pede 1 s entre envios (60 s no padrão do Supabase)
    await page.goto("/confirmar");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Mandar o link de novo" }).click();
    await expect(page.getByText("mandamos de novo")).toBeVisible();
    await expect.poll(async () => (await emailsPara(email)).filter((m) => m.Subject.includes("Confirme")).length).toBe(2);
  });

  test("F01-E10 pedir o link de novo cedo demais: aviso para esperar, sem erro genérico", async ({ page }) => {
    const email = `ju.${sufixo()}@exemplo.com`;
    await cadastrar(page, email);
    await page.getByRole("button", { name: "Mandar o link de novo" }).click();
    await expect(page.getByText(/Muitos emails em pouco tempo|mandamos de novo/)).toBeVisible();
  });

  test("F01-N1 senha curta e email inválido: erros nos campos, nada criado", async ({ page }) => {
    const email = `ivo.${sufixo()}@exemplo.com`;
    await cadastrar(page, email, "curta");
    await expect(page.getByText("A senha precisa de pelo menos 8 caracteres.")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue(email);
    await capturar(page, "S01-erro");
    await page.getByLabel("Email").fill("ivo@");
    await page.getByLabel("Senha").fill("senha-boa-123");
    await page.getByRole("button", { name: "Criar minha página" }).click();
    await expect(page.getByText("Confira o email.")).toBeVisible();
    const [{ n }] = await sql`select count(*)::int as n from auth.users where email like ${"ivo%"}`;
    expect(n).toBe(0);
  });

  test("F01-E9 só teclado, a 390 px: cadastro, endereço e primeiro link", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const email = `jo.${sufixo()}@exemplo.com`;
    const tabAte = async (nome: string) => {
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press("Tab");
        const atual = await page.evaluate(() => {
          const el = document.activeElement as HTMLInputElement | null;
          return (el?.labels?.[0]?.textContent ?? el?.getAttribute("aria-label") ?? el?.textContent ?? "").trim();
        });
        if (atual.startsWith(nome)) return;
      }
      throw new Error(`"${nome}" não alcançado com Tab`);
    };
    await page.goto("/cadastro");
    await semRolagemLateral(page);
    await capturar(page, "S01");
    await tabAte("Email");
    await page.keyboard.type(email);
    await tabAte("Senha");
    await page.keyboard.type("senha-boa-123");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Confira seu email" })).toBeVisible();
    await capturar(page, "S02");
    await page.goto(await linkDoEmail(email, "Confirme seu email"));
    await page.waitForURL("**/comecar");
    await tabAte("Seu endereço");
    await page.keyboard.type(`jo.${sufixo()}`);
    await expect(page.getByText("está livre")).toBeVisible();
    await semRolagemLateral(page);
    await capturar(page, "S03");
    await page.keyboard.press("Enter");
    await page.waitForURL("**/admin");
    await page.getByText("Nada por aqui ainda").waitFor();
    await capturar(page, "S06-vazio");
    await tabAte("Título");
    await page.keyboard.type("Fale comigo no WhatsApp com um título bem comprido para testar");
    await tabAte("Endereço");
    await page.keyboard.type("exemplo.com.br/zap");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: /^Mover Fale comigo/ })).toBeVisible();
    await semRolagemLateral(page);
    await semViolacoes(page, "S06 390");
  });
});
