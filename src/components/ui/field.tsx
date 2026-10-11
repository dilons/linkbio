"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Base = {
  label: string;
  hint?: ReactNode;
  error?: string;
};

const caixa =
  "w-full rounded-md border bg-bg text-base text-fg placeholder:text-muted " +
  "disabled:cursor-not-allowed disabled:bg-surface";

function Mensagens({ id, hint, error }: { id: string; hint?: ReactNode; error?: string }) {
  return (
    <>
      {hint && !error && (
        <p id={`${id}-dica`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-erro`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </>
  );
}

function descritoPor(id: string, hint?: ReactNode, error?: string) {
  return error ? `${id}-erro` : hint ? `${id}-dica` : undefined;
}

/** Campo de texto com rótulo, dica, erro e um prefixo opcional (ex.: o domínio antes do username). */
export function TextField({
  label,
  hint,
  error,
  prefix,
  className,
  ...rest
}: Base & { prefix?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center rounded-md border bg-bg focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus",
          error ? "border-danger" : "border-input",
        )}
      >
        {prefix && <span className="pl-3 text-base text-muted select-none">{prefix}</span>}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={descritoPor(id, hint, error)}
          className={cn(caixa, "h-11 border-0 px-3 focus-visible:outline-none", prefix && "pl-0.5")}
          {...rest}
        />
      </div>
      <Mensagens id={id} hint={hint} error={error} />
    </div>
  );
}

/** Área de texto com contador de caracteres (a bio tem limite). */
export function TextArea({
  label,
  hint,
  error,
  maxLength,
  value,
  className,
  ...rest
}: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const usados = typeof value === "string" ? value.length : 0;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        {maxLength && (
          <span className="text-xs text-muted" aria-live="polite">
            {usados}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={descritoPor(id, hint, error)}
        className={cn(caixa, "min-h-24 px-3 py-2", error ? "border-danger" : "border-input")}
        {...rest}
      />
      <Mensagens id={id} hint={hint} error={error} />
    </div>
  );
}
