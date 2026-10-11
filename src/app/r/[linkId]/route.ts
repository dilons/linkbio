import { registrarClique, usernameDoLink } from "@/lib/data/eventos";
import { dentroDosLimites } from "@/lib/data/limites";
import { infoDoPedido } from "@/lib/visitante";

// Clique num link da página pública: conta e redireciona para a URL gravada.
// O redirecionamento sai sempre; acima do limite, o clique só não é contado.
export async function GET(req: Request, ctx: RouteContext<"/r/[linkId]">) {
  const { linkId } = await ctx.params;
  const info = infoDoPedido(req);
  const contar = await dentroDosLimites([["clique:ip", info.ip, 60, 60]]);
  const destino = await registrarClique(linkId, info, contar);
  if (destino) return new Response(null, { status: 302, headers: { location: destino, "cache-control": "no-store" } });
  return indisponivel(await usernameDoLink(linkId));
}

const escapar = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Link desligado, fora do horário ou apagado depois que a página foi aberta:
 * uma página de verdade, com caminho de volta, em vez de um texto cru
 * (BUG-005). Status 404 e noindex para buscadores. Cores dos tokens.
 */
function indisponivel(username: string | null): Response {
  const volta = username
    ? `<a href="/${escapar(username)}">Ver a página de ${escapar(username)}</a>`
    : `<a href="/">Ir para o linkbio</a>`;
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Link indisponível · linkbio</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fafafa;color:#1c1c1f;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
  main{max-width:28rem;padding:2rem;text-align:center}
  h1{font-size:1.5rem;margin:0 0 .75rem}
  p{color:#5b5b66;margin:0 0 1.5rem;line-height:1.5}
  a{display:inline-block;padding:.75rem 1.25rem;border-radius:999px;background:#4338ca;color:#fff;font-weight:600;text-decoration:none}
  a:focus-visible{outline:2px solid #4338ca;outline-offset:3px}
</style></head>
<body><main><h1>Este link não está mais disponível</h1>
<p>Ele pode ter sido desligado ou ficado fora do ar depois que a página abriu.</p>
${volta}</main></body></html>`;
  return new Response(html, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex", "cache-control": "no-store" },
  });
}
