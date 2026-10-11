"use client";

import { useActionState } from "react";
import { assinarPro, cancelarPro } from "@/app/acoes";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

const FORMAS = [
  { valor: "pix", rotulo: "Pix", detalhe: "cobrança todo mês, paga pelo app do banco" },
  { valor: "card", rotulo: "Cartão de crédito", detalhe: "renova sozinho" },
  { valor: "boleto", rotulo: "Boleto", detalhe: "compensa em até 3 dias úteis" },
];

/** Assinar o Pro. O pagamento acontece na página do Asaas; aqui não entra cartão. */
export function FormAssinar({ pedeDocumento }: { pedeDocumento: boolean }) {
  const [estado, acao, enviando] = useActionState(assinarPro, {});
  const forma = estado.valores?.forma ?? "pix";
  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      {estado.erro && (
        <p role="alert" className="rounded-md bg-surface px-3 py-2 text-sm font-medium text-danger">
          {estado.erro}
        </p>
      )}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold text-fg">Como quer pagar</legend>
        {FORMAS.map((f) => (
          <label key={f.valor} className="flex cursor-pointer items-start gap-3 rounded-md border border-input bg-bg p-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
            <input type="radio" name="forma" value={f.valor} defaultChecked={f.valor === forma} className="mt-1 accent-accent" />
            <span>
              <span className="block text-sm font-semibold text-fg">{f.rotulo}</span>
              <span className="block text-xs text-muted">{f.detalhe}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {pedeDocumento && (
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="Nome de quem paga" name="nome" autoComplete="name" defaultValue={estado.valores?.nome} />
          <TextField
            label="CPF ou CNPJ"
            name="documento"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={estado.valores?.documento}
            error={estado.erros?.documento}
            hint="Exigido para emitir a cobrança. Vai direto para o Asaas; o linkbio não guarda."
          />
        </div>
      )}
      <div>
        <Button type="submit" size="lg" loading={enviando}>
          Assinar e ir para o pagamento
        </Button>
      </div>
    </form>
  );
}

/** Cancelar é um clique. O Pro continua até o fim do período pago. */
export function BotaoCancelar() {
  const [estado, acao, enviando] = useActionState(cancelarPro, {});
  return (
    <form action={acao} className="flex flex-col items-start gap-2">
      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-danger">
          {estado.erro}
        </p>
      )}
      <Button type="submit" variant="secondary" loading={enviando}>
        Cancelar assinatura
      </Button>
    </form>
  );
}
