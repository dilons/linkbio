import type { ReactNode } from "react";

export type Coluna<T> = { chave: keyof T & string; titulo: string; alinhar?: "esquerda" | "direita" };

/** Tabela simples com legenda (lida pelo leitor de tela) e estado vazio. */
export function DataTable<T extends Record<string, ReactNode>>({
  legenda,
  colunas,
  linhas,
  vazio,
}: {
  legenda: string;
  colunas: Coluna<T>[];
  linhas: T[];
  vazio: ReactNode;
}) {
  if (linhas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-input p-8 text-center text-sm text-muted">{vazio}</div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{legenda}</caption>
        <thead className="bg-surface text-muted">
          <tr>
            {colunas.map((c) => (
              <th key={c.chave} scope="col" className={`px-4 py-2 font-medium ${c.alinhar === "direita" ? "text-right" : ""}`}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i} className="border-t border-border">
              {colunas.map((c) => (
                <td key={c.chave} className={`px-4 py-2 text-fg ${c.alinhar === "direita" ? "text-right tabular-nums" : ""}`}>
                  {l[c.chave]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
