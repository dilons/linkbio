import Link from "next/link";
import { MARCA } from "@/lib/marca";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 p-8">
      <h1 className="text-display font-bold text-fg">{MARCA.nome}</h1>
      <p className="text-lg text-muted">Tudo o que você vende e onde te chamar, numa página só para a bio. Pronta em um minuto, grátis para começar.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/cadastro" className="rounded-md bg-accent px-5 py-3 text-base font-semibold text-on-accent">
          Criar minha página
        </Link>
        <Link href="/entrar" className="rounded-md border border-input bg-bg px-5 py-3 text-base font-semibold text-fg">
          Entrar
        </Link>
      </div>
      <Link href="/design" className="text-sm font-semibold text-accent underline">
        Ver o design system
      </Link>
    </main>
  );
}
