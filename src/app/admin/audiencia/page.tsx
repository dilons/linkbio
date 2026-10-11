import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DataTable } from "@/components/ui/data-table";
import { listarInscritos } from "@/lib/data/formularios";
import { exigirPerfil } from "@/lib/sessao";
import { TirarDaLista } from "./tirar";

export const metadata: Metadata = { title: "Audiência · linkbio" };

const LIMITE_NA_TELA = 1000;
const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
const numero = new Intl.NumberFormat("pt-BR");

// S10: quem deixou o email no formulário da página (F07)
export default function Audiencia() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-fg">Audiência</h1>
        <p className="max-w-[70ch] text-sm text-muted">
          Quem deixou o email no formulário da sua página. Use só para o que o texto de consentimento promete: cada inscrição guarda o
          texto que a pessoa aceitou.
        </p>
      </div>
      <Suspense fallback={<div role="status" className="h-48 animate-pulse rounded-lg bg-surface-2"><span className="sr-only">Carregando</span></div>}>
        <Dados />
      </Suspense>
    </div>
  );
}

async function Dados() {
  const { sessao, perfil } = await exigirPerfil();
  const inscritos = await listarInscritos(sessao.userId, perfil.id, LIMITE_NA_TELA + 1);
  const mostrados = inscritos.slice(0, LIMITE_NA_TELA);
  return (
    <section aria-labelledby="t-inscritos" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="t-inscritos" className="text-lg font-semibold text-fg">
          {inscritos.length > LIMITE_NA_TELA
            ? `Os ${numero.format(LIMITE_NA_TELA)} mais recentes`
            : `${numero.format(inscritos.length)} ${inscritos.length === 1 ? "inscrito" : "inscritos"}`}
        </h2>
        {inscritos.length > 0 && (
          <a
            href="/api/audiencia.csv"
            download
            className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-bg px-4 text-sm font-semibold text-fg hover:bg-surface"
          >
            <Download aria-hidden className="size-4" />
            Baixar CSV
          </a>
        )}
      </div>
      {inscritos.length > LIMITE_NA_TELA && <p className="text-sm text-muted">O CSV traz a lista inteira.</p>}
      <DataTable
        legenda="Pessoas inscritas pelo formulário da página"
        colunas={[
          { chave: "email", titulo: "Email" },
          { chave: "nome", titulo: "Nome" },
          { chave: "formulario", titulo: "Formulário" },
          { chave: "em", titulo: "Inscrição" },
          { chave: "acao", titulo: "Ações", alinhar: "direita" },
        ]}
        linhas={mostrados.map((i) => ({
          email: i.email,
          nome: i.nome ?? "–",
          formulario: i.formulario ?? "formulário removido",
          em: quando(i.em),
          acao: <TirarDaLista id={i.id} email={i.email} />,
        }))}
        vazio={
          <>
            Ninguém se inscreveu ainda.{" "}
            <Link href="/admin" className="font-semibold text-accent underline">
              Adicione um formulário de email
            </Link>{" "}
            na sua página e compartilhe o endereço.
          </>
        }
      />
    </section>
  );
}
