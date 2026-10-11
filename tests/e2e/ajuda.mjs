// Apoio dos testes de ponta a ponta: a caixa de email do Supabase local
// (Mailpit) e o Chromium.
export const BASE = process.env.E2E_BASE ?? "http://localhost:3123";
export const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
export const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

import postgres from "postgres";

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Zera os limites de uso do app, para uma rodada não herdar as tentativas da
 * anterior. Só roda contra banco em localhost.
 */
export async function zerarLimites() {
  const url = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
  if (!/@(127\.0\.0\.1|localhost)[:/]/.test(url)) throw new Error("zerarLimites só roda com banco local");
  const sql = postgres(url, { max: 1 });
  await sql`delete from rate_limits`;
  await sql.end();
}

// Cada rodada se apresenta com um IP próprio (faixa de documentação
// 198.51.100.0/24), para os limites de uso por IP não barrarem a rodada
// seguinte. Em produção, a Vercel sobrescreve este cabeçalho com o IP real.
export const CABECALHOS = { "x-forwarded-for": `198.51.100.${1 + Math.floor(Math.random() * 254)}` };

/** Último email para `para` com `assunto` (espera até 15 s chegar). */
export async function emailPara(para, assunto) {
  for (let i = 0; i < 30; i++) {
    const r = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${para}`)}`);
    const { messages } = await r.json();
    const m = messages.find((x) => x.Subject.includes(assunto));
    if (m) return (await fetch(`${MAILPIT}/api/v1/message/${m.ID}`)).json();
    await espera(500);
  }
  throw new Error(`email "${assunto}" para ${para} não chegou`);
}

/** O link /auth/confirm de um email do Supabase Auth. */
export async function linkDoEmail(para, assunto) {
  const m = await emailPara(para, assunto);
  const href = (m.HTML ?? "").match(/href="([^"]*\/auth\/confirm\?[^"]+)"/)?.[1];
  if (!href) throw new Error(`sem link em "${assunto}"`);
  return href.replaceAll("&amp;", "&");
}

export function novoAvaliador() {
  let falhas = 0;
  const ok = (cond, msg) => {
    console.log(cond ? "ok   " : "FALHA", msg);
    if (!cond) falhas++;
  };
  return { ok, falhas: () => falhas };
}
