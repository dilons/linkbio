# Componentes do linkbio

Gerado pela `/replica-design`. Tokens em `replica/design/tokens.json`
(fonte única), `src/app/tokens.css` gerado por `npm run tokens`, mapeamento para
o Tailwind em `src/app/globals.css`. Todos os componentes estão na rota
`/design`, em todos os estados; as capturas `vitrine-1440.png` e
`vitrine-390.png` são a checagem do design system.

## Origem

- **Nada foi medido do Linktree.** A rede do ambiente bloqueou `linktr.ee`, e
  não há capturas em `replica/screens/`. O sistema é nosso, montado a partir dos
  padrões da recon: coluna central com botões empilhados, editor com prévia de
  celular. Quando houver capturas, medir largura da coluna, espaçamento entre
  botões e altura do botão para a comparação de layout da `/replica-diff`, e
  ajustar só os tokens de `layout`.
- **Cor de destaque provisória** (`accent` #4338ca, um índigo neutro). A
  `/replica-brand` define a cor da marca. A cor do Linktree não entra em nenhum
  caso.
- **Fonte:** Inter (SIL OFL), servida pelo próprio app (`src/app/fonts`). Nada
  de CDN do Google, que mandaria o IP de cada visitante para os EUA.
- **Ícones:** Lucide (ISC) na interface; Simple Icons (CC0) para as redes
  sociais, usados só para indicar a plataforma.
- **Base acessível:** Radix (Switch, Dialog) e dnd-kit (lista arrastável com
  teclado e anúncios em português).

## Classes do Tailwind

| papel no token | classe | uso |
| --- | --- | --- |
| bg, surface, surface-2 | `bg-bg`, `bg-surface`, `bg-surface-2` | fundos do painel |
| border, border-input | `border-border`, `border-input` | divisórias; borda de campo (3:1) |
| text, text-muted | `text-fg`, `text-muted` | texto principal e secundário |
| accent, accent-hover, accent-soft, on-accent | `bg-accent`, `hover:bg-accent-hover`, `bg-accent-soft`, `text-on-accent` | ação principal |
| danger, on-danger, success, warning | `bg-danger`, `text-on-danger`, `text-success`, `text-warning` | estados |
| paid, paid-soft | `text-paid`, `bg-paid-soft` | selo de recurso pago |
| tema público (data-theme) | `bg-t-bg`, `text-t-text`, `text-t-muted`, `bg-t-button`, `text-t-on-button`, `border-t-button-border` | página pública e prévia |
| tipografia | `text-xs` 12/16, `text-sm` 14/20, `text-base` 16/24, `text-lg` 18/26, `text-xl` 24/32, `text-display` 32/40 | |
| raio | `rounded-sm` 6, `rounded-md` 10, `rounded-lg` 16, `rounded-pill` | |
| sombra | `shadow-card`, `shadow-pop`, `shadow-sombra` (botão público) | |

Espaçamento: base 4 (padrão do Tailwind). Layout: página pública com no máximo
600 px e margem de 16 px; painel com barra lateral de 240 px e cabeçalho de
56 px; prévia de 320 x 660 px; pontos de quebra 640, 768, 1024, 1280.

## Contraste

`contrast.py`: 42 pares, 0 falhas AA (relatório em `contrast.txt`). Os cinco
temas passam para texto, texto secundário, texto do botão e borda do botão. O
tema customizado é conferido na hora pelo `ColorField` (`src/lib/contrast.ts`,
mesma conta), e o servidor deve recusar salvar abaixo de 4,5:1.

## Painel

```
Button                                              src/components/ui/button.tsx
  variants  primary, secondary, ghost, danger
  sizes     sm 32px, md 40px, lg 48px
  states    default, hover, focus-visible (anel 2px focus), disabled, loading
  tokens    bg accent, text on-accent, radius md, font sm/600
  a11y      <button> de verdade; loading desabilita, mantém o rótulo e marca aria-busy
  used on   todas

TextField / TextArea                                src/components/ui/field.tsx
  variants  texto, email, senha, URL; com prefixo ("linkbio.com.br/"); área com contador
  states    vazio, preenchido, foco, erro, desabilitado
  tokens    border-input, text fg, placeholder muted, erro danger
  a11y      <label> ligado ao campo; dica e erro em aria-describedby; erro com role=alert; aria-invalid
  used on   S01, S03, S06, S07, S11, S18

Switch                                              src/components/ui/switch.tsx
  states    ligado, desligado, bloqueado (recurso pago, com PaidBadge)
  tokens    accent ligado, surface-2 desligado, border-input
  a11y      Radix Switch (role=switch), rótulo pode ficar só para leitor de tela
  used on   S06, S07, S12

PaidBadge / Badge                                   src/components/ui/badge.tsx
  variants  pago; neutro, info, sucesso, alerta
  tokens    paid em paid-soft; accent em accent-soft; success em surface; warning em paid-soft
  a11y      o texto diz o estado; ícone é aria-hidden
  used on   S06, S07, S08, S09, S12

LinkCard                                            src/components/ui/link-card.tsx
  states    ativo, desligado, agendado, travado (18+, sensível), arrastando
  parts     alça de arrastar, título, URL, selos, Switch, editar, excluir
  tokens    bg, border, shadow-card; arrastando: shadow-pop e anel accent; desligado: surface
  a11y      cada botão com nome ("Mover X", "Editar X", "Excluir X")
  used on   S06

SortableList                                        src/components/ui/sortable-list.tsx
  states    parada, arrastando, solta, cancelada
  a11y      mouse, toque e teclado (espaço pega, setas movem, espaço solta, Esc cancela);
            instruções e anúncios em português ("X solto na posição 2 de 4")
  used on   S06 (links e ícones sociais)

PhonePreview                                        src/components/ui/phone-preview.tsx
  tokens    borda fg 10px, raio 36px, shadow-pop, 320 x 660
  a11y      conteúdo inerte (inert), legenda em figcaption
  used on   S06, S08

ThemeCard                                           src/components/ui/theme-card.tsx
  states    normal, selecionado (anel accent, ícone), bloqueado (pago)
  a11y      botão com aria-pressed
  used on   S08

ColorField                                          src/components/ui/color-field.tsx
  states    válido, formato inválido, contraste baixo
  a11y      seletor nativo e campo hex com rótulos; aviso de contraste em aria-describedby
  used on   S08

ImageUpload                                         src/components/ui/image-upload.tsx
  variants  redonda (avatar), quadrada (miniatura, fundo)
  states    vazio, prévia, tipo inválido, tamanho excedido
  limites   JPG, PNG, WebP; avatar e miniatura 2 MB, fundo 5 MB
  a11y      input file real (oculto visualmente) com label clicável; erro com role=alert
  used on   S06, S07, S08

DateTimeTz                                          src/components/ui/datetime-tz.tsx
  states    vazio, válido, fim antes do começo (erro)
  a11y      fieldset com legend; erro ligado ao campo de fim
  used on   S07

StatTile                                            src/components/ui/stat-tile.tsx
  states    com valor, sem dados (traço), carregando (esqueleto com "Carregando" para leitor de tela)
  used on   S09

DataTable                                           src/components/ui/data-table.tsx
  states    com linhas, vazio (mensagem com próximo passo)
  a11y      caption, th com scope, rolagem horizontal no celular
  used on   S09, S10

Dialog                                              src/components/ui/dialog.tsx
  a11y      Radix Dialog: prende o foco, Esc fecha, devolve o foco; título e descrição ligados
  used on   S13 (excluir conta), S19 (QR)

Toast                                               src/components/ui/toast.tsx
  variants  sucesso, erro
  a11y      região aria-live polite; some em 4 s
  used on   todas as telas do painel
```

## Página pública

```
PublicPage                                          src/components/public/public-page.tsx
  parts     cabeçalho, redes (topo ou rodapé), links, extra (formulário), rodapé com marca (grátis)
  tokens    tema por data-theme; coluna até 600px
  a11y      <main> na página de verdade e <div> dentro da prévia; nav com nome
  used on   S15 e a prévia de S06, S08

ProfileHeader                                       src/components/public/profile-header.tsx
  states    com foto, sem foto (iniciais), sem bio
  used on   S15

PublicLinkButton                                    src/components/public/link-button.tsx
  variants  forma: quadrado, arredondado, pílula; preenchimento: cheio, contorno, sombra
  states    normal, hover (escala 1,02), foco, destaque (escala, 3 vezes), travado (cadeado)
  altura    mínimo 56px; título em até 2 linhas
  a11y      <a> para /r/[id] (conta o clique sem JavaScript); destaque só com transform,
            nunca opacidade (piscar com opacidade derrubava o contraste); respeita reduced-motion
  used on   S15

SocialRow                                           src/components/public/social-row.tsx
  a11y      cada ícone com o nome da plataforma
  used on   S15

FormBlock                                           src/components/public/form-block.tsx
  states    parado, email inválido, enviando, enviado, erro de rede
  campos    email, caixa de consentimento obrigatória (texto do criador), campo isca "site"
  a11y      label do email só para leitor de tela; erro com role=alert; sucesso com role=status
  lgpd      o texto de consentimento é gravado com a inscrição
  used on   S15, S17

GateScreen                                          src/components/public/gate-screen.tsx
  variants  sensível, 18, 21, 25
  states    aviso, data de nascimento, idade insuficiente
  lgpd      a data de nascimento não é gravada nem enviada; só libera ou não
  a11y      section com título ligado; recusa com role=alert
  used on   S16
```

## Fica para depois

- QR code (S19): escolher a biblioteca na `/replica-build`.
- Gráfico dos insights (S09): começar com os números e o ranking; gráfico de
  linha depois, seguindo a skill de visualização de dados.
- Medidas do original, quando houver capturas (ver "Origem").
