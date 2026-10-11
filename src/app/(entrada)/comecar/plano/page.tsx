import { EmConstrucao } from "@/components/app/em-construcao";

// S05
export default function Plano() {
  return (
    <EmConstrucao
      tela="S05"
      titulo="Escolha seu plano"
      descricao="Comece grátis. O plano pago tira a marca do rodapé e libera temas, agendamento e insights mais longos."
      etapa="etapa 5 da construção (cobrança)"
      voltar={{ href: "/admin", rotulo: "Continuar no grátis" }}
    />
  );
}
