import { sessaoAtual } from "@/lib/data/auth";
import { dadosDaConta, registrarExportacao } from "@/lib/data/exportar";
import { dentroDosLimites } from "@/lib/data/limites";

// LGPD art. 18: a cópia de todos os dados da conta, em JSON, só para o dono.
export async function GET() {
  const sessao = await sessaoAtual();
  if (!sessao) return new Response("Entre de novo para baixar seus dados.", { status: 401 });
  if (!(await dentroDosLimites([["exportar:conta", sessao.userId, 10, 3600]]))) {
    return new Response("Muitos pedidos seguidos. Tente de novo daqui a pouco.", { status: 429 });
  }
  const dados = await dadosDaConta(sessao.userId, sessao.email);
  await registrarExportacao(sessao.userId, sessao.email);
  const dia = dados.gerado_em.slice(0, 10);
  return new Response(JSON.stringify(dados, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="meus-dados-${dia}.json"`,
      "cache-control": "no-store",
    },
  });
}
