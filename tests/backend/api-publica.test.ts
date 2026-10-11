// A API REST e o Storage do Supabase, com a chave publicável (a que vai para
// o navegador), não leem nem escrevem nada das tabelas do app, nem logado.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fecharBanco } from "@/lib/db";
import { apagarUsuarioDeTeste, criarUsuario } from "./ajuda";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
let usuario: { id: string; email: string; senha: string };
let token: string;

before(async () => {
  usuario = await criarUsuario("rest");
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: chave, "content-type": "application/json" },
    body: JSON.stringify({ email: usuario.email, password: usuario.senha }),
  });
  token = (await r.json()).access_token;
  assert.ok(token, "login pela API do Auth");
});

after(async () => {
  await apagarUsuarioDeTeste(usuario.id);
  await fecharBanco();
});

const TABELAS = ["accounts", "profiles", "links", "submissions", "events", "subscriptions", "billing_events", "rate_limits", "job_runs"];

for (const [quem, cabecalhos] of [
  ["anônimo", () => ({ apikey: chave })],
  ["logado", () => ({ apikey: chave, authorization: `Bearer ${token}` })],
] as const) {
  test(`${quem}: nenhuma tabela do app pode ser lida pela API REST`, async () => {
    for (const t of TABELAS) {
      const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, { headers: cabecalhos() });
      assert.ok(r.status === 401 || r.status === 403, `${t} respondeu ${r.status}`);
    }
  });

  test(`${quem}: não grava pela API REST`, async () => {
    const r = await fetch(`${url}/rest/v1/profiles`, {
      method: "POST",
      headers: { ...cabecalhos(), "content-type": "application/json" },
      body: JSON.stringify({ username: "invasor", account_id: usuario.id }),
    });
    assert.ok(r.status === 401 || r.status === 403, `respondeu ${r.status}`);
  });

  test(`${quem}: não envia arquivo ao Storage sem URL assinada`, async () => {
    const r = await fetch(`${url}/storage/v1/object/avatares/invasor/x.png`, {
      method: "POST",
      headers: { ...cabecalhos(), "content-type": "image/png" },
      body: new Uint8Array([137, 80, 78, 71]),
    });
    assert.ok(r.status >= 400, `respondeu ${r.status}`);
  });
}
