import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 p-8">
      <h1 className="text-display font-bold text-fg">linkbio</h1>
      <p className="text-base text-muted">Todos os seus links numa página só. Em construção.</p>
      <Link href="/design" className="text-sm font-semibold text-accent underline">
        Ver o design system
      </Link>
    </main>
  );
}
