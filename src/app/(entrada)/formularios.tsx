"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  cadastrar,
  entrarComGoogle,
  escolherUsername,
  fazerLogin,
  pedirSenhaNova,
  reenviar,
  salvarSenhaNova,
  type Estado,
} from "@/app/acoes";
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

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="rounded-md bg-accent-soft px-3 py-2 text-sm font-medium text-fg">
      {children}
    </p>
  );
}

const googleLigado = process.env.NEXT_PUBLIC_LOGIN_GOOGLE === "1";

/** Entrar com Google: só aparece quando o app OAuth do Google está configurado. */
function BotaoGoogle() {
  if (!googleLigado) return null;
  return (
    <form action={entrarComGoogle} className="flex flex-col gap-4">
      <Button type="submit" variant="secondary" size="lg">
        Continuar com Google
      </Button>
      <p className="text-center text-xs text-muted">ou com email e senha</p>
    </form>
  );
}

/** S02: o link foi para o email. Mostrada no lugar do formulário de cadastro e na rota /confirmar. */
export function ConfirmeSeuEmail({ email }: { email?: string }) {
  const [estado, acao, enviando] = useActionState(reenviar, {});
  return (
    <div className="flex flex-col gap-4">
      <MailCheck aria-hidden className="size-10 text-accent" />
      <h1 className="text-xl font-bold text-fg">Confira seu email</h1>
      <p className="text-base text-muted">
        {email ? (
          <>
            Se <strong className="text-fg">{email}</strong> ainda não tem conta, o link para confirmar já está a caminho.
          </>
        ) : (
          "Mandamos um link para confirmar o seu email."
        )}{" "}
        Abra no celular ou no computador, tanto faz. Se esse email já tem conta,{" "}
        <Link href="/entrar" className="font-semibold text-accent underline">
          entre por aqui
        </Link>
        .
      </p>
      <form action={acao} className="flex flex-col gap-3" noValidate>
        {estado.aviso && <Aviso>{estado.aviso}</Aviso>}
        <ErroGeral estado={estado} />
        {email ? (
          <input type="hidden" name="email" value={email} />
        ) : (
          <TextField label="Email" name="email" type="email" autoComplete="email" defaultValue={estado.valores?.email} />
        )}
        <Button type="submit" variant="secondary" loading={enviando}>
          Mandar o link de novo
        </Button>
      </form>
    </div>
  );
}

/** S01: criar conta. Depois de enviar, vira a S02. */
export function FormCadastro() {
  const [estado, acao, enviando] = useActionState(cadastrar, {});
  if (estado.ok) return <ConfirmeSeuEmail email={estado.valores?.email} />;
  return (
    <div className="flex flex-col gap-4">
      <BotaoGoogle />
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
    </div>
  );
}

const AVISOS: Record<string, { texto: string; erro?: boolean }> = {
  "link-invalido": { texto: "Esse link expirou ou já foi usado. Entre com email e senha, ou peça outro link.", erro: true },
  google: { texto: "Não deu para entrar com o Google. Tente de novo ou use email e senha.", erro: true },
  "saiu-de-todos": { texto: "Pronto: você saiu de todos os aparelhos." },
  "conta-excluida": { texto: "Sua conta foi excluída. Mandamos a confirmação para o seu email." },
};

/** Recado que vem na URL (?aviso=...) de outra tela: link vencido, conta excluída. */
export function AvisoDaUrl() {
  const aviso = AVISOS[useSearchParams().get("aviso") ?? ""];
  if (!aviso) return null;
  return aviso.erro ? (
    <p role="alert" className="mb-4 rounded-md bg-surface px-3 py-2 text-sm font-medium text-danger">
      {aviso.texto}
    </p>
  ) : (
    <div className="mb-4">
      <Aviso>{aviso.texto}</Aviso>
    </div>
  );
}

/** S18: entrar. Email sem confirmar ganha o botão de mandar o link de novo. */
export function FormLogin() {
  const [estado, acao, enviando] = useActionState(fazerLogin, {});
  if (estado.naoConfirmado) {
    return (
      <div className="flex flex-col gap-4">
        <ErroGeral estado={estado} />
        <ConfirmeSeuEmail email={estado.valores?.email} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <BotaoGoogle />
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
    </div>
  );
}

/** S18 (recuperar): pede o link de senha nova. */
export function FormRecuperar() {
  const [estado, acao, enviando] = useActionState(pedirSenhaNova, {});
  if (estado.ok) {
    return (
      <div className="flex flex-col gap-4">
        <Aviso>{estado.aviso}</Aviso>
        <Link href="/entrar" className="text-sm font-semibold text-accent underline">
          Voltar para o login
        </Link>
      </div>
    );
  }
  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <ErroGeral estado={estado} />
      <TextField
        label="Email da conta"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={estado.valores?.email}
        error={estado.erros?.email}
      />
      <Button type="submit" size="lg" loading={enviando}>
        Mandar o link
      </Button>
      <Link href="/entrar" className="text-sm font-semibold text-accent underline">
        Voltar para o login
      </Link>
    </form>
  );
}

/** Depois do link de recuperação: a senha nova, duas vezes. */
export function FormSenhaNova() {
  const [estado, acao, enviando] = useActionState(salvarSenhaNova, {});
  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <ErroGeral estado={estado} />
      <TextField
        label="Senha nova"
        name="senha"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="Pelo menos 8 caracteres."
        error={estado.erros?.senha}
      />
      <TextField label="Repita a senha nova" name="repetir" type="password" autoComplete="new-password" required error={estado.erros?.repetir} />
      <Button type="submit" size="lg" loading={enviando}>
        Salvar e entrar
      </Button>
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
        .then((r) => (r.ok ? r.json() : null))
        .then((c) => c && setChecagem(c))
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
