"use client";

import { useEffect, useState } from "react";
import { normalizarUsername } from "@/lib/data/validacao";

export type Checagem = { livre: boolean; username: string; motivo?: string } | null;

/**
 * Confere o endereço enquanto a pessoa digita (S03, S13), 300 ms depois da
 * última tecla. Só vale a resposta do que está no campo agora: uma resposta
 * atrasada de um valor anterior é ignorada.
 */
export function useChecagemDeUsername(valor: string): Checagem {
  const [checagem, setChecagem] = useState<Checagem>(null);
  useEffect(() => {
    const u = valor.trim();
    if (u.length < 3) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/username?u=${encodeURIComponent(u)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((c) => c && setChecagem(c))
        .catch(() => {});
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [valor]);
  if (valor.trim().length < 3 || !checagem) return null;
  return checagem.username === normalizarUsername(valor) ? checagem : null;
}
