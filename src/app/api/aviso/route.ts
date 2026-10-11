import { NextResponse } from "next/server";
import { idadeEm, idadeMinima, infoDoAlvo, lerAlvo, nomeDoCookie } from "@/lib/data/aviso";
import { dentroDosLimites } from "@/lib/data/limites";
import { infoDoPedido } from "@/lib/visitante";

// S16: a resposta ao aviso de conteúdo (formulário comum, sem JavaScript).
// O alvo e a idade mínima vêm do banco, não do formulário. A data de
// nascimento só entra na conta: nada é gravado além de "ok" ou "negado" num
// cookie de sessão daquele alvo.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const alvo = lerAlvo(form?.get("alvo"));
  if (!alvo) return new Response(null, { status: 400 });
  const info = await infoDoAlvo(alvo);
  if (!info) return voltar("/");
  if (!info.rotulo) return voltar(info.volta);
  if (!(await dentroDosLimites([["aviso:ip", infoDoPedido(req).ip, 30, 600]]))) return new Response(null, { status: 429 });

  const minima = idadeMinima(info.rotulo);
  let resposta: "ok" | "negado" = "ok";
  if (minima !== null) {
    const idade = idadeEm(String(form?.get("nascimento") ?? ""));
    if (idade === null) return voltar(`${info.pergunta}?aviso=data`);
    if (idade < minima) resposta = "negado";
  }
  const res = voltar(info.volta);
  res.cookies.set(nomeDoCookie(alvo), resposta, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(req.url).protocol === "https:",
    path: "/",
  });
  return res;
}

// 303: o navegador volta com GET para a página ou o link
const voltar = (caminho: string) => new NextResponse(null, { status: 303, headers: { location: caminho, "cache-control": "no-store" } });
