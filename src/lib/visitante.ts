import { headers } from "next/headers";
import type { InfoVisitante } from "@/lib/data/eventos";
import { env } from "@/lib/env";

// SÓ NO DEMO (kamino, branch chore/imagem-demo): o único caminho público é o
// túnel da Cloudflare, que grava o CF-Connecting-IP, e o Traefik do cluster
// troca o X-Forwarded-For pelo IP do cloudflared (todo visitante viraria um).
// Não levar para a Vercel: lá qualquer um forja esse cabeçalho.
function ipDe(h: Headers): string {
  return h.get("cf-connecting-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0";
}

/**
 * Lê do pedido o que a contagem precisa. O IP só entra no hash do dia e nunca
 * é gravado. Um referer do próprio site (a pessoa veio da página pública) vira
 * "sem origem", para a origem real ser a da visita.
 */
export function infoDoPedido(req: Request, referer = req.headers.get("referer")): InfoVisitante {
  const h = req.headers;
  let origem = referer;
  try {
    if (origem && new URL(origem).host === new URL(req.url).host) origem = null;
  } catch {
    origem = null;
  }
  return {
    ip: ipDe(h),
    userAgent: h.get("user-agent") ?? "",
    referer: origem,
    pais: h.get("x-vercel-ip-country"),
    cidade: h.get("x-vercel-ip-city") ? decodeURIComponent(h.get("x-vercel-ip-city")!) : null,
  };
}

/** IP de quem chamou a ação (só para os limites de uso, em hash). */
export async function ipAtual(): Promise<string> {
  return ipDe(await headers());
}

/**
 * Origem do app para links de email e do Google. Em produção vem de
 * NEXT_PUBLIC_SITE_URL; sem ela, do próprio pedido (o Supabase só aceita
 * destinos da lista de URLs permitidas).
 */
export async function origemDoPedido(): Promise<string> {
  const fixa = env.site();
  if (fixa) return fixa;
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${h.get("x-forwarded-proto") ?? "http"}://${host}`;
}
