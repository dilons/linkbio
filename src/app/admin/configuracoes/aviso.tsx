"use client";

import { useActionState, useId } from "react";
import { salvarAvisoDaPagina, type Estado } from "@/app/acoes";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Travado } from "@/components/ui/travado";
import { semQuebrar } from "@/lib/acao-segura";

const salvarSeguro = semQuebrar(salvarAvisoDaPagina);

const OPCOES = [
  ["none", "Sem aviso", "A página abre direto."],
  ["sensitive", "Conteúdo sensível", "Quem abre vê um aviso e escolhe se continua."],
  ["18", "Maiores de 18 anos", "Quem abre informa a data de nascimento; menores não veem os links."],
  ["21", "Maiores de 21 anos", "Igual, com 21 anos."],
  ["25", "Maiores de 25 anos", "Igual, com 25 anos."],
] as const;

/** S12: o aviso de conteúdo da página toda. */
export function AvisoDaPagina({ atual }: { atual: string }) {
  const toast = useToast();
  const id = useId();
  const [estado, acao, enviando] = useActionState(async (anterior: Estado, form: FormData) => {
    const r = await salvarSeguro(anterior, form);
    if (r.ok && r.aviso) toast(r.aviso);
    return r;
  }, {});
  return (
    <section aria-labelledby={`${id}-t`} className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 shadow-card">
      <h2 id={`${id}-t`} className="text-lg font-semibold text-fg">
        Aviso de conteúdo
      </h2>
      <p className="text-sm text-muted">
        Para quando a página toda não é para todo mundo. O aviso aparece antes dos links, e a data de nascimento que a pessoa informa não fica guardada.
        Para um link só, use o aviso no próprio link.
      </p>
      <form action={acao} className="flex flex-col gap-4">
        <Travado enviando={enviando} estado={estado}>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Aviso da página</legend>
            {OPCOES.map(([valor, rotulo, descricao]) => (
              <label
                key={valor}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
              >
                <input type="radio" name="aviso" value={valor} defaultChecked={atual === valor} className="mt-1 size-4 shrink-0 accent-accent" />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-fg">{rotulo}</span>
                  <span className="text-sm text-muted">{descricao}</span>
                </span>
              </label>
            ))}
          </fieldset>
          {estado.erro && (
            <p role="alert" className="text-sm font-medium text-danger">
              {estado.erro}
            </p>
          )}
          <div>
            <Button type="submit" loading={enviando}>
              Salvar aviso
            </Button>
          </div>
        </Travado>
      </form>
    </section>
  );
}
