import type { Metadata } from "next";
import { FormRecuperar } from "../../formularios";

export const metadata: Metadata = { title: "Recuperar a senha · linkbio" };

// S18 (recuperar a senha)
export default function Recuperar() {
  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-fg">Esqueceu a senha?</h1>
      <p className="mb-6 text-sm text-muted">Informe o email da conta e mandamos um link para criar uma senha nova.</p>
      <FormRecuperar />
    </>
  );
}
