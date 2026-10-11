"use client";

import { ImagePlus } from "lucide-react";
import { useId, useState } from "react";

const TIPOS = ["image/jpeg", "image/png", "image/webp"];

/**
 * Escolhe uma imagem (avatar, miniatura, fundo), confere tipo e tamanho antes
 * de enviar e mostra a prévia. O envio usa a URL assinada de /api/upload.
 */
export function ImageUpload({
  label,
  maxMB,
  redonda = false,
  atual,
  onArquivo,
}: {
  label: string;
  maxMB: number;
  redonda?: boolean;
  /** imagem já salva, mostrada até a pessoa escolher outra */
  atual?: string;
  onArquivo: (f: File) => void;
}) {
  const id = useId();
  const [previa, setPrevia] = useState<string | null>(null);
  const mostrada = previa ?? atual;
  const [erro, setErro] = useState<string | null>(null);

  function escolher(f: File | undefined) {
    if (!f) return;
    if (!TIPOS.includes(f.type)) return setErro("Use JPG, PNG ou WebP.");
    if (f.size > maxMB * 1024 * 1024) return setErro(`A imagem passa de ${maxMB} MB.`);
    setErro(null);
    setPrevia(URL.createObjectURL(f));
    onArquivo(f);
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex size-20 items-center justify-center overflow-hidden border border-dashed border-input bg-surface ${redonda ? "rounded-pill" : "rounded-md"}`}
      >
        {mostrada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mostrada} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus aria-hidden className="size-6 text-muted" />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-accent hover:underline">
          {label}
        </label>
        <input id={id} type="file" accept={TIPOS.join(",")} className="sr-only" onChange={(e) => escolher(e.target.files?.[0])} />
        <span className="text-xs text-muted">JPG, PNG ou WebP, até {maxMB} MB.</span>
        {erro && (
          <span role="alert" className="text-xs font-medium text-danger">
            {erro}
          </span>
        )}
      </div>
    </div>
  );
}
