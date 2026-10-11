// Teste ponta a ponta da fatia vertical: cadastro, endereço, links, página
// pública, clique contado, insights, login; a 1440 e a 390 px (esta só com
// teclado), com axe em cada tela. Grava as capturas para a /replica-diff.
//
// Com o app rodando num banco novo (LINKBIO_DEMO=1 next start -p 3123):
//   npm run e2e                       # capturas em replica/clone-screens
// Variáveis: E2E_BASE (padrão http://localhost:3123) e CHROMIUM_PATH (um
// Chromium já instalado, se o do Playwright não estiver baixado).
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const BASE = process.env.E2E_BASE ?? "http://localhost:3123";
const OUT = process.argv[2] ?? "replica/clone-screens";
const sufixo = Date.now().toString(36);
const EMAIL = `ana.${sufixo}@exemplo.com`;
const SENHA = "senha-boa-123";
const USER = `loja.${sufixo}`;

const erros = [];
const axeRes = [];
let falhas = 0;
const ok = (cond, msg) => {
  console.log(cond ? "ok   " : "FALHA", msg);
  if (!cond) falhas++;
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

async function novoContexto(w, h) {
  // o Chromium headless se anuncia como "HeadlessChrome" e o isbot (com razão)
  // o trata como robô; aqui ele se passa por um Chrome comum para ser contado
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  });
  // destinos externos dos links: responde aqui mesmo, sem sair para a rede
  await ctx.route(/^https:\/\/(www\.)?exemplo\.com\.br\//, (r) => r.fulfill({ contentType: "text/html", body: "<title>destino</title>destino" }));
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && erros.push(`${w} ${page.url()}: ${m.text()}`));
  page.on("pageerror", (e) => erros.push(`${w} ${page.url()}: ${e.message}`));
  return { ctx, page };
}

async function axe(page, nome) {
  const r = await new AxeBuilder({ page }).analyze();
  axeRes.push([nome, r.violations.map((v) => `${v.id}(${v.nodes.length})`)]);
}

async function semRolagemLateral(page, nome) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  ok(sw <= iw, `${nome}: sem rolagem lateral (${sw} <= ${iw})`);
}

async function foto(page, id, w) {
  await page.screenshot({ path: `${OUT}/${id}-${w}.png`, fullPage: true });
}

// ---------------------------------------------------------------- 1440: o fluxo completo
{
  const W = 1440;
  const { ctx, page } = await novoContexto(W, 900);

  // S01 cadastro: vazio, erro, sucesso
  await page.goto(`${BASE}/cadastro`, { waitUntil: "networkidle" });
  await foto(page, "S01", W);
  await axe(page, "S01");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await page.locator("main [role=alert]").first().waitFor();
  ok((await page.locator("main [role=alert]").count()) >= 1, "S01: envio vazio mostra erro");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Senha").fill("curta");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await page.getByText("pelo menos 8 caracteres.").waitFor();
  ok((await page.getByLabel("Email").inputValue()) === EMAIL, "S01: email continua no campo depois do erro");
  await foto(page, "S01-erro", W);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await page.waitForURL("**/comecar");
  ok(true, "S01 -> S03 depois do cadastro");

  // S03 endereço: ocupado, reservado, livre
  await page.getByLabel("Seu endereço").fill("doces.da.ana");
  await page.getByText("Alguém já usa").waitFor();
  ok(true, "S03: endereço em uso avisa enquanto digita");
  await page.getByLabel("Seu endereço").fill("admin");
  await page.getByText("reservado").waitFor();
  ok(true, "S03: endereço reservado avisa");
  await foto(page, "S03-erro", W);
  await page.getByLabel("Seu endereço").fill(USER);
  await page.getByText("está livre").waitFor();
  await foto(page, "S03", W);
  await axe(page, "S03");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/admin");
  ok(true, "S03 -> S06 depois de escolher o endereço");

  // S06 vazio
  await page.getByText("Sua página ainda não tem links").waitFor();
  ok(true, "S06: estado vazio");
  await foto(page, "S06-vazio", W);

  // adicionar: erro e dois links
  const titulo = page.getByRole("textbox", { name: "Título" });
  const endereco = page.getByRole("textbox", { name: "Endereço" });
  await endereco.fill("isso não é url");
  await page.getByRole("button", { name: "Adicionar" }).click();
  await page.locator("main [role=alert]").first().waitFor();
  ok((await page.locator("main [role=alert]").count()) >= 1, "S06: link inválido mostra erro");
  ok((await endereco.inputValue()) === "isso não é url", "S06: o que foi digitado volta depois do erro");
  await titulo.fill("Meu site");
  await endereco.fill("exemplo.com.br");
  await page.getByRole("button", { name: "Adicionar" }).click();
  await page.getByText("Link adicionado").waitFor();
  await page.getByText("https://exemplo.com.br/", { exact: true }).waitFor();
  ok(true, "S06: link adicionado, https:// completado");
  await titulo.fill("Catálogo de bolos");
  await endereco.fill("https://exemplo.com.br/catalogo");
  await page.getByRole("button", { name: "Adicionar" }).click();
  await page.getByRole("button", { name: "Mover Catálogo de bolos" }).waitFor();
  const ordem = () => page.locator("ul li p.truncate.text-sm").allInnerTexts();
  ok((await ordem())[0] === "Catálogo de bolos", "S06: link novo entra no topo");
  ok((await titulo.inputValue()) === "", "S06: formulário limpo depois de adicionar");

  // título e bio, com conteúdo longo
  const nomeLongo = "Loja de Doces da Ana com Encomendas para Festas e Casamentos"; // 60
  await page.getByRole("button", { name: "Editar título e bio" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Título").fill(nomeLongo);
  await dlg.getByLabel("Bio").fill("Bolos, doces finos e encomendas para festas em Belo Horizonte. Entregamos na região metropolitana às sextas e aos sábados, com hora marcada.");
  await dlg.getByRole("button", { name: "Salvar" }).click();
  await dlg.waitFor({ state: "detached" });
  await page.getByText(nomeLongo).first().waitFor();
  ok(true, "S06: título e bio salvos, modal fecha");

  // reordenar só com teclado: "Meu site" sobe
  await page.getByRole("button", { name: "Mover Meu site" }).focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(300);
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(300);
  await page.keyboard.press("Space");
  await page.getByText("Ordem salva").waitFor();
  await page.reload({ waitUntil: "networkidle" });
  ok((await ordem())[0] === "Meu site", "S06: nova ordem salva e mantida depois de recarregar");

  // editar
  await page.getByRole("button", { name: "Editar Meu site" }).click();
  await page.getByRole("dialog").getByLabel("Título").fill("Meu site oficial");
  await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();
  await page.getByRole("dialog").waitFor({ state: "detached" });
  await page.getByRole("button", { name: "Mover Meu site oficial" }).waitFor();
  ok(true, "S06: link editado");

  // desligar e excluir
  await titulo.fill("Promoção relâmpago");
  await endereco.fill("exemplo.com.br/promo");
  await page.getByRole("button", { name: "Adicionar" }).click();
  await page.getByRole("button", { name: "Mover Promoção relâmpago" }).waitFor();
  await page.getByRole("switch", { name: "Mostrar Promoção relâmpago na página" }).click();
  await page.getByText("Desligado").waitFor();
  ok(true, "S06: link desligado mostra o selo");
  await page.waitForTimeout(500);
  await foto(page, "S06", W);
  await axe(page, "S06");
  await page.getByRole("button", { name: "Excluir Promoção relâmpago" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Excluir" }).click();
  await page.getByText("Link excluído").waitFor();
  await page.reload({ waitUntil: "networkidle" });
  ok((await page.getByRole("button", { name: "Mover Promoção relâmpago" }).count()) === 0, "S06: link excluído some depois de recarregar");
  await page.getByRole("button", { name: "Excluir Catálogo de bolos" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
  ok((await page.getByRole("button", { name: "Mover Catálogo de bolos" }).count()) === 1, "S06: cancelar não exclui");

  // S15 a página pública
  const visita = page.waitForResponse((r) => r.url().endsWith("/api/e") && r.status() === 204);
  await page.goto(`${BASE}/${USER}`, { waitUntil: "networkidle" });
  await visita;
  ok(true, "S15: visita registrada (204)");
  const botoes = await page.getByRole("navigation", { name: /Links de/ }).getByRole("link").allInnerTexts();
  ok(botoes.join("|") === "Meu site oficial|Catálogo de bolos", `S15: links na ordem certa (${botoes.join(" | ")})`);
  ok((await page.title()).startsWith(nomeLongo), "S15: título da aba com o nome do perfil");
  await foto(page, "S15", W);
  await axe(page, "S15");
  // o Playwright não intercepta o destino de um 302; basta ver o pedido sair
  const destino = page.waitForRequest("https://exemplo.com.br/catalogo");
  await page.getByRole("link", { name: "Catálogo de bolos" }).click();
  await destino;
  ok(true, "S15: clique leva ao destino passando por /r/");

  // S09 insights
  await page.goto(`${BASE}/admin/insights`, { waitUntil: "networkidle" });
  const texto = await page.locator("main").innerText();
  const num = (rotulo) => Number(texto.match(new RegExp(`${rotulo}\\n([\\d.]+)`))?.[1]?.replace(".", ""));
  ok(num("Visitas") === 1, `S09: 1 visita (${num("Visitas")})`);
  ok(num("Cliques") === 1, `S09: 1 clique (${num("Cliques")})`);
  await foto(page, "S09", W);
  await axe(page, "S09");

  // stubs do painel
  for (const [id, rota] of [["S08", "aparencia"], ["S10", "audiencia"], ["S12", "configuracoes"], ["S13", "conta"], ["S14", "plano"]]) {
    await page.goto(`${BASE}/admin/${rota}`, { waitUntil: "networkidle" });
    await foto(page, id, W);
    await axe(page, id);
  }

  // sair, entrar com senha errada, entrar
  await page.goto(`${BASE}/admin/conta`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Sair" }).last().click();
  await page.waitForURL("**/entrar");
  await foto(page, "S18", W);
  await axe(page, "S18");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Senha").fill("senha-errada-1");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.locator("main [role=alert]").waitFor();
  ok(true, "S18: senha errada mostra erro");
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/admin");
  ok(true, "S18: login leva ao painel");

  // stubs de entrada e 404
  for (const [id, rota] of [["S02", "confirmar"], ["S04", "comecar/modelo"], ["S05", "comecar/plano"], ["S18b", "entrar/recuperar"], ["404", "ninguem.mora.aqui"]]) {
    await page.goto(`${BASE}/${rota}`, { waitUntil: "networkidle" });
    await foto(page, id, W);
    await axe(page, id);
  }
  await ctx.close();
}

// ---------------------------------------------------------------- outra conta não mexe no que não é dela
{
  const { ctx, page } = await novoContexto(1440, 900);
  await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("demo@linkbio.test");
  await page.getByLabel("Senha").fill("linkbio-demo-2026");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/admin");
  await page.getByRole("button", { name: /^Mover / }).first().waitFor();
  ok((await page.getByRole("button", { name: /^Mover / }).count()) === 4, "demo: vê só os 4 links dela");
  ok((await page.getByText("Catálogo de bolos").count()) === 0, "demo: não vê links da outra conta");
  await page.goto(`${BASE}/admin/insights`, { waitUntil: "networkidle" });
  await foto(page, "S09-demo", 1440);
  await ctx.close();
}

// ---------------------------------------------------------------- 390: só teclado, do zero
{
  const W = 390;
  const { ctx, page } = await novoContexto(W, 844);
  const tabAte = async (nome) => {
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const atual = await page.evaluate(() => {
        const el = document.activeElement;
        return (el?.labels?.[0]?.textContent ?? el?.getAttribute("aria-label") ?? el?.textContent ?? "").trim();
      });
      if (atual.startsWith(nome)) return true;
    }
    throw new Error(`não achei "${nome}" com Tab`);
  };
  const user2 = `teclado.${sufixo}`;
  await page.goto(`${BASE}/cadastro`, { waitUntil: "networkidle" });
  await semRolagemLateral(page, "S01 390");
  await foto(page, "S01", W);
  await tabAte("Email");
  await page.keyboard.type(`teclado.${sufixo}@exemplo.com`);
  await tabAte("Senha");
  await page.keyboard.type(SENHA);
  await page.keyboard.press("Enter");
  await page.waitForURL("**/comecar");
  await tabAte("Seu endereço");
  await page.keyboard.type(user2);
  await page.getByText("está livre").waitFor();
  await semRolagemLateral(page, "S03 390");
  await foto(page, "S03", W);
  await page.keyboard.press("Enter");
  await page.waitForURL("**/admin");
  await page.getByText("Sua página ainda não tem links").waitFor();
  await foto(page, "S06-vazio", W);
  await tabAte("Título");
  await page.keyboard.type("Fale comigo no WhatsApp com um título bem comprido para testar");
  await tabAte("Endereço");
  await page.keyboard.type("exemplo.com.br/zap");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: /^Mover Fale comigo/ }).waitFor();
  ok(true, "390 teclado: cadastro, endereço e primeiro link sem mouse");
  await page.waitForTimeout(400);
  await semRolagemLateral(page, "S06 390");
  await foto(page, "S06", W);
  await axe(page, "S06 390");
  await page.goto(`${BASE}/${user2}`, { waitUntil: "networkidle" });
  await semRolagemLateral(page, "S15 390");
  await foto(page, "S15", W);
  await tabAte("Fale comigo");
  const zap = page.waitForRequest("https://exemplo.com.br/zap");
  await page.keyboard.press("Enter");
  await zap;
  ok(true, "390 teclado: link da página pública abre com Enter");
  for (const [id, rota] of [["S09", "admin/insights"], ["S18", "entrar"], ["S15-demo", "doces.da.ana"], ["404", "ninguem.mora.aqui"]]) {
    await page.goto(`${BASE}/${rota}`, { waitUntil: "networkidle" });
    await semRolagemLateral(page, `${id} 390`);
    await foto(page, id, W);
  }
  await ctx.close();
}

await browser.close();
console.log("\naxe:");
for (const [nome, v] of axeRes) console.log(` ${nome}: ${v.length ? v.join(", ") : "0 violações"}`);
console.log("erros no console:", erros.length ? erros : "nenhum");
console.log(falhas ? `\n${falhas} FALHA(S)` : "\ntudo certo");
process.exitCode = falhas || erros.length ? 1 : 0;
