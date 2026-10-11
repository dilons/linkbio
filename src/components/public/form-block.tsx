"use client";

import { useId, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";

type Estado = "parado" | "enviando" | "enviado" | "erro";

/**
 * Formulário da página pública para o visitante deixar o email.
 * O texto de consentimento é do criador (ele é o controlador desses dados) e
 * é gravado junto com cada inscrição. O campo "site" é isca para robôs.
 */
export function FormBlock({
  titulo,
  consentimento,
  mensagemSucesso = "Pronto! Você está na lista.",
  estadoInicial = "parado",
  onEnviar,
}: {
  titulo: string;
  consentimento: string;
  mensagemSucesso?: string;
  estadoInicial?: Estado;
  onEnviar?: (dados: { email: string }) => Promise<void>;
}) {
  const id = useId();
  const [estado, setEstado] = useState<Estado>(estadoInicial);
  const [erro, setErro] = useState<string | null>(estadoInicial === "erro" ? "Confira o email." : null);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    if (dados.get("site")) return; // robô
    const email = String(dados.get("email") ?? "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEstado("erro");
      setErro("Confira o email.");
      return;
    }
    setEstado("enviando");
    try {
      await onEnviar?.({ email });
      setEstado("enviado");
    } catch {
      setEstado("erro");
      setErro("Não deu para enviar agora. Tente de novo.");
    }
  }

  if (estado === "enviado") {
    return (
      <p role="status" className="rounded-lg border border-t-button-border p-4 text-center text-base font-semibold text-t-text">
        {mensagemSucesso}
      </p>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-3 rounded-lg border border-t-button-border p-4">
      <p className="text-base font-semibold text-t-text">{titulo}</p>
      <label htmlFor={`${id}-email`} className="sr-only">
        Seu email
      </label>
      <input
        id={`${id}-email`}
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="seu@email.com"
        aria-invalid={estado === "erro" || undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className="h-12 rounded-md border border-t-button-border bg-t-bg px-3 text-base text-t-text placeholder:text-t-muted"
      />
      <input name="site" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <label className="flex items-start gap-2 text-sm text-t-muted">
        <input name="aceite" type="checkbox" required className="mt-0.5 size-4" />
        <span>{consentimento}</span>
      </label>
      {erro && (
        <p id={`${id}-erro`} role="alert" className="text-sm font-semibold text-t-text">
          {erro}
        </p>
      )}
      <button
        type="submit"
        disabled={estado === "enviando"}
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
