import { registrarClique } from "@/lib/data/eventos";
import { dentroDosLimites } from "@/lib/data/limites";
import { infoDoPedido } from "@/lib/visitante";

// Clique num link da página pública: conta e redireciona para a URL gravada.
// O redirecionamento sai sempre; acima do limite, o clique só não é contado.
export async function GET(req: Request, ctx: RouteContext<"/r/[linkId]">) {
  const { linkId } = await ctx.params;
  const info = infoDoPedido(req);
  const contar = await dentroDosLimites([["clique:ip", info.ip, 60, 60]]);
  const destino = await registrarClique(linkId, info, contar);
  if (!destino) return new Response("Este link não existe ou foi desligado.", { status: 404 });
  return new Response(null, { status: 302, headers: { location: destino, "cache-control": "no-store" } });
}
