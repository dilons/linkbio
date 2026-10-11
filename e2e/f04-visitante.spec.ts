// F04 Visitante abre a página e clica num link: S15 -> link externo, com o clique contado.
import { capturar, contaPronta, DEMO, expect, semRolagemLateral, semViolacoes, sql, test } from "./apoio";
import { MARCA } from "../src/lib/marca";

const BOT = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

async function eventos(perfil: string) {
  const [r] = await sql`select count(*) filter (where type = 'view')::int as visitas, count(*) filter (where type = 'click')::int as cliques from events where profile_id = ${perfil}`;
  return r;
}

test.describe("F04 visitante abre a página e clica", () => {
  test("F04-H1 abre a página, a visita conta, o clique conta e leva ao destino", async ({ page }) => {
    const c = await contaPronta("vis", [["Loja", "https://exemplo.com.br/loja"]]);
    const visita = page.waitForResponse((r) => r.url().endsWith("/api/e") && r.status() === 204);
    await page.goto(`/${c.username}`);
    await visita;
    await semViolacoes(page, "S15");
    await capturar(page, "S15");
    await page.route("https://exemplo.com.br/**", (r) => r.fulfill({ body: "destino" }));
    const destino = page.waitForRequest("https://exemplo.com.br/loja");
    await page.getByRole("link", { name: "Loja" }).click();
    await destino;
    await expect.poll(() => eventos(c.perfil)).toEqual({ visitas: 1, cliques: 1 });
  });

  test("F04-E1 endereço livre: 404 de verdade para robô de prévia, página de 404 com noindex no navegador", async ({ page, request }) => {
    const r = await request.get("/ninguem.mora.aqui", { headers: { "user-agent": BOT } });
    expect(r.status()).toBe(404);
    await page.goto("/ninguem.mora.aqui");
    await expect(page.getByRole("heading", { name: "Ninguém mora neste endereço (ainda)" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", "noindex");
    await semViolacoes(page, "404");
    await capturar(page, "404");
  });

  test("F04-E2 perfil excluído some (404) e o clique antigo não redireciona", async ({ page, request }) => {
    const c = await contaPronta("exc", [["Loja", "https://exemplo.com.br/loja"]]);
    const [l] = await sql`select id from links where profile_id = ${c.perfil}`;
    await sql`delete from auth.users where id = ${c.id}`;
    expect((await request.get(`/${c.username}`, { headers: { "user-agent": BOT } })).status()).toBe(404);
    const r = await request.get(`/r/${l.id}`, { maxRedirects: 0 });
    expect(r.status()).toBe(404);
    await page.goto(`/${c.username}`);
    await expect(page.getByRole("heading", { name: "Ninguém mora neste endereço (ainda)" })).toBeVisible();
  });

  test.describe(() => {
    // o navegador registra no console o status 404 da página de link indisponível
    test.use({ consoleEsperado: [/status of 404/] });
    test("F04-E3 link desligado depois que a página abriu: o clique mostra uma página amigável, não um texto cru", async ({ page }) => {
      const c = await contaPronta("desl", [["Promo", "https://exemplo.com.br/promo"]]);
      await page.goto(`/${c.username}`);
      await sql`update links set enabled = false where profile_id = ${c.perfil}`;
      await page.getByRole("link", { name: "Promo" }).click();
      await expect(page.getByRole("heading", { name: "Este link não está mais disponível" })).toBeVisible();
      await semViolacoes(page, "link indisponível");
      await capturar(page, "link-indisponivel");
      await page.getByRole("link", { name: `Ver a página de ${c.username}` }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(c.username);
    });
  });

  test("F04-E4 robôs e prévias de redes não contam visita nem clique", async ({ request }) => {
    const c = await contaPronta("bot", [["Loja", "https://exemplo.com.br/loja"]]);
    const [l] = await sql`select id from links where profile_id = ${c.perfil}`;
    const r = await request.get(`/r/${l.id}`, { headers: { "user-agent": BOT }, maxRedirects: 0 });
    expect(r.status()).toBe(302);
    expect(r.headers()["location"]).toBe("https://exemplo.com.br/loja");
    await request.post("/api/e", { headers: { "user-agent": "Googlebot/2.1" }, data: { p: c.perfil } });
    expect(await eventos(c.perfil)).toEqual({ visitas: 0, cliques: 0 });
  });

  test("F04-E5 endereço com maiúsculas ou @ abre a mesma página", async ({ page }) => {
    for (const u of [DEMO.username.toUpperCase(), `@${DEMO.username}`]) {
      await page.goto(`/${encodeURIComponent(u)}`);
      await expect(page.getByRole("heading", { name: "Doces da Ana", level: 1 })).toBeVisible();
    }
  });

  test("F04-E6 celular com rede lenta: a página abre, sem rolagem lateral", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 400, downloadThroughput: 50_000, uploadThroughput: 20_000 });
    await page.goto(`/${DEMO.username}`, { timeout: 45_000 });
    await expect(page.getByRole("link", { name: "Faça sua encomenda" })).toBeVisible({ timeout: 30_000 });
    await semRolagemLateral(page);
    await capturar(page, "S15-demo");
  });

  test("F04-E7 /r/ com id inválido, inexistente ou de outro tipo não redireciona para lugar nenhum", async ({ request }) => {
    // "../" literal o próprio cliente resolve antes de pedir; codificado, chega ao /r/
    for (const id of ["nao-e-uuid", "00000000-0000-4000-8000-000000000000", "%2e%2e%2f%2e%2e%2fadmin", "c0c0c0c0-0000-4000-8000-000000000001%2F..%2F"]) {
      const r = await request.get(`/r/${id}`, { maxRedirects: 0 });
      expect(r.status(), id).toBe(404);
      expect(r.headers()["location"], id).toBeUndefined();
    }
  });

  test("F04-E8 link agendado fora da janela não aparece nem redireciona", async ({ page, request }) => {
    const c = await contaPronta("agenda", [["Agora", "https://exemplo.com.br/agora"], ["Amanhã", "https://exemplo.com.br/amanha"], ["Ontem", "https://exemplo.com.br/ontem"]]);
    await sql`update links set starts_at = now() + interval '1 day' where profile_id = ${c.perfil} and title = 'Amanhã'`;
    await sql`update links set starts_at = now() - interval '2 days', ends_at = now() - interval '1 day' where profile_id = ${c.perfil} and title = 'Ontem'`;
    await page.goto(`/${c.username}`);
    await expect(page.getByRole("navigation", { name: /Links de/ }).getByRole("link")).toHaveText(["Agora"]);
    const [amanha] = await sql`select id from links where profile_id = ${c.perfil} and title = 'Amanhã'`;
    expect((await request.get(`/r/${amanha.id}`, { maxRedirects: 0 })).status()).toBe(404);
  });

  test("F04-E9 só teclado: Tab até o link e Enter abre o destino", async ({ page }) => {
    const c = await contaPronta("tecla", [["Loja", "https://exemplo.com.br/loja"]]);
    await page.goto(`/${c.username}`);
    await page.route("https://exemplo.com.br/**", (r) => r.fulfill({ body: "destino" }));
    // o esqueleto do Suspense não tem nada focável: Tab só depois do conteúdo
    await page.getByRole("link", { name: "Loja" }).waitFor();
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      if ((await page.evaluate(() => document.activeElement?.textContent)) === "Loja") break;
    }
    const destino = page.waitForRequest("https://exemplo.com.br/loja");
    await page.keyboard.press("Enter");
    await destino;
  });

  test("F04-E10 a prévia do link no WhatsApp tem título e descrição do perfil", async ({ request }) => {
    const html = await (await request.get(`/${DEMO.username}`, { headers: { "user-agent": "WhatsApp/2.23.20.0" } })).text();
    expect(html).toContain(`<title>Doces da Ana · ${MARCA.nome}</title>`);
    expect(html).toContain('content="Confeitaria artesanal em BH. Encomendas pelo link abaixo."');
  });
});
