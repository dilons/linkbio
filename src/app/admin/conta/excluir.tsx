"use client";

import { useActionState, useState } from "react";
import { excluirMinhaConta, excluirMinhaPagina, type Estado } from "@/app/acoes";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/field";
import { semQuebrar } from "@/lib/acao-segura";

const excluirContaSeguro = semQuebrar(excluirMinhaConta);
const excluirPaginaSeguro = semQuebrar(excluirMinhaPagina);

/** Zona de perigo da S13: só a página, confirmando pelo endereço. A conta continua. */
export function ExcluirPagina({ username }: { username: string }) {
  return (
    <Confirmar
      acao={excluirPaginaSeguro}
      confirmacao={username}
      titulo="Excluir só a página?"
      descricao="Links, redes, inscritos da Audiência, estatísticas, foto e textos são apagados agora e não voltam. Quer guardar os inscritos? Baixe o CSV na Audiência antes. Sua conta e o Pro, se tiver, continuam, e o endereço fica guardado para você por 14 dias."
      abrir="Excluir a página"
      confirmar="Excluir a página"
    />
  );
}

/** Zona de perigo da S13: excluir a conta, confirmando pelo endereço da página. */
export function ExcluirConta({ confirmacao }: { confirmacao: string }) {
  return (
    <Confirmar
      acao={excluirContaSeguro}
      confirmacao={confirmacao}
      titulo="Excluir a conta inteira?"
      descricao="Links, inscritos, estatísticas, foto e textos são apagados agora e não voltam. Se você tem o Pro, a assinatura é cancelada. O endereço fica reservado por 14 dias e depois fica livre."
      abrir="Excluir minha conta"
      confirmar="Excluir para sempre"
    />
  );
}

function Confirmar({
  acao: enviar,
  confirmacao,
  titulo,
  descricao,
  abrir,
  confirmar,
}: {
  acao: (anterior: Estado, form: FormData) => Promise<Estado>;
  confirmacao: string;
  titulo: string;
  descricao: string;
  abrir: string;
  confirmar: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, enviando] = useActionState(enviar, {});
  return (
    <Dialog open={aberto} onOpenChange={setAberto} title={titulo} description={descricao} trigger={<Button variant="danger">{abrir}</Button>}>
      <form action={acao} className="flex flex-col gap-4" noValidate>
        {estado.erro && (
          <p role="alert" className="text-sm font-medium text-danger">
            {estado.erro}
          </p>
        )}
        <TextField
          label={`Para confirmar, digite ${confirmacao}`}
          name="confirmacao"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          error={estado.erros?.confirmacao}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button type="submit" variant="danger" loading={enviando}>
            {confirmar}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
