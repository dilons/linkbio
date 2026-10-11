"use client";

import { useActionState, useState } from "react";
import { trocarEndereco, type Estado } from "@/app/acoes";
import { useChecagemDeUsername } from "@/components/app/checagem-username";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { semQuebrar } from "@/lib/acao-segura";
import { normalizarUsername } from "@/lib/data/validacao";
import { MARCA } from "@/lib/marca";

const trocarSeguro = semQuebrar(trocarEndereco);

/**
 * S13: trocar o endereço da página. Uma vez a cada 7 dias; o antigo leva ao
 * novo por 14 dias e fica guardado só para esta conta nesse tempo.
 */
export function TrocarEndereco({ atual, liberaEm }: { atual: string; liberaEm: string | null }) {
  const toast = useToast();
  const [valor, setValor] = useState("");
  // o erro do envio vale até a pessoa mexer no campo; depois, vale a checagem nova (BUG-012)
  const [editou, setEditou] = useState(false);
  const [estado, acao, enviando] = useActionState(async (anterior: Estado, form: FormData) => {
    const r = await trocarSeguro(anterior, form);
    setEditou(false);
    if (r.ok && r.aviso) {
      toast(r.aviso);
      setValor("");
    }
    return r;
  }, {});
  const checagem = useChecagemDeUsername(valor);
  const mesmo = valor.trim().length >= 3 && normalizarUsername(valor) === atual;
  const erroDoEnvio = editou ? undefined : estado.erros?.username;
  const erro = erroDoEnvio ?? (mesmo ? "Esse já é o endereço da sua página." : checagem && !checagem.livre ? checagem.motivo : undefined);
  const dica = checagem?.livre && !mesmo ? `${MARCA.dominio}/${checagem.username} está livre.` : "Letras, números, ponto e sublinhado.";

  return (
    <section aria-labelledby="t-endereco" className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 shadow-card">
      <h2 id="t-endereco" className="text-lg font-semibold text-fg">
        Endereço da página
      </h2>
      <p className="text-sm text-muted">
        Sua página está em <strong className="break-all text-fg">{MARCA.dominio}/{atual}</strong>.
      </p>
      {liberaEm ? (
        <p className="text-sm text-muted">Você trocou o endereço há pouco. A próxima troca fica liberada em {liberaEm}.</p>
      ) : (
        <form action={acao} className="flex flex-col gap-3" noValidate>
          <p className="text-sm text-muted">
            Dá para trocar uma vez a cada 7 dias. Por 14 dias, quem abrir o endereço antigo vai para o novo, e o antigo fica guardado só para você.
            Depois disso, ele fica livre: atualize a bio e o que mais tiver o endereço impresso.
          </p>
          {/* travado enquanto envia (BUG-010) */}
          <fieldset disabled={enviando} className="flex flex-col gap-3">
            <TextField
              label="Endereço novo"
              name="username"
              prefix={`${MARCA.dominio}/`}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={valor}
              onChange={(e) => {
                setValor(e.target.value);
                setEditou(true);
              }}
              hint={<span aria-live="polite">{dica}</span>}
              error={erro}
            />
          </fieldset>
          {estado.erro && (
            <p role="alert" className="text-sm font-medium text-danger">
              {estado.erro}
            </p>
          )}
          <div>
            <Button type="submit" variant="secondary" loading={enviando}>
              Trocar o endereço
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
