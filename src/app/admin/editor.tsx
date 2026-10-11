"use client";

import { Check, Copy, ExternalLink, Pencil } from "lucide-react";
import { useActionState, useState } from "react";
import { apagarLink, ligarDesligarLink, mudarOrdem, novoLink, salvarCabecalho, salvarLink, type Estado } from "@/app/acoes";
import { PublicPage } from "@/components/public/public-page";
import type { Rede } from "@/components/public/social-row";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextArea, TextField } from "@/components/ui/field";
import { LinkCard } from "@/components/ui/link-card";
import { PhonePreview } from "@/components/ui/phone-preview";
import { SortableList } from "@/components/ui/sortable-list";
import { useToast } from "@/components/ui/toast";

export type LinkEditor = { id: string; titulo: string; url: string; ativo: boolean };

type Props = {
  username: string;
  titulo: string;
  bio: string;
  tema: string;
  redes: Rede[];
  links: LinkEditor[];
};

/** S06: o editor. A prévia mostra o estado local, então reage na hora. */
export function Editor(props: Props) {
  const toast = useToast();
  const [itens, setItens] = useState(props.links);
  const [editando, setEditando] = useState<LinkEditor | null>(null);
  const [excluindo, setExcluindo] = useState<LinkEditor | null>(null);

  async function alternar(link: LinkEditor, ativo: boolean) {
    setItens((ls) => ls.map((l) => (l.id === link.id ? { ...l, ativo } : l)));
    if (!(await ligarDesligarLink(link.id, ativo))) toast("Não deu para salvar. Tente de novo.", "erro");
  }

  async function reordenar(novos: LinkEditor[]) {
    setItens(novos);
    if (await mudarOrdem(novos.map((l) => l.id))) toast("Ordem salva");
    else toast("Não deu para salvar a ordem.", "erro");
  }

  async function excluir() {
    if (!excluindo) return;
    const alvo = excluindo;
    setExcluindo(null);
    setItens((ls) => ls.filter((l) => l.id !== alvo.id));
    if (await apagarLink(alvo.id)) toast("Link excluído");
    else toast("Não deu para excluir.", "erro");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex min-w-0 flex-col gap-6">
        <Endereco username={props.username} />
        <Cabecalho titulo={props.titulo} bio={props.bio} />
        <NovoLink />
        <section aria-labelledby="titulo-links" className="flex flex-col gap-3">
          <h2 id="titulo-links" className="text-lg font-semibold text-fg">
            Na sua página
          </h2>
          {itens.length === 0 ? (
            <p className="rounded-lg border border-dashed border-input bg-bg p-6 text-center text-sm text-muted">
              Sua página ainda não tem links. Comece pelo mais importante: ele vai ficar no topo.
            </p>
          ) : (
            <SortableList
              itens={itens}
              onReorder={reordenar}
              render={(link, alca, arrastando) => (
                <LinkCard
                  link={link}
                  alca={alca}
                  arrastando={arrastando}
                  onToggle={(ativo) => alternar(link, ativo)}
                  onEditar={() => setEditando(link)}
                  onExcluir={() => setExcluindo(link)}
                />
              )}
            />
          )}
        </section>
      </div>

      <aside aria-label="Prévia" className="hidden lg:block">
        <div className="sticky top-8">
          <PhonePreview>
            <PublicPage
              principal={false}
              tema={props.tema}
              titulo={props.titulo || props.username}
              bio={props.bio}
              redes={props.redes}
              links={itens.filter((l) => l.ativo).map((l) => ({ id: l.id, titulo: l.titulo }))}
            />
          </PhonePreview>
        </div>
      </aside>

      {editando && <EditarLink link={editando} onFechar={() => setEditando(null)} />}
      <Dialog
        open={excluindo !== null}
        onOpenChange={(v) => !v && setExcluindo(null)}
        title="Excluir este link?"
        description={excluindo ? `"${excluindo.titulo}" sai da sua página. Os cliques que ele já teve continuam nos insights.` : undefined}
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setExcluindo(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={excluir}>
            Excluir
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function Endereco({ username }: { username: string }) {
  const [copiado, setCopiado] = useState(false);
  const caminho = `/${username}`;
  async function copiar() {
    await navigator.clipboard.writeText(`${window.location.origin}${caminho}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-bg p-4 shadow-card">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">Sua página</p>
        <p className="truncate text-base font-semibold text-fg">linkbio.com.br{caminho}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={copiar}>
          {copiado ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
          <span aria-live="polite">{copiado ? "Copiado" : "Copiar"}</span>
        </Button>
        <a
          href={caminho}
          target="_blank"
          rel="noopener"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-bg px-3 text-sm font-semibold text-fg hover:bg-surface"
        >
          <ExternalLink aria-hidden className="size-4" />
          Abrir
        </a>
      </div>
    </section>
  );
}

function Cabecalho({ titulo, bio }: { titulo: string; bio: string }) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, enviando] = useActionState(async (anterior: Estado, form: FormData) => {
    const r = await salvarCabecalho(anterior, form);
    if (r.ok) setAberto(false);
    return r;
  }, {});
  const [bioAtual, setBioAtual] = useState(bio);
  return (
    <section className="flex items-start justify-between gap-3 rounded-lg border border-border bg-bg p-4 shadow-card">
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-fg">{titulo || "Sem título"}</p>
        <p className="text-sm text-muted">{bio || "Sem bio. Conte em uma frase o que você faz."}</p>
      </div>
      <Dialog
        open={aberto}
        onOpenChange={setAberto}
        title="Título e bio"
        trigger={
          <Button variant="ghost" size="sm" aria-label="Editar título e bio">
            <Pencil aria-hidden className="size-4" />
            Editar
          </Button>
        }
      >
        <form action={acao} className="flex flex-col gap-4">
          <TextField label="Título" name="titulo" defaultValue={estado.valores?.titulo ?? titulo} maxLength={60} error={estado.erros?.titulo} />
          <TextArea label="Bio" name="bio" value={bioAtual} onChange={(e) => setBioAtual(e.target.value)} maxLength={160} error={estado.erros?.bio} />
          <div className="flex justify-end">
            <Button type="submit" loading={enviando}>
              Salvar
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  );
}

function NovoLink() {
  const toast = useToast();
  const [estado, acao, enviando] = useActionState(async (anterior: Estado, form: FormData) => {
    const r = await novoLink(anterior, form);
    if (r.ok) toast("Link adicionado");
    return r;
  }, {});
  return (
    <form action={acao} className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 shadow-card" noValidate>
      <h2 className="text-lg font-semibold text-fg">Adicionar link</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField
          label="Título"
          name="titulo"
          placeholder="Ex.: Faça sua encomenda"
          defaultValue={estado.valores?.titulo}
          error={estado.erros?.titulo}
        />
        <TextField
          label="Endereço"
          name="url"
          inputMode="url"
          placeholder="exemplo.com.br"
          defaultValue={estado.valores?.url}
          error={estado.erros?.url}
        />
      </div>
      <div>
        <Button type="submit" loading={enviando}>
          Adicionar
        </Button>
      </div>
    </form>
  );
}

function EditarLink({ link, onFechar }: { link: LinkEditor; onFechar: () => void }) {
  const [estado, acao, enviando] = useActionState(async (anterior: Estado, form: FormData) => {
    const r = await salvarLink(anterior, form);
    if (r.ok) onFechar();
    return r;
  }, {});
  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()} title="Editar link">
      <form action={acao} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="id" value={link.id} />
        <TextField label="Título" name="titulo" defaultValue={estado.valores?.titulo ?? link.titulo} error={estado.erros?.titulo} />
        <TextField label="Endereço" name="url" inputMode="url" defaultValue={estado.valores?.url ?? link.url} error={estado.erros?.url} />
        {estado.erro && (
          <p role="alert" className="text-sm font-medium text-danger">
            {estado.erro}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" loading={enviando}>
            Salvar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
