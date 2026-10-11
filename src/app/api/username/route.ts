import { sessaoAtual } from "@/lib/data/auth";
import { dentroDosLimites } from "@/lib/data/limites";
import { verificarUsername } from "@/lib/data/perfis";

// Checagem do endereço enquanto a pessoa digita (S03). Só para quem está logado
// e com limite, para ninguém varrer a lista de endereços. Não diz de quem é.
export async function GET(req: Request) {
  const sessao = await sessaoAtual();
  if (!sessao) return Response.json({ erro: "Entre de novo." }, { status: 401 });
  if (!(await dentroDosLimites([["username:conta", sessao.userId, 60, 60]]))) {
    return Response.json({ erro: "Calma: muitas checagens seguidas." }, { status: 429 });
  }
  const u = new URL(req.url).searchParams.get("u") ?? "";
  return Response.json(await verificarUsername(u.slice(0, 60), sessao.userId), { headers: { "cache-control": "no-store" } });
}
