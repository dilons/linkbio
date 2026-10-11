import { EmConstrucao } from "@/components/app/em-construcao";

// S02
export default function Confirmar() {
  return (
    <EmConstrucao
      tela="S02"
      titulo="Confirme seu email"
      descricao="Vamos mandar um link para o seu email. Por enquanto, em desenvolvimento, a conta já nasce confirmada."
      etapa="/replica-backend (Supabase Auth)"
      voltar={{ href: "/comecar", rotulo: "Continuar" }}
    />
  );
}
