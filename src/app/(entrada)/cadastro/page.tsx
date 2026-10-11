import type { Metadata } from "next";
import { FormCadastro } from "../formularios";

export const metadata: Metadata = { title: "Criar conta · linkbio" };

// S01
export default function Cadastro() {
  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-fg">Crie sua página</h1>
      <p className="mb-6 text-sm text-muted">Grátis. Em um minuto você tem um endereço para pôr na bio.</p>
      <FormCadastro />
    </>
  );
}
