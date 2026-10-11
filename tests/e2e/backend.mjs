// Ponta a ponta do backend, no navegador e contra o Supabase local: foto no
// Storage, assinatura do Pro (Asaas falso + webhook), recuperação de senha,
// sair de todos os aparelhos e exclusão da conta.
//
// Precisa de: npm run db:start, node tests/asaas-falso.mjs, e o app em
// `next start -p 3123` com o .env.local (ASAAS_API_URL no Asaas falso).
//   node tests/e2e/backend.mjs [pasta-dos-screenshots]
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { BASE, CABECALHOS, UA, emailPara, linkDoEmail, novoAvaliador, zerarLimites } from "./ajuda.mjs";

const OUT = process.argv[2] ?? "replica/clone-screens";
const TOKEN = process.env.ASAAS_WEBHOOK_TOKEN ?? "token-local-do-webhook";
const s = Date.now().toString(36);
const EMAIL = `bea.${s}@exemplo.com`;
const USER = `bea.${s}`;
let SENHA = "senha-boa-123";

const { ok, falhas } = novoAvaliador();
const erros = [];
const axeRes = [];
await zerarLimites();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

async function contexto(w = 1440, h = 900) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, userAgent: UA, extraHTTPHeaders: CABECALHOS });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && erros.push(`${page.url()}: ${m.text()}`));
  page.on("pageerror", (e) => erros.push(`${page.url()}: ${e.message}`));
  return { ctx, page };
}
const axe = async (page, nome) => axeRes.push([nome, (await new AxeBuilder({ page }).analyze()).violations.map((v) => `${v.id}(${v.nodes.length})`)]);
const foto = (page, id, w = 1440) => page.screenshot({ path: `${OUT}/${id}-${w}.png`, fullPage: true });

async function entrar(page, email, senha) {
  await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
}

function webhook(corpo, token = TOKEN) {
  return fetch(`${BASE}/api/webhooks/asaas`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { "asaas-access-token": token } : {}) },
    body: JSON.stringify(corpo),
  });
}

// PNG de 1x1 válido
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

const { ctx, page } = await contexto();

// ------------------------------------------------------------ conta nova, confirmada
await page.goto(`${BASE}/cadastro`, { waitUntil: "networkidle" });
await page.getByLabel("Email").fill(EMAIL);
await page.getByLabel("Senha").fill(SENHA);
await page.getByRole("button", { name: "Criar minha conta" }).click();
await page.getByRole("heading", { name: "Confira seu email" }).waitFor();

// login antes de confirmar: recusa e oferece reenviar
const { ctx: ctx2, page: p2 } = await contexto();
await entrar(p2, EMAIL, SENHA);
await p2.getByText("Falta confirmar o email").waitFor();
ok(true, "S18: email sem confirmar não entra e oferece reenviar");
await p2.getByRole("button", { name: "Mandar o link de novo" }).click();
await p2.getByText("mandamos de novo").waitFor();
ok(true, "S02: reenviar o link");
await ctx2.close();

await page.goto(await linkDoEmail(EMAIL, "Confirme seu email"));
await page.waitForURL("**/comecar");
await page.getByLabel("Seu endereço").fill(USER);
await page.getByText("está livre").waitFor();
await page.getByRole("button", { name: "Continuar" }).click();
await page.waitForURL("**/admin");
ok(true, "cadastro confirmado e endereço escolhido");
const sessao = (await ctx.cookies()).filter((c) => c.name.startsWith("sb-"));
ok(sessao.length > 0 && sessao.every((c) => c.httpOnly && c.sameSite === "Lax"), "cookies da sessão: httpOnly e SameSite=Lax");
ok(!(await page.evaluate(() => document.cookie)).includes("sb-"), "o JavaScript da página não lê o token");

// link de confirmação usado de novo: recusado com aviso
await page.goto(await linkDoEmail(EMAIL, "Confirme seu email"));
ok(page.url().includes("/admin") || page.url().includes("aviso=link-invalido"), "link repetido não quebra (vai ao painel logado ou avisa)");

// ------------------------------------------------------------ foto (Storage)
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Editar título e bio" }).click();
await page.getByRole("dialog").locator('input[type="file"]').setInputFiles({ name: "eu.png", mimeType: "image/png", buffer: PNG });
await page.getByText("Foto salva").waitFor();
ok(true, "S06: foto enviada ao Storage e salva no perfil");
await page.keyboard.press("Escape");
// pelo contexto (mesmos cookies), sem passar pelo console da página
const grande = (await page.request.post(`${BASE}/api/upload`, { data: { tipo: "image/png", tamanho: 3 * 1024 * 1024 } })).status();
const tipo = (await page.request.post(`${BASE}/api/upload`, { data: { tipo: "image/svg+xml", tamanho: 100 } })).status();
ok(grande === 400 && tipo === 400, `upload recusa > 2 MB e SVG (${grande}, ${tipo})`);
const semLogin = (await fetch(`${BASE}/api/upload`, { method: "POST", body: "{}" })).status;
ok(semLogin === 401, `upload sem sessão: ${semLogin}`);

await page.goto(`${BASE}/${USER}`, { waitUntil: "networkidle" });
const src = await page.locator("header img").getAttribute("src");
ok(Boolean(src?.includes("/storage/v1/object/public/avatares/")), "S15: foto vem do Storage (domínio separado)");
ok((await fetch(src)).status === 200, "a foto abre pelo endereço público");
ok((await page.getByText("Feito com").count()) === 1, "S15: plano grátis mostra a marca no rodapé");

// ------------------------------------------------------------ plano (Asaas falso + webhook)
await page.goto(`${BASE}/admin/plano`, { waitUntil: "networkidle" });
await foto(page, "S14");
await axe(page, "S14");
await page.getByLabel("Pix").check();
await page.getByLabel("Nome de quem paga").fill("Beatriz Teste");
await page.getByLabel("CPF ou CNPJ").fill("111.111.111-11");
await page.getByRole("button", { name: "Assinar e ir para o pagamento" }).click();
await page.getByText("Confira o CPF ou CNPJ").waitFor();
ok(true, "S14: CPF inválido é recusado antes de ir ao Asaas");
await page.getByLabel("CPF ou CNPJ").fill("529.982.247-25");
await page.getByRole("button", { name: "Assinar e ir para o pagamento" }).click();
await page.waitForURL(/127\.0\.0\.1:4010\/i\/sub_/);
const assinatura = new URL(page.url()).pathname.split("/").pop();
ok(true, "S14: assinar leva à página de pagamento do Asaas");
const pedidos = await (await fetch("http://127.0.0.1:4010/__pedidos")).json();
const sub = pedidos.find((p) => p.caminho === "/v3/subscriptions" && p.metodo === "POST");
ok(sub?.corpo.billingType === "PIX" && sub?.corpo.cycle === "MONTHLY" && sub?.userAgent === "linkbio", "pedido ao Asaas: PIX, mensal, com User-Agent");

await page.goto(`${BASE}/admin/plano`, { waitUntil: "networkidle" });
ok((await page.getByText("Aguardando pagamento").count()) === 1, "S14: assinatura pendente até o webhook");

const evento = { id: `evt_${s}`, event: "PAYMENT_CONFIRMED", payment: { id: `pay_${s}`, subscription: assinatura, dueDate: new Date().toISOString().slice(0, 10) } };
ok((await webhook(evento, "token-errado")).status === 401, "webhook com token errado: 401");
ok((await webhook(evento, null)).status === 401, "webhook sem token: 401");
ok((await webhook({ nada: 1 })).status === 400, "webhook com corpo inválido: 400");
const r1 = await (await webhook(evento)).json();
const r2 = await (await webhook(evento)).json();
ok(r1.efeito === "ativou" && r2.efeito === "repetido", `webhook idempotente (${r1.efeito}, ${r2.efeito})`);
await emailPara(EMAIL, "Pro está ativo");
ok(true, "email de Pro ativo enviado (uma vez)");

await page.goto(`${BASE}/${USER}`, { waitUntil: "networkidle" });
ok((await page.getByText("Feito com").count()) === 0, "S15: Pro tira a marca do rodapé");

await page.goto(`${BASE}/admin/plano`, { waitUntil: "networkidle" });
ok((await page.getByText("Ativo", { exact: true }).count()) === 1, "S14: plano ativo");
await foto(page, "S14-pro");
await page.getByRole("button", { name: "Cancelar assinatura" }).click();
await page.getByText("O Pro continua até").waitFor();
ok(true, "S14: cancelar em um clique, Pro até o fim do período");
const pedidos2 = await (await fetch("http://127.0.0.1:4010/__pedidos")).json();
ok(pedidos2.some((p) => p.metodo === "DELETE" && p.caminho === `/v3/subscriptions/${assinatura}`), "cancelamento chegou ao Asaas");
await page.goto(`${BASE}/${USER}`, { waitUntil: "networkidle" });
ok((await page.getByText("Feito com").count()) === 0, "S15: cancelado continua sem marca até o fim do período");

// ------------------------------------------------------------ recuperar a senha
await ctx.clearCookies();
await page.goto(`${BASE}/entrar/recuperar`, { waitUntil: "networkidle" });
await foto(page, "S18b");
await axe(page, "S18b");
await page.getByLabel("Email da conta").fill("ninguem.tem.este@exemplo.com");
await page.getByRole("button", { name: "Mandar o link" }).click();
const neutro = await page.getByRole("status").first().innerText();
await page.goto(`${BASE}/entrar/recuperar`, { waitUntil: "networkidle" });
await page.getByLabel("Email da conta").fill(EMAIL);
await page.getByRole("button", { name: "Mandar o link" }).click();
const neutro2 = await page.getByRole("status").first().innerText();
ok(neutro === neutro2, "mesma resposta para email com e sem conta");
await page.goto(await linkDoEmail(EMAIL, "senha nova"));
await page.waitForURL("**/entrar/nova-senha");
await foto(page, "S18-nova-senha");
await axe(page, "S18-nova-senha");
SENHA = "outra-senha-456";
await page.getByLabel("Senha nova", { exact: true }).fill(SENHA);
await page.getByLabel("Repita a senha nova").fill("diferente-789");
await page.getByRole("button", { name: "Salvar e entrar" }).click();
await page.getByText("não estão iguais").waitFor();
await page.getByLabel("Senha nova", { exact: true }).fill(SENHA);
await page.getByLabel("Repita a senha nova").fill(SENHA);
await page.getByRole("button", { name: "Salvar e entrar" }).click();
await page.waitForURL("**/admin");
ok(true, "senha nova salva, entra no painel");
await emailPara(EMAIL, "senha do linkbio mudou");
ok(true, "aviso de senha alterada por email");

// ------------------------------------------------------------ sair de todos os aparelhos
const { ctx: outro, page: celular } = await contexto(390, 844);
await entrar(celular, EMAIL, SENHA);
await celular.waitForURL("**/admin");
await page.goto(`${BASE}/admin/conta`, { waitUntil: "networkidle" });
await foto(page, "S13");
await axe(page, "S13");
await page.getByRole("button", { name: "Sair de todos os aparelhos" }).click();
await page.waitForURL("**/entrar?aviso=saiu-de-todos");
await page.getByText("você saiu de todos os aparelhos").waitFor();
await celular.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
ok(celular.url().endsWith("/entrar"), `o outro aparelho também saiu (${new URL(celular.url()).pathname})`);
await outro.close();

// ------------------------------------------------------------ excluir a conta
await entrar(page, EMAIL, SENHA);
await page.waitForURL("**/admin");
await page.goto(`${BASE}/admin/conta`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Excluir minha conta" }).click();
await page.getByLabel(`Para confirmar, digite ${USER}`).fill("outra-coisa");
await page.getByRole("button", { name: "Excluir para sempre" }).click();
await page.getByText(`Digite ${USER} para confirmar`).waitFor();
ok(true, "S13: exclusão pede o endereço certo");
await foto(page, "S13-excluir");
await page.getByLabel(`Para confirmar, digite ${USER}`).fill(USER);
await page.getByRole("button", { name: "Excluir para sempre" }).click();
await page.waitForURL("**/entrar?aviso=conta-excluida");
await page.getByText("Sua conta foi excluída").waitFor();
ok(true, "S13: conta excluída, volta ao login com aviso");
await emailPara(EMAIL, "foi excluída");
ok(true, "email de confirmação da exclusão");
ok((await fetch(`${BASE}/${USER}`, { headers: { "user-agent": "WhatsApp/2.23" } })).status === 404, "página some (404 para prévia)");
ok((await fetch(src)).status >= 400, "foto apagada do Storage");
await entrar(page, EMAIL, SENHA);
await page.getByText("Email ou senha não conferem").waitFor();
ok(true, "login antigo não entra mais");

await ctx.close();
await browser.close();
console.log("\naxe:");
for (const [nome, v] of axeRes) console.log(` ${nome}: ${v.length ? v.join(", ") : "0 violações"}`);
console.log("erros no console:", erros.length ? erros : "nenhum");
console.log(falhas() ? `\n${falhas()} FALHA(S)` : "\ntudo certo");
process.exitCode = falhas() || erros.length ? 1 : 0;
