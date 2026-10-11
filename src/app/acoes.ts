"use server";

// Todas as ações do app. Cada uma confere a sessão e o dono antes de mexer em
// qualquer coisa: ações do servidor podem ser chamadas por POST direto.
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { criarConta, entrar, sair } from "@/lib/data/auth";
import { adicionarLink, alternarLink, editarLink, excluirLink, reordenarLinks } from "@/lib/data/links";
import { atualizarCabecalho, criarPerfil, perfilDaConta } from "@/lib/data/perfis";
import { cabecalhoSchema, credenciaisSchema, linkSchema } from "@/lib/data/validacao";
import { exigirConta, exigirPerfil } from "@/lib/sessao";

export type Estado = {
  erro?: string;
  erros?: Record<string, string>;
  ok?: boolean;
  // o que a pessoa digitou: o React limpa o formulário depois do envio, e em
  // caso de erro os campos voltam com isto
  valores?: Record<string, string>;
};

function valoresDe(form: FormData, campos: string[]): Record<string, string> {
  return Object.fromEntries(campos.map((c) => [c, String(form.get(c) ?? "")]));
}

function errosDe(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const r: Record<string, string> = {};
  for (const i of issues) r[String(i.path[0])] ??= i.message;
  return r;
}

// ------------------------------------------------------------------ conta

export async function cadastrar(_: Estado, form: FormData): Promise<Estado> {
  const dados = credenciaisSchema.safeParse({ email: form.get("email"), senha: form.get("senha") });
  const valores = valoresDe(form, ["email"]);
  if (!dados.success) return { erros: errosDe(dados.error.issues), valores };
  const r = await criarConta(dados.data.email, dados.data.senha);
  if (!r.ok) return { erro: r.erro, valores };
  redirect("/comecar");
}

export async function fazerLogin(_: Estado, form: FormData): Promise<Estado> {
  const dados = credenciaisSchema.safeParse({ email: form.get("email"), senha: form.get("senha") });
  const valores = valoresDe(form, ["email"]);
  if (!dados.success) return { erro: "Email ou senha não conferem.", valores };
  const r = await entrar(dados.data.email, dados.data.senha);
  if (!r.ok) return { erro: r.erro, valores };
  redirect("/admin");
}

export async function fazerLogout(): Promise<void> {
  await sair();
  redirect("/entrar");
}

export async function escolherUsername(_: Estado, form: FormData): Promise<Estado> {
  const sessao = await exigirConta();
  if (await perfilDaConta(sessao.userId)) redirect("/admin");
  const r = await criarPerfil(sessao.userId, String(form.get("username") ?? ""));
  if (!r.ok) return { erros: { username: r.erro } };
  redirect("/admin");
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

export async function salvarLink(_: Estado, form: FormData): Promise<Estado> {
  const { sessao } = await exigirPerfil();
  const dados = linkSchema.safeParse({ titulo: form.get("titulo"), url: form.get("url") });
  if (!dados.success) return { erros: errosDe(dados.error.issues), valores: valoresDe(form, ["titulo", "url"]) };
  const ok = await editarLink(sessao.userId, String(form.get("id")), dados.data);
  if (!ok) return { erro: "Esse link não existe mais." };
  refresh();
  return { ok: true };
}

export async function ligarDesligarLink(id: string, ativo: boolean): Promise<boolean> {
  const { sessao } = await exigirPerfil();
  const ok = await alternarLink(sessao.userId, id, ativo);
  refresh();
  return ok;
}

export async function apagarLink(id: string): Promise<boolean> {
  const { sessao } = await exigirPerfil();
  const ok = await excluirLink(sessao.userId, id);
  refresh();
  return ok;
}

export async function mudarOrdem(ids: string[]): Promise<boolean> {
  const { sessao, perfil } = await exigirPerfil();
  const ok = await reordenarLinks(sessao.userId, perfil.id, ids);
  refresh();
  return ok;
}
