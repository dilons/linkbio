// F05 Visitante deixa o email: S06 adicionar formulário -> S11 textos -> S15 bloco -> S17 enviado.
import type { Page } from "@playwright/test";
import { capturar, contaPronta, entrarNoPainel, expect, semRolagemLateral, semViolacoes, sql, sufixo, test } from "./apoio";

async function formularioPronto(nome: string, extra: { pedirNome?: boolean } = {}) {
  const c = await contaPronta(nome, [["Loja", "https://exemplo.com.br"]]);
  const [l] = await sql`insert into links (profile_id, kind, title, position) values (${c.perfil}, 'form', 'Receba as novidades', -1) returning id`;
  const campos = [{ type: "email", label: "Email", required: true }, ...(extra.pedirNome ? [{ type: "nome", label: "Nome", required: false }] : [])];
  await sql`insert into forms (link_id, fields, consent_text, success_message)
            values (${l.id}, ${sql.json(campos)}, 'Aceito receber as novidades da loja por email.', 'Obrigado! Você entrou na lista.')`;
  return { ...c, form: l.id as string };
}

const inscritos = (perfil: string) => sql`select email, name, consent_text from submissions where profile_id = ${perfil} order by created_at`;

async function inscreverNaPagina(page: Page, email: string, aceitar = true) {
  await page.getByLabel("Seu email").fill(email);
  if (aceitar) await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Quero receber" }).click();
}

test.describe("F05 visitante deixa o email", () => {
  test("F05-H1 o criador põe o formulário e ajusta os textos; o visitante se inscreve com o consentimento gravado", async ({ page, browser }) => {
    const c = await contaPronta("form", [["Loja", "https://exemplo.com.br"]]);
    await entrarNoPainel(page, c);
    await page.getByRole("button", { name: "Adicionar formulário de email" }).click();
    await expect(page.getByText("Formulário adicionado")).toBeVisible();
    await expect(page.getByText("Formulário de email", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Editar Receba novidades por email" }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByLabel("Título").fill("Novidades da loja");
    await dlg.getByLabel(/Pedir o nome também/).check();
    await dlg.getByLabel("Texto de consentimento").fill("Aceito receber as promoções da loja por email, até pedir para sair.");
    await dlg.getByLabel("Mensagem depois do envio").fill("Valeu! Logo chega a primeira promoção.");
    await semViolacoes(page, "S11");
    await capturar(page, "S11");
    await dlg.getByRole("button", { name: "Salvar" }).click();
    await expect(dlg).toBeHidden();
    await expect(page.getByRole("figure").getByText("Novidades da loja")).toBeVisible();

    const visitante = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.201" } });
    const v = await visitante.newPage();
    await v.goto(`/${c.username}`);
    await semViolacoes(v, "S15 formulário");
    await capturar(v, "S15-formulario");
    await v.getByLabel("Seu nome").fill("Rita");
    await inscreverNaPagina(v, "Rita.Fa@Exemplo.com");
    await expect(v.getByText("Valeu! Logo chega a primeira promoção.")).toBeVisible();
    await capturar(v, "S17");
    await visitante.close();
    expect(await inscritos(c.perfil)).toEqual([
      { email: "rita.fa@exemplo.com", name: "Rita", consent_text: "Aceito receber as promoções da loja por email, até pedir para sair." },
    ]);
    const [{ n }] = await sql`select count(*)::int as n from events where profile_id = ${c.perfil} and type = 'signup'`;
    expect(n).toBe(1);
  });

  test("F05-E1 email inválido ou sem marcar o aceite: avisa e não grava nada", async ({ page }) => {
    const f = await formularioPronto("inval");
    await page.goto(`/${f.username}`);
    await inscreverNaPagina(page, "rita@", false);
    await expect(page.getByText("Confira o email.")).toBeVisible();
    await inscreverNaPagina(page, "rita@exemplo.com", false);
    await expect(page.getByText("Marque a caixa para confirmar")).toBeVisible();
    expect(await inscritos(f.perfil)).toHaveLength(0);
  });

  test("F05-E2 o mesmo email de novo (outra caixa): mesma resposta, uma inscrição só", async ({ page, context }) => {
    const f = await formularioPronto("repete");
    await page.goto(`/${f.username}`);
    await inscreverNaPagina(page, "ze@exemplo.com");
    await expect(page.getByText("Obrigado! Você entrou na lista.")).toBeVisible();
    const outra = await context.newPage();
    await outra.goto(`/${f.username}`);
    await inscreverNaPagina(outra, "ZE@Exemplo.com");
    await expect(outra.getByText("Obrigado! Você entrou na lista.")).toBeVisible();
    expect(await inscritos(f.perfil)).toHaveLength(1);
  });

  test("F05-E3 dois cliques seguidos em Quero receber: uma inscrição", async ({ page }) => {
    const f = await formularioPronto("duplo");
    await page.goto(`/${f.username}`);
    await page.getByLabel("Seu email").fill("dois@exemplo.com");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Quero receber" }).dblclick();
    await expect(page.getByText("Obrigado! Você entrou na lista.")).toBeVisible();
    expect(await inscritos(f.perfil)).toHaveLength(1);
  });

  test("F05-E4 robô (campo isca ou navegador de robô) recebe ok e nada é gravado", async ({ request }) => {
    const f = await formularioPronto("robo");
    const isca = await request.post(`/api/forms/${f.form}`, { data: { email: "bot@exemplo.com", aceite: true, site: "http://spam" } });
    expect(isca.status()).toBe(200);
    const bot = await request.post(`/api/forms/${f.form}`, { data: { email: "bot2@exemplo.com", aceite: true }, headers: { "user-agent": "Googlebot/2.1" } });
    expect(bot.status()).toBe(200);
    expect(await inscritos(f.perfil)).toHaveLength(0);
  });

  test("F05-E5 sem aceite pela API, formulário desligado ou inexistente: nada é gravado", async ({ request }) => {
    const f = await formularioPronto("api");
    expect((await request.post(`/api/forms/${f.form}`, { data: { email: "a@exemplo.com", aceite: false } })).status()).toBe(400);
    expect((await request.post(`/api/forms/${f.form}`, { data: { email: "a@exemplo.com" } })).status()).toBe(400);
    await sql`update links set enabled = false where id = ${f.form}`;
    expect((await request.post(`/api/forms/${f.form}`, { data: { email: "a@exemplo.com", aceite: true } })).status()).toBe(404);
    expect((await request.post("/api/forms/00000000-0000-4000-8000-000000000000", { data: { email: "a@exemplo.com", aceite: true } })).status()).toBe(404);
    expect((await request.post("/api/forms/nao-e-id", { data: { email: "a@exemplo.com", aceite: true } })).status()).toBe(404);
    expect(await inscritos(f.perfil)).toHaveLength(0);
  });

  test("F05-E6 muitos envios do mesmo visitante no mesmo formulário: o sexto espera", async ({ request }) => {
    const f = await formularioPronto("limite");
    const ip = { "x-forwarded-for": `198.51.100.${10 + Math.floor(Math.random() * 200)}` };
    const status = [];
    for (let i = 0; i < 6; i++) {
      status.push((await request.post(`/api/forms/${f.form}`, { data: { email: `p${i}.${sufixo()}@exemplo.com`, aceite: true }, headers: ip })).status());
    }
    expect(status).toEqual([200, 200, 200, 200, 200, 429]);
  });

  test("F05-E7 textos do formulário são validados no editor (S11)", async ({ page }) => {
    const f = await formularioPronto("valida");
    await entrarNoPainel(page, f);
    await page.getByRole("button", { name: "Editar Receba as novidades" }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByLabel("Texto de consentimento").fill("curto");
    await dlg.getByLabel("Título").fill("");
    await dlg.getByRole("button", { name: "Salvar" }).click();
    await expect(dlg.getByText("Diga em uma frase para que o email vai ser usado.")).toBeVisible();
    await expect(dlg.getByText("Dê um título ao formulário.")).toBeVisible();
  });

  test("F05-E8 a 390 px e só com teclado: o visitante se inscreve", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const f = await formularioPronto("tecla", { pedirNome: true });
    await page.goto(`/${f.username}`);
    await semRolagemLateral(page);
    // O React revela o que chegou por streaming um pouco depois do load, e o botão liga depois da hidratação.
    await expect(page.getByRole("button", { name: "Quero receber" })).toBeEnabled();
    await page.getByLabel("Seu nome").focus();
    await page.keyboard.type("Ana");
    await page.keyboard.press("Tab");
    await page.keyboard.type("ana.tecla@exemplo.com");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Space");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Obrigado! Você entrou na lista.")).toBeVisible();
    await capturar(page, "S17");
    expect(await inscritos(f.perfil)).toHaveLength(1);
  });
});
