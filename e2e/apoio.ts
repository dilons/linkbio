// O que todos os testes usam: falha em erro no console e em resposta 5xx, axe
// em cada tela, a caixa de email do Supabase local (Mailpit), contas de teste
// e o banco local para preparar dados que a tela ainda não cria.
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { expect, test as base, type Page } from "@playwright/test";
import postgres from "postgres";
import { randomUUID } from "node:crypto";

export const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
export const ASAAS = "http://127.0.0.1:4010";
export const DEMO = { email: "demo@linkbio.test", senha: "linkbio-demo-2026", username: "doces.da.ana" };

export const sufixo = () => randomUUID().slice(0, 8);
export const sql = postgres(process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres", { max: 2 });

type Guardas = {
  /** mensagens de console esperadas neste teste (ex.: um 401 provocado de propósito) */
  consoleEsperado: RegExp[];
};

/**
 * `page` com guardas: cada teste se apresenta com um IP próprio (os limites de
 * uso são por IP) e falha se aparecer erro no console ou resposta 5xx.
 */
export const test = base.extend<Guardas>({
  consoleEsperado: [[], { option: true }],
  context: async ({ browser, contextOptions }, entregar) => {
    const ctx = await browser.newContext({
      ...contextOptions,
      extraHTTPHeaders: { "x-forwarded-for": `198.51.100.${1 + Math.floor(Math.random() * 254)}` },
    });
    await entregar(ctx);
    await ctx.close();
  },
  page: async ({ context, consoleEsperado }, entregar) => {
    const problemas: string[] = [];
    const respostas4xx: string[] = [];
    const vigiar = (p: Page) => {
      p.on("console", (m) => {
        if (m.type() === "error" && !consoleEsperado.some((r) => r.test(m.text()))) problemas.push(`console: ${m.text()}`);
      });
      p.on("pageerror", (e) => problemas.push(`erro na página: ${e.message}`));
      p.on("response", (r) => {
        if (r.status() >= 500) problemas.push(`${r.status()} em ${r.url()}`);
        // o console só diz "Failed to load resource"; aqui fica de qual endereço
        else if (r.status() >= 400) respostas4xx.push(`${r.status()} ${r.request().method()} ${r.url()} ${process.env.E2E_DEBUG ? JSON.stringify(r.request().headers()) : ""}`);
      });
    };
    // toda página do contexto (inclusive a segunda aba de um teste) é vigiada
    context.on("page", vigiar);
    const page = await context.newPage();
    await entregar(page);
    expect(problemas, `sem erro no console e sem 5xx (respostas 4xx: ${respostas4xx.join(", ") || "nenhuma"})`).toEqual([]);
  },
});
export { expect };

/** axe na tela atual: nenhuma violação. */
export async function semViolacoes(page: Page, tela: string) {
  // só com a página assentada (título já no lugar); no meio de uma navegação o
  // axe vê um documento pela metade
  await expect(page).toHaveTitle(/linkbio/);
  const r = await new AxeBuilder({ page }).analyze();
  expect(r.violations.map((v) => `${tela}: ${v.id} (${v.nodes.length})`)).toEqual([]);
}

/** Sem rolagem lateral na largura atual. */
export async function semRolagemLateral(page: Page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(sw, "sem rolagem lateral").toBeLessThanOrEqual(iw);
}

/**
 * Captura para a /replica-diff (replica/clone-screens/<id>-<largura>.png).
 * Página inteira, menos com um modal em tela cheia aberto (aí só a tela).
 */
export async function capturar(page: Page, id: string, { paginaInteira = true } = {}) {
  const w = page.viewportSize()?.width ?? 1440;
  await page.screenshot({ path: `replica/clone-screens/${id}-${w}.png`, fullPage: paginaInteira });
}

// ------------------------------------------------------------ email

type Mensagem = { ID: string; Subject: string; HTML: string; Text: string };

export async function emailsPara(para: string): Promise<Array<{ ID: string; Subject: string }>> {
  const r = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${para}"`)}`);
  return (await r.json()).messages;
}

/** Espera chegar um email para `para` com `assunto` e devolve o conteúdo. */
export async function emailPara(para: string, assunto: string): Promise<Mensagem> {
  let achado: { ID: string } | undefined;
  await expect
    .poll(async () => (achado = (await emailsPara(para)).find((m) => m.Subject.includes(assunto))), {
      message: `email "${assunto}" para ${para}`,
      timeout: 15_000,
    })
    .toBeTruthy();
  return (await fetch(`${MAILPIT}/api/v1/message/${achado!.ID}`)).json();
}

/** O link /auth/confirm de um email do Supabase Auth. */
export async function linkDoEmail(para: string, assunto: string): Promise<string> {
  const m = await emailPara(para, assunto);
  const href = m.HTML.match(/href="([^"]*\/auth\/confirm\?[^"]+)"/)?.[1];
  expect(href, `link em "${assunto}"`).toBeTruthy();
  return href!.replaceAll("&amp;", "&");
}

// ------------------------------------------------------------ contas

const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

export type Conta = { id: string; email: string; senha: string; username: string; perfil: string };

/**
 * Conta pronta para usar o painel: usuário confirmado no Auth (a linha em
 * accounts vem do gatilho) e perfil com o endereço escolhido. O cadastro pela
 * tela é testado na F01; aqui é só preparação.
 */
export async function contaPronta(nome = "teste", links: Array<[string, string]> = []): Promise<Conta> {
  const s = sufixo();
  const email = `${nome}.${s}@exemplo.com`;
  const senha = `senha-${s}`;
  const { data, error } = await admin().auth.admin.createUser({ email, password: senha, email_confirm: true });
  if (error || !data.user) throw error ?? new Error("sem usuário");
  const username = `${nome}.${s}`;
  const [p] = await sql`insert into profiles (account_id, username, title) values (${data.user.id}, ${username}, ${username}) returning id`;
  await sql`insert into appearances (profile_id) values (${p.id})`;
  for (const [i, [titulo, url]] of links.entries()) {
    await sql`insert into links (profile_id, title, url, position) values (${p.id}, ${titulo}, ${url}, ${i})`;
  }
  return { id: data.user.id, email, senha, username, perfil: p.id };
}

export async function entrar(page: Page, email: string, senha: string) {
  await page.goto("/entrar");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
}

/** Entra e espera o painel abrir com o conteúdo carregado. */
export async function entrarNoPainel(page: Page, conta: { email: string; senha: string }) {
  await entrar(page, conta.email, conta.senha);
  await page.waitForURL("**/admin");
  await page.getByRole("heading", { name: "Seus links", level: 1 }).waitFor();
  await page.getByRole("heading", { name: "Adicionar link" }).waitFor();
}
