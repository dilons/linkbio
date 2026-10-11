// Um segundo usuário não vê nem mexe em nada do primeiro (architecture.md,
// "Regra de acesso"), e o dono consegue tudo.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fecharBanco } from "@/lib/db";
import { definirTema } from "@/lib/data/aparencia";
import { totais } from "@/lib/data/eventos";
import { adicionarLink, alternarLink, editarLink, excluirLink, listarLinks, reordenarLinks } from "@/lib/data/links";
import { atualizarCabecalho, criarPerfil, perfilDaConta } from "@/lib/data/perfis";
import { apagarUsuarioDeTeste, criarUsuario, sufixo } from "./ajuda";

let ana: { id: string };
let bia: { id: string };
let perfilAna: string;
let linkAna: string;

before(async () => {
  ana = await criarUsuario("ana");
  bia = await criarUsuario("bia");
  const r = await criarPerfil(ana.id, `ana_${sufixo()}`);
  assert.ok(r.ok);
  perfilAna = r.perfil.id;
  const l = await adicionarLink(ana.id, perfilAna, { titulo: "Loja", url: "https://exemplo.com.br/" });
  assert.ok(l);
  linkAna = l.id;
});

after(async () => {
  await apagarUsuarioDeTeste(ana.id);
  await apagarUsuarioDeTeste(bia.id);
  await fecharBanco();
});

test("a conta nasce junto com o usuário do Auth (gatilho)", async () => {
  // criarPerfil só funciona com a linha em accounts; perfilDaConta prova que ela existe
  assert.equal((await perfilDaConta(ana.id))?.id, perfilAna);
  assert.equal(await perfilDaConta(bia.id), null);
});

test("outra conta não lista os links", async () => {
  assert.equal((await listarLinks(bia.id, perfilAna)).length, 0);
  assert.equal((await listarLinks(ana.id, perfilAna)).length, 1);
});

test("outra conta não adiciona, edita, liga, exclui nem reordena", async () => {
  assert.equal(await adicionarLink(bia.id, perfilAna, { titulo: "x", url: "https://a.b/" }), null);
  assert.equal(await editarLink(bia.id, linkAna, { titulo: "invadido", url: "https://a.b/" }), false);
  assert.equal(await alternarLink(bia.id, linkAna, false), false);
  assert.equal(await reordenarLinks(bia.id, perfilAna, [linkAna]), false);
  assert.equal(await excluirLink(bia.id, linkAna), false);
  const [l] = await listarLinks(ana.id, perfilAna);
  assert.equal(l.title, "Loja");
  assert.equal(l.enabled, true);
});

test("outra conta não muda o cabeçalho nem vê os insights", async () => {
  assert.equal(await atualizarCabecalho(bia.id, perfilAna, { titulo: "invadido", bio: "" }), false);
  assert.equal(await totais(bia.id, perfilAna), null);
  assert.ok(await totais(ana.id, perfilAna));
});

test("outra conta não troca o tema", async () => {
  assert.equal(await definirTema(bia.id, perfilAna, "noite"), false);
  assert.equal(await definirTema(ana.id, perfilAna, "areia"), true);
});

test("o dono consegue tudo", async () => {
  assert.equal(await editarLink(ana.id, linkAna, { titulo: "Loja nova", url: "https://exemplo.com.br/loja" }), true);
  assert.equal(await alternarLink(ana.id, linkAna, false), true);
  const outro = await adicionarLink(ana.id, perfilAna, { titulo: "Outro", url: "https://exemplo.com.br/2" });
  assert.ok(outro);
  assert.equal((await listarLinks(ana.id, perfilAna))[0].id, outro.id, "link novo entra no topo");
  assert.equal(await reordenarLinks(ana.id, perfilAna, [linkAna, outro.id]), true);
  assert.equal((await listarLinks(ana.id, perfilAna))[0].id, linkAna);
  assert.equal(await reordenarLinks(ana.id, perfilAna, [linkAna]), false, "lista incompleta é recusada");
  assert.equal(await excluirLink(ana.id, outro.id), true);
});
