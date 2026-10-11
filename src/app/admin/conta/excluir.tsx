"use client";

import { useActionState, useState } from "react";
import { excluirMinhaConta } from "@/app/acoes";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/field";

/** Zona de perigo da S13: excluir a conta, confirmando pelo endereço da página. */
export function ExcluirConta({ confirmacao }: { confirmacao: string }) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, enviando] = useActionState(excluirMinhaConta, {});
  return (
    <Dialog
      open={aberto}
      onOpenChange={setAberto}
      title="Excluir a conta inteira?"
      description="Links, inscritos, estatísticas, foto e textos são apagados agora e não voltam. Se você tem o Pro, a assinatura é cancelada. O endereço fica reservado por 14 dias e depois fica livre."
      trigger={<Button variant="danger">Excluir minha conta</Button>}
    >
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
            Excluir para sempre
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
