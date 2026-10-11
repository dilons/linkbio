"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

type Item = { id: string; titulo: string };

/**
 * Lista que reordena arrastando, com mouse, toque ou teclado (espaço pega,
 * setas movem, espaço solta, Esc cancela). Os anúncios para leitor de tela
 * estão em português.
 */
export function SortableList<T extends Item>({
  itens,
  onReorder,
  render,
}: {
  itens: T[];
  onReorder: (novos: T[]) => void;
  render: (item: T, alca: AlcaProps, arrastando: boolean) => ReactNode;
}) {
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const nome = (id: string | number) => itens.find((i) => i.id === id)?.titulo ?? "item";
  const posicao = (id: string | number) => itens.findIndex((i) => i.id === id) + 1;

  function soltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const de = itens.findIndex((i) => i.id === active.id);
    const para = itens.findIndex((i) => i.id === over.id);
    onReorder(arrayMove(itens, de, para));
  }

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={closestCenter}
      onDragEnd={soltar}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Para mover, aperte espaço ou enter. Use as setas para cima e para baixo, espaço para soltar e Esc para cancelar.",
        },
        announcements: {
          onDragStart: ({ active }) => `${nome(active.id)} selecionado, posição ${posicao(active.id)} de ${itens.length}.`,
          onDragOver: ({ active, over }) =>
            over ? `${nome(active.id)} sobre a posição ${posicao(over.id)} de ${itens.length}.` : undefined,
          onDragEnd: ({ active, over }) =>
            over ? `${nome(active.id)} solto na posição ${posicao(over.id)} de ${itens.length}.` : undefined,
          onDragCancel: ({ active }) => `Movimento cancelado. ${nome(active.id)} voltou ao lugar.`,
        },
      }}
    >
      <SortableContext items={itens.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-3">
          {itens.map((item) => (
            <Linha key={item.id} item={item} render={render} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

export type AlcaProps = Record<string, unknown>;

function Linha<T extends Item>({
  item,
  render,
}: {
  item: T;
  render: (item: T, alca: AlcaProps, arrastando: boolean) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "relative z-10" : undefined}
    >
      {render(item, { ...attributes, ...listeners }, isDragging)}
    </li>
  );
}
