import { registrarClique } from "@/lib/data/eventos";
import { infoDoPedido } from "@/lib/visitante";

// Clique num link da página pública: conta e redireciona para a URL gravada.
export async function GET(req: Request, ctx: RouteContext<"/r/[linkId]">) {
  const { linkId } = await ctx.params;
  const destino = await registrarClique(linkId, infoDoPedido(req));
  if (!destino) return new Response("Este link não existe ou foi desligado.", { status: 404 });
  return new Response(null, { status: 302, headers: { location: destino, "cache-control": "no-store" } });
}
