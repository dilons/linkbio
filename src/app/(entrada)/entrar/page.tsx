import type { Metadata } from "next";
import { FormLogin } from "../formularios";

export const metadata: Metadata = { title: "Entrar · linkbio" };

// S18
export default function Entrar() {
  return (
    <>
      <h1 className="mb-6 text-xl font-bold text-fg">Entrar</h1>
      <FormLogin />
    </>
  );
}
