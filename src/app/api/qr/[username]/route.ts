import QRCode from "qrcode";
import { paginaPublica } from "@/lib/data/perfis";
import { env } from "@/lib/env";

// S19: o QR code da página, gerado aqui (nenhum serviço de fora vê o endereço).
// Preto no branco, com margem: é o que qualquer câmera lê melhor, impresso ou
// na tela. Leva a /usuario?origem=qr, para os insights contarem a origem.
const PRETO = "#000000";
const BRANCO = "#ffffff";

export async function GET(req: Request, ctx: RouteContext<"/api/qr/[username]">) {
  const { username } = await ctx.params;
  const pagina = await paginaPublica(username);
  if (!pagina) return new Response(null, { status: 404 });
  const u = pagina.perfil.username;
  const destino = `${env.site() ?? new URL(req.url).origin}/${u}?origem=qr`;
  const params = new URL(req.url).searchParams;
  const svg = params.get("formato") === "svg";
  const cabecalhos: Record<string, string> = {
    "cache-control": "public, max-age=3600",
    "x-robots-tag": "noindex",
  };
  if (params.has("baixar")) cabecalhos["content-disposition"] = `attachment; filename="qr-${u}.${svg ? "svg" : "png"}"`;
  const opcoes = { errorCorrectionLevel: "M" as const, margin: 4, color: { dark: PRETO, light: BRANCO } };
  if (svg) {
    const corpo = await QRCode.toString(destino, { ...opcoes, type: "svg" });
    return new Response(corpo, { headers: { ...cabecalhos, "content-type": "image/svg+xml; charset=utf-8" } });
  }
  const png = await QRCode.toBuffer(destino, { ...opcoes, type: "png", width: 1024 });
  return new Response(new Uint8Array(png), { headers: { ...cabecalhos, "content-type": "image/png" } });
}
