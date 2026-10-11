// Os jobs diários (Vercel Cron, horários em UTC no vercel.json). Cada um é
// idempotente: rodar duas vezes no mesmo dia termina no mesmo lugar. O
// executor tenta três vezes e grava cada execução em job_runs; o que falhou
// nas três fica lá com o erro (a fila de mortos), para alguém olhar.
import { randomBytes } from "node:crypto";
import { and, eq, lt, sql } from "drizzle-orm";
import { cancelarAssinatura } from "@/lib/billing";
import { emailDaConta } from "@/lib/data/emails";
import { db } from "@/lib/db";
import { analyticsSalts, jobRuns, subscriptions } from "@/lib/db/schema";
import { enviarEmail } from "@/lib/email";
import { modelos } from "@/lib/email/modelos";
import { env } from "@/lib/env";

type Resultado = Record<string, number>;

const site = () => env.site() ?? "https://linkbio.com.br";

/** 00:05: cria o sal de hoje e de amanhã e apaga os de mais de um dia. */
async function sal(): Promise<Resultado> {
  const conn = await db();
  const dia = (d: number) => new Date(Date.now() + d * 86400_000).toISOString().slice(0, 10);
  await conn
    .insert(analyticsSalts)
    .values([
      { day: dia(0), salt: randomBytes(32) },
      { day: dia(1), salt: randomBytes(32) },
    ])
    .onConflictDoNothing();
  const apagados = await conn.delete(analyticsSalts).where(lt(analyticsSalts.day, dia(-1))).returning({ d: analyticsSalts.day });
  return { apagados: apagados.length };
}

/**
 * 03:10 (meia-noite em São Paulo): soma os eventos dos últimos dias completos,
 * no fuso de cada perfil, em daily_stats e daily_breakdowns. Recalcula três
 * dias para cobrir atraso ou falha da véspera; grava o total (não soma), então
 * repetir não duplica.
 */
async function diario(): Promise<Resultado> {
  const conn = await db();
  const zero = sql.raw("'00000000-0000-0000-0000-000000000000'::uuid");
  const stats = await conn.execute(sql`
    with e as (
      select e.profile_id, e.link_id, e.type, e.visitor_hash,
             (e.occurred_at at time zone p.timezone)::date as day
        from events e join profiles p on p.id = e.profile_id
       where e.occurred_at >= now() - interval '4 days'
         and (e.occurred_at at time zone p.timezone)::date < (now() at time zone p.timezone)::date
         and (e.occurred_at at time zone p.timezone)::date >= (now() at time zone p.timezone)::date - 3
    )
    insert into daily_stats (profile_id, day, link_id, views, unique_views, clicks, unique_clicks, signups)
    select profile_id, day, link_id,
           count(*) filter (where type = 'view'),
           count(distinct visitor_hash) filter (where type = 'view'),
           count(*) filter (where type = 'click'),
           count(distinct visitor_hash) filter (where type = 'click'),
           count(*) filter (where type = 'signup')
      from e
     group by grouping sets ((profile_id, day), (profile_id, day, link_id))
    -- a página toda sai do primeiro conjunto; do segundo, só as linhas de links
    having grouping(link_id) = 1 or link_id is not null
    on conflict (profile_id, day, coalesce(link_id, ${zero})) do update
       set views = excluded.views, unique_views = excluded.unique_views, clicks = excluded.clicks,
           unique_clicks = excluded.unique_clicks, signups = excluded.signups
    returning 1`);
  const quebras = await conn.execute(sql`
    with e as (
      select e.profile_id, e.type, e.source, e.country, e.city, e.device,
             (e.occurred_at at time zone p.timezone)::date as day
        from events e join profiles p on p.id = e.profile_id
       where e.occurred_at >= now() - interval '4 days'
         and (e.occurred_at at time zone p.timezone)::date < (now() at time zone p.timezone)::date
         and (e.occurred_at at time zone p.timezone)::date >= (now() at time zone p.timezone)::date - 3
    ), d as (
      select profile_id, day, 'source' as dimension, source as value, type from e
      union all select profile_id, day, 'country', country, type from e where country is not null
      union all select profile_id, day, 'city', city, type from e where city is not null
      union all select profile_id, day, 'device', device, type from e
    )
    insert into daily_breakdowns (profile_id, day, dimension, value, views, clicks)
    select profile_id, day, dimension, value,
           count(*) filter (where type = 'view'), count(*) filter (where type = 'click')
      from d group by profile_id, day, dimension, value
    on conflict (profile_id, day, dimension, value) do update
       set views = excluded.views, clicks = excluded.clicks
    returning 1`);
  return { linhas_stats: stats.length, linhas_quebras: quebras.length };
}

/** 06:00: apaga o que passou do prazo (eventos de 90 dias, perfis excluídos há 14, limites velhos). */
async function limpeza(): Promise<Resultado> {
  const conn = await db();
  const conta = async (q: ReturnType<typeof sql>) => (await conn.execute(q)).length;
  return {
    eventos: await conta(sql`delete from events where occurred_at < now() - interval '90 days' returning 1`),
    perfis: await conta(sql`delete from profiles where deleted_at < now() - interval '14 days' returning 1`),
    limites: await conta(sql`delete from rate_limits where window_start < now() - interval '1 day' returning 1`),
    execucoes: await conta(sql`delete from job_runs where started_at < now() - interval '90 days' returning 1`),
  };
}

/**
 * 12:00: lembra quem renova por Pix em 3 dias e volta ao grátis quem está com
 * a cobrança vencida há mais de 5 dias (cancelando no Asaas, para não gerar
 * mais cobranças).
 */
async function cobranca(): Promise<Resultado> {
  const conn = await db();
  let lembretes = 0;
  let rebaixados = 0;
  const renovam = await conn
    .select({ accountId: subscriptions.accountId, fim: subscriptions.currentPeriodEnd, preco: subscriptions.priceCents })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        eq(subscriptions.billingType, "pix"),
        eq(subscriptions.cancelAtPeriodEnd, false),
        sql`${subscriptions.currentPeriodEnd} between now() + interval '3 days' and now() + interval '4 days'`,
      ),
    );
  for (const r of renovam) {
    const email = await emailDaConta(r.accountId);
    if (email && r.fim) {
      // a chave impede o segundo lembrete do mesmo período se o job rodar de novo
      if (await enviarEmail(modelos.lembretePix(email, site(), r.preco, r.fim), `pix-${r.accountId}-${r.fim.slice(0, 10)}`)) lembretes++;
    }
  }
  const vencidas = await conn
    .select({ accountId: subscriptions.accountId })
    .from(subscriptions)
    .where(and(eq(subscriptions.status, "past_due"), sql`${subscriptions.updatedAt} < now() - interval '5 days'`));
  for (const v of vencidas) {
    if (!(await cancelarAssinatura(v.accountId))) continue;
    await conn
      .update(subscriptions)
      .set({ currentPeriodEnd: new Date().toISOString() })
      .where(eq(subscriptions.accountId, v.accountId));
    const email = await emailDaConta(v.accountId);
    if (email) await enviarEmail(modelos.voltouAoGratis(email, site()), `gratis-${v.accountId}-${new Date().toISOString().slice(0, 10)}`);
    rebaixados++;
  }
  return { lembretes, rebaixados };
}

export const JOBS = { sal, diario, limpeza, cobranca } as const;
export type NomeJob = keyof typeof JOBS;

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Roda o job com até 3 tentativas (1 s e 4 s entre elas) e grava em job_runs. */
export async function rodarJob(nome: NomeJob, tentativas = 3): Promise<{ ok: boolean; resultado?: Resultado; erro?: string }> {
  const conn = await db();
  const [run] = await conn.insert(jobRuns).values({ job: nome }).returning({ id: jobRuns.id });
  let erro = "";
  for (let i = 1; i <= tentativas; i++) {
    try {
      const resultado = await JOBS[nome]();
      await conn
        .update(jobRuns)
        .set({ ok: true, attempts: i, result: resultado, finishedAt: new Date().toISOString() })
        .where(eq(jobRuns.id, run.id));
      return { ok: true, resultado };
    } catch (e) {
      erro = e instanceof Error ? e.message : String(e);
      if (i < tentativas) await espera(4 ** (i - 1) * 1000);
    }
  }
  await conn
    .update(jobRuns)
    .set({ ok: false, attempts: tentativas, error: erro.slice(0, 2000), finishedAt: new Date().toISOString() })
    .where(eq(jobRuns.id, run.id));
  console.error(`job ${nome}: falhou ${tentativas} vezes`, erro);
  return { ok: false, erro };
}
