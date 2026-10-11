import type { Metadata } from "next";
import { EmConstrucao } from "@/components/app/em-construcao";

export const metadata: Metadata = { title: "Configurações · linkbio" };

// S12
export default function Pagina() {
  return <EmConstrucao tela="S12" titulo="Configurações" descricao="Aviso de conteúdo sensível ou para maiores na página toda e o QR code da sua página para imprimir (S19)." etapa="etapa 6 da construção" />;
}
