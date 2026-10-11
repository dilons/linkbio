import type { Metadata } from "next";
import { EmConstrucao } from "@/components/app/em-construcao";

export const metadata: Metadata = { title: "Aparência · linkbio" };

// S08
export default function Pagina() {
  return <EmConstrucao tela="S08" titulo="Aparência" descricao="Escolha um dos temas ou monte o seu: cores, fonte, formato dos botões e fundo, com o contraste conferido antes de salvar." etapa="etapa 2 da construção (temas prontos) e etapa 6 (tema customizado)" />;
}
