import type { InfoVisitante } from "@/lib/data/eventos";

/**
 * Lê do pedido o que a contagem precisa. O IP só entra no hash do dia e nunca
 * é gravado. Um referer do próprio site (a pessoa veio da página pública) vira
 * "sem origem", para a origem real ser a da visita.
 */
export function infoDoPedido(req: Request, referer = req.headers.get("referer")): InfoVisitante {
  const h = req.headers;
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0";
  let origem = referer;
  try {
    if (origem && new URL(origem).host === new URL(req.url).host) origem = null;
  } catch {
    origem = null;
  }
  return {
    ip,
    userAgent: h.get("user-agent") ?? "",
    referer: origem,
    pais: h.get("x-vercel-ip-country"),
    cidade: h.get("x-vercel-ip-city") ? decodeURIComponent(h.get("x-vercel-ip-city")!) : null,
  };
}
