import type { Metadata } from "next";
import { Suspense } from "react";
import { TEMAS } from "@/lib/data/aparencia";
import { urlDaFoto } from "@/lib/data/fotos";
import { paginaPublica } from "@/lib/data/perfis";
import { exigirPerfil } from "@/lib/sessao";
import { Galeria } from "./galeria";

export const metadata: Metadata = { title: "Aparência · linkbio" };

// S08 (temas prontos; o tema customizado é da etapa 6)
export default function Aparencia() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-fg">Aparência</h1>
      <Suspense fallback={<Esqueleto />}>
        <Dados />
      </Suspense>
    </div>
  );
}

async function Dados() {
  const { perfil } = await exigirPerfil();
  const pagina = await paginaPublica(perfil.username);
  return (
    <Galeria
      temas={TEMAS}
      atual={pagina?.tema ?? "papel"}
      titulo={perfil.title || perfil.username}
      bio={perfil.bio ?? undefined}
      avatarUrl={urlDaFoto(perfil.avatar_path)}
      redes={(pagina?.redes ?? []).map((r) => ({ plataforma: r.platform, url: r.url }))}
      redesNoTopo={perfil.social_position === "top"}
      links={(pagina?.links ?? []).map((l) => ({ id: l.id, titulo: l.title }))}
      comMarca={!pagina?.pro}
    />
  );
}

function Esqueleto() {
  return (
    <div role="status" className="flex flex-wrap gap-3">
      <span className="sr-only">Carregando os temas</span>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-48 w-32 animate-pulse rounded-lg bg-surface-2" />
      ))}
    </div>
  );
}
