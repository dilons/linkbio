// F07 Criador exporta os inscritos: S10 lista -> CSV.
import { readFile } from "node:fs/promises";
import { capturar, contaPronta, entrarNoPainel, expect, semRolagemLateral, semViolacoes, sql, test } from "./apoio";

async function comInscritos(nome: string, pessoas: Array<[string, string | null]>) {
  const c = await contaPronta(nome);
  const [l] = await sql`insert into links (profile_id, kind, title, position) values (${c.perfil}, 'form', 'Lista VIP', 0) returning id`;
  await sql`insert into forms (link_id, consent_text) values (${l.id}, 'Aceito receber a lista VIP por email.')`;
  for (const [i, [email, nomeP]] of pessoas.entries()) {
    await sql`insert into submissions (profile_id, link_id, email, name, consent_text, created_at)
              values (${c.perfil}, ${l.id}, ${email}, ${nomeP}, 'Aceito receber a lista VIP por email.', now() - make_interval(mins => ${i}))`;
  }
  return c;
}

test.describe("F07 exporta os inscritos", () => {
  test("F07-H1 a lista mostra os inscritos e o CSV vem certo (BOM, ponto e vírgula, sem fórmula)", async ({ page }) => {
    const c = await comInscritos("csv", [
      ["ana@exemplo.com", "Ana"],
      ["beto@exemplo.com", '=HYPERLINK("http://mal.example","clique")'],
      ["caio@exemplo.com", null],
    ]);
    await entrarNoPainel(page, c);
    await page.getByRole("link", { name: "Audiência" }).click();
    await expect(page.getByRole("heading", { name: "3 inscritos" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "ana@exemplo.com", exact: true })).toBeVisible();
    await semViolacoes(page, "S10");
    await capturar(page, "S10");
    const baixando = page.waitForEvent("download");
    await page.getByRole("link", { name: "Baixar CSV" }).click();
    const arquivo = await baixando;
    expect(arquivo.suggestedFilename()).toMatch(new RegExp(`^inscritos-${c.username.replace(".", "\\.")}-\\d{4}-\\d{2}-\\d{2}\\.csv$`));
    const texto = await readFile((await arquivo.path())!, "utf8");
    expect(texto.charCodeAt(0)).toBe(0xfeff);
    const linhas = texto.slice(1).trim().split("\r\n");
    expect(linhas[0]).toBe("email;nome;formulario;inscrito_em;consentimento_aceito");
    expect(linhas).toHaveLength(4);
    expect(linhas[1]).toMatch(/^"ana@exemplo.com";"Ana";"Lista VIP";"\d{4}-\d{2}-\d{2} \d{2}:\d{2}";"Aceito receber a lista VIP por email."$/);
    expect(linhas[2]).toContain(`"'=HYPERLINK(""http://mal.example"",""clique"")"`);
  });

  test("F07-E1 lista vazia: convite para pôr o formulário e nenhum botão de CSV", async ({ page }) => {
    const c = await contaPronta("vazia");
    await entrarNoPainel(page, c);
    await page.goto("/admin/audiencia");
    await expect(page.getByText("Ninguém se inscreveu ainda.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Baixar CSV" })).toHaveCount(0);
    await semViolacoes(page, "S10 vazia");
  });

  test("F07-E2 tirar uma pessoa da lista: some da tela e do CSV", async ({ page }) => {
    const c = await comInscritos("tira", [["fica@exemplo.com", null], ["sai@exemplo.com", null]]);
    await entrarNoPainel(page, c);
    await page.goto("/admin/audiencia");
    await page.getByRole("button", { name: "Tirar sai@exemplo.com da lista" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Tirar da lista" }).click();
    await expect(page.getByText("Tirado da lista")).toBeVisible();
    await expect(page.getByRole("cell", { name: "sai@exemplo.com" })).toHaveCount(0);
    const csv = await (await page.request.get("/api/audiencia.csv")).text();
    expect(csv).toContain("fica@exemplo.com");
    expect(csv).not.toContain("sai@exemplo.com");
  });

  test("F07-E3 o CSV é só do dono: sem sessão 401, outra conta não vê os inscritos", async ({ page, request }) => {
    const dono = await comInscritos("dono", [["segredo@exemplo.com", null]]);
    expect((await request.get("/api/audiencia.csv")).status()).toBe(401);
    const outra = await contaPronta("curioso");
    await entrarNoPainel(page, outra);
    const csv = await (await page.request.get("/api/audiencia.csv")).text();
    expect(csv).not.toContain("segredo@exemplo.com");
    await page.goto("/admin/audiencia");
    await expect(page.getByText("segredo@exemplo.com")).toHaveCount(0);
    void dono;
  });

  test("F07-E4 a 390 px a tabela rola dentro dela, sem rolar a página", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const c = await comInscritos("estreita", [["um.email.bem.comprido.para.testar@exemplo.com.br", "Maria Aparecida dos Santos Oliveira"]]);
    await entrarNoPainel(page, c);
    await page.goto("/admin/audiencia");
    await expect(page.getByRole("heading", { name: "1 inscrito" })).toBeVisible();
    await semRolagemLateral(page);
    await capturar(page, "S10");
  });
});
