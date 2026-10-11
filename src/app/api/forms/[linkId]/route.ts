import { z } from "zod";
import { inscrever } from "@/lib/data/formularios";
import { dentroDosLimites } from "@/lib/data/limites";
import { infoDoPedido } from "@/lib/visitante";

const corpo = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  nome: z.string().trim().max(100).optional(),
  // aceite explícito, marcado pelo visitante (LGPD): sem ele, nada é gravado
  aceite: z.literal(true),
  // campo isca: gente não vê, robô preenche
  site: z.string().max(200).optional(),
});

// Inscrição no formulário de email da página pública (F05). Responde igual
// para email novo e repetido: ninguém descobre quem já está na lista.
export async function POST(req: Request, ctx: RouteContext<"/api/forms/[linkId]">) {
  const { linkId } = await ctx.params;
  if (!z.uuid().safeParse(linkId).success) return new Response(null, { status: 404 });
  const dados = corpo.safeParse(await req.json().catch(() => null));
  if (!dados.success) return Response.json({ ok: false }, { status: 400 });
  if (dados.data.site) return Response.json({ ok: true }); // robô: finge que deu certo
  const info = infoDoPedido(req);
  const ok = await dentroDosLimites([
    ["inscricao:ip-form", `${info.ip}|${linkId}`, 5, 600],
    ["inscricao:ip", info.ip, 30, 3600],
  ]);
  if (!ok) return Response.json({ ok: false }, { status: 429 });
  const r = await inscrever(linkId, { email: dados.data.email, nome: dados.data.nome }, info);
  return r === "ok" ? Response.json({ ok: true }) : Response.json({ ok: false }, { status: 404 });
}
