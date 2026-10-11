import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import type { Rotulo } from "@/lib/data/aviso";

export type { Rotulo };

/**
 * S16: aviso antes da página ou de um link marcado. É um formulário comum que
 * vai para /api/aviso, então funciona sem JavaScript. Com idade mínima, pede a
 * data de nascimento (que serve só para a conta e não é gravada).
 */
export function GateScreen({
  rotulo,
  alvo,
  titulo,
  doLink = false,
  negado = false,
  erroData = false,
  nivel = 1,
}: {
  rotulo: Rotulo;
  /** "p:<id do perfil>" ou "l:<id do link>" */
  alvo: string;
  /** nome da página dona do conteúdo */
  titulo: string;
  doLink?: boolean;
  negado?: boolean;
  erroData?: boolean;
  /** 1 na tela do aviso; 2 dentro de outra página (a vitrine do design) */
  nivel?: 1 | 2;
}) {
  const id = useId();
  const Titulo = nivel === 1 ? "h1" : "h2";
  const minima = rotulo === "sensivel" ? null : Number(rotulo);
  const cabecalho = minima ? `Conteúdo para maiores de ${minima} anos` : "Conteúdo sensível";
  return (
    <section aria-labelledby={`${id}-titulo`} className="flex flex-col items-center gap-4 p-6 text-center">
      <ShieldAlert aria-hidden className="size-10 text-t-text" />
      <p className="text-sm text-t-muted">{doLink ? `Um link da página de ${titulo}` : `Página de ${titulo}`}</p>
      <Titulo id={`${id}-titulo`} className="text-xl font-bold text-t-text">
        {cabecalho}
      </Titulo>
      {negado ? (
        <p className="max-w-[40ch] text-base text-t-text">Este conteúdo não está disponível para a sua idade.</p>
      ) : (
        <form method="post" action="/api/aviso" className="flex flex-col items-center gap-4">
          <input type="hidden" name="alvo" value={alvo} />
          <p id={`${id}-texto`} className="max-w-[40ch] text-base text-t-muted">
            {minima
              ? "Para continuar, informe sua data de nascimento. Ela é usada só para conferir a idade e não fica guardada."
              : doLink
                ? "Este link pode levar a um conteúdo que nem todo mundo quer ver. Quer continuar?"
                : "Esta página pode ter conteúdo que nem todo mundo quer ver. Quer continuar?"}
          </p>
          {minima && (
            <div className="flex flex-col items-start gap-1">
              <label htmlFor={`${id}-nascimento`} className="text-sm font-medium text-t-text">
                Data de nascimento
              </label>
              <input
                id={`${id}-nascimento`}
                name="nascimento"
                type="date"
                required
                min="1900-01-01"
                autoComplete="bday"
                aria-invalid={erroData || undefined}
                aria-describedby={erroData ? `${id}-erro` : `${id}-texto`}
                className={`h-11 rounded-md border bg-t-bg px-3 text-t-text ${erroData ? "border-2 border-t-text" : "border-t-button-border"}`}
              />
              {erroData && (
                <p id={`${id}-erro`} role="alert" className="text-sm font-semibold text-t-text">
                  Confira a data de nascimento.
                </p>
              )}
            </div>
          )}
          <button
            type="submit"
            className="h-12 rounded-pill border border-t-button-border bg-t-button px-6 font-semibold text-t-on-button focus-visible:outline-offset-4"
          >
            Continuar
          </button>
        </form>
      )}
    </section>
  );
}

/** A tela inteira do aviso, no tema da página, no lugar do conteúdo. */
export function TelaDeAviso({
  tema,
  voltarPara,
  ...props
}: Parameters<typeof GateScreen>[0] & { tema: string; voltarPara?: { href: string; texto: string } }) {
  return (
    <div data-theme={tema} className="flex min-h-full flex-1 flex-col bg-t-bg">
      <main className="mx-auto flex w-full flex-1 flex-col items-center justify-center gap-4 py-10" style={{ maxWidth: "var(--layout-public-max)", paddingInline: "var(--layout-public-gutter)" }}>
        <GateScreen {...props} />
        {voltarPara && (
          <Link href={voltarPara.href} prefetch={false} className="rounded-sm text-sm font-semibold text-t-text underline">
            {voltarPara.texto}
          </Link>
        )}
      </main>
    </div>
  );
}
