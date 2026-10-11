import { Download } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { estiloDeBotao } from "@/components/ui/button";
import { OPERADORES } from "@/lib/privacidade";

/** S13: privacidade e dados (LGPD art. 18): baixar a cópia e ver com quem os dados são compartilhados. */
export function PrivacidadeEDados() {
  return (
    <section aria-labelledby="t-privacidade" className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 shadow-card">
      <h2 id="t-privacidade" className="text-lg font-semibold text-fg">
        Privacidade e dados
      </h2>
      <p className="text-sm text-muted">
        Baixe uma cópia de tudo o que guardamos da sua conta: a página, os links, as redes, os inscritos dos seus formulários, as estatísticas por
        dia e a assinatura. Vem num arquivo JSON, que outros serviços conseguem ler.
      </p>
      <div>
        <a href="/api/me/export" download className={estiloDeBotao("secondary", "sm")}>
          <Download aria-hidden className="size-4" />
          Baixar meus dados
        </a>
      </div>
      <h3 className="pt-2 text-base font-semibold text-fg">Com quem compartilhamos</h3>
      <p className="text-sm text-muted">Só com estes fornecedores, para o serviço funcionar, sob contrato. Não vendemos seus dados.</p>
      <DataTable
        legenda="Fornecedores que tratam dados em nome do app"
        colunas={[
          { chave: "nome", titulo: "Fornecedor" },
          { chave: "faz", titulo: "Para quê" },
          { chave: "pais", titulo: "Onde" },
        ]}
        linhas={OPERADORES.map((o) => ({ nome: o.nome, faz: o.faz, pais: o.pais }))}
        vazio="Nenhum."
      />
    </section>
  );
}
