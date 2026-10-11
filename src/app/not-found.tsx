import Link from "next/link";

export default function NaoEncontrada() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm font-semibold text-muted">404</p>
      <h1 className="text-xl font-bold text-fg">Essa página não existe (ainda)</h1>
      <p className="text-base text-muted">Confira o endereço. Se ele estiver livre, pode ser seu.</p>
      <Link href="/cadastro" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent">
        Criar minha página
      </Link>
    </main>
  );
}
