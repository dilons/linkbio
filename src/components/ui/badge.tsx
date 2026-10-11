import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Marca um recurso do plano pago. O texto diz o plano; o cadeado é só enfeite. */
export function PaidBadge({ plano = "Pro" }: { plano?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-paid-soft px-2 py-0.5 text-xs font-semibold text-paid">
      <Lock aria-hidden className="size-3" />
      {plano}
    </span>
  );
}

const tons = {
  neutro: "bg-surface-2 text-fg",
  info: "bg-accent-soft text-accent",
  sucesso: "bg-surface text-success",
  alerta: "bg-paid-soft text-warning",
} as const;

export function Badge({ tom = "neutro", children }: { tom?: keyof typeof tons; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-semibold", tons[tom])}>
      {children}
    </span>
  );
}
