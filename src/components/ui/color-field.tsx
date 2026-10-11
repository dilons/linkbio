"use client";

import { useId } from "react";
import { nivel, parseHex, razao } from "@/lib/contrast";

/**
 * Cor do tema customizado, com o contraste contra o fundo calculado na hora.
 * Abaixo de 4,5:1 avisa, e o servidor recusa salvar (mesma conta do contrast.py).
 */
export function ColorField({
  label,
  value,
  onChange,
  contraFundo,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  contraFundo?: string;
}) {
  const id = useId();
  const valido = parseHex(value) !== null;
  const r = valido && contraFundo ? razao(value, contraFundo) : null;
  const n = valido && contraFundo ? nivel(value, contraFundo) : null;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label}: seletor`}
          value={valido ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-md border border-input bg-bg p-1"
        />
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!valido || undefined}
          aria-describedby={`${id}-contraste`}
          className="h-10 w-28 rounded-md border border-input bg-bg px-3 font-mono text-sm uppercase"
        />
      </div>
      <p id={`${id}-contraste`} className={n === "falha" || n === "AA-grande" ? "text-xs font-medium text-danger" : "text-xs text-muted"}>
        {!valido && "Use o formato #RRGGBB."}
        {valido && r !== null &&
          (n === "falha" || n === "AA-grande"
            ? `Contraste ${r.toFixed(1)}:1 com o fundo. Precisa de 4,5:1 para ler bem.`
            : `Contraste ${r.toFixed(1)}:1 com o fundo (${n}).`)}
      </p>
    </div>
  );
}
