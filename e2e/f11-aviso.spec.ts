// F11 Criador marca a página ou um link como sensível: S12 ou S07 -> a S15 mostra o aviso S16 antes.
import { capturar, contaPronta, entrarNoPainel, expect, semRolagemLateral, semViolacoes, sql, test } from "./apoio";

const ADULTO = "1990-01-01";
const MENOR = `${new Date().getFullYear() - 10}-01-01`;

async function eventos(perfil: string) {
  const [r] = await sql`select count(*) filter (where type = 'view')::int as visitas, count(*) filter (where type = 'click')::int as cliques from events where profile_id = ${perfil}`;
  return r;
}
const avisoDaPagina = async (perfil: string) => (await sql`select sensitive_label from profiles where id = ${perfil}`)[0].sensitive_label;

test.describe("F11 aviso de conteúdo e trava de idade", () => {
  test("F11-H1 a página marcada como 18+ na S12 pede a data antes; adulto vê os links e a visita só conta depois", async ({ page, browser }) => {
    const c = await contaPronta("aviso", [["Loja", "https://exemplo.com.br/loja"]]);
    await entrarNoPainel(page, c);
    await page.getByRole("link", { name: "Configurações" }).click();
    await expect(page.getByRole("heading", { name: "Aviso de conteúdo" })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Sem aviso/ })).toBeChecked();
    await semViolacoes(page, "S12");
    await page.getByRole("radio", { name: /Maiores de 18 anos/ }).check();
    await page.getByRole("button", { name: "Salvar aviso" }).click();
    await expect(page.getByText("Pronto, quem abrir a página vê o aviso antes.")).toBeVisible();
    expect(await avisoDaPagina(c.perfil)).toBe("18");
    await capturar(page, "S12");

    // o visitante, em outro navegador
    const ctx = await browser.newContext({ locale: "pt-BR", timezoneId: "America/Sao_Paulo", userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36" });
    const v = await ctx.newPage();
    const html = await (await v.goto(`/${c.username}`))!.text();
    expect(html, "os links não saem antes da resposta").not.toContain("/r/");
    await expect(v.getByRole("heading", { name: "Conteúdo para maiores de 18 anos" })).toBeVisible();
    await expect(v.getByRole("link", { name: "Loja" })).toHaveCount(0);
    await semViolacoes(v, "S16 página");
    await capturar(v, "S16");
    expect(await eventos(c.perfil)).toEqual({ visitas: 0, cliques: 0 });
    await v.getByLabel("Data de nascimento").fill(ADULTO);
    await v.getByRole("button", { name: "Continuar" }).click();
    await expect(v.getByRole("link", { name: "Loja" })).toBeVisible();
    await expect.poll(() => eventos(c.perfil)).toEqual({ visitas: 1, cliques: 0 });
    // a resposta vale para a sessão: recarregar não pergunta de novo
    await v.reload();
    await expect(v.getByRole("link", { name: "Loja" })).toBeVisible();
    await v.route("https://exemplo.com.br/**", (r) => r.fulfill({ body: "destino" }));
    const destino = v.waitForRequest("https://exemplo.com.br/loja");
    await v.getByRole("link", { name: "Loja" }).click();
    await destino;
    await expect.poll(() => eventos(c.perfil)).toMatchObject({ cliques: 1 });
    await ctx.close();
  });

  test("F11-E1 idade insuficiente: não vê os links, recarregar continua negado e o /r/ direto volta ao aviso", async ({ page, request }) => {
    const c = await contaPronta("menor", [["Loja", "https://exemplo.com.br/loja"]]);
    await sql`update profiles set sensitive_label = '21' where id = ${c.perfil}`;
    await page.goto(`/${c.username}`);
    await page.getByLabel("Data de nascimento").fill(MENOR);
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText("Este conteúdo não está disponível para a sua idade.")).toBeVisible();
    await expect(page.getByLabel("Data de nascimento")).toHaveCount(0);
    await semViolacoes(page, "S16 negado");
    await capturar(page, "S16-negado");
    await page.reload();
    await expect(page.getByText("Este conteúdo não está disponível para a sua idade.")).toBeVisible();
    const [l] = await sql`select id from links where profile_id = ${c.perfil}`;
    const r = await page.request.get(`/r/${l.id}`, { maxRedirects: 0 });
    expect(r.status()).toBe(303);
    expect(r.headers().location).toBe(`/${c.username}`);
    // sem cookie nenhum, o mesmo
    const r2 = await request.get(`/r/${l.id}`, { maxRedirects: 0 });
    expect(r2.headers().location).toBe(`/${c.username}`);
    expect(await eventos(c.perfil)).toEqual({ visitas: 0, cliques: 0 });
  });

  test("F11-E2 link com aviso, marcado na S07: cadeado na página, aviso antes do destino, clique contado uma vez", async ({ page }) => {
    const c = await contaPronta("trava", [
      ["Normal", "https://exemplo.com.br/normal"],
      ["Bastidores", "https://exemplo.com.br/bastidores"],
    ]);
    await entrarNoPainel(page, c);
    await page.getByRole("button", { name: "Editar Bastidores" }).click();
    await page.getByLabel("Aviso antes de abrir").selectOption("sensitive");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("Aviso", { exact: true })).toBeVisible();
    const [l] = await sql`select id, lock, lock_min_age from links where profile_id = ${c.perfil} and title = 'Bastidores'`;
    expect([l.lock, l.lock_min_age]).toEqual(["sensitive", null]);

    await page.goto(`/${c.username}`);
    await expect(page.getByRole("link", { name: /Bastidores/ }).getByLabel("Conteúdo com aviso")).toBeVisible();
    await page.route("https://exemplo.com.br/**", (r) => r.fulfill({ body: "destino" }));
    await page.getByRole("link", { name: /Bastidores/ }).click();
    await expect(page).toHaveURL(new RegExp(`/r/${l.id}/aviso$`));
    await expect(page.getByRole("heading", { name: "Conteúdo sensível" })).toBeVisible();
    await expect(page.getByText(`Um link da página de ${c.username}`)).toBeVisible();
    await semViolacoes(page, "S16 link");
    await capturar(page, "S16-link");
    expect(await eventos(c.perfil)).toMatchObject({ cliques: 0 });
    const destino = page.waitForRequest("https://exemplo.com.br/bastidores");
    await page.getByRole("button", { name: "Continuar" }).click();
    await destino;
    await expect.poll(() => eventos(c.perfil)).toMatchObject({ cliques: 1 });
    // o link sem aviso continua indo direto
    await page.goto(`/${c.username}`);
    const normal = page.waitForRequest("https://exemplo.com.br/normal");
    await page.getByRole("link", { name: "Normal" }).click();
    await normal;
  });

  test("F11-E3 link com idade: data inválida avisa, e voltar leva à página", async ({ page, request }) => {
    const c = await contaPronta("data", [["Adega", "https://exemplo.com.br/adega"]]);
    const [l] = await sql`update links set lock = 'age', lock_min_age = 21 where profile_id = ${c.perfil} returning id`;
    await page.goto(`/r/${l.id}/aviso`);
    await expect(page.getByRole("heading", { name: "Conteúdo para maiores de 21 anos" })).toBeVisible();
    // o navegador não deixa mandar vazio nem fora do formato; pela API, a resposta é o aviso de novo
    const r = await request.post("/api/aviso", { form: { alvo: `l:${l.id}`, nascimento: "2023-02-30" }, maxRedirects: 0 });
    expect(r.status()).toBe(303);
    expect(r.headers().location).toBe(`/r/${l.id}/aviso?aviso=data`);
    expect(r.headers()["set-cookie"]).toBeUndefined();
    await page.goto(r.headers().location);
    // (o Next tem o próprio role=alert, o anunciador de rotas)
    await expect(page.getByRole("alert").filter({ hasText: "Confira" })).toHaveText("Confira a data de nascimento.");
    await expect(page.getByLabel("Data de nascimento")).toHaveAttribute("aria-invalid", "true");
    await page.getByRole("link", { name: `Voltar para a página de ${c.username}` }).click();
    await expect(page.getByRole("link", { name: /Adega/ })).toBeVisible();
  });

  test.describe(() => {
    test.use({ consoleEsperado: [/Failed to load resource/] });
    test("F11-E4 sem o JavaScript do app (antes de hidratar ou se ele não carregar): o aviso da página funciona", async ({ page }) => {
      const c = await contaPronta("semjs", [["Loja", "https://exemplo.com.br/loja"]]);
      await sql`update profiles set sensitive_label = '18' where id = ${c.perfil}`;
      // sem os pacotes do React o app não hidrata; só o HTML e o streaming embutido nele
      await page.route("**/_next/static/chunks/**", (r) => r.abort());
      await page.goto(`/${c.username}`);
      await page.getByLabel("Data de nascimento").fill(ADULTO);
      await page.getByRole("button", { name: "Continuar" }).click();
      await expect(page.getByRole("link", { name: "Loja" })).toBeVisible();
    });
  });

  test("F11-E5 só teclado, a 390 px: escolher o aviso na S12 e passar por ele na página", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const c = await contaPronta("teclaviso", [["Loja", "https://exemplo.com.br/loja"]]);
    await entrarNoPainel(page, c);
    await page.goto("/admin/configuracoes");
    await page.getByRole("radio", { name: /Sem aviso/ }).waitFor();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      if (await page.evaluate(() => (document.activeElement as HTMLInputElement | null)?.type === "radio")) break;
    }
    await page.keyboard.press("ArrowDown"); // de "Sem aviso" para "Conteúdo sensível"
    await expect(page.getByRole("radio", { name: /Conteúdo sensível/ })).toBeChecked();
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      if ((await page.evaluate(() => document.activeElement?.textContent ?? "")).includes("Salvar aviso")) break;
    }
    await page.keyboard.press("Enter");
    await expect(page.getByText("Pronto, quem abrir a página vê o aviso antes.")).toBeVisible();
    expect(await avisoDaPagina(c.perfil)).toBe("sensitive");
    await semRolagemLateral(page);
    await capturar(page, "S12");

    await page.goto(`/${c.username}`);
    await expect(page.getByRole("heading", { name: "Conteúdo sensível" })).toBeVisible();
    await semRolagemLateral(page);
    await capturar(page, "S16");
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      if ((await page.evaluate(() => document.activeElement?.textContent ?? "")) === "Continuar") break;
    }
    await page.keyboard.press("Enter");
    await expect(page.getByRole("link", { name: "Loja" })).toBeVisible();
  });

  test("F11-E6 a prévia no WhatsApp de uma página com aviso não mostra a bio", async ({ request }) => {
    const c = await contaPronta("previa");
    await sql`update profiles set sensitive_label = 'sensitive', bio = 'Bio que só aparece depois do aviso' where id = ${c.perfil}`;
    const html = await (await request.get(`/${c.username}`, { headers: { "user-agent": "WhatsApp/2.23.20.0" } })).text();
    expect(html).toContain('content="Esta página tem um aviso de conteúdo."');
    expect(html).not.toContain("Bio que só aparece depois do aviso");
  });

  test("F11-N1 a rota do aviso recusa alvo inválido e não grava nada para página sem aviso", async ({ request }) => {
    expect((await request.post("/api/aviso", { form: { alvo: "p:nada" }, maxRedirects: 0 })).status()).toBe(400);
    const inexistente = await request.post("/api/aviso", { form: { alvo: "p:00000000-0000-4000-8000-000000000000" }, maxRedirects: 0 });
    expect(inexistente.headers().location).toBe("/");
    const c = await contaPronta("semaviso");
    const r = await request.post("/api/aviso", { form: { alvo: `p:${c.perfil}` }, maxRedirects: 0 });
    expect(r.headers().location).toBe(`/${c.username}`);
    expect(r.headers()["set-cookie"]).toBeUndefined();
  });
});
