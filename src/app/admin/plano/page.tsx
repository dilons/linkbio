import { Check } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { assinaturaDaConta, ehPro, precoProCentavos } from "@/lib/billing";
import { exigirConta } from "@/lib/sessao";
import { BotaoCancelar, FormAssinar } from "./formularios";

export const metadata: Metadata = { title: "Seu plano · linkbio" };

const reais = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

// só o que já existe; agendamento e insights longos entram quando forem construídos
const VANTAGENS = ["Página sem a marca do linkbio no rodapé"];

// S14
export default function Plano() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-bold text-fg">Seu plano</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-surface-2" />}>
        <Dados />
      </Suspense>
    </div>
  );
}

async function Dados() {
  const sessao = await exigirConta();
  const a = await assinaturaDaConta(sessao.userId);
  const pro = ehPro(a);
  const preco = a?.precoCentavos ?? precoProCentavos();

  return (
    <section aria-labelledby="t-plano" className="flex flex-col gap-4 rounded-lg border border-border bg-bg p-4 shadow-card md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="t-plano" className="text-lg font-semibold text-fg">
          {pro ? "Pro" : "Grátis"}
        </h2>
        {a?.status === "active" && <Badge tom="sucesso">Ativo</Badge>}
        {a?.status === "past_due" && <Badge tom="alerta">Pagamento vencido</Badge>}
        {a?.status === "pending" && <Badge tom="info">Aguardando pagamento</Badge>}
        {a?.status === "canceled" && pro && <Badge>Cancelado</Badge>}
      </div>

      {pro && a?.fimDoPeriodo && (
        <p className="text-sm text-muted">
          {a.status === "canceled"
            ? `Você cancelou. O Pro continua até ${dia(a.fimDoPeriodo)} e depois a página volta ao grátis, sem perder nada.`
            : `${reais(preco)} por mês. Período atual até ${dia(a.fimDoPeriodo)}.`}
        </p>
      )}
      {a?.status === "past_due" && (
        <p className="text-sm text-muted">A cobrança deste mês venceu. Pague pelo link que o Asaas mandou para o seu email para continuar no Pro.</p>
      )}

      <ul className="flex flex-col gap-1.5">
        {VANTAGENS.map((v) => (
          <li key={v} className="flex items-center gap-2 text-sm text-fg">
            <Check aria-hidden className="size-4 text-success" />
            {v}
          </li>
        ))}
      </ul>

      {pro && a && a.status !== "canceled" ? (
        <BotaoCancelar />
      ) : (
        <>
          <p className="text-base font-semibold text-fg">
            {reais(preco)} <span className="text-sm font-normal text-muted">por mês, cancele quando quiser</span>
          </p>
          {a?.status === "pending" && (
            <p className="text-sm text-muted">Já existe uma cobrança esperando pagamento. Assinar de novo leva a ela, ou cria outra se você trocar a forma de pagamento.</p>
          )}
          <FormAssinar pedeDocumento={!a?.temCliente} />
        </>
      )}
    </section>
  );
}
