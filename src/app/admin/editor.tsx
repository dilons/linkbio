"use client";

import { Check, Copy, ExternalLink, Mail, Pencil } from "lucide-react";
import { useActionState, useState } from "react";
import {
  apagarLink,
  ligarDesligarLink,
  mudarOrdem,
  novoFormulario,
  novoLink,
  salvarCabecalho,
  salvarFormulario,
  salvarFoto,
  salvarLink,
  type Estado,
} from "@/app/acoes";
import { PublicPage } from "@/components/public/public-page";
import type { Rede } from "@/components/public/social-row";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextArea, TextField } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import { LinkCard } from "@/components/ui/link-card";
import { PhonePreview } from "@/components/ui/phone-preview";
import { SortableList } from "@/components/ui/sortable-list";
import { useToast } from "@/components/ui/toast";
import { SEM_CONEXAO, semQuebrar, tentar } from "@/lib/acao-segura";

export type ConfigFormulario = { pedirNome: boolean; consentimento: string; sucesso: string };
export type LinkEditor = { id: string; titulo: string; url: string; ativo: boolean; formulario: ConfigFormulario | null };

const novoLinkSeguro = semQuebrar(novoLink);
const salvarLinkSeguro = semQuebrar(salvarLink);
const salvarCabecalhoSeguro = semQuebrar(salvarCabecalho);
const salvarFormularioSeguro = semQuebrar(salvarFormulario);

type Props = {
  username: string;
  titulo: string;
  bio: string;
  avatarUrl?: string;
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

  // As três mudam a lista na hora (otimista) e voltam atrás se o servidor não confirmar.
  async function alternar(link: LinkEditor, ativo: boolean) {
    setItens((ls) => ls.map((l) => (l.id === link.id ? { ...l, ativo } : l)));
    const ok = await tentar(() => ligarDesligarLink(link.id, ativo), null);
    if (ok) return;
    setItens((ls) => ls.map((l) => (l.id === link.id ? { ...l, ativo: !ativo } : l)));
    toast(ok === null ? SEM_CONEXAO : "Não deu para salvar. Tente de novo.", "erro");
  }

  async function reordenar(novos: LinkEditor[]) {
    const antes = itens;
    setItens(novos);
    const ok = await tentar(() => mudarOrdem(novos.map((l) => l.id)), null);
    if (ok) return toast("Ordem salva");
    setItens(antes);
    toast(ok === null ? SEM_CONEXAO : "Não deu para salvar a ordem.", "erro");
  }

  async function excluir() {
    if (!excluindo) return;
    const alvo = excluindo;
    const antes = itens;
    setExcluindo(null);
    setItens((ls) => ls.filter((l) => l.id !== alvo.id));
    const ok = await tentar(() => apagarLink(alvo.id), null);
    if (ok) return toast("Link excluído");
    setItens(antes);
    toast(ok === null ? SEM_CONEXAO : "Não deu para excluir.", "erro");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex min-w-0 flex-col gap-6">
        <Endereco username={props.username} />
        <Cabecalho titulo={props.titulo} bio={props.bio} avatarUrl={props.avatarUrl} />
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
                  link={{ ...link, url: link.formulario ? undefined : link.url, selo: link.formulario ? "Formulário de email" : undefined }}
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
              avatarUrl={props.avatarUrl}
              redes={props.redes}
              links={itens.filter((l) => l.ativo).map((l) => ({ id: l.id, titulo: l.titulo, formulario: l.formulario }))}
            />
          </PhonePreview>
        </div>
      </aside>

      {editando &&
        (editando.formulario ? (
          <EditarFormulario link={editando} formulario={editando.formulario} onFechar={() => setEditando(null)} />
        ) : (
          <EditarLink link={editando} onFechar={() => setEditando(null)} />
        ))}
      <Dialog
        open={excluindo !== null}
        onOpenChange={(v) => !v && setExcluindo(null)}
        title="Excluir este link?"
        description={
          excluindo
            ? excluindo.formulario
              ? `"${excluindo.titulo}" sai da sua página. Quem já se inscreveu continua na Audiência.`
              : `"${excluindo.titulo}" sai da sua página. Os cliques que ele já teve continuam nos insights.`
            : undefined
        }
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

/** Envia a foto direto ao Storage (URL assinada de /api/upload) e grava no perfil. */
function Foto({ avatarUrl }: { avatarUrl?: string }) {
  const toast = useToast();
  const [enviando, setEnviando] = useState(false);
  async function enviar(f: File) {
    setEnviando(true);
    try {
      const r = await fetch("/api/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tipo: f.type, tamanho: f.size }),
      });
      const envio = await r.json();
      if (!r.ok) return toast(envio.erro ?? "Não deu para enviar a foto.", "erro");
      const up = await fetch(envio.url, { method: "PUT", body: f, headers: { "content-type": f.type, "x-upsert": "false" } });
      if (!up.ok || !(await tentar(() => salvarFoto(envio.caminho), false))) return toast("Não deu para enviar a foto.", "erro");
      toast("Foto salva");
    } catch {
      toast("Não deu para enviar a foto.", "erro");
    } finally {
      setEnviando(false);
    }
  }
  return (
    <div className="flex flex-col gap-2" aria-busy={enviando}>
      <ImageUpload label={avatarUrl ? "Trocar a foto" : "Escolher uma foto"} maxMB={2} redonda atual={avatarUrl} onArquivo={enviar} />
      {avatarUrl && (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={async () => {
              const ok = await tentar(() => salvarFoto(null), false);
              toast(ok ? "Foto removida" : "Não deu para remover.", ok ? "sucesso" : "erro");
            }}
          >
            Tirar a foto
          </Button>
        </div>
      )}
    </div>
  );
}

function Cabecalho({ titulo, bio, avatarUrl }: { titulo: string; bio: string; avatarUrl?: string }) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, enviando] = useActionState(async (anterior: Estado, form: FormData) => {
    const r = await salvarCabecalhoSeguro(anterior, form);
    if (r.ok) setAberto(false);
    return r;
  }, {});
  const [bioAtual, setBioAtual] = useState(bio);
  return (
    <section className="flex items-start justify-between gap-3 rounded-lg border border-border bg-bg p-4 shadow-card">
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-fg">{titulo || "Sem título"}</p>
        <p className="text-sm text-muted wrap-anywhere">{bio || "Sem bio. Conte em uma frase o que você faz."}</p>
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
        <Foto avatarUrl={avatarUrl} />
        <form action={acao} className="mt-4 flex flex-col gap-4">
          <TextField label="Título" name="titulo" defaultValue={estado.valores?.titulo ?? titulo} maxLength={60} error={estado.erros?.titulo} />
          <TextArea label="Bio" name="bio" value={bioAtual} onChange={(e) => setBioAtual(e.target.value)} maxLength={160} error={estado.erros?.bio} />
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
    </section>
  );
}

function NovoLink() {
  const toast = useToast();
  const [estado, acao, enviando] = useActionState(async (anterior: Estado, form: FormData) => {
    const r = await novoLinkSeguro(anterior, form);
    if (r.ok) toast("Link adicionado");
    else if (r.erro) toast(r.erro, "erro");
    // sem rede, o que foi digitado volta para os campos
    return r.erro && !r.valores ? { ...r, valores: { titulo: String(form.get("titulo") ?? ""), url: String(form.get("url") ?? "") } } : r;
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
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={enviando}>
          Adicionar
        </Button>
        <NovoFormulario />
      </div>
    </form>
  );
}

/** Põe um bloco de formulário de email no topo da página (F05). */
function NovoFormulario() {
  const toast = useToast();
  const [criando, setCriando] = useState(false);
  async function criar() {
    setCriando(true);
    const ok = await tentar(() => novoFormulario(), null);
    setCriando(false);
    if (ok) toast("Formulário adicionado. Toque em editar para ajustar os textos.");
    else toast(ok === null ? SEM_CONEXAO : "Não deu para adicionar o formulário.", "erro");
  }
  return (
    <Button type="button" variant="secondary" loading={criando} onClick={criar}>
      <Mail aria-hidden className="size-4" />
      Adicionar formulário de email
    </Button>
  );
}

/** S11: textos e campos do formulário de email. */
function EditarFormulario({ link, formulario, onFechar }: { link: LinkEditor; formulario: ConfigFormulario; onFechar: () => void }) {
  const [estado, acao, enviando] = useActionState(async (anterior: Estado, form: FormData) => {
    const r = await salvarFormularioSeguro(anterior, form);
    if (r.ok) onFechar();
    return r;
  }, {});
  const [consentimento, setConsentimento] = useState(formulario.consentimento);
  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()} title="Formulário de email" description="Quem visitar sua página deixa o email para receber suas novidades.">
      <form action={acao} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="id" value={link.id} />
        <TextField label="Título" name="titulo" maxLength={100} defaultValue={estado.valores?.titulo ?? link.titulo} error={estado.erros?.titulo} />
        <label className="flex items-start gap-2 text-sm text-fg">
          <input
            type="checkbox"
            name="pedirNome"
            defaultChecked={estado.valores ? estado.valores.pedirNome === "on" : formulario.pedirNome}
            className="mt-0.5 size-4 accent-accent"
          />
          <span>Pedir o nome também (opcional para quem se inscreve)</span>
        </label>
        <TextArea
          label="Texto de consentimento"
          name="consentimento"
          maxLength={300}
          value={consentimento}
          onChange={(e) => setConsentimento(e.target.value)}
          hint="Diz para que o email vai ser usado. A pessoa marca que aceita, e o texto fica guardado com a inscrição."
          error={estado.erros?.consentimento}
        />
        <TextField
          label="Mensagem depois do envio"
          name="sucesso"
          maxLength={200}
          defaultValue={estado.valores?.sucesso ?? formulario.sucesso}
          error={estado.erros?.sucesso}
        />
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

function EditarLink({ link, onFechar }: { link: LinkEditor; onFechar: () => void }) {
  const [estado, acao, enviando] = useActionState(async (anterior: Estado, form: FormData) => {
    const r = await salvarLinkSeguro(anterior, form);
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
