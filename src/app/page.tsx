import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 p-8">
      <h1 className="text-display font-bold text-fg">linkbio</h1>
      <p className="text-lg text-muted">Uma página com todos os seus links, para pôr na bio. Pronta em um minuto.</p>
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
