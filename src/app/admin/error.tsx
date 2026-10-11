"use client";

import { Button } from "@/components/ui/button";

// Erro dentro do painel: a moldura (menu) continua, só o conteúdo dá a mensagem.
export default function ErroDoPainel({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="flex max-w-xl flex-col items-start gap-3 rounded-lg border border-border bg-bg p-6 shadow-card">
      <h1 className="text-xl font-bold text-fg">Não deu para carregar esta parte</h1>
      <p className="text-base text-muted">Pode ser a conexão. Confira a internet e tente de novo; o que já estava salvo continua lá.</p>
      <Button onClick={() => reset()}>Tentar de novo</Button>
    </div>
  );
}
