"use client";

import { useState } from "react";
import { tirarDaLista } from "@/app/acoes";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { SEM_CONEXAO, tentar } from "@/lib/acao-segura";

/** Tira uma pessoa da lista (por exemplo, quando ela pede). Confirma antes. */
export function TirarDaLista({ id, email }: { id: string; email: string }) {
  const toast = useToast();
  const [aberto, setAberto] = useState(false);
  const [tirando, setTirando] = useState(false);
  async function tirar() {
    setTirando(true);
    const ok = await tentar(() => tirarDaLista(id), null);
    setTirando(false);
    setAberto(false);
    if (ok) toast("Tirado da lista");
    else toast(ok === null ? SEM_CONEXAO : "Não deu para tirar da lista.", "erro");
  }
  return (
    <Dialog
      open={aberto}
      onOpenChange={setAberto}
      title="Tirar da lista?"
      description={`${email} sai da sua lista e do CSV. Não dá para desfazer; a pessoa pode se inscrever de novo pela sua página.`}
      trigger={
        <Button variant="ghost" size="sm" aria-label={`Tirar ${email} da lista`}>
          Tirar
        </Button>
      }
    >
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
        <Button variant="danger" loading={tirando} onClick={tirar}>
          Tirar da lista
        </Button>
      </div>
    </Dialog>
  );
}
