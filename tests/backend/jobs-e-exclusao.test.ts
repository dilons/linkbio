// Jobs diários (idempotentes, com fila de mortos) e exclusão de conta (LGPD).
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { after, before, test } from "node:test";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, fecharBanco } from "@/lib/db";
import { analyticsSalts, dailyBreakdowns, dailyStats, events, jobRuns, links, profiles, rateLimits, socialLinks, submissions, subscriptions } from "@/lib/db/schema";
import { hashDoDia } from "@/lib/data/eventos";
import { adicionarLink } from "@/lib/data/links";
import { criarPerfil, paginaPublica, verificarUsername } from "@/lib/data/perfis";
import { JOBS, rodarJob } from "@/lib/jobs";
import { apagarUsuarioDeTeste, criarUsuario, sufixo } from "./ajuda";

let asaas: ChildProcess;
const criados: string[] = [];

before(async () => {
  asaas = spawn(process.execPath, ["tests/asaas-falso.mjs", "4010"], { stdio: "ignore", env: process.env });
  await new Promise((r) => setTimeout(r, 400));
});

after(async () => {
  asaas.kill();
  for (const id of criados) await apagarUsuarioDeTeste(id);
  await fecharBanco();
});

async function contaComPerfil(nome: string) {
  const u = await criarUsuario(nome);
  criados.push(u.id);
  const r = await criarPerfil(u.id, `${nome}_${sufixo()}`);
  assert.ok(r.ok);
  return { conta: u.id, email: u.email, perfil: r.perfil.id, username: r.perfil.username };
}

test("sal: cria o de hoje e o de amanhã", async () => {
  assert.equal((await rodarJob("sal")).ok, true);
  const conn = await db();
  const dias = (await conn.select({ d: analyticsSalts.day }).from(analyticsSalts)).map((r) => r.d);
  assert.ok(dias.includes(new Date().toISOString().slice(0, 10)));
  assert.ok(dias.includes(new Date(Date.now() + 86400_000).toISOString().slice(0, 10)));
});

test("diário: soma o dia anterior no fuso do perfil, e rodar de novo não duplica", async () => {
  const { conta, perfil } = await contaComPerfil("diario");
  const link = (await adicionarLink(conta, perfil, { titulo: "Loja", url: "https://exemplo.com.br/" }))!;
  const conn = await db();
  // ontem ao meio-dia em São Paulo (15h UTC), contando o dia pelo fuso de lá
  const hojeSP = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const ontem = new Date(`${hojeSP}T15:00:00Z`);
  ontem.setUTCDate(ontem.getUTCDate() - 1);
  const quando = ontem.toISOString();
  const h1 = await hashDoDia("a");
  const h2 = await hashDoDia("b");
  await conn.insert(events).values([
    { profileId: perfil, type: "view", occurredAt: quando, visitorHash: h1, source: "instagram", device: "mobile", country: "BR" },
    { profileId: perfil, type: "view", occurredAt: quando, visitorHash: h1, source: "instagram", device: "mobile", country: "BR" },
    { profileId: perfil, type: "view", occurredAt: quando, visitorHash: h2, source: "direct", device: "desktop" },
    { profileId: perfil, linkId: link.id, type: "click", occurredAt: quando, visitorHash: h1, source: "instagram", device: "mobile" },
    { profileId: perfil, linkId: link.id, type: "click", occurredAt: quando, visitorHash: h2, source: "direct", device: "desktop" },
  ]);
  const ler = async () => {
    const pagina = await conn.select().from(dailyStats).where(and(eq(dailyStats.profileId, perfil), isNull(dailyStats.linkId)));
    const doLink = await conn.select().from(dailyStats).where(eq(dailyStats.linkId, link.id));
    const fontes = await conn
      .select({ v: dailyBreakdowns.value, views: dailyBreakdowns.views })
      .from(dailyBreakdowns)
      .where(and(eq(dailyBreakdowns.profileId, perfil), eq(dailyBreakdowns.dimension, "source")));
    return { pagina, doLink, fontes };
  };
  assert.equal((await rodarJob("diario")).ok, true);
  const primeira = await ler();
  assert.equal(primeira.pagina.length, 1);
  assert.equal(primeira.pagina[0].views, 3);
  assert.equal(primeira.pagina[0].uniqueViews, 2);
  assert.equal(primeira.pagina[0].clicks, 2);
  assert.equal(primeira.doLink[0].clicks, 2);
  assert.equal(primeira.doLink[0].views, 0);
  assert.equal(primeira.fontes.find((f) => f.v === "instagram")?.views, 2);
  await rodarJob("diario");
  assert.deepEqual(await ler(), primeira);
});

test("limpeza: eventos de 90 dias, perfis excluídos há 14 e limites velhos", async () => {
  const { perfil } = await contaComPerfil("limpa");
  const conn = await db();
  const velho = new Date(Date.now() - 100 * 86400_000).toISOString();
  await conn.insert(events).values({ profileId: perfil, type: "view", occurredAt: velho, visitorHash: await hashDoDia("x") });
  await conn.insert(rateLimits).values({ key: `teste:${sufixo()}`, windowStart: new Date(Date.now() - 2 * 86400_000).toISOString() });
  const r = await rodarJob("limpeza");
  assert.equal(r.ok, true);
  assert.ok((r.resultado?.eventos ?? 0) >= 1);
  assert.ok((r.resultado?.limites ?? 0) >= 1);
  const restam = await conn.select().from(events).where(and(eq(events.profileId, perfil), sql`${events.occurredAt} < now() - interval '90 days'`));
  assert.equal(restam.length, 0);
});

test("exclusão: apagar o usuário esvazia o perfil na hora e segura o endereço por 14 dias", async () => {
  const { conta, perfil, username } = await contaComPerfil("sai");
  const conn = await db();
  await adicionarLink(conta, perfil, { titulo: "Loja", url: "https://exemplo.com.br/" });
  await conn.insert(socialLinks).values({ profileId: perfil, platform: "instagram", url: "https://instagram.com/x", position: 0 });
  await conn.insert(submissions).values({ profileId: perfil, email: "fa@exemplo.com", consentText: "Aceito" });
  await conn.insert(events).values({ profileId: perfil, type: "view", visitorHash: await hashDoDia("y") });
  await conn.update(profiles).set({ bio: "minha bio", avatarPath: `${perfil}/foto.png` }).where(eq(profiles.id, perfil));

  await apagarUsuarioDeTeste(conta); // o mesmo caminho do painel do Supabase e da API admin
  criados.splice(criados.indexOf(conta), 1);

  const [p] = await conn.select().from(profiles).where(eq(profiles.id, perfil));
  assert.ok(p.deletedAt, "perfil marcado como excluído");
  assert.equal(p.accountId, null);
  assert.equal(p.title, null);
  assert.equal(p.bio, null);
  assert.equal(p.avatarPath, null);
  for (const t of [links, socialLinks, submissions, events] as const) {
    assert.equal((await conn.select().from(t).where(eq(t.profileId, perfil))).length, 0);
  }
  assert.equal(await paginaPublica(username), null, "página some");
  assert.equal((await verificarUsername(username)).livre, false, "endereço segurado");

  await conn.update(profiles).set({ deletedAt: new Date(Date.now() - 15 * 86400_000).toISOString() }).where(eq(profiles.id, perfil));
  await rodarJob("limpeza");
  assert.equal((await verificarUsername(username)).livre, true, "liberado depois de 14 dias");
});

test("cobrança: vencida há mais de 5 dias volta ao grátis; Pix renova com lembrete", async () => {
  const conn = await db();
  const vencida = await contaComPerfil("vencida");
  const pix = await contaComPerfil("pix");
  await conn.insert(subscriptions).values([
    {
      accountId: vencida.conta, providerCustomerId: "cus_x", providerSubscriptionId: `sub_${sufixo()}`, plan: "pro",
      billingType: "boleto", status: "past_due", priceCents: 1900,
      currentPeriodEnd: new Date(Date.now() + 10 * 86400_000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 86400_000).toISOString(),
    },
    {
      accountId: pix.conta, providerCustomerId: "cus_y", providerSubscriptionId: `sub_${sufixo()}`, plan: "pro",
      billingType: "pix", status: "active", priceCents: 1900,
      currentPeriodEnd: new Date(Date.now() + 3.5 * 86400_000).toISOString(),
    },
  ]);
  const r = await rodarJob("cobranca");
  assert.equal(r.ok, true);
  assert.ok((r.resultado?.rebaixados ?? 0) >= 1);
  assert.ok((r.resultado?.lembretes ?? 0) >= 1);
  const [s] = await conn.select().from(subscriptions).where(eq(subscriptions.accountId, vencida.conta));
  assert.equal(s.status, "canceled");
  assert.ok(Date.parse(s.currentPeriodEnd!) <= Date.now());
  // os emails foram para o Mailpit do Supabase local
  const caixa = await (await fetch(`${process.env.MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${pix.email}`)}`)).json();
  assert.ok(caixa.messages.some((m: { Subject: string }) => m.Subject.includes("renova em 3 dias")));
});

test("job que falha três vezes fica na fila de mortos com o erro", async () => {
  const original = JOBS.sal;
  (JOBS as Record<string, () => Promise<Record<string, number>>>).sal = async () => {
    throw new Error("falha de propósito");
  };
  try {
    const r = await rodarJob("sal", 2);
    assert.equal(r.ok, false);
    const conn = await db();
    const [ultimo] = await conn.select().from(jobRuns).where(eq(jobRuns.job, "sal")).orderBy(desc(jobRuns.id)).limit(1);
    assert.equal(ultimo.ok, false);
    assert.equal(ultimo.attempts, 2);
    assert.match(ultimo.error ?? "", /falha de propósito/);
  } finally {
    (JOBS as Record<string, unknown>).sal = original;
  }
});
