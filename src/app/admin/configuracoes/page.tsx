import type { Metadata } from "next";
import { Suspense } from "react";
import { exigirPerfil } from "@/lib/sessao";
import { AvisoDaPagina } from "./aviso";

export const metadata: Metadata = { title: "Configurações" };

// S12: aviso de conteúdo da página toda (S16). O QR code da página (S19) entra aqui também.
export default function Configuracoes() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-bold text-fg">Configurações</h1>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-lg bg-surface-2" />}>
        <Dados />
      </Suspense>
    </div>
  );
}

async function Dados() {
  const { perfil } = await exigirPerfil();
  return <AvisoDaPagina atual={perfil.sensitive_label} />;
}
