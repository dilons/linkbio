"use client";

import { ShieldAlert } from "lucide-react";
import { useId, useState } from "react";

export type Rotulo = "sensivel" | "18" | "21" | "25";

/**
 * Aviso antes da página ou de um link marcado. Com idade mínima, pede a data
 * de nascimento (a data não é gravada: serve só para liberar ou não).
 */
export function GateScreen({ rotulo, onLiberar }: { rotulo: Rotulo; onLiberar: () => void }) {
  const tituloId = useId();
  const [nascimento, setNascimento] = useState("");
  const [negado, setNegado] = useState(false);
  const idadeMinima = rotulo === "sensivel" ? null : Number(rotulo);

  function confirmar() {
    if (idadeMinima === null) return onLiberar();
    const d = new Date(nascimento);
    if (Number.isNaN(d.getTime())) return;
    const hoje = new Date();
    let idade = hoje.getFullYear() - d.getFullYear();
    if (hoje < new Date(hoje.getFullYear(), d.getMonth(), d.getDate())) idade -= 1;
    if (idade >= idadeMinima) onLiberar();
    else setNegado(true);
  }

  return (
    <section aria-labelledby={tituloId} className="flex flex-col items-center gap-4 p-6 text-center">
      <ShieldAlert aria-hidden className="size-10 text-t-text" />
      <h2 id={tituloId} className="text-lg font-bold text-t-text">
        {idadeMinima ? `Conteúdo para maiores de ${idadeMinima} anos` : "Conteúdo sensível"}
      </h2>
      {negado ? (
        <p role="alert" className="text-base text-t-text">
          Este conteúdo não está disponível para a sua idade.
        </p>
      ) : (
        <>
          <p className="max-w-[40ch] text-base text-t-muted">
            {idadeMinima
              ? "Informe sua data de nascimento para continuar."
              : "Esta página pode ter conteúdo que nem todo mundo quer ver."}
          </p>
          {idadeMinima && (
            <label className="flex flex-col gap-1 text-sm text-t-muted">
              Data de nascimento
              <input
                type="date"
                value={nascimento}
                onChange={(e) => setNascimento(e.target.value)}
                className="h-11 rounded-md border border-t-button-border bg-t-bg px-3 text-t-text"
              />
            </label>
          )}
          <button
            type="button"
            onClick={confirmar}
            className="h-12 rounded-pill border border-t-button-border bg-t-button px-6 font-semibold text-t-on-button"
          >
            Continuar
          </button>
        </>
      )}
    </section>
  );
}
