import assert from "node:assert/strict";
import { after, test } from "node:test";
import { fecharBanco } from "@/lib/db";
import { chaveDe, dentroDosLimites, limitar } from "@/lib/data/limites";
import { sufixo } from "./ajuda";

after(fecharBanco);

test("passa até o máximo e recusa depois, por chave", async () => {
  const chave = await chaveDe("teste", sufixo());
  const r = [];
  for (let i = 0; i < 4; i++) r.push(await limitar(chave, 3, 60));
  assert.deepEqual(r, [true, true, true, false]);
  assert.equal(await limitar(await chaveDe("teste", sufixo()), 3, 60), true, "outra chave tem o próprio limite");
});

test("tentativas simultâneas não passam do limite (contagem atômica)", async () => {
  const chave = await chaveDe("teste", sufixo());
  const r = await Promise.all(Array.from({ length: 10 }, () => limitar(chave, 5, 60)));
  assert.equal(r.filter(Boolean).length, 5);
});

test("a chave não guarda o valor em claro", async () => {
  const chave = await chaveDe("login:email", "ana@exemplo.com");
  assert.ok(!chave.includes("ana"));
  assert.match(chave, /^login:email:[A-Za-z0-9_-]{32}$/);
});

test("várias regras: basta uma estourar", async () => {
  const v = sufixo();
  assert.equal(await dentroDosLimites([["a", v, 1, 60], ["b", v, 5, 60]]), true);
  assert.equal(await dentroDosLimites([["a", v, 1, 60], ["b", v, 5, 60]]), false);
});
