// S13: trocar o endereço. Uma troca por vez (linha travada), o antigo guardado
// para a própria conta e redirecionando para a página por 14 dias.
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { criarPerfil, enderecoNovo, proximaTroca, trocarUsername, verificarUsername } from "@/lib/data/perfis";
import { apagarUsuarioDeTeste, criarUsuario, sufixo } from "./ajuda";

const criados: string[] = [];
after(async () => {
  for (const id of criados) await apagarUsuarioDeTeste(id);
});

test("troca: duas ao mesmo tempo, passa uma; o antigo leva à página e fica só para a conta", async () => {
  const u = await criarUsuario("troca");
  const outro = await criarUsuario("outro");
  criados.push(u.id, outro.id);
  const antigo = `troca.${sufixo()}`;
  const p = await criarPerfil(u.id, antigo);
  assert.ok(p.ok);
  const [a, b] = await Promise.all([
    trocarUsername(u.id, p.perfil.id, `a.${sufixo()}`),
    trocarUsername(u.id, p.perfil.id, `b.${sufixo()}`),
  ]);
  const ok = [a, b].filter((r) => r.ok);
  assert.equal(ok.length, 1, JSON.stringify([a, b]));
  const recusada = [a, b].find((r) => !r.ok);
  assert.match(recusada && !recusada.ok ? recusada.erro : "", /A próxima troca fica liberada em/);
  const novo = ok[0].ok ? ok[0].username : "";
  assert.equal(await enderecoNovo(antigo), novo);
  assert.equal((await verificarUsername(antigo, outro.id)).livre, false);
  assert.equal((await verificarUsername(antigo, u.id)).livre, true);
  // outra conta não troca para o endereço guardado
  const p2 = await criarPerfil(outro.id, `outro.${sufixo()}`);
  assert.ok(p2.ok);
  const tentativa = await trocarUsername(outro.id, p2.perfil.id, antigo);
  assert.equal(tentativa.ok, false);
  // passados 14 dias, o antigo não redireciona mais
  const conn = await db();
  await conn.execute(sql`update profiles set deleted_at = now() - interval '15 days' where username = ${antigo}`);
  assert.equal(await enderecoNovo(antigo), null);
});

test("troca: página excluída de verdade não redireciona", async () => {
  const u = await criarUsuario("excluida");
  criados.push(u.id);
  const nome = `excl.${sufixo()}`;
  const p = await criarPerfil(u.id, nome);
  assert.ok(p.ok);
  const conn = await db();
  await conn.execute(sql`select public.apagar_perfil(${p.perfil.id})`);
  assert.equal(await enderecoNovo(nome), null);
});

test("troca: a próxima fica liberada 7 dias depois da última", () => {
  const agora = Date.parse("2026-10-11T12:00:00Z");
  assert.equal(proximaTroca(null, agora), null);
  assert.equal(proximaTroca("2026-10-01T12:00:00Z", agora), null);
  assert.equal(proximaTroca("2026-10-08T12:00:00Z", agora)?.toISOString(), "2026-10-15T12:00:00.000Z");
});
