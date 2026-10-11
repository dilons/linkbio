// LGPD art. 18: a cópia dos dados traz o que é da conta, e nada de outra conta.
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { eq } from "drizzle-orm";
import { db, fecharBanco } from "@/lib/db";
import { dataRequests, submissions } from "@/lib/db/schema";
import { dadosDaConta, registrarExportacao } from "@/lib/data/exportar";
import { adicionarLink } from "@/lib/data/links";
import { criarPerfil } from "@/lib/data/perfis";
import { apagarUsuarioDeTeste, criarUsuario, sufixo } from "./ajuda";

const criados: string[] = [];
after(async () => {
  for (const id of criados) await apagarUsuarioDeTeste(id);
  await fecharBanco();
});

test("exportar: página, links e inscritos da conta; nada da outra; o pedido fica registrado", async () => {
  const [eu, outra] = [await criarUsuario("exporta"), await criarUsuario("outra")];
  criados.push(eu.id, outra.id);
  const minha = await criarPerfil(eu.id, `exporta_${sufixo()}`);
  const dela = await criarPerfil(outra.id, `outra_${sufixo()}`);
  assert.ok(minha.ok && dela.ok);
  const link = (await adicionarLink(eu.id, minha.perfil.id, { titulo: "Minha loja", url: "https://exemplo.com.br/minha" }))!;
  await adicionarLink(outra.id, dela.perfil.id, { titulo: "Loja dela", url: "https://exemplo.com.br/dela" });
  const conn = await db();
  await conn.insert(submissions).values({ profileId: minha.perfil.id, linkId: link.id, email: "fa@exemplo.com", name: "Fã", consentText: "Aceito receber emails." });

  const d = await dadosDaConta(eu.id, eu.email);
  assert.equal(d.conta.email, eu.email);
  assert.deepEqual(d.paginas.map((p) => p.endereco), [minha.perfil.username]);
  assert.deepEqual(d.links.map((l) => l.titulo), ["Minha loja"]);
  assert.deepEqual(d.inscritos.map((i) => [i.email, i.consentimento]), [["fa@exemplo.com", "Aceito receber emails."]]);
  assert.equal(d.assinatura, null);
  const texto = JSON.stringify(d);
  assert.ok(!texto.includes("Loja dela") && !texto.includes(dela.perfil.username), "nada da outra conta");
  assert.ok(!/senha|password|encrypted/i.test(Object.keys(d).join(" ")), "nada de senha");

  await registrarExportacao(eu.id, eu.email);
  const pedidos = await conn.select().from(dataRequests).where(eq(dataRequests.accountId, eu.id));
  assert.equal(pedidos.length, 1);
  assert.equal(pedidos[0].kind, "export");
  assert.ok(pedidos[0].completedAt);
});
