import type { Metadata } from "next";
import { Suspense } from "react";
import { fazerLogout, sairDeTodos } from "@/app/acoes";
import { Button } from "@/components/ui/button";
import { perfilDaConta, proximaTroca } from "@/lib/data/perfis";
import { exigirConta } from "@/lib/sessao";
import { TrocarEndereco } from "./endereco";
import { ExcluirConta, ExcluirPagina } from "./excluir";
import { PrivacidadeEDados } from "./privacidade";
import { MARCA } from "@/lib/marca";

export const metadata: Metadata = { title: "Conta" };

// S13: endereço, acesso, privacidade e dados (LGPD) e as zonas de perigo
export default function Conta() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-bold text-fg">Sua conta</h1>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-surface-2" />}>
        <Dados />
      </Suspense>
    </div>
  );
}

async function Dados() {
  const sessao = await exigirConta();
  const perfil = await perfilDaConta(sessao.userId);
  const libera = perfil && proximaTroca(perfil.username_changed_at);
  return (
    <>
      {perfil && (
        <TrocarEndereco
          atual={perfil.username}
          liberaEm={libera ? libera.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : null}
        />
      )}
      <section aria-labelledby="t-acesso" className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 shadow-card">
        <h2 id="t-acesso" className="text-lg font-semibold text-fg">
          Acesso
        </h2>
        <p className="text-sm text-muted">
          Você entra com <strong className="break-all text-fg">{sessao.email}</strong>.
        </p>
        <div className="flex flex-wrap gap-2">
          <form action={fazerLogout}>
            <Button type="submit" variant="secondary">
              Sair deste aparelho
            </Button>
          </form>
          <form action={sairDeTodos}>
            <Button type="submit" variant="secondary">
              Sair de todos os aparelhos
            </Button>
          </form>
        </div>
      </section>
      <PrivacidadeEDados />
      {perfil && (
        <section aria-labelledby="t-pagina" className="flex flex-col gap-3 rounded-lg border border-danger/40 bg-bg p-4 shadow-card">
          <h2 id="t-pagina" className="text-lg font-semibold text-fg">
            Excluir só a página
          </h2>
          <p className="text-sm text-muted">
            Apaga <strong className="break-all text-fg">{MARCA.dominio}/{perfil.username}</strong> e tudo o que está nela. Sua conta continua, e
            você pode criar outra página depois.
          </p>
          <div>
            <ExcluirPagina username={perfil.username} />
          </div>
        </section>
      )}
      <section aria-labelledby="t-perigo" className="flex flex-col gap-3 rounded-lg border border-danger/40 bg-bg p-4 shadow-card">
        <h2 id="t-perigo" className="text-lg font-semibold text-fg">
          Excluir a conta
        </h2>
        <p className="text-sm text-muted">Apaga sua página e tudo o que está nela. Não dá para desfazer.</p>
        <div>
          <ExcluirConta confirmacao={perfil?.username ?? "excluir"} />
        </div>
      </section>
    </>
  );
}
