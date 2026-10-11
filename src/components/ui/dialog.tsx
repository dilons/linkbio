"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Modal acessível: prende o foco, fecha no Esc e devolve o foco ao botão que
 * abriu. `cheia` ocupa a tela toda (a prévia da página no celular).
 */
export function Dialog({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
  cheia = false,
}: {
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  cheia?: boolean;
}) {
  // Sem `trigger` (modal aberto pelo estado), o Radix não sabe para onde devolver
  // o foco ao fechar: guardamos quem estava com o foco quando o modal abriu.
  const quemAbriu = useRef<HTMLElement | null>(null);
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-fg/40" />
        <RadixDialog.Content
          onOpenAutoFocus={() => {
            quemAbriu.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(e) => {
            if (trigger || !quemAbriu.current?.isConnected) return;
            e.preventDefault();
            quemAbriu.current.focus();
          }}
          className={cn(
            "fixed z-50 bg-bg",
            cheia
              ? "inset-0 flex flex-col"
              : "top-1/2 left-1/2 max-h-[92dvh] w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg p-6 shadow-pop",
          )}
        >
          <div className={cn("flex items-start justify-between gap-4", cheia ? "border-b border-border px-4 py-3" : "mb-4")}>
            <div>
              <RadixDialog.Title className="text-lg font-semibold text-fg">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-1 text-sm text-muted">{description}</RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close className="rounded-sm p-1 text-muted hover:bg-surface" aria-label="Fechar">
              <X aria-hidden className="size-5" />
            </RadixDialog.Close>
          </div>
          {cheia ? <div className="min-h-0 flex-1 overflow-y-auto">{children}</div> : children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
