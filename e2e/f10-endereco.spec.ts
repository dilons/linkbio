// F10 Criador troca o endereço da página: S13 trocar (1 vez a cada 7 dias); o antigo leva ao novo e fica guardado 14 dias.
import { capturar, contaPronta, entrarNoPainel, expect, semRolagemLateral, semViolacoes, sql, sufixo, test } from "./apoio";
import { MARCA } from "../src/lib/marca";

const perfilAtual = async (perfil: string) => (await sql`select username, username_changed_at from profiles where id = ${perfil}`)[0];

test.describe("F10 trocar o endereço", () => {
  test("F10-H3 trocar o endereço: a página vai para o novo, o antigo redireciona e os links seguem funcionando", async ({ page, request }) => {
    const c = await contaPronta("troca", [["Loja", "https://exemplo.com.br/loja"]]);
    const novo = `nova.${sufixo()}`;
    await entrarNoPainel(page, c);
    await page.getByRole("link", { name: "Conta" }).click();
    await expect(page.getByRole("heading", { name: "Endereço da página" })).toBeVisible();
    await semViolacoes(page, "S13");
    await page.getByLabel("Endereço novo").fill(novo);
    await expect(page.getByText(`${MARCA.dominio}/${novo} está livre.`)).toBeVisible();
    await page.getByRole("button", { name: "Trocar o endereço" }).click();
    await expect(page.getByText(`Pronto, sua página agora está em ${MARCA.dominio}/${novo}.`)).toBeVisible();
    await expect(page.getByText(/A próxima troca fica liberada em/)).toBeVisible();
    await capturar(page, "S13-endereco");
    expect((await perfilAtual(c.perfil)).username).toBe(novo);
    const [antigo] = await sql`select deleted_at, moved_to, account_id from profiles where username = ${c.username}`;
    expect([antigo.moved_to, antigo.account_id]).toEqual([c.perfil, c.id]);
    expect(antigo.deleted_at).not.toBeNull();

    // o endereço antigo leva ao novo, para gente e para robô de prévia
    const r = await request.get(`/${c.username}`, { maxRedirects: 0, headers: { "user-agent": "WhatsApp/2.23.20.0" } });
    expect(r.status()).toBe(307);
    expect(r.headers().location).toBe(`/${novo}`);
    await page.goto(`/${c.username}`);
    await expect(page).toHaveURL(new RegExp(`/${novo.replace(".", "\\.")}$`));
    // os links são por id: continuam valendo
    await page.route("https://exemplo.com.br/**", (rota) => rota.fulfill({ body: "destino" }));
    const destino = page.waitForRequest("https://exemplo.com.br/loja");
    await page.getByRole("link", { name: "Loja" }).click();
    await destino;
    // o painel mostra o endereço novo
    await page.goto("/admin");
    await expect(page.getByText(`${MARCA.dominio}/${novo}`).first()).toBeVisible();
  });

  test("F10-E4 uma troca a cada 7 dias: na mesma semana o formulário some e o servidor recusa", async ({ page }) => {
    const c = await contaPronta("semana");
    await sql`update profiles set username_changed_at = now() - interval '2 days' where id = ${c.perfil}`;
    await entrarNoPainel(page, c);
    await page.goto("/admin/conta");
    await expect(page.getByText(/Você trocou o endereço há pouco\. A próxima troca fica liberada em \d{2}\/\d{2}, \d{2}:\d{2}\./)).toBeVisible();
    await expect(page.getByLabel("Endereço novo")).toHaveCount(0);
    await capturar(page, "S13-bloqueada");
    // passados os 7 dias, volta
    await sql`update profiles set username_changed_at = now() - interval '8 days' where id = ${c.perfil}`;
    await page.reload();
    await expect(page.getByLabel("Endereço novo")).toBeVisible();
  });

  test("F10-E6 o antigo fica guardado 14 dias: outra conta não pega; depois disso, fica livre e dá 404", async ({ page, browser }) => {
    const c = await contaPronta("guarda");
    const novo = `guardou.${sufixo()}`;
    await entrarNoPainel(page, c);
    await page.goto("/admin/conta");
    await page.getByLabel("Endereço novo").fill(novo);
    await page.getByRole("button", { name: "Trocar o endereço" }).click();
    await expect(page.getByText(/Pronto, sua página agora está em/)).toBeVisible();

    const outra = await contaPronta("outra");
    const ctx = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": `198.51.100.${1 + Math.floor(Math.random() * 254)}` } });
    const p2 = await ctx.newPage();
    await entrarNoPainel(p2, outra);
    await p2.goto("/admin/conta");
    await p2.getByLabel("Endereço novo").fill(c.username);
    await expect(p2.getByText("Alguém já usa esse endereço. Tente outro.")).toBeVisible();
    // espera a resposta da ação: o aviso já estava na tela pela checagem ao vivo
    const resposta = p2.waitForResponse((r) => r.request().method() === "POST" && r.url().endsWith("/admin/conta"));
    await p2.getByRole("button", { name: "Trocar o endereço" }).click();
    await resposta;
    await expect(p2.getByText("Alguém já usa esse endereço. Tente outro.")).toBeVisible();
    expect((await perfilAtual(outra.perfil)).username).toBe(outra.username);

    // passaram 15 dias: o redirecionamento acaba e o job de limpeza libera o endereço
    await sql`update profiles set deleted_at = now() - interval '15 days' where username = ${c.username}`;
    expect((await p2.request.get(`/${c.username}`, { maxRedirects: 0 })).status()).not.toBe(307);
    await sql`delete from profiles where deleted_at < now() - interval '14 days' and username = ${c.username}`;
    // o campo já tinha esse valor: limpar antes, para a checagem rodar de novo
    await p2.getByLabel("Endereço novo").fill("");
    await p2.getByLabel("Endereço novo").fill(c.username);
    await expect(p2.getByText(`${MARCA.dominio}/${c.username} está livre.`)).toBeVisible();
    await ctx.close();
  });

  test("F10-E7 a própria conta retoma o endereço antigo (depois dos 7 dias), sem sobrar linha guardada", async ({ page }) => {
    const c = await contaPronta("volta");
    const meio = `meio.${sufixo()}`;
    await entrarNoPainel(page, c);
    await page.goto("/admin/conta");
    await page.getByLabel("Endereço novo").fill(meio);
    await page.getByRole("button", { name: "Trocar o endereço" }).click();
    await expect(page.getByText(/Pronto, sua página agora está em/)).toBeVisible();
    await sql`update profiles set username_changed_at = now() - interval '8 days' where id = ${c.perfil}`;
    await page.reload();
    await page.getByLabel("Endereço novo").fill(c.username);
    await expect(page.getByText(`${MARCA.dominio}/${c.username} está livre.`)).toBeVisible();
    await page.getByRole("button", { name: "Trocar o endereço" }).click();
    await expect(page.getByText(`Pronto, sua página agora está em ${MARCA.dominio}/${c.username}.`)).toBeVisible();
    const linhas = await sql`select username, deleted_at is not null as guardado, moved_to from profiles where account_id = ${c.id} order by username`;
    expect(linhas.map((l) => [l.username, l.guardado, l.moved_to])).toEqual(
      [
        [c.username, false, null],
        [meio, true, c.perfil],
      ].sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    );
  });

  test("F10-E8 o mesmo endereço, um reservado ou um inválido: avisa e não troca", async ({ page }) => {
    const c = await contaPronta("invalido");
    await entrarNoPainel(page, c);
    await page.goto("/admin/conta");
    const campo = page.getByLabel("Endereço novo");
    await campo.fill(c.username.toUpperCase());
    await expect(page.getByText("Esse já é o endereço da sua página.")).toBeVisible();
    await campo.fill("chamaqui");
    await expect(page.getByText("Esse endereço é reservado. Tente outro.")).toBeVisible();
    await campo.fill("a b");
    await page.getByRole("button", { name: "Trocar o endereço" }).click();
    await expect(page.getByText("Use pelo menos 3 caracteres.").or(page.getByText("Use só letras sem acento, números, ponto e sublinhado."))).toBeVisible();
    expect((await perfilAtual(c.perfil)).username_changed_at).toBeNull();
  });

  test("F10-E9 só teclado, a 390 px: troca o endereço", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const c = await contaPronta("tecla390");
    const novo = `tecla.${sufixo()}`;
    await entrarNoPainel(page, c);
    await page.goto("/admin/conta");
    await page.getByLabel("Endereço novo").waitFor();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      if (await page.evaluate(() => (document.activeElement as HTMLInputElement | null)?.name === "username")) break;
    }
    await page.keyboard.type(novo);
    await expect(page.getByText(`${MARCA.dominio}/${novo} está livre.`)).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.getByText(`Pronto, sua página agora está em ${MARCA.dominio}/${novo}.`)).toBeVisible();
    await semRolagemLateral(page);
    await capturar(page, "S13-endereco");
  });
});
