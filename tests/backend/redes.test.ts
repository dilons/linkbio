// Endereços das redes sociais: o que a pessoa digita vira o endereço da rede,
// e endereço de outro site é recusado (um ícone do Instagram não pode levar a
// um site qualquer).
import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizarRede } from "@/lib/plataformas";

const url = (p: Parameters<typeof normalizarRede>[0], e: string) => {
  const r = normalizarRede(p, e);
  assert.ok(r.ok, `${p} "${e}": ${!r.ok && r.erro}`);
  return r.url;
};
const erro = (p: Parameters<typeof normalizarRede>[0], e: string) => {
  const r = normalizarRede(p, e);
  assert.ok(!r.ok, `${p} "${e}" devia ser recusado e deu ${r.ok && r.url}`);
  return r.erro;
};

test("@, nome de usuário e endereço viram o endereço da rede", () => {
  assert.equal(url("instagram", "@doces.da.ana"), "https://www.instagram.com/doces.da.ana");
  assert.equal(url("instagram", " docesdaana "), "https://www.instagram.com/docesdaana");
  assert.equal(url("instagram", "instagram.com/docesdaana"), "https://instagram.com/docesdaana");
  assert.equal(url("instagram", "http://www.instagram.com/docesdaana/"), "https://www.instagram.com/docesdaana/");
  assert.equal(url("tiktok", "@docesdaana"), "https://www.tiktok.com/@docesdaana");
  assert.equal(url("youtube", "@DocesDaAna"), "https://www.youtube.com/@DocesDaAna");
  assert.equal(url("youtube", "youtu.be/abc123"), "https://youtu.be/abc123");
  assert.equal(url("x", "@doces_ana"), "https://x.com/doces_ana");
  assert.equal(url("x", "twitter.com/doces_ana"), "https://twitter.com/doces_ana");
  assert.equal(url("facebook", "docesdaana"), "https://www.facebook.com/docesdaana");
  assert.equal(url("facebook", "m.facebook.com/docesdaana"), "https://m.facebook.com/docesdaana");
  assert.equal(url("spotify", "open.spotify.com/artist/1a2b3c"), "https://open.spotify.com/artist/1a2b3c");
});

test("WhatsApp: o número em qualquer formato; sem +, o 55 do Brasil entra sozinho", () => {
  assert.equal(url("whatsapp", "(11) 91234-5678"), "https://wa.me/5511912345678");
  assert.equal(url("whatsapp", "+55 11 91234-5678"), "https://wa.me/5511912345678");
  assert.equal(url("whatsapp", "011 3123-4567"), "https://wa.me/551131234567");
  assert.equal(url("whatsapp", "wa.me/5511912345678"), "https://wa.me/5511912345678");
  assert.match(erro("whatsapp", "91234-5678"), /DDD/);
  assert.equal(url("whatsapp", "+1 415 555 0100"), "https://wa.me/14155550100", "com + vale o código do país");
  assert.match(erro("whatsapp", "+55 91234-5678"), /DDD/);
  assert.match(erro("whatsapp", "1234"), /DDD/);
});

test("endereço de outro site, sem perfil ou vazio é recusado", () => {
  assert.match(erro("instagram", "https://instagram.com.golpe.example/docesdaana"), /não é do Instagram/);
  assert.match(erro("instagram", "golpe.example/instagram.com/docesdaana"), /não é do Instagram/);
  assert.match(erro("youtube", "https://youtube.com.br.example/@ana"), /não é do YouTube/);
  assert.match(erro("instagram", "instagram.com"), /Falta o seu perfil/);
  assert.match(erro("instagram", "https://user:senha@instagram.com/ana"), /Confira/);
  assert.match(erro("instagram", "   "), /Escreva/);
  assert.match(erro("instagram", "doces da ana"), /Confira o seu @/);
  assert.match(erro("x", "@nome_comprido_demais_para_o_x"), /Confira o seu @/);
  assert.match(erro("spotify", "docesdaana"), /endereço completo/);
  assert.match(erro("instagram", `instagram.com/${"a".repeat(400)}`), /longo/);
  assert.match(erro("instagram", "javascript:alert(1)//instagram.com"), /não é do Instagram|Confira/);
});
