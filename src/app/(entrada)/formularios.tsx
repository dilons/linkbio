"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { cadastrar, escolherUsername, fazerLogin, type Estado } from "@/app/acoes";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

function ErroGeral({ estado }: { estado: Estado }) {
  if (!estado.erro) return null;
  return (
    <p role="alert" className="rounded-md bg-surface px-3 py-2 text-sm font-medium text-danger">
      {estado.erro}
    </p>
  );
}

/** S01: criar conta. */
export function FormCadastro() {
  const [estado, acao, enviando] = useActionState(cadastrar, {});
  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <ErroGeral estado={estado} />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={estado.valores?.email}
        error={estado.erros?.email}
      />
      <TextField
        label="Senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="Pelo menos 8 caracteres."
        error={estado.erros?.senha}
      />
      <Button type="submit" size="lg" loading={enviando}>
        Criar minha conta
      </Button>
      <p className="text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-accent underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}

/** S18: entrar. */
export function FormLogin() {
  const [estado, acao, enviando] = useActionState(fazerLogin, {});
  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <ErroGeral estado={estado} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required defaultValue={estado.valores?.email} />
      <TextField label="Senha" name="senha" type="password" autoComplete="current-password" required />
      <Button type="submit" size="lg" loading={enviando}>
        Entrar
      </Button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/entrar/recuperar" className="font-semibold text-accent underline">
          Esqueci a senha
        </Link>
        <Link href="/cadastro" className="font-semibold text-accent underline">
          Criar conta
        </Link>
      </div>
    </form>
  );
}

type Checagem = { livre: boolean; username: string; motivo?: string } | null;

/** S03: escolher o endereço, com checagem enquanto digita. */
export function FormUsername() {
  const [estado, acao, enviando] = useActionState(escolherUsername, {});
  const [valor, setValor] = useState("");
  const [checagem, setChecagem] = useState<Checagem>(null);

  useEffect(() => {
    const u = valor.trim();
    if (u.length < 3) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/username?u=${encodeURIComponent(u)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then(setChecagem)
        .catch(() => {});
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [valor]);

  const atual = valor.trim().length >= 3 ? checagem : null;
  const erro = estado.erros?.username ?? (atual && !atual.livre ? atual.motivo : undefined);
  const dica = atual?.livre ? `linkbio.com.br/${atual.username} está livre.` : "Letras, números, ponto e sublinhado.";

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <TextField
        label="Seu endereço"
        name="username"
        prefix="linkbio.com.br/"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        required
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        hint={<span aria-live="polite">{dica}</span>}
        error={erro}
      />
      <Button type="submit" size="lg" loading={enviando}>
        Continuar
      </Button>
    </form>
  );
}
