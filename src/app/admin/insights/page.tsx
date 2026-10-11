import type { Metadata } from "next";
import { Suspense } from "react";
import { DataTable } from "@/components/ui/data-table";
import { StatTile } from "@/components/ui/stat-tile";
import { totais } from "@/lib/data/eventos";
import { exigirPerfil } from "@/lib/sessao";

export const metadata: Metadata = { title: "Insights · linkbio" };

const numero = new Intl.NumberFormat("pt-BR");
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

// S09 (primeira versão: totais dos últimos 7 dias; fontes, locais e período vêm na etapa 6)
export default function Insights() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-fg">Insights</h1>
        <p className="text-sm text-muted">Últimos 7 dias. Robôs e prévias de redes sociais não contam.</p>
      </div>
      <Suspense fallback={<Numeros />}>
        <Dados />
      </Suspense>
    </div>
  );
}

function Numeros({ t }: { t?: { visitas: number; visitantes: number; cliques: number } }) {
  const vazio = t && t.visitas === 0 && t.cliques === 0;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatTile label="Visitas" value={t ? numero.format(t.visitas) : undefined} carregando={!t} />
      <StatTile label="Visitantes únicos" value={t ? numero.format(t.visitantes) : undefined} carregando={!t} detalhe="por dia, sem cookie" />
      <StatTile label="Cliques" value={t ? numero.format(t.cliques) : undefined} carregando={!t} />
      <StatTile
        label="Taxa de clique"
        value={t ? (vazio || t.visitas === 0 ? null : pct.format(t.cliques / t.visitas)) : undefined}
        carregando={!t}
        detalhe="cliques por visita"
      />
    </div>
  );
}

async function Dados() {
  const { sessao, perfil } = await exigirPerfil();
  const t = await totais(sessao.userId, perfil.id, 7);
  if (!t) return null;
  return (
    <>
      <Numeros t={t} />
      <section aria-labelledby="mais-clicados" className="flex flex-col gap-3">
        <h2 id="mais-clicados" className="text-lg font-semibold text-fg">
          Links mais clicados
        </h2>
        <DataTable
          legenda="Cliques por link nos últimos 7 dias"
          colunas={[
            { chave: "link", titulo: "Link" },
            { chave: "cliques", titulo: "Cliques", alinhar: "direita" },
          ]}
          linhas={t.porLink.map((l) => ({ link: l.title, cliques: numero.format(l.cliques) }))}
          vazio="Ainda não há cliques. Ponha o endereço da sua página na bio e volte aqui."
        />
      </section>
    </>
  );
}
