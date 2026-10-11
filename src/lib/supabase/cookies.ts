// Os cookies da sessão. O app nunca usa o cliente do Supabase no navegador
// (login e dados passam sempre pelo servidor), então o JavaScript da página não
// precisa ler o token: httpOnly fecha a porta para roubo por XSS.
export const OPCOES_DO_COOKIE = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 400 * 24 * 60 * 60,
};
