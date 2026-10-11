import { useId } from "react";
import { DataTable } from "./data-table";

export type Ponto = {
  chave: string;
  /** rótulo curto no eixo (ex.: "11/10") */
  rotulo: string;
  /** a frase completa da dica e do leitor de tela (ex.: "sábado, 11/10: 5 visitas") */
  descricao: string;
  valor: number;
};

/** Um teto "redondo" para o eixo: 1, 2 ou 5 vezes uma potência de 10. */
function teto(max: number): number {
  if (max <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(max));
  return [1, 2, 5, 10].map((m) => m * p).find((v) => v >= max) ?? 10 * p;
}

/**
 * Colunas de uma série só (S09): cor da marca, até 24 px de largura, ponta
 * arredondada e base reta, 2 px entre colunas, grade fina. Sem legenda (o
 * título diz o que é). A dica aparece com o mouse; para teclado e leitor de
 * tela, o mesmo está em "Ver em tabela", logo abaixo (uma parada de Tab, não
 * uma por coluna). Nada fica só no gráfico.
 */
export function GraficoColunas({
  titulo,
  pontos,
  formatar = (n) => n.toLocaleString("pt-BR"),
  colunaTabela,
}: {
  titulo: string;
  pontos: Ponto[];
  formatar?: (n: number) => string;
  /** cabeçalho da coluna de valores na tabela (ex.: "Visitas") */
  colunaTabela: string;
}) {
  const id = useId();
  const topo = teto(Math.max(0, ...pontos.map((p) => p.valor)));
  const marcas = [topo, topo / 2, 0];
  // rótulos do eixo: primeiro, do meio e último (nunca um em cada coluna)
  const visiveis = new Set([0, Math.floor((pontos.length - 1) / 2), pontos.length - 1]);
  return (
    <figure aria-labelledby={`${id}-t`} className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 shadow-card">
      <figcaption id={`${id}-t`} className="text-lg font-semibold text-fg">
        {titulo}
      </figcaption>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
        {/* eixo */}
        <div aria-hidden className="flex h-40 flex-col justify-between text-right text-xs text-muted tabular-nums">
          {marcas.map((m) => (
            <span key={m} className="-my-2 leading-4">
              {formatar(m)}
            </span>
          ))}
        </div>
        <div className="relative h-40">
          <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
            {marcas.map((m) => (
              <span key={m} className="h-px w-full bg-border" />
            ))}
          </div>
          <ol aria-hidden className="relative flex h-full items-end gap-[2px]">
            {pontos.map((p) => (
              <li key={p.chave} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
                <span
                  className="w-full max-w-6 rounded-t-[4px] bg-accent"
                  style={{ height: `${(p.valor / topo) * 100}%`, minHeight: p.valor > 0 ? 2 : 0 }}
                />
                <span className="pointer-events-none absolute bottom-full z-10 mb-2 hidden w-max max-w-48 rounded-md border border-border bg-bg px-2 py-1 text-xs text-fg shadow-card group-hover:block">
                  {p.descricao}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <span />
        <div aria-hidden className="relative mt-1 h-4 text-xs text-muted">
          {pontos.map((p, i) =>
            visiveis.has(i) ? (
              <span
                key={p.chave}
                className="absolute whitespace-nowrap"
                style={
                  i === 0
                    ? { left: 0 }
                    : i === pontos.length - 1
                      ? { right: 0 }
                      : { left: `${((i + 0.5) / pontos.length) * 100}%`, transform: "translateX(-50%)" }
                }
              >
                {p.rotulo}
              </span>
            ) : null,
          )}
        </div>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer rounded-sm font-medium text-fg">Ver em tabela</summary>
        <div className="mt-3">
          <DataTable
            legenda={titulo}
            colunas={[
              { chave: "quando", titulo: "Quando" },
              { chave: "valor", titulo: colunaTabela, alinhar: "direita" },
            ]}
            linhas={pontos.map((p) => ({ quando: p.descricao.split(":")[0], valor: formatar(p.valor) }))}
            vazio="Sem dados."
          />
        </div>
      </details>
    </figure>
  );
}
