import type { Metadata } from "next";
import { FormUsername } from "../formularios";

export const metadata: Metadata = { title: "Seu endereço · linkbio" };

// S03
export default function Comecar() {
  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-fg">Escolha seu endereço</h1>
      <p className="mb-6 text-sm text-muted">É o link que você vai pôr na bio. Dá para trocar depois.</p>
      <FormUsername />
    </>
  );
}
