import { NextResponse, type NextRequest } from "next/server";

// Checagem otimista: sem o cookie de sessão, nem tenta abrir o painel.
// A checagem de verdade (sessão válida, dono do perfil) é feita no servidor,
// em cada página e em cada ação.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("lb_sessao")) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/comecar/:path*"],
};
