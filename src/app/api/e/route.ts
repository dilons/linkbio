import { z } from "zod";
import { registrarVisita } from "@/lib/data/eventos";
import { dentroDosLimites } from "@/lib/data/limites";
import { infoDoPedido } from "@/lib/visitante";

const corpo = z.object({ p: z.uuid(), r: z.string().max(2000).nullable().optional() });

// Visita à página pública, mandada pelo navegador (sendBeacon). Acima do
// limite, responde igual e só não conta: quem infla visita não ganha nada.
export async function POST(req: Request) {
  const dados = corpo.safeParse(await req.json().catch(() => null));
  if (!dados.success) return new Response(null, { status: 400 });
  const info = infoDoPedido(req, dados.data.r ?? null);
  const ok = await dentroDosLimites([
    ["visita:ip", info.ip, 120, 60],
    ["visita:ip-perfil", `${info.ip}|${dados.data.p}`, 10, 60],
  ]);
  if (ok) await registrarVisita(dados.data.p, info);
  return new Response(null, { status: 204 });
}
