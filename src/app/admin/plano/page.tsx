import type { Metadata } from "next";
import { EmConstrucao } from "@/components/app/em-construcao";

export const metadata: Metadata = { title: "Seu plano · linkbio" };

// S14
export default function Pagina() {
  return <EmConstrucao tela="S14" titulo="Seu plano" descricao="Assine o plano pago por Pix, cartão ou boleto, troque de plano e cancele em um clique." etapa="etapa 5 da construção (cobrança com Asaas)" />;
}
