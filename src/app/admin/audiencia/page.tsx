import type { Metadata } from "next";
import { EmConstrucao } from "@/components/app/em-construcao";

export const metadata: Metadata = { title: "Audiência · linkbio" };

// S10
export default function Pagina() {
  return <EmConstrucao tela="S10" titulo="Audiência" descricao="As pessoas que deixaram o email no formulário da sua página, com a data e o texto de consentimento que aceitaram. Dá para baixar em CSV." etapa="etapa 4 da construção" />;
}
