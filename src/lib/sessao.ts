import { redirect } from "next/navigation";
import { sessaoAtual, type Sessao } from "./data/auth";
import { perfilDaConta, type Perfil } from "./data/perfis";

/** Sem sessão válida, manda para o login. */
export async function exigirConta(): Promise<Sessao> {
  const s = await sessaoAtual();
  if (!s) redirect("/entrar");
  return s;
}

/** Sem perfil ainda, manda escolher o endereço. */
export async function exigirPerfil(): Promise<{ sessao: Sessao; perfil: Perfil }> {
  const sessao = await exigirConta();
  const perfil = await perfilDaConta(sessao.userId);
  if (!perfil) redirect("/comecar");
  return { sessao, perfil };
}
