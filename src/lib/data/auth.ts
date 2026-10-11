// Login provisório (email e senha, sessão em cookie httpOnly). A
// /replica-backend troca por Supabase Auth com confirmação de email e Google;
// as funções exportadas ficam com a mesma forma.
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db, violouUnico } from "./db";
import { conferirSenha, hashSenha } from "./senha";

export const COOKIE_SESSAO = "lb_sessao";
const DURACAO_DIAS = 30;

export type Sessao = { userId: string; email: string };
type Resultado = { ok: true; userId: string } | { ok: false; erro: string };

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

async function abrirSessao(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expira = new Date(Date.now() + DURACAO_DIAS * 86400_000);
  const conn = await db();
  await conn.query("insert into auth.sessions (token_hash, user_id, expires_at) values ($1, $2, $3)", [
    hashToken(token),
    userId,
    expira.toISOString(),
  ]);
  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expira,
  });
}

/** Cria a conta e já abre a sessão. Em desenvolvimento o email vale como confirmado. */
export async function criarConta(email: string, senha: string): Promise<Resultado> {
  const conn = await db();
  try {
    const id = await conn.transaction(async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        "insert into auth.users (email, password_hash, email_confirmed_at) values ($1, $2, now()) returning id",
        [email, await hashSenha(senha)],
      );
      await tx.query("insert into accounts (id) values ($1)", [rows[0].id]);
      return rows[0].id;
    });
    await abrirSessao(id);
    return { ok: true, userId: id };
  } catch (e) {
    if (violouUnico(e)) return { ok: false, erro: "Já existe uma conta com esse email. Entre por aqui." };
    throw e;
  }
}

export async function entrar(email: string, senha: string): Promise<Resultado> {
  const conn = await db();
  const { rows } = await conn.query<{ id: string; password_hash: string }>(
    "select id, password_hash from auth.users where email = $1",
    [email],
  );
  // Mesma mensagem para email inexistente e senha errada: não revela quem tem conta.
  if (!rows[0] || !(await conferirSenha(senha, rows[0].password_hash))) {
    return { ok: false, erro: "Email ou senha não conferem." };
  }
  await abrirSessao(rows[0].id);
  return { ok: true, userId: rows[0].id };
}

export async function sair(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (token) {
    const conn = await db();
    await conn.query("delete from auth.sessions where token_hash = $1", [hashToken(token)]);
  }
  jar.delete(COOKIE_SESSAO);
}

export async function sessaoAtual(): Promise<Sessao | null> {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  const conn = await db();
  const { rows } = await conn.query<{ user_id: string; email: string }>(
    `select s.user_id, u.email from auth.sessions s join auth.users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)],
  );
  return rows[0] ? { userId: rows[0].user_id, email: rows[0].email } : null;
}
