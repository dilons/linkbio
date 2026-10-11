import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { PublicPage } from "@/components/public/public-page";
import { urlDaFoto } from "@/lib/data/fotos";
import { paginaPublica } from "@/lib/data/perfis";
import { ContaVisita } from "./conta-visita";

// metadata e página pedem o mesmo perfil: uma consulta só por requisição
const carregar = cache(paginaPublica);

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const pagina = await carregar(username);
  // Robôs de prévia (WhatsApp, Facebook) esperam os metadados antes de qualquer
  // byte: daqui o 404 sai com status 404 de verdade.
  if (!pagina) notFound();
  const nome = pagina.perfil.title || pagina.perfil.username;
  return {
    title: `${nome} · linkbio`,
    description: pagina.perfil.bio ?? `Os links de ${nome}.`,
  };
}

// S15: a página pública. Tudo depende do endereço, então fica dentro do
// Suspense. Endereço livre: robôs de prévia (WhatsApp, Facebook) recebem 404
// de verdade, porque o Next não faz streaming para eles; navegadores recebem a
// página de 404 com noindex, já que o status sai com o primeiro pedaço.
export default function PaginaDoPerfil({ params }: PageProps<"/[username]">) {
  return (
    <Suspense fallback={<Esqueleto />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: PageProps<"/[username]">["params"] }) {
  const { username } = await params;
  const pagina = await carregar(username);
  if (!pagina) notFound();
  const { perfil } = pagina;
  return (
    <>
      <PublicPage
        tema={pagina.tema}
        titulo={perfil.title || perfil.username}
        bio={perfil.bio ?? undefined}
        avatarUrl={urlDaFoto(perfil.avatar_path)}
        comMarca={!pagina.pro}
        redes={pagina.redes.map((r) => ({ plataforma: r.platform, url: r.url }))}
        redesNoTopo={perfil.social_position === "top"}
        links={pagina.links.map((l) => ({ id: l.id, titulo: l.title, formulario: l.formulario }))}
      />
      <ContaVisita perfil={perfil.id} />
    </>
  );
}

function Esqueleto() {
  return (
    <div data-theme="papel" className="min-h-full flex-1 bg-t-bg" aria-busy="true">
      <div className="mx-auto flex flex-col items-center gap-6 py-10" style={{ maxWidth: "var(--layout-public-max)", paddingInline: "var(--layout-public-gutter)" }}>
        <span className="size-24 animate-pulse rounded-pill bg-t-button opacity-20" />
        <span className="h-6 w-40 animate-pulse rounded-md bg-t-button opacity-20" />
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-full animate-pulse rounded-pill bg-t-button opacity-20" style={{ height: "var(--layout-public-link-height)" }} />
        ))}
      </div>
    </div>
  );
}
