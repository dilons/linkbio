"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Os campos de um formulário enquanto ele envia (BUG-010): travados, para a
 * resposta atrasada de um envio não apagar o que foi digitado depois. Travar
 * tira o foco de quem apertou Enter num campo; por isso, se a resposta vier
 * com erro, o foco vai para o primeiro campo inválido. Sem caixa nem margem
 * (display: contents): o layout do formulário não muda.
 */
export function Travado({ enviando, estado, children }: { enviando: boolean; estado: { erros?: Record<string, string>; erro?: string }; children: ReactNode }) {
  const ref = useRef<HTMLFieldSetElement>(null);
  useEffect(() => {
    if (enviando || (!estado.erros && !estado.erro)) return;
    const campo = ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (campo && !ref.current?.contains(document.activeElement)) campo.focus();
  }, [enviando, estado]);
  return (
    <fieldset ref={ref} disabled={enviando} className="contents">
      {children}
    </fieldset>
  );
}
