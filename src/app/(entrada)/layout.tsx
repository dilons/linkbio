import Link from "next/link";
import type { ReactNode } from "react";
import { MARCA } from "@/lib/marca";

// Moldura das telas de entrada (cadastro, login, endereço): um cartão no centro.
export default function LayoutEntrada({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-surface">
      <header className="px-4 py-4 md:px-8">
        <Link href="/" className="text-lg font-bold text-fg">
          {MARCA.nome}
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 md:pt-16">
        <div className="w-full max-w-md rounded-lg border border-border bg-bg p-6 shadow-card md:p-8">{children}</div>
      </main>
    </div>
  );
}
