// BUG-013: variável presente mas em branco ("X=" no .env, campo vazio na
// Vercel) valia como valor: preço zero, pool zero, links relativos.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { precoProCentavos } from "@/lib/billing";
import { env, lerInteiro, lerVariavel } from "@/lib/env";

const antes = { ...process.env };
afterEach(() => {
  for (const k of ["PRECO_PRO_CENTAVOS", "NEXT_PUBLIC_SITE_URL", "X_TESTE"]) {
    if (antes[k] === undefined) delete process.env[k];
    else process.env[k] = antes[k];
  }
});

test("em branco é o mesmo que ausente", () => {
  process.env.X_TESTE = "";
  assert.equal(lerVariavel("X_TESTE"), undefined);
  process.env.X_TESTE = "   ";
  assert.equal(lerVariavel("X_TESTE"), undefined);
  process.env.X_TESTE = " valor ";
  assert.equal(lerVariavel("X_TESTE"), "valor");
});

test("preço do Pro: em branco, zero ou inválido volta ao padrão; valor certo vale", () => {
  for (const v of ["", "0", "-5", "19,90", "abc", "19.5"]) {
    process.env.PRECO_PRO_CENTAVOS = v;
    assert.equal(precoProCentavos(), 1900, `"${v}"`);
  }
  process.env.PRECO_PRO_CENTAVOS = "2490";
  assert.equal(precoProCentavos(), 2490);
  assert.equal(lerInteiro("NAO_EXISTE", 5), 5);
});

test("endereço do site em branco: nenhum (o app usa o do pedido), nunca um link relativo", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "";
  assert.equal(env.site(), null);
  process.env.NEXT_PUBLIC_SITE_URL = "https://chamaqui.com.br/";
  assert.equal(env.site(), "https://chamaqui.com.br");
});
