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
  // Só navegação é redirecionada. Uma ação do servidor (POST) que recebesse um
  // redirect daqui receberia HTML no lugar da resposta da ação e a página
  // quebrava (BUG-002); a própria ação confere a sessão e manda ao login.
  if (request.method !== "GET" && request.method !== "HEAD") return resposta;

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

// Pré-carregamentos do Next ficam de fora: um redirect aqui virava 404 no
// console (BUG-008), e a página conferir a sessão já basta para eles. O
// matcher precisa ser estático, daí a repetição.
export const config = {
  matcher: [
    { source: "/admin/:path*", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
    { source: "/comecar/:path*", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
    { source: "/cadastro", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
    { source: "/entrar/:path*", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
    { source: "/api/username", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
    { source: "/api/upload", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
    { source: "/api/me/:path*", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
    { source: "/api/audiencia.csv", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] },
  ],
};
