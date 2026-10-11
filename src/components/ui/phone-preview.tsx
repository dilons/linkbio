import type { ReactNode } from "react";

/** Moldura de celular para a prévia ao vivo no editor. Não é interativa: o conteúdo fica inerte. */
export function PhonePreview({ children, rotulo = "Prévia da sua página" }: { children: ReactNode; rotulo?: string }) {
  return (
    <figure className="flex flex-col items-center gap-2">
      <div
        className="overflow-hidden rounded-[36px] border-[10px] border-fg bg-bg shadow-pop"
        style={{ width: "var(--layout-preview-width)", height: "var(--layout-preview-height)" }}
      >
        <div inert className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
      <figcaption className="text-xs text-muted">{rotulo}</figcaption>
    </figure>
  );
}
