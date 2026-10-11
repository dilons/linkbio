import type { Metadata } from "next";
import { Suspense } from "react";
import { AvisoDaUrl, FormUsername } from "../formularios";

export const metadata: Metadata = { title: "Seu endereço" };

// S03
export default function Comecar() {
  return (
    <>
      <Suspense>
        <AvisoDaUrl />
      </Suspense>
      <h1 className="mb-1 text-xl font-bold text-fg">Escolha seu endereço</h1>
      <p className="mb-6 text-sm text-muted">É o endereço que vai na sua bio e no seu cartão. Escolha com calma.</p>
      <FormUsername />
    </>
  );
}
