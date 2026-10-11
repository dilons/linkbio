import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { TelaDeAviso } from "@/components/public/gate-screen";
import { estadoDoAviso, infoDoAlvo, lerAlvo } from "@/lib/data/aviso";

export const metadata: Metadata = { title: "Aviso de conteúdo", robots: { index: false } };

// S16 para um link: o aviso antes de ir ao destino. A resposta volta para
// /r/[id], que confere o cookie, conta o clique e redireciona.
export default function AvisoDoLink({ params, searchParams }: PageProps<"/r/[linkId]/aviso">) {
  return (
    <Suspense fallback={null}>
      <Conteudo params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Conteudo({ params, searchParams }: Pick<PageProps<"/r/[linkId]/aviso">, "params" | "searchParams">) {
  const { linkId } = await params;
  const alvo = lerAlvo(`l:${linkId}`);
  const info = alvo && (await infoDoAlvo(alvo));
  if (!alvo || !info) notFound();
  // a página toda tem aviso e a pessoa ainda não respondeu: começa por lá
  if (info.rotuloDaPagina && (await estadoDoAviso({ tipo: "p", id: info.perfilId })) !== "ok") redirect(`/${info.username}`);
  const estado = await estadoDoAviso(alvo);
  if (!info.rotulo || estado === "ok") redirect(`/r/${alvo.id}`);
  return (
    <TelaDeAviso
      tema={info.tema}
      rotulo={info.rotulo}
      alvo={`l:${alvo.id}`}
      titulo={info.titulo}
      doLink
      negado={estado === "negado"}
      erroData={(await searchParams).aviso === "data"}
      voltarPara={{ href: `/${info.username}`, texto: `Voltar para a página de ${info.titulo}` }}
    />
  );
}
