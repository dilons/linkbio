import type { Metadata } from "next";
import { FormSenhaNova } from "../../formularios";

export const metadata: Metadata = { title: "Senha nova · linkbio" };

// Chega-se aqui pelo link de recuperação (/auth/confirm já abriu a sessão).
export default function SenhaNova() {
  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-fg">Crie uma senha nova</h1>
      <p className="mb-6 text-sm text-muted">Depois de salvar, você entra direto no painel.</p>
      <FormSenhaNova />
    </>
  );
}
