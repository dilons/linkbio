import type { ReactNode } from "react";
import { PublicLinkButton, type Forma, type Preenchimento } from "./link-button";
import { ProfileHeader } from "./profile-header";
import { SocialRow, type Rede } from "./social-row";

export type LinkPublico = { id: string; titulo: string; destaque?: boolean; travado?: boolean };

/**
 * A página que o visitante vê: uma coluna central com cabeçalho, redes, links
 * e blocos extras (formulário). É a mesma usada na prévia do editor.
 */
export function PublicPage({
  tema,
  titulo,
  bio,
  avatarUrl,
  redes = [],
  redesNoTopo = true,
  links,
  forma,
  preenchimento,
  extra,
  comMarca = true,
  principal = true,
}: {
  tema: string;
  titulo: string;
  bio?: string;
  avatarUrl?: string;
  redes?: Rede[];
  redesNoTopo?: boolean;
  links: LinkPublico[];
  forma?: Forma;
  preenchimento?: Preenchimento;
  extra?: ReactNode;
  comMarca?: boolean;
  /** false dentro da prévia do editor, que já está dentro de um <main>. */
  principal?: boolean;
}) {
  const Raiz = principal ? "main" : "div";
  return (
    <div data-theme={tema} className="min-h-full bg-t-bg">
      <Raiz
        className="mx-auto flex flex-col gap-6 py-10"
        style={{ maxWidth: "var(--layout-public-max)", paddingInline: "var(--layout-public-gutter)" }}
      >
        <ProfileHeader titulo={titulo} bio={bio} avatarUrl={avatarUrl} />
        {redesNoTopo && <SocialRow redes={redes} />}
        <nav aria-label={`Links de ${titulo}`}>
          <ul className="flex flex-col gap-3">
            {links.map((l) => (
              <li key={l.id}>
                <PublicLinkButton id={l.id} titulo={l.titulo} destaque={l.destaque} travado={l.travado} forma={forma} preenchimento={preenchimento} />
              </li>
            ))}
          </ul>
        </nav>
        {extra}
        {!redesNoTopo && <SocialRow redes={redes} />}
        {comMarca && (
          <footer className="pt-4 text-center text-xs text-t-muted">
            Feito com <span className="font-semibold">linkbio</span>
          </footer>
        )}
      </Raiz>
    </div>
  );
}
