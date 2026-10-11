// Contas no Supabase Auth: email e senha com confirmação, recuperação de senha,
// Google, sair deste ou de todos os aparelhos, excluir. A sessão fica em
// cookies httpOnly gerenciados pelo @supabase/ssr; o proxy a renova.
import type { AuthError, EmailOtpType } from "@supabase/supabase-js";
import { enviarEmail } from "@/lib/email";
import { modelos } from "@/lib/email/modelos";
import { supabaseAdmin, supabaseDoPedido } from "@/lib/supabase/server";

export type Sessao = { userId: string; email: string };
export type Resultado = { ok: true } | { ok: false; erro: string; naoConfirmado?: boolean };

const MENSAGENS: Record<string, string> = {
  invalid_credentials: "Email ou senha não conferem.",
  email_not_confirmed: "Falta confirmar o email. Procure o link que enviamos (veja também o spam).",
  weak_password: "Essa senha é fácil de adivinhar. Tente outra, com pelo menos 8 caracteres.",
  same_password: "A senha nova precisa ser diferente da atual.",
  email_address_invalid: "Confira o email.",
  over_email_send_rate_limit: "Muitos emails em pouco tempo. Espere alguns minutos e tente de novo.",
  over_request_rate_limit: "Muitas tentativas. Espere alguns minutos e tente de novo.",
  signup_disabled: "Os cadastros estão fechados agora.",
  otp_expired: "Esse link expirou ou já foi usado. Peça outro.",
};

function traduzir(e: AuthError): string {
  return (e.code && MENSAGENS[e.code]) || "Não deu certo agora. Tente de novo em instantes.";
}

/** A sessão do pedido, conferida (assinatura do token ou consulta ao Auth). */
export async function sessaoAtual(): Promise<Sessao | null> {
  const supabase = await supabaseDoPedido();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return { userId: claims.sub, email: String(claims.email ?? "") };
}

/**
 * Cria a conta e manda o email de confirmação. Email que já tem conta: a tela
 * responde igual (não revela quem é cliente) e o dono do email recebe um aviso
 * com o caminho para entrar (BUG-007; antes aparecia um erro genérico).
 */
export async function criarConta(email: string, senha: string, origem: string): Promise<Resultado> {
  const supabase = await supabaseDoPedido();
  const { error } = await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: origem } });
  if (error?.code === "user_already_exists") {
    await enviarEmail(modelos.jaTemConta(email, origem), `ja-tem-conta-${email}-${new Date().toISOString().slice(0, 10)}`);
    return { ok: true };
  }
  return error ? { ok: false, erro: traduzir(error) } : { ok: true };
}

export async function entrar(email: string, senha: string): Promise<Resultado> {
  const supabase = await supabaseDoPedido();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (!error) return { ok: true };
  return { ok: false, erro: traduzir(error), naoConfirmado: error.code === "email_not_confirmed" };
}

export async function reenviarConfirmacao(email: string, origem: string): Promise<Resultado> {
  const supabase = await supabaseDoPedido();
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: origem } });
  return error ? { ok: false, erro: traduzir(error) } : { ok: true };
}

/** Manda o link de senha nova. Responde igual exista ou não a conta. */
export async function pedirNovaSenha(email: string, origem: string): Promise<Resultado> {
  const supabase = await supabaseDoPedido();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: origem });
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return { ok: false, erro: traduzir(error) };
  }
  return { ok: true };
}

/** O link dos emails (/auth/confirm): valida o token e abre a sessão. */
export async function confirmarToken(tokenHash: string, tipo: EmailOtpType): Promise<Resultado> {
  const supabase = await supabaseDoPedido();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
  return error ? { ok: false, erro: traduzir(error) } : { ok: true };
}

/** A volta do Google (/auth/callback): troca o código pela sessão. */
export async function trocarCodigo(codigo: string): Promise<Resultado> {
  const supabase = await supabaseDoPedido();
  const { error } = await supabase.auth.exchangeCodeForSession(codigo);
  return error ? { ok: false, erro: traduzir(error) } : { ok: true };
}

/** Endereço do Google para onde mandar a pessoa. Só pede email e perfil. */
export async function urlLoginGoogle(origem: string): Promise<string | null> {
  const supabase = await supabaseDoPedido();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origem}/auth/callback`, scopes: "email profile" },
  });
  return error ? null : data.url;
}

export async function trocarSenha(senha: string): Promise<Resultado> {
  const supabase = await supabaseDoPedido();
  const { error } = await supabase.auth.updateUser({ password: senha });
  return error ? { ok: false, erro: traduzir(error) } : { ok: true };
}

/** "local" sai só deste aparelho; "global" derruba a sessão em todos. */
export async function sair(escopo: "local" | "global" = "local"): Promise<void> {
  const supabase = await supabaseDoPedido();
  await supabase.auth.signOut({ scope: escopo });
}

/**
 * Apaga o usuário no Auth. Em cascata some a conta; o gatilho
 * antes_de_apagar_conta esvazia os perfis na hora (o username fica 14 dias).
 */
export async function apagarUsuario(userId: string): Promise<boolean> {
  const { error } = await supabaseAdmin().auth.admin.deleteUser(userId);
  return !error;
}
