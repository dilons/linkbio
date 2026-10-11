import { EmConstrucao } from "@/components/app/em-construcao";

// S04
export default function Modelo() {
  return (
    <EmConstrucao
      tela="S04"
      titulo="Que tipo de página você quer?"
      descricao="Você escolhe sua área (loja, música, serviços, criador de conteúdo) e começa com um modelo pronto de links e tema."
      etapa="etapa 6 da construção (should-haves)"
      voltar={{ href: "/admin", rotulo: "Ir para o editor" }}
    />
  );
}
