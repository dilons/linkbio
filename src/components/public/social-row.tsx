import { siFacebook, siInstagram, siSpotify, siTiktok, siWhatsapp, siX, siYoutube, type SimpleIcon } from "simple-icons";

// Ícones das plataformas: Simple Icons (CC0). As marcas continuam sendo de cada
// plataforma; usamos só para indicar para onde o link leva.
const ICONES: Record<string, SimpleIcon> = {
  instagram: siInstagram,
  tiktok: siTiktok,
  youtube: siYoutube,
  whatsapp: siWhatsapp,
  x: siX,
  facebook: siFacebook,
  spotify: siSpotify,
};

export type Rede = { plataforma: keyof typeof ICONES | string; url: string };

/** Ícone da plataforma (decorativo: quem usa dá o nome acessível). */
export function IconeDaRede({ plataforma, className = "size-6" }: { plataforma: string; className?: string }) {
  const icone = ICONES[plataforma];
  if (!icone) return null;
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`${className} fill-current`}>
      <path d={icone.path} />
    </svg>
  );
}

/** Fileira de ícones das redes, no topo ou no rodapé da página. Cada ícone tem nome acessível. */
export function SocialRow({ redes }: { redes: Rede[] }) {
  if (redes.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center justify-center gap-4">
      {redes.map((r) => {
        const icone = ICONES[r.plataforma];
        return (
          <li key={r.plataforma}>
            <a href={r.url} rel="noopener" aria-label={icone?.title ?? r.plataforma} className="block rounded-sm p-1 text-t-text hover:opacity-80">
              {icone ? (
                <IconeDaRede plataforma={r.plataforma} />
              ) : (
                <span className="text-sm underline">{r.plataforma}</span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
