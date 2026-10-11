// F12 (derivado, não está no recon): entrar, recuperar a senha, sessão e saída.
import { capturar, contaPronta, emailPara, entrar, entrarNoPainel, expect, linkDoEmail, semViolacoes, sufixo, test } from "./apoio";

test.describe("F12 acesso: entrar, senha e sessão", () => {
  test("F12-H1 entrar e sair deste aparelho", async ({ page }) => {
    const c = await contaPronta("entra");
    await page.goto("/entrar");
    await semViolacoes(page, "S18");
    await capturar(page, "S18");
    await entrarNoPainel(page, c);
    await page.goto("/admin/conta");
    await page.getByRole("button", { name: "Sair deste aparelho" }).click();
    await page.waitForURL("**/entrar");
    await page.goto("/admin");
    await page.waitForURL("**/entrar");
  });

  test("F12-N1 senha errada e email sem conta dão a mesma resposta", async ({ page }) => {
    const c = await contaPronta("errada");
    await entrar(page, c.email, "senha-errada-1");
    await expect(page.getByText("Email ou senha não conferem.")).toBeVisible();
    await entrar(page, `ninguem.${sufixo()}@exemplo.com`, "senha-errada-1");
    await expect(page.getByText("Email ou senha não conferem.")).toBeVisible();
  });

  test("F12-N2 email ainda sem confirmar: não entra e pode pedir o link de novo", async ({ page }) => {
    const email = `semconf.${sufixo()}@exemplo.com`;
    await page.goto("/cadastro");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Senha").fill("senha-boa-123");
    await page.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(page.getByRole("heading", { name: "Confira seu email" })).toBeVisible();
    await page.context().clearCookies();
    await page.waitForTimeout(1500); // o Auth local pede 1 s entre envios
    await entrar(page, email, "senha-boa-123");
    await expect(page.getByText("Falta confirmar o email")).toBeVisible();
    await page.getByRole("button", { name: "Mandar o link de novo" }).click();
    await expect(page.getByText("mandamos de novo")).toBeVisible();
  });

  test("F12-E1 recuperar a senha: resposta neutra, link abre em outro navegador, senha nova vale e avisa por email", async ({ page, browser }) => {
    const c = await contaPronta("rec");
    await page.goto("/entrar/recuperar");
    await semViolacoes(page, "S18b");
    await capturar(page, "S18b");
    await page.getByLabel("Email da conta").fill(`ninguem.${sufixo()}@exemplo.com`);
    await page.getByRole("button", { name: "Mandar o link" }).click();
    const neutro = await page.getByRole("status").first().innerText();
    await page.goto("/entrar/recuperar");
    await page.getByLabel("Email da conta").fill(c.email);
    await page.getByRole("button", { name: "Mandar o link" }).click();
    expect(await page.getByRole("status").first().innerText()).toBe(neutro);

    // o link do email aberto em outro navegador (outro aparelho)
    const outro = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.250" } });
    const p2 = await outro.newPage();
    await p2.goto(await linkDoEmail(c.email, "senha nova"));
    await p2.waitForURL("**/entrar/nova-senha");
    await capturar(p2, "S18-nova-senha");
    await p2.getByLabel("Senha nova", { exact: true }).fill("outra-senha-456");
    await p2.getByLabel("Repita a senha nova").fill("diferente-789");
    await p2.getByRole("button", { name: "Salvar e entrar" }).click();
    await expect(p2.getByText("As duas senhas não estão iguais.")).toBeVisible();
    await p2.getByLabel("Senha nova", { exact: true }).fill("outra-senha-456");
    await p2.getByLabel("Repita a senha nova").fill("outra-senha-456");
    await p2.getByRole("button", { name: "Salvar e entrar" }).click();
    await p2.waitForURL("**/admin");
    await outro.close();
    await emailPara(c.email, "senha do linkbio mudou");
    await entrar(page, c.email, c.senha);
    await expect(page.getByText("Email ou senha não conferem.")).toBeVisible();
    await entrarNoPainel(page, { email: c.email, senha: "outra-senha-456" });
  });

  test("F12-E2 sair de todos os aparelhos derruba a outra sessão na hora", async ({ page, browser }) => {
    const c = await contaPronta("todos");
    const celular = await browser.newContext({ viewport: { width: 390, height: 844 }, extraHTTPHeaders: { "x-forwarded-for": "198.51.100.251" } });
    const p2 = await celular.newPage();
    await entrarNoPainel(p2, c);
    await entrarNoPainel(page, c);
    await page.goto("/admin/conta");
    await page.getByRole("button", { name: "Sair de todos os aparelhos" }).click();
    await page.waitForURL("**/entrar?aviso=saiu-de-todos");
    await p2.goto("/admin");
    await p2.waitForURL("**/entrar");
    await celular.close();
  });

  test("F12-E3 sessão com o token vencido se renova sozinha", async ({ page, context }) => {
    const c = await contaPronta("renova");
    await entrarNoPainel(page, c);
    const cookies = await context.cookies();
    const sessao = cookies.find((k) => k.name.startsWith("sb-") && k.name.endsWith("-auth-token"))!;
    const dados = JSON.parse(Buffer.from(sessao.value.replace(/^base64-/, ""), "base64url").toString());
    dados.expires_at = Math.floor(Date.now() / 1000) - 60;
    await context.addCookies([{ ...sessao, value: `base64-${Buffer.from(JSON.stringify(dados)).toString("base64url")}` }]);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Seus links", level: 1 })).toBeVisible();
    const nova = (await context.cookies()).find((k) => k.name === sessao.name)!;
    expect(nova.value).not.toBe(sessao.value);
  });

  test("F12-E4 dez senhas erradas seguidas para o mesmo email: as próximas tentativas esperam", async ({ page }) => {
    const c = await contaPronta("tranca");
    for (let i = 0; i < 10; i++) {
      await entrar(page, c.email, `errada-${i}-xx`);
      await expect(page.getByText("Email ou senha não conferem.")).toBeVisible();
    }
    await entrar(page, c.email, c.senha);
    await expect(page.getByText("Muitas tentativas em pouco tempo")).toBeVisible();
  });

  test("F12-N3 alguém errando a senha de outra pessoa de outro lugar não tranca a conta dela", async ({ page, browser }) => {
    const c = await contaPronta("vitima");
    const atacante = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "203.0.113.66" } });
    const pa = await atacante.newPage();
    for (let i = 0; i < 11; i++) {
      await entrar(pa, c.email, `chute-${i}-xx`);
      await expect(pa.getByText(/Email ou senha não conferem|Muitas tentativas/)).toBeVisible();
    }
    await atacante.close();
    await entrarNoPainel(page, c);
  });

  test("F12-E5 voltar no navegador depois de sair não mostra o painel", async ({ page }) => {
    const c = await contaPronta("volta");
    await entrarNoPainel(page, c);
    await page.goto("/admin/conta");
    await page.getByRole("button", { name: "Sair deste aparelho" }).click();
    await page.waitForURL("**/entrar");
    await page.goBack();
    await expect(page.getByRole("button", { name: "Sair de todos os aparelhos" })).toHaveCount(0);
    await expect(page).toHaveURL(/\/entrar/);
  });

  test("F12-E6 cookies da sessão fechados para o JavaScript da página", async ({ page, context }) => {
    const c = await contaPronta("cookie");
    await entrarNoPainel(page, c);
    const sessao = (await context.cookies()).filter((k) => k.name.startsWith("sb-"));
    expect(sessao.length).toBeGreaterThan(0);
    for (const k of sessao) expect(k).toMatchObject({ httpOnly: true, sameSite: "Lax" });
    expect(await page.evaluate(() => document.cookie)).not.toContain("sb-");
  });

  test("F12-E7 sem sessão o painel leva ao login; com sessão, login e cadastro levam ao painel", async ({ page }) => {
    for (const rota of ["/admin", "/admin/insights", "/admin/plano", "/comecar", "/entrar/nova-senha"]) {
      await page.goto(rota);
      await expect(page, rota).toHaveURL(/\/entrar$/);
    }
    const c = await contaPronta("logado");
    await entrarNoPainel(page, c);
    for (const rota of ["/entrar", "/cadastro"]) {
      await page.goto(rota);
      await expect(page, rota).toHaveURL(/\/admin$/);
    }
  });

  test("F12-E8 jobs e webhook não abrem sem o segredo", async ({ request }) => {
    expect((await request.get("/api/cron/limpeza")).status()).toBe(401);
    expect((await request.get("/api/cron/limpeza", { headers: { authorization: "Bearer errado" } })).status()).toBe(401);
    const ok = await request.get("/api/cron/sal", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
    expect(ok.status()).toBe(200);
    expect((await request.get("/api/cron/nao-existe", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } })).status()).toBe(404);
  });
});
