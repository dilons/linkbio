import { cn } from "@/lib/cn";

/** Um número dos insights. Sem dados mostra um traço; carregando mostra um esqueleto. */
export function StatTile({
  label,
  value,
  detalhe,
  carregando = false,
}: {
  label: string;
  value?: string | number | null;
  detalhe?: string;
  carregando?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-bg p-4 shadow-card">
      <span className="text-sm text-muted">{label}</span>
      {carregando ? (
        <span role="status" className="h-8 w-20 animate-pulse rounded-sm bg-surface-2">
          <span className="sr-only">Carregando</span>
        </span>
      ) : (
        <span className={cn("text-xl font-bold tabular-nums", value == null ? "text-muted" : "text-fg")}>
          {value == null ? "–" : value}
        </span>
      )}
      {detalhe && <span className="text-xs text-muted">{detalhe}</span>}
    </div>
  );
}
