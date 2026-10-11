"use client";

import { CalendarClock, GripVertical, Lock, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "./badge";
import type { AlcaProps } from "./sortable-list";
import { Switch } from "./switch";

export type LinkResumo = {
  id: string;
  titulo: string;
  url?: string;
  ativo: boolean;
  agendado?: string;
  travado?: string;
};

/** Um link na lista do editor: alça de arrastar, título, URL, liga e desliga, editar e excluir. */
export function LinkCard({
  link,
  alca,
  arrastando = false,
  onToggle,
  onEditar,
  onExcluir,
}: {
  link: LinkResumo;
  alca?: AlcaProps;
  arrastando?: boolean;
  onToggle: (ativo: boolean) => void;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-bg p-3 shadow-card",
        arrastando && "shadow-pop ring-2 ring-accent",
        !link.ativo && "bg-surface",
      )}
    >
      <button
        type="button"
        aria-label={`Mover ${link.titulo}`}
        className="cursor-grab touch-none rounded-sm p-1 text-muted hover:bg-surface active:cursor-grabbing"
        {...alca}
      >
        <GripVertical aria-hidden className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-semibold", link.ativo ? "text-fg" : "text-muted")}>{link.titulo}</p>
        {link.url && <p className="truncate text-xs text-muted">{link.url}</p>}
        <div className="mt-1 flex flex-wrap gap-1.5">
          {!link.ativo && <Badge>Desligado</Badge>}
          {link.agendado && (
            <Badge tom="info">
              <CalendarClock aria-hidden className="size-3" />
              {link.agendado}
            </Badge>
          )}
          {link.travado && (
            <Badge tom="alerta">
              <Lock aria-hidden className="size-3" />
              {link.travado}
            </Badge>
          )}
        </div>
      </div>
      <Switch label={`Mostrar ${link.titulo} na página`} hideLabel checked={link.ativo} onCheckedChange={onToggle} />
      <button type="button" aria-label={`Editar ${link.titulo}`} onClick={onEditar} className="rounded-sm p-2 text-muted hover:bg-surface">
        <Pencil aria-hidden className="size-4" />
      </button>
      <button type="button" aria-label={`Excluir ${link.titulo}`} onClick={onExcluir} className="rounded-sm p-2 text-danger hover:bg-surface">
        <Trash2 aria-hidden className="size-4" />
      </button>
    </div>
  );
}
