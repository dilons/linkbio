import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { OPCOES_DO_COOKIE } from "@/lib/supabase/cookies";

// Renova a sessão do Supabase Auth antes da página ou da ação rodar (os
// cookies só podem ser regravados aqui ou numa ação). Também faz a checagem
// otimista: sem sessão, o painel nem abre; com sessão, cadastro e login levam
// direto ao painel. A checagem de verdade (dono do perfil) é feita no servidor,
// em cada página e em cada ação.
export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookieOptions: OPCOES_DO_COOKIE,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(lista, cabecalhos) {
        for (const { name, value } of lista) request.cookies.set(name, value);
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of lista) resposta.cookies.set(name, value, options);
        // resposta que grava sessão não pode ficar em cache de CDN
        for (const [k, v] of Object.entries(cabecalhos ?? {})) resposta.headers.set(k, v);
      },
    },
  });

  // getUser pergunta ao Supabase Auth (getClaims só confere a assinatura do
  // token): sessão derrubada por "sair de todos os aparelhos" cai na hora.
  const { data } = await supabase.auth.getUser();
  const logado = Boolean(data.user);
  const caminho = request.nextUrl.pathname;

  const destino =
    !logado && /^\/(admin|comecar)(\/|$)|^\/entrar\/nova-senha$/.test(caminho)
      ? "/entrar"
      : logado && /^\/(cadastro|entrar)$/.test(caminho)
        ? "/admin"
        : null;
  if (!destino) return resposta;

  const redirecionar = NextResponse.redirect(new URL(destino, request.url));
  for (const c of resposta.cookies.getAll()) redirecionar.cookies.set(c);
  return redirecionar;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/comecar/:path*",
    "/cadastro",
    "/entrar/:path*",
    "/api/username",
    "/api/upload",
    "/api/me/:path*",
  ],
};
