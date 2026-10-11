import type { Metadata } from "next";
import { fazerLogout } from "@/app/acoes";
import { EmConstrucao } from "@/components/app/em-construcao";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Conta · linkbio" };

// S13
export default function Conta() {
  return (
    <div className="flex flex-col gap-8">
      <EmConstrucao
        tela="S13"
        titulo="Sua conta"
        descricao="Trocar o endereço (uma vez a cada 7 dias), baixar todos os seus dados e excluir a página ou a conta inteira."
        etapa="etapa 5 da construção (exclusão e dados) e etapa 6 (troca de endereço)"
      />
      <form action={fazerLogout}>
        <Button type="submit" variant="secondary">
          Sair da conta
        </Button>
      </form>
    </div>
  );
}
