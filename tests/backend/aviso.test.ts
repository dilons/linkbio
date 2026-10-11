// S16: a idade do aviso de conteúdo (F11). A conta é no dia de Brasília.
import assert from "node:assert/strict";
import { test } from "node:test";
import { idadeEm, lerAlvo, rotuloDaPagina, rotuloDoLink } from "@/lib/data/aviso";

// 2026-10-11 às 01:00 em Brasília (04:00 UTC)
const HOJE = new Date("2026-10-11T04:00:00Z");

test("idade: o aniversário de hoje já conta, o de amanhã ainda não", () => {
  assert.equal(idadeEm("2008-10-11", HOJE), 18);
  assert.equal(idadeEm("2008-10-12", HOJE), 17);
  assert.equal(idadeEm("2008-10-10", HOJE), 18);
  assert.equal(idadeEm("1990-01-01", HOJE), 36);
});

test("idade: o dia é o de Brasília, não o de UTC", () => {
  // 23:30 de 10/10 em Brasília já é 11/10 em UTC: ainda não é o aniversário
  const tarde = new Date("2026-10-11T02:30:00Z");
  assert.equal(idadeEm("2008-10-11", tarde), 17);
});

test("idade: data impossível, no futuro, antes de 1900 ou fora do formato não vale", () => {
  for (const d of ["2023-02-30", "2027-01-01", "1899-12-31", "11/10/2008", "", "2008-1-1", "abc"]) {
    assert.equal(idadeEm(d, HOJE), null, d);
  }
});

test("rótulos: só os valores do banco viram aviso", () => {
  assert.equal(rotuloDaPagina("none"), null);
  assert.equal(rotuloDaPagina("sensitive"), "sensivel");
  assert.equal(rotuloDaPagina("21"), "21");
  assert.equal(rotuloDaPagina("30"), null);
  assert.equal(rotuloDoLink("age", 18), "18");
  assert.equal(rotuloDoLink("age", 16), null);
  assert.equal(rotuloDoLink("sensitive", null), "sensivel");
  assert.equal(rotuloDoLink("none", 18), null);
});

test("alvo: só p: ou l: com um uuid", () => {
  assert.deepEqual(lerAlvo("p:4F1C3A2E-1111-4222-8333-444455556666"), { tipo: "p", id: "4f1c3a2e-1111-4222-8333-444455556666" });
  for (const a of ["x:4f1c3a2e-1111-4222-8333-444455556666", "p:nada", "p:", "", null, "l:../../etc"]) assert.equal(lerAlvo(a), null, String(a));
});
