"use client";

import { Check, Copy, Eye, ExternalLink, GripVertical, Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useId, useState } from "react";
import {
  apagarLink,
  ligarDesligarLink,
  lugarDasRedes,
  mudarOrdem,
  novoFormulario,
  novoLink,
  ordemDasRedes,
  salvarCabecalho,
  salvarFormulario,
  salvarFoto,
  salvarLink,
  salvarRedeSocial,
  tirarRede,
  type Estado,
} from "@/app/acoes";
import { PublicPage } from "@/components/public/public-page";
import { IconeDaRede, type Rede } from "@/components/public/social-row";
import { Button } from "@/components/ui/button";
import { DateTimeTz } from "@/components/ui/datetime-tz";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextArea, TextField } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import { LinkCard } from "@/components/ui/link-card";
import { PhonePreview } from "@/components/ui/phone-preview";
import { SortableList } from "@/components/ui/sortable-list";
import { useToast } from "@/components/ui/toast";
import { Travado } from "@/components/ui/travado";
import { SEM_CONEXAO, semQuebrar, tentar } from "@/lib/acao-segura";
import { cn } from "@/lib/cn";
import { FUSO_PADRAO } from "@/lib/fuso";
import { REDES, type Plataforma } from "@/lib/plataformas";
import { MARCA } from "@/lib/marca";

export type ConfigFormulario = { pedirNome: boolean; consentimento: string; sucesso: string };
export type Trava = "none" | "sensitive" | "18" | "21" | "25";
export type Agenda = { inicio: string; fim: string; fuso: string };
export type LinkEditor = {
  id: string;
  titulo: string;
  url: string;
  ativo: boolean;
  trava?: Trava;
  /** a janela no fuso em que foi agendada (vazio: sem agendamento) */
  agenda?: Agenda;
  /** texto do selo: "Aparece 20/10 às 18:00", "Encerrado"... */
  agendado?: string;
  /** dentro da janela agora (a prévia mostra só esses, como a página) */
  noAr?: boolean;
  formulario: ConfigFormulario | null;
};

const TRAVAS: ReadonlyArray<readonly [Trava, string]> = [
  ["none", "Sem aviso"],
  ["sensitive", "Conteúdo sensível"],
  ["18", "Maiores de 18 anos"],
  ["21", "Maiores de 21 anos"],
  ["25", "Maiores de 25 anos"],
];
const seloDaTrava = (t?: Trava) => (!t || t === "none" ? undefined : t === "sensitive" ? "Aviso" : `Aviso ${t}+`);

const novoLinkSeguro = semQuebrar(novoLink);
const salvarLinkSeguro = semQuebrar(salvarLink);
const salvarCabecalhoSeguro = semQuebrar(salvarCabecalho);
const salvarFormularioSeguro = semQuebrar(salvarFormulario);
const salvarRedeSeguro = semQuebrar(salvarRedeSocial);

type Props = {
  username: string;
  titulo: string;
  bio: string;
  avatarUrl?: string;
  tema: string;
  redes: Rede[];
  redesNoTopo: boolean;
  links: LinkEditor[];
};

/** S06: o editor. A prévia mostra o estado local, então reage na hora. */
export function Editor(props: Props) {
  const toast = useToast();
  const [itens, setItens] = useState(props.links);
  const [redes, setRedes] = useState(props.redes);
  const [redesNoTopo, setRedesNoTopo] = useState(props.redesNoTopo);
  const [previaAberta, setPreviaAberta] = useState(false);
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

  const previa = (
    <PublicPage
      principal={false}
      tema={props.tema}
      titulo={props.titulo || props.username}
      bio={props.bio}
      avatarUrl={props.avatarUrl}
      redes={redes}
      redesNoTopo={redesNoTopo}
      links={itens
        .filter((l) => l.ativo && l.noAr !== false)
        .map((l) => ({ id: l.id, titulo: l.titulo, travado: !!seloDaTrava(l.trava), formulario: l.formulario }))}
    />
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex min-w-0 flex-col gap-6">
        <Endereco username={props.username} onPrevia={() => setPreviaAberta(true)} />
        <Cabecalho titulo={props.titulo} bio={props.bio} avatarUrl={props.avatarUrl} />
        <Redes redes={redes} setRedes={setRedes} noTopo={redesNoTopo} setNoTopo={setRedesNoTopo} />
        <NovoLink />
        <section aria-labelledby="titulo-links" className="flex flex-col gap-3">
          <h2 id="titulo-links" className="text-lg font-semibold text-fg">
            Na sua página
          </h2>
          {itens.length === 0 ? (
            <p className="rounded-lg border border-dashed border-input bg-bg p-6 text-center text-sm text-muted">
              Nada por aqui ainda. Comece pelo link que mais importa, como seu WhatsApp ou sua loja: ele fica no topo.
            </p>
          ) : (
            <SortableList
              itens={itens}
              onReorder={reordenar}
              render={(link, alca, arrastando) => (
                <LinkCard
                  link={{
                    ...link,
                    url: link.formulario ? undefined : link.url,
                    selo: link.formulario ? "Formulário de email" : undefined,
                    travado: seloDaTrava(link.trava),
                    agendado: link.agendado,
                  }}
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
          <PhonePreview>{previa}</PhonePreview>
        </div>
      </aside>

      {/* No celular a prévia abre em tela cheia (no computador ela fica ao lado). */}
      <Dialog
        cheia
        open={previaAberta}
        onOpenChange={setPreviaAberta}
        title="Prévia da sua página"
        description="Assim fica para quem visita. Aqui os links não abrem."
      >
        <div inert className="flex min-h-full flex-col">
          {previa}
        </div>
      </Dialog>

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

function Endereco({ username, onPrevia }: { username: string; onPrevia: () => void }) {
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
        <p className="truncate text-base font-semibold text-fg">{MARCA.dominio}{caminho}</p>
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
        <Button variant="secondary" size="sm" className="lg:hidden" onClick={onPrevia}>
          <Eye aria-hidden className="size-4" />
          Prévia
        </Button>
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
          <Travado enviando={enviando} estado={estado}>
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
          </Travado>
        </form>
      </Dialog>
    </section>
  );
}

const nomeDaRede = (p: string) => REDES.find((r) => r.id === p)?.nome ?? p;

/** S06: a fileira de ícones das redes: quais, em que ordem e onde aparecem na página. */
function Redes({
  redes,
  setRedes,
  noTopo,
  setNoTopo,
}: {
  redes: Rede[];
  setRedes: (r: Rede[]) => void;
  noTopo: boolean;
  setNoTopo: (v: boolean) => void;
}) {
  const toast = useToast();
  const [editando, setEditando] = useState<{ plataforma?: Plataforma; url?: string } | null>(null);
  const [tirando, setTirando] = useState<Rede | null>(null);
  const livres = REDES.filter((r) => !redes.some((x) => x.plataforma === r.id));

  // As três mudam a tela na hora (otimista) e voltam atrás se o servidor não confirmar.
  async function reordenar(novas: Rede[]) {
    const antes = redes;
    setRedes(novas.map(({ plataforma, url }) => ({ plataforma, url })));
    const ok = await tentar(() => ordemDasRedes(novas.map((r) => r.plataforma)), null);
    if (ok) return toast("Ordem salva");
    setRedes(antes);
    toast(ok === null ? SEM_CONEXAO : "Não deu para salvar a ordem.", "erro");
  }

  async function tirar() {
    if (!tirando) return;
    const alvo = tirando;
    const antes = redes;
    setTirando(null);
    setRedes(redes.filter((r) => r.plataforma !== alvo.plataforma));
    const ok = await tentar(() => tirarRede(alvo.plataforma), null);
    if (ok) return toast(`${nomeDaRede(alvo.plataforma)} saiu da página`);
    setRedes(antes);
    toast(ok === null ? SEM_CONEXAO : "Não deu para tirar.", "erro");
  }

  async function mudarLugar(topo: boolean) {
    setNoTopo(topo);
    const ok = await tentar(() => lugarDasRedes(topo ? "top" : "bottom"), null);
    if (ok) return toast(topo ? "Ícones no topo" : "Ícones no rodapé");
    setNoTopo(!topo);
    toast(ok === null ? SEM_CONEXAO : "Não deu para salvar.", "erro");
  }

  return (
    <section aria-labelledby="titulo-redes" className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-redes" className="text-lg font-semibold text-fg">
          Redes sociais
        </h2>
        {livres.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => setEditando({})}>
            <Plus aria-hidden className="size-4" />
            Adicionar rede
          </Button>
        )}
      </div>
      {redes.length === 0 ? (
        <p className="text-sm text-muted">Ponha os ícones do seu Instagram, WhatsApp e outras redes. Quem visita chega nelas com um toque.</p>
      ) : (
        <>
          <SortableList
            itens={redes.map((r) => ({ ...r, id: r.plataforma, titulo: nomeDaRede(r.plataforma) }))}
            onReorder={reordenar}
            render={(r, alca, arrastando) => (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-md border border-border bg-bg p-2",
                  arrastando && "shadow-pop ring-2 ring-accent",
                )}
              >
                <button
                  type="button"
                  aria-label={`Mover ${r.titulo}`}
                  className="cursor-grab touch-none rounded-sm p-1 text-muted hover:bg-surface active:cursor-grabbing"
                  {...alca}
                >
                  <GripVertical aria-hidden className="size-5" />
                </button>
                <IconeDaRede plataforma={r.plataforma} className="size-5 shrink-0 text-fg" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fg">{r.titulo}</p>
                  <p className="truncate text-xs text-muted">{r.url}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Editar ${r.titulo}`}
                  onClick={() => setEditando({ plataforma: r.plataforma as Plataforma, url: r.url })}
                  className="rounded-sm p-2 text-muted hover:bg-surface"
                >
                  <Pencil aria-hidden className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Tirar ${r.titulo}`}
                  onClick={() => setTirando(r)}
                  className="rounded-sm p-2 text-danger hover:bg-surface"
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </div>
            )}
          />
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-fg">Onde os ícones aparecem</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {(
                [
                  [true, "No topo, abaixo da bio"],
                  [false, "No rodapé"],
                ] as const
              ).map(([topo, rotulo]) => (
                <label key={rotulo} className="flex items-center gap-2 text-sm text-fg">
                  <input
                    type="radio"
                    name="lugar-das-redes"
                    checked={noTopo === topo}
                    onChange={() => mudarLugar(topo)}
                    className="size-4 accent-accent"
                  />
                  {rotulo}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {editando && <EditarRede inicial={editando} livres={livres.map((r) => r.id)} onFechar={() => setEditando(null)} />}
      <Dialog
        open={tirando !== null}
        onOpenChange={(v) => !v && setTirando(null)}
        title="Tirar esta rede?"
        description={tirando ? `O ícone do ${nomeDaRede(tirando.plataforma)} sai da sua página.` : undefined}
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setTirando(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={tirar}>
            Tirar
          </Button>
        </div>
      </Dialog>
    </section>
  );
}

/** Escolhe a rede (ao adicionar) e o @, número ou endereço. O servidor monta o endereço final. */
function EditarRede({
  inicial,
  livres,
  onFechar,
}: {
  inicial: { plataforma?: Plataforma; url?: string };
  livres: Plataforma[];
  onFechar: () => void;
}) {
  const toast = useToast();
  const idRede = useId();
  const [estado, acao, enviando] = useActionState(async (anterior: Estado, form: FormData) => {
    const r = await salvarRedeSeguro(anterior, form);
    if (r.ok) {
      toast("Rede salva");
      onFechar();
    }
    return r;
  }, {});
  const [plataforma, setPlataforma] = useState<Plataforma>(inicial.plataforma ?? livres[0]);
  const rede = REDES.find((r) => r.id === plataforma)!;
  const trocando = inicial.plataforma !== undefined;
  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()} title={trocando ? `Editar ${rede.nome}` : "Adicionar rede"}>
      <form action={acao} className="flex flex-col gap-4" noValidate>
        <Travado enviando={enviando} estado={estado}>
          {trocando ? (
            <input type="hidden" name="plataforma" value={plataforma} />
          ) : (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={idRede} className="text-sm font-medium text-fg">
                Rede
              </label>
              <select
                id={idRede}
                name="plataforma"
                value={plataforma}
                onChange={(e) => setPlataforma(e.target.value as Plataforma)}
                className="h-11 rounded-md border border-input bg-bg px-3 text-base text-fg"
              >
                {livres.map((id) => (
                  <option key={id} value={id}>
                    {nomeDaRede(id)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <TextField
            key={plataforma}
            label={rede.rotulo}
            name="endereco"
            placeholder={rede.exemplo}
            autoComplete="off"
            inputMode={plataforma === "whatsapp" ? "tel" : undefined}
            defaultValue={estado.valores?.plataforma === plataforma ? estado.valores.endereco : inicial.url}
            error={estado.valores?.plataforma === plataforma ? estado.erros?.endereco : undefined}
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
        </Travado>
      </form>
    </Dialog>
  );
}

function NovoLink() {
  const toast = useToast();
  const [estado, acao, enviando] = useActionState(async (anterior: Estado, form: FormData) => {
    const r = await novoLinkSeguro(anterior, form);
    if (r.ok) toast("Pronto, o link está na página");
    else if (r.erro) toast(r.erro, "erro");
    // sem rede, o que foi digitado volta para os campos
    return r.erro && !r.valores ? { ...r, valores: { titulo: String(form.get("titulo") ?? ""), url: String(form.get("url") ?? "") } } : r;
  }, {});
  return (
    <form action={acao} className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 shadow-card" noValidate>
      <Travado enviando={enviando} estado={estado}>
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
      </Travado>
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
        <Travado enviando={enviando} estado={estado}>
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
        </Travado>
      </form>
    </Dialog>
  );
}

function EditarLink({ link, onFechar }: { link: LinkEditor; onFechar: () => void }) {
  const [agenda, setAgenda] = useState<Agenda>(link.agenda ?? { inicio: "", fim: "", fuso: FUSO_PADRAO });
  const [estado, acao, enviando] = useActionState(async (anterior: Estado, form: FormData) => {
    const r = await salvarLinkSeguro(anterior, form);
    if (r.ok) onFechar();
    return r;
  }, {});
  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()} title="Editar link">
      <form action={acao} className="flex flex-col gap-4" noValidate>
        <Travado enviando={enviando} estado={estado}>
          <input type="hidden" name="id" value={link.id} />
          <input type="hidden" name="inicio" value={agenda.inicio} />
          <input type="hidden" name="fim" value={agenda.fim} />
          <input type="hidden" name="fuso" value={agenda.fuso} />
          <TextField label="Título" name="titulo" defaultValue={estado.valores?.titulo ?? link.titulo} error={estado.erros?.titulo} />
          <TextField label="Endereço" name="url" inputMode="url" defaultValue={estado.valores?.url ?? link.url} error={estado.erros?.url} />
          <SelectField
            label="Aviso antes de abrir"
            name="trava"
            opcoes={TRAVAS}
            defaultValue={estado.valores?.trava ?? link.trava ?? "none"}
            hint="Com idade mínima, quem clica informa a data de nascimento antes de ir ao link."
          />
          <div className="flex flex-col gap-2">
            <DateTimeTz inicio={agenda.inicio} fim={agenda.fim} fuso={agenda.fuso} onChange={setAgenda} />
            <p className="text-xs text-muted">Deixe em branco para o link ficar sempre na página. Fora da janela, ele some sozinho.</p>
            {(agenda.inicio || agenda.fim) && (
              <div>
                <Button size="sm" variant="ghost" onClick={() => setAgenda((a) => ({ ...a, inicio: "", fim: "" }))}>
                  Tirar o agendamento
                </Button>
              </div>
            )}
            {estado.erros?.agenda && (
              <p role="alert" className="text-sm font-medium text-danger">
                {estado.erros.agenda}
              </p>
            )}
          </div>
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
        </Travado>
      </form>
    </Dialog>
  );
}
