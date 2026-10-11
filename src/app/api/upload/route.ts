import { z } from "zod";
import { dentroDosLimites } from "@/lib/data/limites";
import { prepararEnvio } from "@/lib/data/fotos";
import { perfilDaConta } from "@/lib/data/perfis";
import { sessaoAtual } from "@/lib/data/auth";

const corpo = z.object({ tipo: z.string().max(50), tamanho: z.number().int().positive() });

// URL assinada para enviar a foto do perfil direto ao Storage (S06).
export async function POST(req: Request) {
  const sessao = await sessaoAtual();
  if (!sessao) return Response.json({ erro: "Entre de novo." }, { status: 401 });
  const perfil = await perfilDaConta(sessao.userId);
  if (!perfil) return Response.json({ erro: "Escolha o endereço primeiro." }, { status: 403 });
  const dados = corpo.safeParse(await req.json().catch(() => null));
  if (!dados.success) return Response.json({ erro: "Pedido inválido." }, { status: 400 });
  if (!(await dentroDosLimites([["upload:conta", sessao.userId, 20, 3600]]))) {
    return Response.json({ erro: "Muitos envios em pouco tempo. Espere um pouco." }, { status: 429 });
  }
  const r = await prepararEnvio(perfil.id, dados.data.tipo, dados.data.tamanho);
  return r.ok ? Response.json({ caminho: r.caminho, url: r.url }) : Response.json({ erro: r.erro }, { status: 400 });
}
