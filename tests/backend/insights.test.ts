// S09: o período junta a soma diária (dias fechados pelo job) com os eventos
// (dias que o job ainda não fechou), sem contar um dia duas vezes.
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { db, fecharBanco } from "@/lib/db";
import { dailyBreakdowns, dailyStats, events } from "@/lib/db/schema";
import { hashDoDia } from "@/lib/data/eventos";
import { insights, lerPeriodo } from "@/lib/data/insights";
import { adicionarLink } from "@/lib/data/links";
import { criarPerfil } from "@/lib/data/perfis";
import { rodarJob } from "@/lib/jobs";
import { apagarUsuarioDeTeste, criarUsuario, sufixo } from "./ajuda";

const criados: string[] = [];
after(async () => {
  for (const id of criados) await apagarUsuarioDeTeste(id);
  await fecharBanco();
});

const FUSO = "America/Sao_Paulo";
/** meio-dia em São Paulo, `dias` atrás (15h UTC) */
function meioDia(dias: number): { iso: string; dia: string } {
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(new Date());
  const d = new Date(`${hoje}T15:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return { iso: d.toISOString(), dia: d.toISOString().slice(0, 10) };
}

test("insights: soma diária mais eventos, cada dia de um lugar só", async () => {
  const u = await criarUsuario("insights");
  criados.push(u.id);
  const p = await criarPerfil(u.id, `insights_${sufixo()}`);
  assert.ok(p.ok);
  const perfil = p.perfil.id;
  const link = (await adicionarLink(u.id, perfil, { titulo: "Loja", url: "https://exemplo.com.br/" }))!;
  const conn = await db();
  const [a, b] = [await hashDoDia("a"), await hashDoDia("b")];

  // 40 dias atrás: só a soma diária (os eventos já teriam sido apagados)
  const velho = meioDia(40);
  await conn.insert(dailyStats).values([
    { profileId: perfil, day: velho.dia, views: 10, uniqueViews: 7, clicks: 4, uniqueClicks: 3, signups: 1 },
    { profileId: perfil, day: velho.dia, linkId: link.id, clicks: 4, uniqueClicks: 3 },
  ]);
  await conn.insert(dailyBreakdowns).values({ profileId: perfil, day: velho.dia, dimension: "source", value: "instagram", views: 10, clicks: 4 });

  // ontem: eventos que o job vai fechar (depois disso, só a soma vale)
  const ontem = meioDia(1);
  await conn.insert(events).values([
    { profileId: perfil, type: "view", occurredAt: ontem.iso, visitorHash: a, source: "whatsapp", device: "mobile", country: "BR", city: "Belo Horizonte" },
    { profileId: perfil, type: "view", occurredAt: ontem.iso, visitorHash: a, source: "whatsapp", device: "mobile", country: "BR", city: "Belo Horizonte" },
    { profileId: perfil, linkId: link.id, type: "click", occurredAt: ontem.iso, visitorHash: a, source: "whatsapp", device: "mobile" },
  ]);
  // 10 dias atrás: o job não alcança (só fecha três dias); vem dos eventos
  const dez = meioDia(10);
  await conn.insert(events).values({ profileId: perfil, type: "view", occurredAt: dez.iso, visitorHash: b, source: "qr", device: "desktop", country: "PT" });
  // hoje: dos eventos
  await conn.insert(events).values([
    { profileId: perfil, type: "view", occurredAt: new Date().toISOString(), visitorHash: b, source: "direct", device: "desktop" },
    { profileId: perfil, linkId: link.id, type: "click", occurredAt: new Date().toISOString(), visitorHash: b, source: "direct", device: "desktop" },
  ]);
  assert.equal((await rodarJob("diario")).ok, true);

  const i28 = (await insights(u.id, perfil, 28, FUSO))!;
  assert.equal(i28.porDia.length, 28);
  assert.equal(i28.fim, meioDia(0).dia);
  assert.deepEqual(i28.totais, { visitas: 4, visitantes: 3, cliques: 2, cliquesUnicos: 2, inscricoes: 0 });
  assert.equal(i28.porDia.find((d) => d.dia === ontem.dia)?.visitas, 2);
  assert.equal(i28.porDia.find((d) => d.dia === dez.dia)?.visitas, 1);
  assert.deepEqual(i28.porLink.map((l) => [l.titulo, l.cliques, l.cliquesUnicos]), [["Loja", 2, 2]]);
  assert.deepEqual(
    i28.fontes.map((f) => [f.valor, f.visitas]),
    [["whatsapp", 2], ["direct", 1], ["qr", 1]],
  );
  assert.deepEqual(i28.cidades.map((c) => [c.valor, c.visitas]), [["Belo Horizonte", 2]]);
  assert.deepEqual(i28.paises.map((c) => [c.valor, c.visitas]), [["BR", 2], ["PT", 1]]);

  const i90 = (await insights(u.id, perfil, 90, FUSO))!;
  assert.equal(i90.totais.visitas, 14);
  assert.equal(i90.totais.inscricoes, 1);
  assert.equal(i90.porLink[0].cliques, 6);
  assert.equal(i90.fontes.find((f) => f.valor === "instagram")?.visitas, 10);

  // rodar o job de novo não muda nada
  await rodarJob("diario");
  assert.deepEqual((await insights(u.id, perfil, 28, FUSO))!.totais, i28.totais);

  // outra conta não vê
  const outro = await criarUsuario("intruso");
  criados.push(outro.id);
  assert.equal(await insights(outro.id, perfil, 28, FUSO), null);
});

test("insights: período fora da lista vira 28 dias", () => {
  assert.equal(lerPeriodo("7"), 7);
  assert.equal(lerPeriodo(365), 365);
  assert.equal(lerPeriodo("30"), 28);
  assert.equal(lerPeriodo(undefined), 28);
});
