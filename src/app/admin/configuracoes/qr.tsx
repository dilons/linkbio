import { Download } from "lucide-react";
import { estiloDeBotao } from "@/components/ui/button";
import { MARCA } from "@/lib/marca";

/** S19: o QR code da página, para imprimir. Gerado pelo próprio app (/api/qr). */
export function QrDaPagina({ username }: { username: string }) {
  const base = `/api/qr/${username}`;
  return (
    <section aria-labelledby="t-qr" className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 shadow-card">
      <h2 id="t-qr" className="text-lg font-semibold text-fg">
        QR code da página
      </h2>
      <p className="text-sm text-muted">
        Para o cartão, a embalagem, o balcão ou o cardápio. Quem aponta a câmera abre a sua página, e a visita aparece nos insights com a origem
        &quot;QR code&quot;.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG gerado pela nossa rota, sem otimização de imagem */}
        <img
          src={`${base}?formato=svg`}
          alt={`QR code que leva a ${MARCA.dominio}/${username}`}
          width={160}
          height={160}
          className="size-40 rounded-md border border-border"
        />
        <div className="flex flex-col gap-2">
          <a href={`${base}?baixar=1`} download className={estiloDeBotao("secondary", "sm")}>
            <Download aria-hidden className="size-4" />
            Baixar PNG
          </a>
          <a href={`${base}?formato=svg&baixar=1`} download className={estiloDeBotao("secondary", "sm")}>
            <Download aria-hidden className="size-4" />
            Baixar SVG (para gráfica)
          </a>
        </div>
      </div>
    </section>
  );
}
