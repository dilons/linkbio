import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DataTable } from "@/components/ui/data-table";
import { GraficoColunas, type Ponto } from "@/components/ui/grafico-colunas";
import { StatTile } from "@/components/ui/stat-tile";
import { insights, lerPeriodo, PERIODOS, type Dia, type Periodo, type Quebra } from "@/lib/data/insights";
import { cn } from "@/lib/cn";
import { ehFuso, FUSO_PADRAO } from "@/lib/fuso";
import { exigirPerfil } from "@/lib/sessao";

export const metadata: Metadata = { title: "Insights" };

const numero = new Intl.NumberFormat("pt-BR");
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
const regioes = new Intl.DisplayNames(["pt-BR"], { type: "region" });
const pais = (codigo: string) => {
  try {
    return regioes.of(codigo) ?? codigo;
  } catch {
    return codigo; // código que não é de país (o cabeçalho da hospedagem veio estranho)
  }
};

const NOME_DO_PERIODO: Record<Periodo, string> = { 7: "7 dias", 28: "28 dias", 90: "90 dias", 365: "12 meses" };
const FONTES: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
  x: "X (Twitter)",
  facebook: "Facebook",
  search: "Busca (Google e outros)",
  qr: "QR code",
  direct: "Direto ou sem origem",
  other: "Outros sites",
};
const APARELHOS: Record<string, string> = { mobile: "Celular", desktop: "Computador", tablet: "Tablet" };

// S09: o período escolhido (grátis em todos), os números, a série, os links,
// as origens, os locais e os aparelhos.
export default function Insights({ searchParams }: PageProps<"/admin/insights">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-fg">Insights</h1>
      <Suspense fallback={<Numeros />}>
        <Dados searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const dataCurta = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
const diaDaSemana = (dia: string) => new Date(`${dia}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "long", timeZone: "UTC" });
const visitas = (n: number) => `${numero.format(n)} ${n === 1 ? "visita" : "visitas"}`;

/** A série no tamanho que cabe: por dia até 28 dias, por semana em 90, por mês em 12 meses. */
function serie(porDia: Dia[], dias: Periodo): { titulo: string; pontos: Ponto[] } {
  if (dias <= 28) {
    return {
      titulo: "Visitas por dia",
      pontos: porDia.map((d) => ({ chave: d.dia, rotulo: dataCurta(d.dia), descricao: `${diaDaSemana(d.dia)}, ${dataCurta(d.dia)}: ${visitas(d.visitas)}`, valor: d.visitas })),
    };
  }
  if (dias === 90) {
    const pontos: Ponto[] = [];
    for (let i = 0; i < porDia.length; i += 7) {
      const semana = porDia.slice(i, i + 7);
      const total = semana.reduce((s, d) => s + d.visitas, 0);
      const de = semana[0].dia;
      const ate = semana[semana.length - 1].dia;
      pontos.push({ chave: de, rotulo: dataCurta(de), descricao: `${dataCurta(de)} a ${dataCurta(ate)}: ${visitas(total)}`, valor: total });
    }
    return { titulo: "Visitas por semana", pontos };
  }
  const meses = new Map<string, number>();
  for (const d of porDia) meses.set(d.dia.slice(0, 7), (meses.get(d.dia.slice(0, 7)) ?? 0) + d.visitas);
  return {
    titulo: "Visitas por mês",
    pontos: [...meses].map(([mes, total]) => {
      const nome = new Date(`${mes}-15T12:00:00Z`).toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "");
      const longo = new Date(`${mes}-15T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
      return { chave: mes, rotulo: nome, descricao: `${longo}: ${visitas(total)}`, valor: total };
    }),
  };
}

function Periodos({ atual }: { atual: Periodo }) {
  return (
    <nav aria-label="Período" className="flex flex-wrap gap-2">
      {PERIODOS.map((p) => (
        <Link
          key={p}
          href={`/admin/insights?periodo=${p}`}
          aria-current={p === atual ? "page" : undefined}
          className={cn(
            "rounded-pill border px-3 py-1.5 text-sm font-semibold",
            p === atual ? "border-accent bg-accent-soft text-fg" : "border-input bg-bg text-fg hover:bg-surface",
          )}
        >
          {NOME_DO_PERIODO[p]}
        </Link>
      ))}
    </nav>
  );
}

type Totais = { visitas: number; visitantes: number; cliques: number; cliquesUnicos: number };

function Numeros({ t }: { t?: Totais }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <StatTile label="Visitas" value={t ? numero.format(t.visitas) : undefined} carregando={!t} />
      <StatTile label="Visitantes únicos" value={t ? numero.format(t.visitantes) : undefined} carregando={!t} detalhe="contados por dia, sem cookie" />
      <StatTile label="Cliques" value={t ? numero.format(t.cliques) : undefined} carregando={!t} />
      <StatTile label="Cliques únicos" value={t ? numero.format(t.cliquesUnicos) : undefined} carregando={!t} detalhe="contados por dia" />
      <StatTile
        label="Taxa de clique"
        value={t ? (t.visitas === 0 ? null : pct.format(t.cliques / t.visitas)) : undefined}
        carregando={!t}
        detalhe="cliques por visita"
      />
    </div>
  );
}

/** Uma quebra (origem, país, cidade, aparelho): o rótulo, as visitas e a parte do total, com uma barra. */
function Ranking({ titulo, itens, nome, vazio }: { titulo: string; itens: Quebra[]; nome: (v: string) => string; vazio: string }) {
  const total = itens.reduce((s, i) => s + i.visitas, 0);
  const mostrados = itens.filter((i) => i.visitas > 0).slice(0, 10);
  return (
    <section aria-label={titulo} className="flex flex-col gap-3">
      <h3 className="text-base font-semibold text-fg">{titulo}</h3>
      <DataTable
        legenda={titulo}
        colunas={[
          { chave: "nome", titulo },
          { chave: "visitas", titulo: "Visitas", alinhar: "direita" },
          { chave: "parte", titulo: "Do total", alinhar: "direita" },
        ]}
        linhas={mostrados.map((i) => ({
          nome: (
            <span className="flex flex-col gap-1">
              <span>{nome(i.valor)}</span>
              <span aria-hidden className="h-1.5 rounded-pill bg-accent" style={{ width: `${Math.max(2, (i.visitas / total) * 100)}%` }} />
            </span>
          ),
          visitas: numero.format(i.visitas),
          parte: pct.format(i.visitas / total),
        }))}
        vazio={vazio}
      />
    </section>
  );
}

async function Dados({ searchParams }: Pick<PageProps<"/admin/insights">, "searchParams">) {
  const { sessao, perfil } = await exigirPerfil();
  const periodo = lerPeriodo((await searchParams).periodo);
  const fuso = ehFuso(perfil.timezone) ? perfil.timezone : FUSO_PADRAO;
  const i = await insights(sessao.userId, perfil.id, periodo, fuso);
  if (!i) return null;
  const s = serie(i.porDia, periodo);
  const totalCliques = i.porLink.reduce((soma, l) => soma + l.cliques, 0);
  return (
    <>
      <div className="flex flex-col gap-2">
        <Periodos atual={periodo} />
        <p className="text-sm text-muted">
          De {dataCurta(i.inicio)} a {dataCurta(i.fim)}, no horário da sua página. Robôs e prévias de redes sociais não contam.
        </p>
      </div>
      <Numeros t={i.totais} />
      <GraficoColunas titulo={s.titulo} pontos={s.pontos} colunaTabela="Visitas" />
      <section aria-labelledby="mais-clicados" className="flex flex-col gap-3">
        <h2 id="mais-clicados" className="text-lg font-semibold text-fg">
          Links mais clicados
        </h2>
        <DataTable
          legenda={`Cliques por link, ${NOME_DO_PERIODO[periodo]}`}
          colunas={[
            { chave: "link", titulo: "Link" },
            { chave: "cliques", titulo: "Cliques", alinhar: "direita" },
            { chave: "unicos", titulo: "Únicos", alinhar: "direita" },
            { chave: "parte", titulo: "Dos cliques", alinhar: "direita" },
          ]}
          linhas={i.porLink.map((l) => ({
            link: l.titulo,
            cliques: numero.format(l.cliques),
            unicos: numero.format(l.cliquesUnicos),
            parte: totalCliques ? pct.format(l.cliques / totalCliques) : "–",
          }))}
          vazio="Ainda não há links. Ponha o primeiro no editor e volte aqui."
        />
      </section>
      <section aria-labelledby="de-onde" className="flex flex-col gap-4">
        <div>
          <h2 id="de-onde" className="text-lg font-semibold text-fg">
            De onde vêm as visitas
          </h2>
          <p className="text-sm text-muted">O IP de quem visita não é guardado: só o país e a cidade, para estas contas.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Ranking titulo="Origem" itens={i.fontes} nome={(v) => FONTES[v] ?? v} vazio="Sem visitas neste período." />
          <Ranking titulo="Aparelho" itens={i.aparelhos} nome={(v) => APARELHOS[v] ?? v} vazio="Sem visitas neste período." />
          <Ranking titulo="País" itens={i.paises} nome={pais} vazio="Sem dados de país neste período." />
          <Ranking titulo="Cidade" itens={i.cidades} nome={(v) => v} vazio="Sem dados de cidade neste período." />
        </div>
      </section>
    </>
  );
}
