import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { PaidBadge } from "./badge";

/** Um tema na galeria. Mostra uma miniatura com as cores do próprio tema. */
export function ThemeCard({
  tema,
  nome,
  selecionado,
  bloqueado = false,
  onSelecionar,
}: {
  tema: string;
  nome: string;
  selecionado: boolean;
  bloqueado?: boolean;
  onSelecionar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelecionar}
      disabled={bloqueado}
      aria-pressed={selecionado}
      className={cn(
        "flex w-32 flex-col gap-2 rounded-lg p-2 text-left transition-colors disabled:cursor-not-allowed",
        selecionado ? "ring-2 ring-accent" : "hover:bg-surface",
      )}
    >
      <div data-theme={tema} className="flex h-40 w-full flex-col items-center gap-2 rounded-md bg-t-bg p-3">
        <span className="mt-2 size-8 rounded-pill bg-t-muted opacity-60" />
        <span className="h-2 w-14 rounded-pill bg-t-text" />
        <span className="mt-2 h-5 w-full rounded-pill border border-t-button-border bg-t-button" />
        <span className="h-5 w-full rounded-pill border border-t-button-border bg-t-button" />
      </div>
      <span className="flex items-center justify-between text-sm font-medium text-fg">
        {nome}
        {selecionado && <Check aria-hidden className="size-4 text-accent" />}
        {bloqueado && <PaidBadge />}
      </span>
    </button>
  );
}
