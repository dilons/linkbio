import { z } from "zod";
import { registrarVisita } from "@/lib/data/eventos";
import { infoDoPedido } from "@/lib/visitante";

const corpo = z.object({ p: z.uuid(), r: z.string().max(2000).nullable().optional() });

// Visita à página pública, mandada pelo navegador (sendBeacon).
export async function POST(req: Request) {
  const dados = corpo.safeParse(await req.json().catch(() => null));
  if (!dados.success) return new Response(null, { status: 400 });
  await registrarVisita(dados.data.p, infoDoPedido(req, dados.data.r ?? null));
  return new Response(null, { status: 204 });
}
