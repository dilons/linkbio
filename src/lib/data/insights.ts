// S09: os números do período, no fuso da página. Os dias que o job diário já
// fechou vêm da soma (daily_stats, daily_breakdowns, guardadas sem prazo); os
// que ele ainda não fechou (hoje, ou um dia em que ele falhou) vêm dos eventos,
// que ficam 90 dias. Cada dia vem de um lugar só, então nada conta duas vezes.
// O visitante único é por dia (o sal muda todo dia, sem cookie): somar os dias
// dá "visitantes por dia", não pessoas diferentes no período.
import { sql } from "drizzle-orm";
import { donoDoPerfil } from "@/lib/authz";
import { db } from "@/lib/db";

export const PERIODOS = [7, 28, 90, 365] as const;
export type Periodo = (typeof PERIODOS)[number];
export const lerPeriodo = (v: unknown): Periodo => (PERIODOS.find((p) => String(p) === String(v)) ?? 28) as Periodo;

export type Numeros = { visitas: number; visitantes: number; cliques: number; cliquesUnicos: number; inscricoes: number };
export type Dia = { dia: string; visitas: number; cliques: number };
export type Quebra = { valor: string; visitas: number; cliques: number };
export type Insights = {
  dias: Periodo;
  /** primeiro e último dia do período (AAAA-MM-DD, no fuso da página) */
  inicio: string;
  fim: string;
  totais: Numeros;
  porDia: Dia[];
  porLink: Array<{ id: string; titulo: string; cliques: number; cliquesUnicos: number }>;
  fontes: Quebra[];
  paises: Quebra[];
  cidades: Quebra[];
  aparelhos: Quebra[];
};

const n = (v: unknown) => Number(v ?? 0);

export async function insights(accountId: string, profileId: string, dias: Periodo, fuso: string): Promise<Insights | null> {
  const conn = await db();
  if (!(await donoDoPerfil(conn, accountId, profileId))) return null;

  // o período e os dias já fechados pelo job, usados por todas as consultas abaixo
  const base = sql`
    periodo as (
      select (now() at time zone ${fuso})::date as hoje,
             (now() at time zone ${fuso})::date - (${dias}::int - 1) as inicio
    ),
    fechados as (
      select s.day from daily_stats s, periodo
       where s.profile_id = ${profileId} and s.link_id is null and s.day between periodo.inicio and periodo.hoje
    ),
    vivos as (
      select (e.occurred_at at time zone ${fuso})::date as day, e.type, e.visitor_hash, e.link_id,
             e.source, e.country, e.city, e.device
        from events e, periodo
       where e.profile_id = ${profileId}
         and e.occurred_at >= now() - make_interval(days => ${dias}::int + 1)
         and (e.occurred_at at time zone ${fuso})::date between periodo.inicio and periodo.hoje
         and (e.occurred_at at time zone ${fuso})::date not in (select day from fechados)
    )`;

  const [porDiaLinhas, linkLinhas, quebraLinhas, [limites]] = await Promise.all([
    conn.execute(sql`
      with ${base}
      select day::text as dia, sum(views) as visitas, sum(unicos) as visitantes, sum(clicks) as cliques,
             sum(clicks_unicos) as cliques_unicos, sum(signups) as inscricoes
        from (
          select s.day, s.views, s.unique_views as unicos, s.clicks, s.unique_clicks as clicks_unicos, s.signups
            from daily_stats s join fechados f on f.day = s.day
           where s.profile_id = ${profileId} and s.link_id is null
          union all
          select day,
                 count(*) filter (where type = 'view'),
                 count(distinct visitor_hash) filter (where type = 'view'),
                 count(*) filter (where type = 'click'),
                 count(distinct visitor_hash) filter (where type = 'click'),
                 count(*) filter (where type = 'signup')
            from vivos group by day
        ) d
       group by day order by day`),
    conn.execute(sql`
      with ${base},
      cliques as (
        select s.link_id, s.clicks, s.unique_clicks
          from daily_stats s join fechados f on f.day = s.day
         where s.profile_id = ${profileId} and s.link_id is not null
        union all
        select link_id, count(*), count(distinct visitor_hash) from vivos
         where type = 'click' and link_id is not null group by day, link_id
      )
      select l.id, l.title as titulo, coalesce(sum(c.clicks), 0) as cliques, coalesce(sum(c.unique_clicks), 0) as cliques_unicos
        from links l left join cliques c on c.link_id = l.id
       where l.profile_id = ${profileId} and l.kind = 'link'
       group by l.id, l.title, l.position
       order by cliques desc, l.position`),
    conn.execute(sql`
      with ${base}
      select dimension, value, sum(visitas) as visitas, sum(cliques) as cliques
        from (
          select b.dimension, b.value, b.views as visitas, b.clicks as cliques
            from daily_breakdowns b join fechados f on f.day = b.day
           where b.profile_id = ${profileId}
          union all
          select 'source', source, count(*) filter (where type = 'view'), count(*) filter (where type = 'click') from vivos group by source
          union all
          select 'country', country, count(*) filter (where type = 'view'), count(*) filter (where type = 'click') from vivos where country is not null group by country
          union all
          select 'city', city, count(*) filter (where type = 'view'), count(*) filter (where type = 'click') from vivos where city is not null group by city
          union all
          select 'device', device, count(*) filter (where type = 'view'), count(*) filter (where type = 'click') from vivos group by device
        ) q
       group by dimension, value
       order by visitas desc, cliques desc, value`),
    conn.execute(sql`with ${base} select inicio::text as inicio, hoje::text as fim from periodo`),
  ]);

  // a série tem todos os dias do período, inclusive os sem visita
  const porDiaMapa = new Map(porDiaLinhas.map((r) => [String(r.dia), r]));
  const porDia: Dia[] = [];
  const totais: Numeros = { visitas: 0, visitantes: 0, cliques: 0, cliquesUnicos: 0, inscricoes: 0 };
  const inicio = String(limites.inicio);
  for (let i = 0; i < dias; i++) {
    const d = new Date(`${inicio}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    const dia = d.toISOString().slice(0, 10);
    const r = porDiaMapa.get(dia);
    porDia.push({ dia, visitas: n(r?.visitas), cliques: n(r?.cliques) });
    totais.visitas += n(r?.visitas);
    totais.visitantes += n(r?.visitantes);
    totais.cliques += n(r?.cliques);
    totais.cliquesUnicos += n(r?.cliques_unicos);
    totais.inscricoes += n(r?.inscricoes);
  }
  const quebra = (dim: string): Quebra[] =>
    quebraLinhas.filter((r) => r.dimension === dim).map((r) => ({ valor: String(r.value), visitas: n(r.visitas), cliques: n(r.cliques) }));
  return {
    dias,
    inicio,
    fim: String(limites.fim),
    totais,
    porDia,
    porLink: linkLinhas.map((r) => ({ id: String(r.id), titulo: String(r.titulo), cliques: n(r.cliques), cliquesUnicos: n(r.cliques_unicos) })),
    fontes: quebra("source"),
    paises: quebra("country"),
    cidades: quebra("city"),
    aparelhos: quebra("device"),
  };
}
