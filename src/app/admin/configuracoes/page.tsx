import type { Metadata } from "next";
import { Suspense } from "react";
import { exigirPerfil } from "@/lib/sessao";
import { AvisoDaPagina } from "./aviso";
import { QrDaPagina } from "./qr";

export const metadata: Metadata = { title: "Configurações" };

// S12: o QR code da página (S19) e o aviso de conteúdo da página toda (S16).
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
  return (
    <>
      <QrDaPagina username={perfil.username} />
      <AvisoDaPagina atual={perfil.sensitive_label} />
    </>
  );
}
