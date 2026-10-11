"use server";

// Todas as ações do app. Cada uma confere a sessão e o dono antes de mexer em
// qualquer coisa: ações do servidor podem ser chamadas por POST direto.
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cancelarAssinatura, iniciarAssinatura, type Forma } from "@/lib/billing";
import { documentoValido } from "@/lib/billing/cpf";
import { criarConta, entrar, pedirNovaSenha, reenviarConfirmacao, sair, trocarSenha, urlLoginGoogle } from "@/lib/data/auth";
import { definirTema, IDS_DOS_TEMAS } from "@/lib/data/aparencia";
import { excluirConta } from "@/lib/data/conta";
import { definirFoto } from "@/lib/data/fotos";
import { adicionarFormulario, editarFormulario, formularioSchema, removerInscrito } from "@/lib/data/formularios";
import { dentroDosLimites } from "@/lib/data/limites";
import { adicionarLink, alternarLink, editarLink, excluirLink, reordenarLinks } from "@/lib/data/links";
import { atualizarCabecalho, criarPerfil, perfilDaConta } from "@/lib/data/perfis";
import { IDS_DAS_REDES, normalizarRede, posicionarRedes, removerRede, reordenarRedes, salvarRede } from "@/lib/data/redes";
import { cabecalhoSchema, credenciaisSchema, linkSchema } from "@/lib/data/validacao";
import { exigirConta, exigirPerfil } from "@/lib/sessao";
import { ipAtual, origemDoPedido } from "@/lib/visitante";

export type Estado = {
  erro?: string;
  erros?: Record<string, string>;
  ok?: boolean;
  /** mensagem neutra de sucesso ("enviamos o link") */
  aviso?: string;
  /** login recusado porque o email ainda não foi confirmado */
  naoConfirmado?: boolean;
  // o que a pessoa digitou: o React limpa o formulário depois do envio, e em
  // caso de erro os campos voltam com isto
  valores?: Record<string, string>;
};

const MUITAS_TENTATIVAS = "Muitas tentativas em pouco tempo. Espere alguns minutos e tente de novo.";

function valoresDe(form: FormData, campos: string[]): Record<string, string> {
  return Object.fromEntries(campos.map((c) => [c, String(form.get(c) ?? "")]));
}

function errosDe(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const r: Record<string, string> = {};
  for (const i of issues) r[String(i.path[0])] ??= i.message;
  return r;
}

const emailSchema = z.string().trim().toLowerCase().email("Confira o email.").max(254);

// ------------------------------------------------------------------ conta

/** S01: cria a conta e manda o email de confirmação (a tela mostra a S02 no lugar do formulário). */
export async function cadastrar(_: Estado, form: FormData): Promise<Estado> {
  const dados = credenciaisSchema.safeParse({ email: form.get("email"), senha: form.get("senha") });
  const valores = valoresDe(form, ["email"]);
  if (!dados.success) return { erros: errosDe(dados.error.issues), valores };
  if (!(await dentroDosLimites([["cadastro:ip", await ipAtual(), 5, 3600]]))) return { erro: MUITAS_TENTATIVAS, valores };
  const r = await criarConta(dados.data.email, dados.data.senha, await origemDoPedido());
  if (!r.ok) return { erro: r.erro, valores };
  return { ok: true, valores };
}

/** S02: manda o link de confirmação de novo. */
export async function reenviar(_: Estado, form: FormData): Promise<Estado> {
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return { erro: "Confira o email." };
  const ok = await dentroDosLimites([
    ["reenviar:email", email.data, 3, 3600],
    ["reenviar:ip", await ipAtual(), 10, 3600],
  ]);
  if (!ok) return { erro: MUITAS_TENTATIVAS, valores: { email: email.data } };
  const r = await reenviarConfirmacao(email.data, await origemDoPedido());
  if (!r.ok) return { erro: r.erro, valores: { email: email.data } };
  return { ok: true, aviso: "Pronto, mandamos de novo. Pode levar um minuto; veja também o spam.", valores: { email: email.data } };
}

export async function fazerLogin(_: Estado, form: FormData): Promise<Estado> {
  const dados = credenciaisSchema.safeParse({ email: form.get("email"), senha: form.get("senha") });
  const valores = valoresDe(form, ["email"]);
  if (!dados.success) return { erro: "Email ou senha não conferem.", valores };
  const ip = await ipAtual();
  // Por email e IP, não só por email: senão qualquer um tranca a conta de
  // outra pessoa errando a senha dela de propósito (BUG-011).
  const ok = await dentroDosLimites([
    ["login:ip", ip, 20, 900],
    ["login:email-ip", `${dados.data.email}|${ip}`, 10, 900],
  ]);
  if (!ok) return { erro: MUITAS_TENTATIVAS, valores };
  const r = await entrar(dados.data.email, dados.data.senha);
  if (!r.ok) return { erro: r.erro, naoConfirmado: r.naoConfirmado, valores };
  redirect("/admin");
}

export async function entrarComGoogle(): Promise<void> {
  const url = await urlLoginGoogle(await origemDoPedido());
  redirect(url ?? "/entrar?aviso=google");
}

/** S18: pede o link de senha nova. A resposta é a mesma exista ou não a conta. */
export async function pedirSenhaNova(_: Estado, form: FormData): Promise<Estado> {
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return { erros: { email: "Confira o email." }, valores: valoresDe(form, ["email"]) };
  const ok = await dentroDosLimites([
    ["senha:email", email.data, 3, 3600],
    ["senha:ip", await ipAtual(), 10, 3600],
  ]);
  if (!ok) return { erro: MUITAS_TENTATIVAS, valores: { email: email.data } };
  const r = await pedirNovaSenha(email.data, await origemDoPedido());
  if (!r.ok) return { erro: r.erro, valores: { email: email.data } };
  return { ok: true, aviso: "Se existir uma conta com esse email, o link para criar uma senha nova chega em instantes. Veja também o spam." };
}

const senhaNovaSchema = z
  .object({ senha: credenciaisSchema.shape.senha, repetir: z.string() })
  .refine((d) => d.senha === d.repetir, { path: ["repetir"], message: "As duas senhas não estão iguais." });

/** Depois do link de recuperação: grava a senha nova. */
export async function salvarSenhaNova(_: Estado, form: FormData): Promise<Estado> {
  await exigirConta();
  const dados = senhaNovaSchema.safeParse({ senha: form.get("senha"), repetir: form.get("repetir") });
  if (!dados.success) return { erros: errosDe(dados.error.issues) };
  const r = await trocarSenha(dados.data.senha);
  if (!r.ok) return { erro: r.erro };
  redirect("/admin");
}

export async function fazerLogout(): Promise<void> {
  await sair("local");
  redirect("/entrar");
}

/** S13: derruba a sessão em todos os aparelhos (celular perdido, computador emprestado). */
export async function sairDeTodos(): Promise<void> {
  await exigirConta();
  await sair("global");
  redirect("/entrar?aviso=saiu-de-todos");
}

/** S13: exclui a conta inteira. Confirma pelo endereço da página (ou "excluir", se ainda não tem). */
export async function excluirMinhaConta(_: Estado, form: FormData): Promise<Estado> {
  const sessao = await exigirConta();
  const perfil = await perfilDaConta(sessao.userId);
  const esperado = perfil?.username ?? "excluir";
  if (String(form.get("confirmacao") ?? "").trim().toLowerCase() !== esperado) {
    return { erros: { confirmacao: `Digite ${esperado} para confirmar.` } };
  }
  const r = await excluirConta(sessao.userId, sessao.email);
  if (!r.ok) return { erro: r.erro };
  await sair("local").catch(() => undefined);
  redirect("/entrar?aviso=conta-excluida");
}

export async function escolherUsername(_: Estado, form: FormData): Promise<Estado> {
  const sessao = await exigirConta();
  if (await perfilDaConta(sessao.userId)) redirect("/admin");
  const r = await criarPerfil(sessao.userId, String(form.get("username") ?? ""));
  if (!r.ok) return { erros: { username: r.erro } };
  redirect("/admin");
}

// ------------------------------------------------------------------ plano

const checkoutSchema = z.object({
  forma: z.enum(["pix", "card", "boleto"]),
  nome: z.string().trim().max(100).optional(),
  documento: z.string().trim().max(20).optional(),
});

/** S14: assina o Pro e manda para a página de pagamento do Asaas. */
export async function assinarPro(_: Estado, form: FormData): Promise<Estado> {
  const sessao = await exigirConta();
  const valores = valoresDe(form, ["forma", "nome", "documento"]);
  const dados = checkoutSchema.safeParse({
    forma: form.get("forma"),
    nome: form.get("nome") ?? undefined,
    documento: form.get("documento") ?? undefined,
  });
  if (!dados.success) return { erro: "Escolha como quer pagar.", valores };
  let documento: string | undefined;
  if (dados.data.documento) {
    documento = documentoValido(dados.data.documento) ?? undefined;
    if (!documento) return { erros: { documento: "Confira o CPF ou CNPJ." }, valores };
  }
  if (!(await dentroDosLimites([["checkout:conta", sessao.userId, 10, 3600]]))) return { erro: MUITAS_TENTATIVAS, valores };
  const r = await iniciarAssinatura(sessao.userId, sessao.email, { forma: dados.data.forma as Forma, nome: dados.data.nome, documento });
  if (!r.ok) return { erro: r.erro, valores };
  redirect(r.url);
}

/** S14: cancela em um clique. */
export async function cancelarPro(): Promise<Estado> {
  const sessao = await exigirConta();
  const ok = await cancelarAssinatura(sessao.userId);
  refresh();
  return ok ? { ok: true, aviso: "Assinatura cancelada. O Pro continua até o fim do período pago." } : { erro: "Não deu para cancelar agora. Tente de novo em instantes." };
}

// ------------------------------------------------------------------ página

export async function salvarCabecalho(_: Estado, form: FormData): Promise<Estado> {
  const { sessao, perfil } = await exigirPerfil();
  const dados = cabecalhoSchema.safeParse({ titulo: form.get("titulo") ?? "", bio: form.get("bio") ?? "" });
  if (!dados.success) return { erros: errosDe(dados.error.issues), valores: valoresDe(form, ["titulo", "bio"]) };
  await atualizarCabecalho(sessao.userId, perfil.id, dados.data);
  refresh();
  return { ok: true };
}

export async function novoLink(_: Estado, form: FormData): Promise<Estado> {
  const { sessao, perfil } = await exigirPerfil();
  const dados = linkSchema.safeParse({ titulo: form.get("titulo"), url: form.get("url") });
  if (!dados.success) return { erros: errosDe(dados.error.issues), valores: valoresDe(form, ["titulo", "url"]) };
  await adicionarLink(sessao.userId, perfil.id, dados.data);
  refresh();
  return { ok: true };
}

// Ações chamadas direto pelo navegador: os argumentos chegam como o cliente
// mandou, então o formato é conferido aqui antes de ir ao banco.
const idSchema = z.uuid();
const idsSchema = z.array(z.uuid()).max(500);

export async function salvarLink(_: Estado, form: FormData): Promise<Estado> {
  const { sessao } = await exigirPerfil();
  const dados = linkSchema.safeParse({ titulo: form.get("titulo"), url: form.get("url") });
  if (!dados.success) return { erros: errosDe(dados.error.issues), valores: valoresDe(form, ["titulo", "url"]) };
  const id = idSchema.safeParse(form.get("id"));
  const ok = id.success && (await editarLink(sessao.userId, id.data, dados.data));
  if (!ok) return { erro: "Esse link não existe mais." };
  refresh();
  return { ok: true };
}

export async function ligarDesligarLink(id: unknown, ativo: unknown): Promise<boolean> {
  const { sessao } = await exigirPerfil();
  const linkId = idSchema.safeParse(id);
  if (!linkId.success || typeof ativo !== "boolean") return false;
  const ok = await alternarLink(sessao.userId, linkId.data, ativo);
  refresh();
  return ok;
}

export async function apagarLink(id: unknown): Promise<boolean> {
  const { sessao } = await exigirPerfil();
  const linkId = idSchema.safeParse(id);
  if (!linkId.success) return false;
  const ok = await excluirLink(sessao.userId, linkId.data);
  refresh();
  return ok;
}

export async function mudarOrdem(ids: unknown): Promise<boolean> {
  const { sessao, perfil } = await exigirPerfil();
  const lista = idsSchema.safeParse(ids);
  if (!lista.success) return false;
  const ok = await reordenarLinks(sessao.userId, perfil.id, lista.data);
  refresh();
  return ok;
}

/** S06: depois de enviar a foto ao Storage, grava como a do perfil (null tira a foto). */
export async function salvarFoto(caminho: unknown): Promise<boolean> {
  const { sessao, perfil } = await exigirPerfil();
  if (caminho !== null && (typeof caminho !== "string" || caminho.length > 200)) return false;
  const ok = await definirFoto(sessao.userId, perfil.id, caminho);
  refresh();
  return ok;
}

/** S08: troca o tema da página. */
export async function escolherTema(tema: unknown): Promise<boolean> {
  const { sessao, perfil } = await exigirPerfil();
  const escolhido = z.enum(IDS_DOS_TEMAS).safeParse(tema);
  if (!escolhido.success) return false;
  const ok = await definirTema(sessao.userId, perfil.id, escolhido.data);
  refresh();
  return ok;
}

// ------------------------------------------------------------------ formulário de email

/** S06: põe um formulário de email no topo da página, com textos padrão. */
export async function novoFormulario(): Promise<boolean> {
  const { sessao, perfil } = await exigirPerfil();
  const id = await adicionarFormulario(sessao.userId, perfil.id, perfil.title || perfil.username);
  refresh();
  return id !== null;
}

/** S11: título, nome opcional, consentimento e mensagem de sucesso. */
export async function salvarFormulario(_: Estado, form: FormData): Promise<Estado> {
  const { sessao } = await exigirPerfil();
  const valores = valoresDe(form, ["titulo", "consentimento", "sucesso", "pedirNome"]);
  const dados = formularioSchema.safeParse({
    titulo: form.get("titulo") ?? "",
    pedirNome: form.get("pedirNome") === "on",
    consentimento: form.get("consentimento") ?? "",
    sucesso: form.get("sucesso") ?? "",
  });
  if (!dados.success) return { erros: errosDe(dados.error.issues), valores };
  const id = idSchema.safeParse(form.get("id"));
  const ok = id.success && (await editarFormulario(sessao.userId, id.data, dados.data));
  if (!ok) return { erro: "Esse formulário não existe mais." };
  refresh();
  return { ok: true };
}

/** S10: tira uma pessoa da lista de inscritos. */
export async function tirarDaLista(id: unknown): Promise<boolean> {
  const { sessao } = await exigirPerfil();
  const inscrito = idSchema.safeParse(id);
  if (!inscrito.success) return false;
  const ok = await removerInscrito(sessao.userId, inscrito.data);
  refresh();
  return ok;
}

// ------------------------------------------------------------------ redes sociais

const plataformaSchema = z.enum(IDS_DAS_REDES);

/** S06: põe uma rede na fileira de ícones ou troca o endereço dela. */
export async function salvarRedeSocial(_: Estado, form: FormData): Promise<Estado> {
  const { sessao, perfil } = await exigirPerfil();
  const valores = valoresDe(form, ["plataforma", "endereco"]);
  const plataforma = plataformaSchema.safeParse(form.get("plataforma"));
  if (!plataforma.success) return { erros: { plataforma: "Escolha a rede." }, valores };
  const endereco = normalizarRede(plataforma.data, String(form.get("endereco") ?? ""));
  if (!endereco.ok) return { erros: { endereco: endereco.erro }, valores };
  const ok = await salvarRede(sessao.userId, perfil.id, plataforma.data, endereco.url);
  if (!ok) return { erro: "Não deu para salvar. Tente de novo.", valores };
  refresh();
  return { ok: true };
}

export async function tirarRede(plataforma: unknown): Promise<boolean> {
  const { sessao, perfil } = await exigirPerfil();
  const p = plataformaSchema.safeParse(plataforma);
  if (!p.success) return false;
  const ok = await removerRede(sessao.userId, perfil.id, p.data);
  refresh();
  return ok;
}

export async function ordemDasRedes(plataformas: unknown): Promise<boolean> {
  const { sessao, perfil } = await exigirPerfil();
  const lista = z.array(plataformaSchema).max(IDS_DAS_REDES.length).safeParse(plataformas);
  if (!lista.success) return false;
  const ok = await reordenarRedes(sessao.userId, perfil.id, lista.data);
  refresh();
  return ok;
}

export async function lugarDasRedes(posicao: unknown): Promise<boolean> {
  const { sessao, perfil } = await exigirPerfil();
  const p = z.enum(["top", "bottom"]).safeParse(posicao);
  if (!p.success) return false;
  const ok = await posicionarRedes(sessao.userId, perfil.id, p.data);
  refresh();
  return ok;
}
