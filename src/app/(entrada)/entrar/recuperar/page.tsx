import { EmConstrucao } from "@/components/app/em-construcao";

// S18 (recuperar senha)
export default function Recuperar() {
  return (
    <EmConstrucao
      tela="S18"
      titulo="Recuperar a senha"
      descricao="Você informa o email e recebe um link para criar uma senha nova."
      etapa="/replica-backend (Supabase Auth)"
      voltar={{ href: "/entrar", rotulo: "Voltar para o login" }}
    />
  );
}
