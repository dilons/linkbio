import { sessaoAtual } from "@/lib/data/auth";
import { celulaCsv, listarInscritos } from "@/lib/data/formularios";
import { dentroDosLimites } from "@/lib/data/limites";
import { perfilDaConta } from "@/lib/data/perfis";

const dataHora = (iso: string) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

// S10: os inscritos em CSV, direto (sem a ida e volta por email do original).
// Ponto e vírgula e BOM: abre certo no Excel em português. Células que
// começariam com =, +, - ou @ viram texto (sem fórmula escondida).
export async function GET() {
  const sessao = await sessaoAtual();
  if (!sessao) return new Response("Entre de novo.", { status: 401 });
  const perfil = await perfilDaConta(sessao.userId);
  if (!perfil) return new Response("Sem página.", { status: 404 });
  if (!(await dentroDosLimites([["csv:conta", sessao.userId, 20, 3600]]))) {
    return new Response("Muitos downloads seguidos. Espere um pouco.", { status: 429 });
  }
  const inscritos = await listarInscritos(sessao.userId, perfil.id, 100_000);
  const linhas = [
    ["email", "nome", "formulario", "inscrito_em", "consentimento_aceito"].join(";"),
    ...inscritos.map((i) => [i.email, i.nome, i.formulario, dataHora(i.em), i.consentimento].map(celulaCsv).join(";")),
  ];
  const hoje = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${linhas.join("\r\n")}\r\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="inscritos-${perfil.username}-${hoje}.csv"`,
      "cache-control": "no-store",
    },
  });
}
