"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// Última rede de proteção: algo deu errado ao montar a tela. Em vez da página
// genérica do Next, uma mensagem nossa e um jeito de tentar de novo.
export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-bold text-fg">Algo saiu do lugar</h1>
      <p className="text-base text-muted">Pode ser a conexão. Confira a internet e tente de novo; nada do que já estava salvo se perdeu.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>Tentar de novo</Button>
        <Link href="/" className="inline-flex h-10 items-center rounded-md border border-input bg-bg px-4 text-sm font-semibold text-fg">
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
