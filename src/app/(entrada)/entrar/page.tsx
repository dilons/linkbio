import type { Metadata } from "next";
import { Suspense } from "react";
import { AvisoDaUrl, FormLogin } from "../formularios";

export const metadata: Metadata = { title: "Entrar" };

// S18
export default function Entrar() {
  return (
    <>
      <h1 className="mb-6 text-xl font-bold text-fg">Entrar</h1>
      <Suspense>
        <AvisoDaUrl />
      </Suspense>
      <FormLogin />
    </>
  );
}
