"use client";

import { useState } from "react";
import { escolherTema } from "@/app/acoes";
import { PublicPage, type LinkPublico } from "@/components/public/public-page";
import type { Rede } from "@/components/public/social-row";
import { PhonePreview } from "@/components/ui/phone-preview";
import { ThemeCard } from "@/components/ui/theme-card";
import { useToast } from "@/components/ui/toast";
import { SEM_CONEXAO, tentar } from "@/lib/acao-segura";

type Props = {
  temas: ReadonlyArray<{ id: string; nome: string; descricao: string }>;
  atual: string;
  titulo: string;
  bio?: string;
  avatarUrl?: string;
  redes: Rede[];
  redesNoTopo: boolean;
  links: LinkPublico[];
  comMarca: boolean;
};

/** S08: a galeria de temas. A prévia muda na hora; o servidor confirma depois. */
export function Galeria(props: Props) {
  const toast = useToast();
  const [tema, setTema] = useState(props.atual);

  async function escolher(id: string) {
    if (id === tema) return;
    const antes = tema;
    setTema(id);
    const ok = await tentar(() => escolherTema(id), null);
    if (ok) return toast("Tema salvo");
    setTema(antes);
    toast(ok === null ? SEM_CONEXAO : "Não deu para trocar o tema.", "erro");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
      <section aria-labelledby="t-temas" className="flex min-w-0 flex-col gap-4">
        <div>
          <h2 id="t-temas" className="text-lg font-semibold text-fg">
            Temas prontos
          </h2>
          <p className="text-sm text-muted">Todos com o contraste conferido. Cores, fonte e fundo do seu jeito chegam em breve.</p>
        </div>
        <ul className="flex flex-wrap gap-3">
          {props.temas.map((t) => (
            <li key={t.id}>
              <ThemeCard tema={t.id} nome={t.nome} selecionado={tema === t.id} onSelecionar={() => escolher(t.id)} />
              <p className="sr-only">{t.descricao}</p>
            </li>
          ))}
        </ul>
      </section>
      <div className="lg:sticky lg:top-8 lg:self-start">
        <PhonePreview rotulo={`Prévia com o tema ${props.temas.find((t) => t.id === tema)?.nome ?? ""}`}>
          <PublicPage
            principal={false}
            tema={tema}
            titulo={props.titulo}
            bio={props.bio}
            avatarUrl={props.avatarUrl}
            redes={props.redes}
            redesNoTopo={props.redesNoTopo}
            links={props.links}
            comMarca={props.comMarca}
          />
        </PhonePreview>
      </div>
    </div>
  );
}
