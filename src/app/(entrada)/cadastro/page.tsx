import type { Metadata } from "next";
import { FormCadastro } from "../formularios";

export const metadata: Metadata = { title: "Criar conta" };

// S01
export default function Cadastro() {
  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-fg">Crie sua página</h1>
      <p className="mb-6 text-sm text-muted">Grátis para começar, sem cartão. Em um minuto sua bio ganha um endereço.</p>
      <FormCadastro />
    </>
  );
}
