import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";

export type Forma = "quadrado" | "arredondado" | "pilula";
export type Preenchimento = "cheio" | "contorno" | "sombra";

const formas: Record<Forma, string> = {
  quadrado: "rounded-none",
  arredondado: "rounded-md",
  pilula: "rounded-pill",
};

const preenchimentos: Record<Preenchimento, string> = {
  cheio: "bg-t-button text-t-on-button border border-t-button-border",
  contorno: "bg-transparent text-t-text border-2 border-t-button-border",
  sombra: "bg-t-button text-t-on-button border border-t-button-border shadow-sombra",
};

/**
 * Botão de link da página pública. Aponta para /r/[id], que conta o clique e
 * redireciona; assim o clique conta mesmo sem JavaScript.
 */
export function PublicLinkButton({
  id,
  titulo,
  forma = "pilula",
  preenchimento = "cheio",
  destaque = false,
  travado = false,
}: {
  id: string;
  titulo: string;
  forma?: Forma;
  preenchimento?: Preenchimento;
  destaque?: boolean;
  travado?: boolean;
}) {
  return (
    <a
      href={`/r/${id}`}
      rel="noopener"
      className={cn(
        "flex w-full items-center justify-center gap-2 px-5 text-center text-base font-semibold",
        "transition-transform duration-150 hover:scale-[1.02] focus-visible:outline-offset-4",
        formas[forma],
        preenchimentos[preenchimento],
        // só transform: piscar com opacidade derruba o contraste no meio da animação
        destaque && "motion-safe:animate-[destaque_1.2s_ease-in-out_3]",
      )}
      style={{ minHeight: "var(--layout-public-link-height)" }}
    >
      {travado && <Lock aria-label="Conteúdo com aviso" className="size-4 shrink-0" />}
      <span className="line-clamp-2 wrap-anywhere">{titulo}</span>
    </a>
  );
}
