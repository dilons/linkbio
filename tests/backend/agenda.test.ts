// F08: agendar um link. O criador digita no fuso dele; o banco guarda UTC.
import assert from "node:assert/strict";
import { test } from "node:test";
import { lerAgenda } from "@/lib/data/validacao";
import { janela, localParaUtc, utcParaLocal } from "@/lib/fuso";

test("fuso: Brasília é UTC-3, Amazonas UTC-4, Noronha UTC-2", () => {
  assert.equal(localParaUtc("2026-10-20T18:00", "America/Sao_Paulo"), "2026-10-20T21:00:00.000Z");
  assert.equal(localParaUtc("2026-10-20T18:00", "America/Manaus"), "2026-10-20T22:00:00.000Z");
  assert.equal(localParaUtc("2026-10-20T18:00", "America/Noronha"), "2026-10-20T20:00:00.000Z");
  assert.equal(localParaUtc("2026-12-31T23:30", "America/Sao_Paulo"), "2027-01-01T02:30:00.000Z");
});

test("fuso: Lisboa muda de horário (verão UTC+1, inverno UTC+0)", () => {
  assert.equal(localParaUtc("2026-07-01T12:00", "Europe/Lisbon"), "2026-07-01T11:00:00.000Z");
  assert.equal(localParaUtc("2026-12-01T12:00", "Europe/Lisbon"), "2026-12-01T12:00:00.000Z");
});

test("fuso: volta para o mesmo horário digitado", () => {
  for (const f of ["America/Sao_Paulo", "America/Manaus", "Europe/Lisbon", "UTC"]) {
    for (const l of ["2026-10-20T18:00", "2026-07-01T00:05", "2027-03-28T10:00"]) {
      assert.equal(utcParaLocal(localParaUtc(l, f), f), l, `${l} ${f}`);
    }
  }
  assert.equal(utcParaLocal(null, "UTC"), "");
});

test("fuso: data impossível, formato errado ou fuso fora da lista não vale", () => {
  for (const l of ["2026-02-30T10:00", "2026-10-20 18:00", "2026-10-20T25:00", "", "amanhã"]) {
    assert.equal(localParaUtc(l, "America/Sao_Paulo"), null, l);
  }
  assert.equal(localParaUtc("2026-10-20T18:00", "America/New_York"), null);
});

const form = (campos: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
};
const AGORA = Date.parse("2026-10-11T15:00:00Z");

test("janela: vazia é sem agendamento; fim antes do começo, fim no passado e data ruim são recusados", () => {
  assert.deepEqual(lerAgenda(form({ inicio: "", fim: "", fuso: "America/Sao_Paulo" }), AGORA), {
    ok: true,
    agenda: { inicio: null, fim: null, fuso: "America/Sao_Paulo" },
  });
  const ok = lerAgenda(form({ inicio: "2026-10-20T18:00", fim: "2026-10-21T18:00", fuso: "America/Sao_Paulo" }), AGORA);
  assert.ok(ok.ok && ok.agenda.inicio === "2026-10-20T21:00:00.000Z" && ok.agenda.fim === "2026-10-21T21:00:00.000Z");
  const erro = (c: Record<string, string>) => {
    const r = lerAgenda(form(c), AGORA);
    return r.ok ? null : r.erro;
  };
  assert.equal(erro({ inicio: "2026-10-21T18:00", fim: "2026-10-20T18:00", fuso: "America/Sao_Paulo" }), "O fim precisa ser depois do começo.");
  assert.equal(erro({ inicio: "", fim: "2026-10-01T18:00", fuso: "America/Sao_Paulo" }), "Esse horário de sumir já passou: o link não ia aparecer.");
  assert.equal(erro({ inicio: "2026-02-30T10:00", fim: "", fuso: "America/Sao_Paulo" }), "Confira a data e a hora.");
  assert.equal(erro({ inicio: "", fim: "", fuso: "Marte/Olympus" }), "Escolha um fuso da lista.");
});

test("janela: o selo do editor diz se ainda vai aparecer, se some e quando, ou se encerrou", () => {
  const f = "America/Sao_Paulo";
  assert.deepEqual(janela(null, null, f, AGORA), { noAr: true });
  assert.deepEqual(janela("2026-10-20T21:00:00.000Z", null, f, AGORA), { noAr: false, selo: "Aparece 20/10 às 18:00" });
  assert.deepEqual(janela(null, "2026-10-21T21:00:00.000Z", f, AGORA), { noAr: true, selo: "Some 21/10 às 18:00" });
  assert.deepEqual(janela(null, "2026-10-01T21:00:00.000Z", f, AGORA), { noAr: false, selo: "Encerrado" });
});
