"use client";

import { useState, type ReactNode } from "react";
import { FormBlock } from "@/components/public/form-block";
import { GateScreen } from "@/components/public/gate-screen";
import { PublicLinkButton, type Forma, type Preenchimento } from "@/components/public/link-button";
import { PublicPage } from "@/components/public/public-page";
import { Badge, PaidBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColorField } from "@/components/ui/color-field";
import { DataTable } from "@/components/ui/data-table";
import { DateTimeTz } from "@/components/ui/datetime-tz";
import { Dialog } from "@/components/ui/dialog";
import { TextArea, TextField } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import { LinkCard, type LinkResumo } from "@/components/ui/link-card";
import { PhonePreview } from "@/components/ui/phone-preview";
import { SortableList } from "@/components/ui/sortable-list";
import { StatTile } from "@/components/ui/stat-tile";
import { Switch } from "@/components/ui/switch";
import { ThemeCard } from "@/components/ui/theme-card";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { MARCA } from "@/lib/marca";

const CORES = [
  "bg", "surface", "surface-2", "border", "border-input", "text", "text-muted", "accent",
  "accent-hover", "accent-soft", "on-accent", "danger", "success", "warning", "paid", "paid-soft",
];
const TEMAS = [
  ["papel", "Papel"],
  ["noite", "Noite"],
  ["areia", "Areia"],
  ["oceano", "Oceano"],
  ["contraste", "Contraste"],
] as const;
const REDES = [
  { plataforma: "instagram", url: "https://instagram.com/exemplo" },
  { plataforma: "tiktok", url: "https://tiktok.com/@exemplo" },
  { plataforma: "youtube", url: "https://youtube.com/@exemplo" },
  { plataforma: "whatsapp", url: "https://wa.me/5500000000000" },
];
const LINKS_PUBLICOS = [
  { id: "1", titulo: "Agende um horário" },
  { id: "2", titulo: "Cardápio da semana", destaque: true },
  { id: "3", titulo: "Loja online" },
  { id: "4", titulo: "Conteúdo para maiores", travado: true },
];

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border py-8">
      <h2 className="text-xl font-bold text-fg">{titulo}</h2>
      {children}
    </section>
  );
}

function Rotulo({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold tracking-wide text-muted uppercase">{children}</p>;
}

function Conteudo() {
  const toast = useToast();
  const [links, setLinks] = useState<LinkResumo[]>([
    { id: "a", titulo: "Agende um horário", url: "https://exemplo.com.br/agenda", ativo: true },
    { id: "b", titulo: "Cardápio da semana", url: "https://exemplo.com.br/cardapio", ativo: true, agendado: "até 31/10, 23:59" },
    { id: "c", titulo: "Promoção antiga", url: "https://exemplo.com.br/promo", ativo: false },
    { id: "d", titulo: "Conteúdo para maiores", url: "https://exemplo.com.br/adulto", ativo: true, travado: "18+" },
  ]);
  const [ligado, setLigado] = useState(true);
  const [tema, setTema] = useState("papel");
  const [corTexto, setCorTexto] = useState("#9aa0a6");
  const [bio, setBio] = useState("Confeitaria artesanal em Belo Horizonte. Encomendas pelo link abaixo.");
  const [agenda, setAgenda] = useState({ inicio: "2026-10-20T09:00", fim: "2026-10-19T18:00", fuso: "America/Sao_Paulo" });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <header className="flex flex-col gap-2 pb-6">
        <h1 className="text-display font-bold text-fg">Design system</h1>
        <p className="text-base text-muted">
          Todos os componentes do {MARCA.nome} em todos os estados, antes de qualquer tela. Tokens em{" "}
          <code className="font-mono text-sm">replica/design/tokens.json</code>.
        </p>
      </header>

      <Secao titulo="Cores">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {CORES.map((c) => (
            <div key={c} className="flex flex-col gap-1">
              <span className="h-12 rounded-md border border-border" style={{ background: `var(--${c})` }} />
              <span className="font-mono text-xs text-muted">{c}</span>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Tipografia">
        <p className="text-display font-bold text-fg">display 32/40</p>
        <p className="text-xl font-bold text-fg">xl 24/32</p>
        <p className="text-lg font-semibold text-fg">lg 18/26</p>
        <p className="text-base text-fg">base 16/24: o texto do dia a dia, com acentuação: ação, maçã, você.</p>
        <p className="text-sm text-muted">sm 14/20, texto secundário</p>
        <p className="text-xs font-medium text-muted">xs 12/16, legendas</p>
      </Secao>

      <Secao titulo="Botões">
        {(["primary", "secondary", "ghost", "danger"] as const).map((v) => (
          <div key={v} className="flex flex-wrap items-center gap-3">
            <Rotulo>{v}</Rotulo>
            <Button variant={v} size="sm">Pequeno</Button>
            <Button variant={v}>Médio</Button>
            <Button variant={v} size="lg">Grande</Button>
            <Button variant={v} disabled>Desabilitado</Button>
            <Button variant={v} loading>Salvando</Button>
          </div>
        ))}
      </Secao>

      <Secao titulo="Campos">
        <div className="grid gap-6 md:grid-cols-2">
          <TextField label="Seu endereço" prefix={`${MARCA.dominio}/`} defaultValue="doces.da.ana" hint="Letras, números, ponto e sublinhado." />
          <TextField label="Seu endereço" prefix={`${MARCA.dominio}/`} defaultValue="admin" error="Esse endereço é reservado. Tente outro." />
          <TextArea label="Bio" maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} />
          <TextField label="Desabilitado" defaultValue="não dá para editar" disabled />
          <ColorField label="Cor do texto (contraste baixo)" value={corTexto} onChange={setCorTexto} contraFundo="#fafafa" />
          <ColorField label="Cor do texto (ok)" value="#1c1c1f" onChange={() => {}} contraFundo="#fafafa" />
        </div>
      </Secao>

      <Secao titulo="Liga e desliga, selos">
        <div className="flex flex-wrap items-center gap-6">
          <Switch label="Mostrar na página" checked={ligado} onCheckedChange={setLigado} />
          <Switch label="Desligado" checked={false} onCheckedChange={() => {}} />
          <Switch label="Destacar link" checked={false} onCheckedChange={() => {}} locked />
          <PaidBadge />
          <Badge>Desligado</Badge>
          <Badge tom="info">Agendado</Badge>
          <Badge tom="alerta">18+</Badge>
        </div>
      </Secao>

      <Secao titulo="Lista de links (arraste ou use o teclado)">
        <div className="max-w-xl">
          <SortableList
            itens={links}
            onReorder={(novos) => {
              setLinks(novos);
              toast("Ordem salva");
            }}
            render={(link, alca, arrastando) => (
              <LinkCard
                link={link}
                alca={alca}
                arrastando={arrastando}
                onToggle={(ativo) => setLinks((ls) => ls.map((l) => (l.id === link.id ? { ...l, ativo } : l)))}
                onEditar={() => toast(`Editar ${link.titulo}`)}
                onExcluir={() => toast("Link excluído", "erro")}
              />
            )}
          />
        </div>
      </Secao>

      <Secao titulo="Agendamento, imagem">
        <DateTimeTz {...agenda} onChange={setAgenda} />
        <div className="flex flex-wrap gap-8">
          <ImageUpload label="Trocar foto" maxMB={2} redonda onArquivo={() => toast("Foto pronta para enviar")} />
          <ImageUpload label="Miniatura do link" maxMB={2} onArquivo={() => {}} />
        </div>
      </Secao>

      <Secao titulo="Temas">
        <div className="flex flex-wrap gap-2">
          {TEMAS.map(([t, nome]) => (
            <ThemeCard key={t} tema={t} nome={nome} selecionado={tema === t} bloqueado={t === "contraste"} onSelecionar={() => setTema(t)} />
          ))}
        </div>
      </Secao>

      <Secao titulo="Insights e audiência">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Visitas" value="1.284" detalhe="últimos 7 dias" />
          <StatTile label="Cliques" value="562" detalhe="taxa de 43,8%" />
          <StatTile label="Inscritos" value={null} detalhe="ainda sem dados" />
          <StatTile label="Visitantes únicos" carregando />
        </div>
        <DataTable
          legenda="Inscritos"
          colunas={[
            { chave: "email", titulo: "Email" },
            { chave: "data", titulo: "Data", alinhar: "direita" },
          ]}
          linhas={[
            { email: "cliente1@exemplo.com", data: "10/10/2026" },
            { email: "cliente2@exemplo.com", data: "09/10/2026" },
          ]}
          vazio="Ninguém se inscreveu ainda."
        />
        <DataTable legenda="Inscritos" colunas={[{ chave: "email", titulo: "Email" }]} linhas={[]} vazio="Ninguém se inscreveu ainda. Adicione um formulário na sua página." />
      </Secao>

      <Secao titulo="Modal e aviso">
        <div className="flex gap-3">
          <Dialog
            trigger={<Button variant="danger">Excluir conta</Button>}
            title="Excluir a conta?"
            description="Sua página sai do ar na hora e o endereço fica bloqueado por 14 dias. Não dá para desfazer."
          >
            <div className="flex justify-end gap-2">
              <Button variant="secondary">Cancelar</Button>
              <Button variant="danger">Excluir para sempre</Button>
            </div>
          </Dialog>
          <Button variant="secondary" onClick={() => toast("Link salvo")}>
            Mostrar aviso
          </Button>
        </div>
      </Secao>

      <Secao titulo="Botões da página pública">
        <div data-theme="papel" className="grid gap-3 rounded-lg bg-t-bg p-6 md:grid-cols-3">
          {(["quadrado", "arredondado", "pilula"] as Forma[]).flatMap((f) =>
            (["cheio", "contorno", "sombra"] as Preenchimento[]).map((p) => (
              <PublicLinkButton key={`${f}-${p}`} id="x" titulo={`${f}, ${p}`} forma={f} preenchimento={p} />
            )),
          )}
        </div>
      </Secao>

      <Secao titulo="Página pública nos cinco temas">
        <div className="flex flex-wrap justify-center gap-6">
          {TEMAS.map(([t, nome]) => (
            <PhonePreview key={t} rotulo={nome}>
              <PublicPage
                tema={t}
                principal={false}
                titulo="Doces da Ana"
                bio="Confeitaria artesanal em BH. Encomendas pelo link."
                redes={REDES}
                links={LINKS_PUBLICOS}
                extra={<FormBlock titulo="Receba as novidades" consentimento="Aceito receber emails da Doces da Ana. Posso sair quando quiser." />}
              />
            </PhonePreview>
          ))}
        </div>
      </Secao>

      <Secao titulo="Formulário e aviso de conteúdo">
        <div data-theme="papel" className="grid gap-6 rounded-lg bg-t-bg p-6 md:grid-cols-3">
          <FormBlock titulo="Receba as novidades" consentimento="Aceito receber emails. Posso sair quando quiser." estadoInicial="erro" />
          <FormBlock titulo="Receba as novidades" consentimento="x" estadoInicial="enviado" />
          <GateScreen rotulo="18" onLiberar={() => toast("Liberado")} />
        </div>
        <div data-theme="noite" className="rounded-lg bg-t-bg">
          <GateScreen rotulo="sensivel" onLiberar={() => toast("Liberado")} />
        </div>
      </Secao>
    </main>
  );
}

export function Vitrine() {
  return (
    <ToastProvider>
      <Conteudo />
    </ToastProvider>
  );
}
