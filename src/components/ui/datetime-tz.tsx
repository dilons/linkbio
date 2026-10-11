"use client";

import { useId } from "react";
import { FUSOS } from "@/lib/fuso";

/**
 * Janela de agendamento de um link: quando aparece, quando some, em qual fuso.
 * Grava em UTC no servidor; aqui mostra no fuso escolhido. Fim antes do começo é erro.
 */
export function DateTimeTz({
  inicio,
  fim,
  fuso,
  onChange,
}: {
  inicio: string;
  fim: string;
  fuso: string;
  onChange: (v: { inicio: string; fim: string; fuso: string }) => void;
}) {
  const id = useId();
  const erro = inicio && fim && fim <= inicio ? "O fim precisa ser depois do começo." : null;
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium text-fg">Agendar</legend>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Aparece em
          <input
            type="datetime-local"
            value={inicio}
            onChange={(e) => onChange({ inicio: e.target.value, fim, fuso })}
            className="h-10 rounded-md border border-input bg-bg px-3 text-fg"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Some em
          <input
            type="datetime-local"
            value={fim}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? `${id}-erro` : undefined}
            onChange={(e) => onChange({ inicio, fim: e.target.value, fuso })}
            className={`h-10 rounded-md border bg-bg px-3 text-fg ${erro ? "border-danger" : "border-input"}`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Fuso
          <select
            value={fuso}
            onChange={(e) => onChange({ inicio, fim, fuso: e.target.value })}
            className="h-10 rounded-md border border-input bg-bg px-3 text-fg"
          >
            {FUSOS.map(([v, rotulo]) => (
              <option key={v} value={v}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
      </div>
      {erro && (
        <p id={`${id}-erro`} role="alert" className="text-xs font-medium text-danger">
          {erro}
        </p>
      )}
    </fieldset>
  );
}
