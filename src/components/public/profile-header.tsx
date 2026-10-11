/** Foto, nome e bio no topo da página pública. Sem foto, mostra as iniciais. */
export function ProfileHeader({ titulo, bio, avatarUrl }: { titulo: string; bio?: string; avatarUrl?: string }) {
  const iniciais = titulo
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="size-24 rounded-pill object-cover" />
      ) : (
        <span aria-hidden className="flex size-24 items-center justify-center rounded-pill bg-t-button text-xl font-bold text-t-on-button">
          {iniciais}
        </span>
      )}
      {/* texto sem espaços (um endereço colado na bio) quebra em vez de estourar a tela */}
      <h1 className="max-w-full text-xl font-bold text-t-text wrap-anywhere">{titulo}</h1>
      {bio && <p className="max-w-[44ch] text-base text-t-muted wrap-anywhere">{bio}</p>}
    </header>
  );
}
