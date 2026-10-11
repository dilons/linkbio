import { Hammer } from "lucide-react";
import Link from "next/link";

/**
 * Tela que ainda não foi construída. Diz o que ela vai fazer e em qual etapa
 * da architecture.md ela entra, em vez de fingir que funciona.
 */
export function EmConstrucao({
  tela,
  titulo,
  descricao,
  etapa,
  voltar,
}: {
  tela: string;
  titulo: string;
  descricao: string;
  etapa: string;
  voltar?: { href: string; rotulo: string };
}) {
  return (
    <section className="flex flex-col items-start gap-3">
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">
        <Hammer aria-hidden className="size-3.5" />
        {tela} · em construção
      </span>
      <h1 className="text-xl font-bold text-fg">{titulo}</h1>
      <p className="max-w-[60ch] text-base text-muted">{descricao}</p>
      <p className="text-sm text-muted">Chega na {etapa}.</p>
      {voltar && (
        <Link href={voltar.href} className="text-sm font-semibold text-accent underline">
          {voltar.rotulo}
        </Link>
      )}
    </section>
  );
}
