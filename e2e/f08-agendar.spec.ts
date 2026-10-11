// F08 Criador agenda um link: S07 agendar (com fuso) -> a S15 mostra ou esconde no horário.
import { capturar, contaPronta, entrarNoPainel, expect, semRolagemLateral, semViolacoes, sql, test } from "./apoio";

/** Daqui a `horas`, como um datetime-local no fuso (minutos zerados). */
function localDaqui(horas: number, fuso = "America/Sao_Paulo"): string {
  const d = new Date(Date.now() + horas * 3600_000);
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: fuso, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit" })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:00`;
}
const seloDe = (local: string) => `${local.slice(8, 10)}/${local.slice(5, 7)} às ${local.slice(11, 16)}`;

const janelaNoBanco = async (perfil: string, titulo: string) =>
  (await sql`select starts_at, ends_at, schedule_tz from links where profile_id = ${perfil} and title = ${titulo}`)[0];

test.describe("F08 agendar um link", () => {
  test("F08-H1 agendar para amanhã: o cartão avisa, a prévia e a página escondem; com a janela aberta, aparece", async ({ page }) => {
    const c = await contaPronta("agenda", [
      ["Sempre", "https://exemplo.com.br/sempre"],
      ["Promoção", "https://exemplo.com.br/promo"],
    ]);
    await entrarNoPainel(page, c);
    await page.getByRole("button", { name: "Editar Promoção" }).click();
    const amanha = localDaqui(26);
    await page.getByLabel("Aparece em").fill(amanha);
    await semViolacoes(page, "S07 agendar");
    await capturar(page, "S07-agendar", { paginaInteira: false });
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText(`Aparece ${seloDe(amanha)}`)).toBeVisible();
    const j = await janelaNoBanco(c.perfil, "Promoção");
    // Brasília é UTC-3
    expect(new Date(j.starts_at).toISOString().slice(0, 16)).toBe(new Date(Date.parse(`${amanha}:00Z`) + 3 * 3600_000).toISOString().slice(0, 16));
    expect([j.ends_at, j.schedule_tz]).toEqual([null, "America/Sao_Paulo"]);
    await expect(page.getByRole("complementary", { name: "Prévia" }).getByRole("link", { name: "Promoção" })).toHaveCount(0);
    await capturar(page, "S06-agendado");
    await page.goto(`/${c.username}`);
    await expect(page.getByRole("navigation", { name: /Links de/ }).getByRole("link")).toHaveText(["Sempre"]);

    // abrir a janela: começou há uma hora, some daqui a dois dias
    await page.goto("/admin");
    await page.getByRole("button", { name: "Editar Promoção" }).click();
    await expect(page.getByLabel("Aparece em")).toHaveValue(amanha);
    await page.getByLabel("Aparece em").fill(localDaqui(-1));
    const depois = localDaqui(48);
    await page.getByLabel("Some em").fill(depois);
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByText(`Some ${seloDe(depois)}`)).toBeVisible();
    await page.goto(`/${c.username}`);
    await expect(page.getByRole("navigation", { name: /Links de/ }).getByRole("link")).toHaveText(["Sempre", "Promoção"]);
  });

  test("F08-E1 fim antes do começo e fim que já passou são recusados, e nada muda no banco", async ({ page }) => {
    const c = await contaPronta("fimantes", [["Live", "https://exemplo.com.br/live"]]);
    await entrarNoPainel(page, c);
    await page.getByRole("button", { name: "Editar Live" }).click();
    await page.getByLabel("Aparece em").fill(localDaqui(30));
    await page.getByLabel("Some em").fill(localDaqui(5));
    // a tela já avisa enquanto digita
    await expect(page.getByRole("dialog").getByText("O fim precisa ser depois do começo.").first()).toBeVisible();
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByRole("dialog").getByRole("alert").filter({ hasText: "O fim precisa ser depois do começo." }).last()).toBeVisible();
    await page.getByLabel("Aparece em").fill("");
    await page.getByLabel("Some em").fill(localDaqui(-5));
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByText("Esse horário de sumir já passou: o link não ia aparecer.")).toBeVisible();
    expect(await janelaNoBanco(c.perfil, "Live")).toEqual({ starts_at: null, ends_at: null, schedule_tz: null });
  });

  test("F08-E2 no fuso do Amazonas: grava em UTC-4 e reabre no mesmo horário e fuso", async ({ page }) => {
    const c = await contaPronta("manaus", [["Show", "https://exemplo.com.br/show"]]);
    await entrarNoPainel(page, c);
    await page.getByRole("button", { name: "Editar Show" }).click();
    const quando = localDaqui(50, "America/Manaus");
    await page.getByLabel("Fuso").selectOption("America/Manaus");
    await page.getByLabel("Aparece em").fill(quando);
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByText(`Aparece ${seloDe(quando)}`)).toBeVisible();
    const j = await janelaNoBanco(c.perfil, "Show");
    expect(new Date(j.starts_at).toISOString().slice(0, 16)).toBe(new Date(Date.parse(`${quando}:00Z`) + 4 * 3600_000).toISOString().slice(0, 16));
    expect(j.schedule_tz).toBe("America/Manaus");
    await page.getByRole("button", { name: "Editar Show" }).click();
    await expect(page.getByLabel("Fuso")).toHaveValue("America/Manaus");
    await expect(page.getByLabel("Aparece em")).toHaveValue(quando);
  });

  test("F08-E3 tirar o agendamento: o link volta a ficar sempre na página", async ({ page }) => {
    const c = await contaPronta("tirar", [["Cupom", "https://exemplo.com.br/cupom"]]);
    await sql`update links set starts_at = now() + interval '3 days' where profile_id = ${c.perfil}`;
    await entrarNoPainel(page, c);
    await expect(page.getByText(/^Aparece /)).toBeVisible();
    await page.getByRole("button", { name: "Editar Cupom" }).click();
    await page.getByRole("button", { name: "Tirar o agendamento" }).click();
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByText(/^Aparece /)).toHaveCount(0);
    expect((await janelaNoBanco(c.perfil, "Cupom")).starts_at).toBeNull();
    await page.goto(`/${c.username}`);
    await expect(page.getByRole("link", { name: "Cupom" })).toBeVisible();
  });

  test("F08-E4 a 390 px: o agendamento cabe na tela e o link encerrado aparece como encerrado", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const c = await contaPronta("agenda390", [["Black Friday", "https://exemplo.com.br/bf"]]);
    await sql`update links set starts_at = now() - interval '3 days', ends_at = now() - interval '1 day' where profile_id = ${c.perfil}`;
    await entrarNoPainel(page, c);
    await expect(page.getByText("Encerrado")).toBeVisible();
    await page.getByRole("button", { name: "Editar Black Friday" }).click();
    await expect(page.getByLabel("Some em")).not.toHaveValue("");
    await semRolagemLateral(page);
    await semViolacoes(page, "S07 agendar 390");
    await capturar(page, "S07-agendar", { paginaInteira: false });
  });
});
