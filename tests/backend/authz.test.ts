// Um segundo usuário não vê nem mexe em nada do primeiro (architecture.md,
// "Regra de acesso"), e o dono consegue tudo.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fecharBanco } from "@/lib/db";
import { definirTema } from "@/lib/data/aparencia";
import { totais } from "@/lib/data/eventos";
import { adicionarFormulario, editarFormulario, listarInscritos, removerInscrito } from "@/lib/data/formularios";
import { adicionarLink, alternarLink, editarLink, excluirLink, listarLinks, reordenarLinks } from "@/lib/data/links";
import { atualizarCabecalho, criarPerfil, perfilDaConta } from "@/lib/data/perfis";
import { listarRedes, posicionarRedes, removerRede, reordenarRedes, salvarRede } from "@/lib/data/redes";
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

test("outra conta não cria, edita nem lê formulários e inscritos", async () => {
  assert.equal(await adicionarFormulario(bia.id, perfilAna, "Ana"), null);
  const form = await adicionarFormulario(ana.id, perfilAna, "Ana");
  assert.ok(form);
  const dados = { titulo: "Invadido", pedirNome: false, consentimento: "Texto trocado por outra conta, não pode", sucesso: "x" };
  assert.equal(await editarFormulario(bia.id, form, dados), false);
  const { db } = await import("@/lib/db");
  const { submissions } = await import("@/lib/db/schema");
  const [i] = await (await db())
    .insert(submissions)
    .values({ profileId: perfilAna, linkId: form, email: "fa@exemplo.com", consentText: "Aceito" })
    .returning({ id: submissions.id });
  assert.deepEqual(await listarInscritos(bia.id, perfilAna), []);
  assert.equal(await removerInscrito(bia.id, i.id), false);
  assert.equal((await listarInscritos(ana.id, perfilAna)).length, 1);
  assert.equal(await removerInscrito(ana.id, i.id), true);
  assert.equal(await excluirLink(bia.id, form), false);
  assert.equal(await excluirLink(ana.id, form), true);
});

test("outra conta não põe, tira, reordena nem move as redes", async () => {
  assert.equal(await salvarRede(bia.id, perfilAna, "instagram", "https://www.instagram.com/golpe"), false);
  assert.equal(await salvarRede(ana.id, perfilAna, "instagram", "https://www.instagram.com/ana"), true);
  assert.equal(await salvarRede(ana.id, perfilAna, "whatsapp", "https://wa.me/5511912345678"), true);
  assert.deepEqual(await listarRedes(bia.id, perfilAna), []);
  assert.equal(await removerRede(bia.id, perfilAna, "instagram"), false);
  assert.equal(await reordenarRedes(bia.id, perfilAna, ["whatsapp", "instagram"]), false);
  assert.equal(await posicionarRedes(bia.id, perfilAna, "bottom"), false);
  assert.equal((await perfilDaConta(ana.id))?.social_position, "top");

  assert.equal(await salvarRede(ana.id, perfilAna, "instagram", "https://www.instagram.com/ana.nova"), true, "a mesma rede troca o endereço");
  assert.equal(await reordenarRedes(ana.id, perfilAna, ["whatsapp"]), false, "lista incompleta é recusada");
  assert.equal(await reordenarRedes(ana.id, perfilAna, ["whatsapp", "instagram"]), true);
  assert.deepEqual(await listarRedes(ana.id, perfilAna), [
    { plataforma: "whatsapp", url: "https://wa.me/5511912345678" },
    { plataforma: "instagram", url: "https://www.instagram.com/ana.nova" },
  ]);
  assert.equal(await posicionarRedes(ana.id, perfilAna, "bottom"), true);
  assert.equal((await perfilDaConta(ana.id))?.social_position, "bottom");
  assert.equal(await removerRede(ana.id, perfilAna, "instagram"), true);
  assert.equal(await removerRede(ana.id, perfilAna, "whatsapp"), true);
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
