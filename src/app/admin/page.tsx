import type { Metadata } from "next";
import { Suspense } from "react";
import { urlDaFoto } from "@/lib/data/fotos";
import { listarLinks } from "@/lib/data/links";
import { paginaPublica } from "@/lib/data/perfis";
import { travaDoBanco } from "@/lib/data/validacao";
import { ehFuso, FUSO_PADRAO, janela, utcParaLocal } from "@/lib/fuso";
import { exigirPerfil } from "@/lib/sessao";
import { Editor } from "./editor";

export const metadata: Metadata = { title: "Seus links" };

// S06 (com S07 nos modais de edição)
export default function PaginaEditor() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-fg">Seus links</h1>
      <Suspense fallback={<Carregando />}>
        <Dados />
      </Suspense>
    </div>
  );
}

async function Dados() {
  const { sessao, perfil } = await exigirPerfil();
  const [links, pagina] = await Promise.all([listarLinks(sessao.userId, perfil.id), paginaPublica(perfil.username)]);
  const fusoDaPagina = ehFuso(perfil.timezone) ? perfil.timezone : FUSO_PADRAO;
  const itens = links.map((l) => {
    const fuso = ehFuso(l.schedule_tz) ? l.schedule_tz : fusoDaPagina;
    const agora = janela(l.starts_at, l.ends_at, fuso);
    return {
      id: l.id,
      titulo: l.title,
      url: l.url ?? "",
      ativo: l.enabled,
      trava: travaDoBanco(l.lock, l.lock_min_age),
      agenda: { inicio: utcParaLocal(l.starts_at, fuso), fim: utcParaLocal(l.ends_at, fuso), fuso },
      agendado: agora.selo,
      noAr: agora.noAr,
      formulario: l.formulario,
    };
  });
  const redes = (pagina?.redes ?? []).map((r) => ({ plataforma: r.platform, url: r.url }));
  // A chave muda quando os dados do servidor mudam: o editor recomeça do estado salvo.
  const chave = [
    ...itens.map((l) => `${l.id}:${l.ativo}:${l.titulo}:${l.url}:${l.trava}:${l.agendado}:${JSON.stringify(l.agenda)}:${JSON.stringify(l.formulario)}`),
    ...redes.map((r) => `${r.plataforma}:${r.url}`),
    perfil.title,
    perfil.bio,
    perfil.avatar_path,
    perfil.social_position,
  ].join("|");
  return (
    <Editor
      key={chave}
      username={perfil.username}
      titulo={perfil.title ?? ""}
      bio={perfil.bio ?? ""}
      avatarUrl={urlDaFoto(perfil.avatar_path)}
      tema={pagina?.tema ?? "papel"}
      redes={redes}
      redesNoTopo={perfil.social_position === "top"}
      links={itens}
    />
  );
}

function Carregando() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">Carregando seus links</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg bg-surface-2" />
      ))}
    </div>
  );
}
