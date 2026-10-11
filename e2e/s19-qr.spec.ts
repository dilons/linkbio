// S19 QR code da página (na S12): gerado pelo app, leva à página e marca a origem "qr" nos insights.
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { capturar, contaPronta, entrarNoPainel, expect, semRolagemLateral, semViolacoes, sql, test } from "./apoio";
import { MARCA } from "../src/lib/marca";

function lerQr(png: Buffer): string | null {
  const img = PNG.sync.read(png);
  return jsQR(new Uint8ClampedArray(img.data), img.width, img.height)?.data ?? null;
}

test.describe("S19 QR code da página", () => {
  test("S19-H1 a S12 mostra o QR; o PNG baixado leva à página com ?origem=qr e o SVG baixa com nome", async ({ page, baseURL }) => {
    const c = await contaPronta("qr", [["Cardápio", "https://exemplo.com.br/cardapio"]]);
    await entrarNoPainel(page, c);
    await page.getByRole("link", { name: "Configurações" }).click();
    const img = page.getByRole("img", { name: `QR code que leva a ${MARCA.dominio}/${c.username}` });
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
    await semViolacoes(page, "S12 com QR");
    await capturar(page, "S19");

    const baixarPng = page.waitForEvent("download");
    await page.getByRole("link", { name: "Baixar PNG" }).click();
    const png = await baixarPng;
    expect(png.suggestedFilename()).toBe(`qr-${c.username}.png`);
    const caminho = await png.path();
    const { readFileSync } = await import("node:fs");
    expect(lerQr(readFileSync(caminho))).toBe(`${baseURL}/${c.username}?origem=qr`);

    const baixarSvg = page.waitForEvent("download");
    await page.getByRole("link", { name: "Baixar SVG (para gráfica)" }).click();
    const svg = await baixarSvg;
    expect(svg.suggestedFilename()).toBe(`qr-${c.username}.svg`);
    expect(readFileSync(await svg.path(), "utf8")).toContain("<svg");
  });

  test("S19-E1 quem chega pelo QR conta com a origem \"qr\" e o ?origem some do endereço", async ({ page }) => {
    const c = await contaPronta("qrvisita", [["Loja", "https://exemplo.com.br/loja"]]);
    const visita = page.waitForResponse((r) => r.url().endsWith("/api/e") && r.status() === 204);
    await page.goto(`/${c.username}?origem=qr`);
    await visita;
    await expect(page).toHaveURL(new RegExp(`/${c.username.replace(".", "\\.")}$`));
    await expect.poll(async () => (await sql`select source from events where profile_id = ${c.perfil} and type = 'view'`).map((e) => e.source)).toEqual(["qr"]);
  });

  test("S19-E2 endereço que não existe não ganha QR", async ({ request }) => {
    expect((await request.get("/api/qr/ninguem.mora.aqui")).status()).toBe(404);
    expect((await request.get("/api/qr/..%2Fadmin")).status()).toBe(404);
  });

  test("S19-E3 a 390 px o QR e os botões cabem e dá para baixar só com teclado", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const c = await contaPronta("qr390");
    await entrarNoPainel(page, c);
    await page.goto("/admin/configuracoes");
    await page.getByRole("link", { name: "Baixar PNG" }).waitFor();
    await semRolagemLateral(page);
    await capturar(page, "S19");
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      if ((await page.evaluate(() => document.activeElement?.textContent ?? "")).includes("Baixar PNG")) break;
    }
    const baixar = page.waitForEvent("download");
    await page.keyboard.press("Enter");
    expect((await baixar).suggestedFilename()).toBe(`qr-${c.username}.png`);
  });
});
