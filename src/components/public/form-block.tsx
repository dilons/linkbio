"use client";

import { useId, useState, useSyncExternalStore, type FormEvent } from "react";
import { cn } from "@/lib/cn";

type Estado = "parado" | "enviando" | "enviado" | "erro";

const semAssinatura = () => () => {};

const MENSAGENS: Record<number, string> = {
  400: "Confira o email e marque a caixa de aceite.",
  404: "Este formulário não está mais recebendo inscrições.",
  429: "Muitas tentativas seguidas. Espere um pouco e tente de novo.",
};

/**
 * Formulário da página pública para o visitante deixar o email (S15, S17).
 * O texto de consentimento é do criador (ele é o controlador desses dados) e
 * é gravado junto com cada inscrição. O campo "site" é isca para robôs.
 * Com `linkId`, envia para /api/forms/[linkId]; sem ele (na vitrine do design
 * system), chama `onEnviar`. O botão só liga depois da hidratação: antes
 * disso o navegador enviaria o formulário sozinho e o email iria parar na URL.
 */
export function FormBlock({
  linkId,
  titulo,
  consentimento,
  pedirNome = false,
  mensagemSucesso = "Pronto! Você está na lista.",
  estadoInicial = "parado",
  onEnviar,
}: {
  linkId?: string;
  titulo: string;
  consentimento: string;
  pedirNome?: boolean;
  mensagemSucesso?: string;
  estadoInicial?: Estado;
  onEnviar?: (dados: { email: string }) => Promise<void>;
}) {
  const id = useId();
  const hidratado = useSyncExternalStore(semAssinatura, () => true, () => false);
  const [estado, setEstado] = useState<Estado>(estadoInicial);
  const [erro, setErro] = useState<string | null>(estadoInicial === "erro" ? "Confira o email." : null);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const email = String(dados.get("email") ?? "").trim();
    const nome = String(dados.get("nome") ?? "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEstado("erro");
      setErro("Confira o email.");
      return;
    }
    if (!dados.get("aceite")) {
      setEstado("erro");
      setErro("Marque a caixa para confirmar que aceita receber os emails.");
      return;
    }
    setEstado("enviando");
    try {
      if (linkId) {
        const r = await fetch(`/api/forms/${linkId}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, nome: nome || undefined, aceite: true, site: String(dados.get("site") ?? "") }),
        });
        if (!r.ok) {
          setEstado("erro");
          setErro(MENSAGENS[r.status] ?? "Não deu para enviar agora. Tente de novo.");
          return;
        }
      } else {
        await onEnviar?.({ email });
      }
      setEstado("enviado");
    } catch {
      setEstado("erro");
      setErro("Sem conexão. Confira a internet e tente de novo.");
    }
  }

  if (estado === "enviado") {
    return (
      <p role="status" className="rounded-lg border border-t-button-border p-4 text-center text-base font-semibold text-t-text wrap-anywhere">
        {mensagemSucesso}
      </p>
    );
  }

  return (
    <form method="post" onSubmit={enviar} noValidate className="flex flex-col gap-3 rounded-lg border border-t-button-border p-4">
      <p className="text-base font-semibold text-t-text wrap-anywhere">{titulo}</p>
      {pedirNome && (
        <>
          <label htmlFor={`${id}-nome`} className="sr-only">
            Seu nome
          </label>
          <input
            id={`${id}-nome`}
            name="nome"
            type="text"
            autoComplete="name"
            maxLength={100}
            placeholder="Seu nome (opcional)"
            className="h-12 rounded-md border border-t-button-border bg-t-bg px-3 text-base text-t-text placeholder:text-t-muted"
          />
        </>
      )}
      <label htmlFor={`${id}-email`} className="sr-only">
        Seu email
      </label>
      <input
        id={`${id}-email`}
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        placeholder="seu@email.com"
        aria-invalid={estado === "erro" || undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className="h-12 rounded-md border border-t-button-border bg-t-bg px-3 text-base text-t-text placeholder:text-t-muted"
      />
      <input name="site" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <label className="flex items-start gap-2 text-sm text-t-muted">
        <input name="aceite" type="checkbox" required className="mt-0.5 size-4 shrink-0" />
        <span className="wrap-anywhere">{consentimento}</span>
      </label>
      {erro && (
        <p id={`${id}-erro`} role="alert" className="text-sm font-semibold text-t-text">
          {erro}
        </p>
      )}
      <button
        type="submit"
        disabled={!hidratado || estado === "enviando"}
        className={cn(
          "h-12 rounded-md border border-t-button-border bg-t-button text-base font-semibold text-t-on-button",
          "disabled:opacity-60",
        )}
      >
        {estado === "enviando" ? "Enviando..." : "Quero receber"}
      </button>
    </form>
  );
}
