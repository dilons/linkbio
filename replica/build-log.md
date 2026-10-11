# Build log

Uma linha por tela. Estado: **feito**, **parcial** (funciona, falta parte),
**stub** (rota e moldura, sem a função) ou **não começou**.

Etapa 1 da `architecture.md`, a fatia vertical: cadastro → endereço → link →
página pública → clique contado → insights. Testada de ponta a ponta por
`tests/e2e/fatia.mjs` (hoje dividido por fluxo em `e2e/`, ver `test-plan.md`; 38 checagens na etapa 1, 40 depois do backend, a 1440 e 390 px, a de 390 só com teclado;
axe 0 violações em 17 telas; console sem erros). Capturas em
`replica/clone-screens/`.

| tela | data | estado | o que falta | o que deu mais trabalho |
| --- | --- | --- | --- | --- |
| S01 cadastro | 2026-10-11 | parcial | login com Google (pronto, falta o app OAuth do dono para testar) | o React 19 limpa o formulário depois de cada envio: as ações devolvem o que foi digitado para os campos voltarem no erro |
| S02 confirmar email | 2026-10-11 | feito (backend) | | o link usa token_hash, não o código PKCE, para abrir em outro aparelho |
| S03 endereço | 2026-10-11 | feito | | o Postgres recusa o mesmo `$2` numa coluna `citext` e numa `text` no mesmo insert; o teste pegou |
| S04 modelo por categoria | 2026-10-11 | stub | tudo (should-have, etapa 6) | |
| S05 plano no onboarding | 2026-10-11 | stub | tudo (etapa 5) | |
| S06 editor de links | 2026-10-11 | feito | coleções (could-have) | o editor guarda o estado local para a prévia reagir na hora e remonta quando o servidor muda (chave pelos dados); reordenar pelo teclado anuncia em português. Redes: o endereço tem que ser do domínio da rede, senão um ícone do Instagram levaria a qualquer site. Prévia no celular em tela cheia: o Dialog do Radix só devolvia o foco a quem abriu quando havia `trigger` |
| S07 editar link | 2026-10-11 | parcial | miniatura, destaque | 2026-10-11 (WSL): ganhou o aviso antes de abrir (sensível ou idade) e o agendamento com fuso, com selos no cartão. O fuso precisou de coluna própria (`schedule_tz`, migração nova): sem ela, quem agendou no fuso do Amazonas reabria vendo o horário de Brasília. Conversão só com `Intl`, testada com o horário de verão de Lisboa. Agendar ficou grátis (correção 2 do `fixes.md`) |
| S08 aparência | 2026-10-11 | parcial | tema customizado e fundo com imagem (should, etapa 6) | pouco: os 5 temas já estavam nos tokens desde a /replica-design, com contraste conferido |
| S09 insights | 2026-10-11 | feito | | o Chromium headless se apresenta como "HeadlessChrome" e o isbot (certo) não conta; o teste usa um user-agent comum. Terceira rodada: período (7, 28, 90 dias e 12 meses, todos grátis), únicos por dia, série em colunas (por dia, semana ou mês, para a coluna não sumir a 390 px), origens, aparelhos, país e cidade. Cada dia vem de um lugar só: soma diária para os que o job fechou, eventos para os outros (hoje, ou um dia em que o job falhou); o teste do backend confere que nada conta duas vezes. O gráfico seguiu a skill de dataviz (uma série, sem legenda, cor validada, tabela equivalente) |
| S10 audiência | 2026-10-11 | feito | | CSV que abre certo no Excel em português: BOM, ponto e vírgula, horário de Brasília e fórmulas neutralizadas (`=`, `+`, `-`, `@` no começo) |
| S11 editor do formulário | 2026-10-11 | feito | campo de telefone | o bloco entrou na lista dos links (`kind = 'form'`): ordenar, ligar e excluir vieram de graça, mas toda consulta de link passou a dizer quais tipos aceita |
| S12 configurações | 2026-10-11 | feito | | QR code (S19) e aviso da página toda; os campos travam enquanto salva (BUG-010) |
| S13 conta | 2026-10-11 | parcial | baixar os dados (LGPD) | sair de todos os aparelhos só valeu na hora com getUser no proxy. Excluir só a página: o endereço fica guardado 14 dias e só a mesma conta retoma (a linha vazia sai na mesma transação). Troca de endereço (2026-10-11, WSL): o antigo vira uma linha já excluída da conta, como na exclusão, com `moved_to` para o redirecionamento de 14 dias; a checagem dentro da transação usa a mesma conexão (pedir outra ao pool com uma presa pode travar o pool). |
| S14 assinatura | 2026-10-11 | parcial (backend) | validar no sandbox real do Asaas | o sandbox está bloqueado pela rede daqui: testado contra um Asaas falso que segue a documentação |
| S15 página pública | 2026-10-11 | parcial | cache da página | o 404: com streaming o status sai no primeiro pedaço. Robôs de prévia (WhatsApp, Facebook) recebem 404 de verdade; navegadores recebem a página de 404 com `noindex` |
| S16 aviso de conteúdo sensível | 2026-10-11 | feito | | o `GateScreen` era um componente do navegador que só escondia: virou formulário no servidor, para os links não irem no HTML antes da resposta. Sem JavaScript nenhum, o conteúdo em streaming do Suspense não aparece (vale para a página pública toda); sem o JS do app, o aviso funciona. O `/r/` precisou conferir os dois avisos antes de contar o clique |
| S17 inscrição enviada | 2026-10-11 | feito | | o React 19 revela o conteúdo do streaming uns 300 ms depois do load, e antes de hidratar o navegador mandaria o formulário sozinho, com o email na URL: o form é POST e o botão só liga depois da hidratação |
| S18 entrar | 2026-10-11 | parcial | Google (pronto, falta testar) | o limite de login por email barrou os próprios testes repetidos: os testes zeram a tabela de limites |
| S19 QR code | 2026-10-11 | feito | QR com cor e logo (could-have, pago no original) | virou seção da S12, não um modal. Para o insight saber que veio do QR, a coluna `source` dos eventos ganhou `qr` (migração) e o `?origem=qr` sai da barra depois de contar. O teste decodifica o PNG baixado (jsqr) para conferir o endereço |

Placar depois da /replica-backend: 2 feitas, 8 parciais, 5 stubs, 4 por
começar, de 19. Must-haves: 11 sim e 4 parciais de 18.

Placar depois da segunda /replica-build: 6 feitas, 8 parciais, 3 stubs, 2 por
começar, de 19. Must-haves: 17 de 18 (falta validar a cobrança no sandbox do
Asaas, que depende da conta do dono).

## Maior do que parecia

- **Banco dentro do processo + Cache Components.** O PGlite responde sem I/O
  de rede, então o Next 16 achou que as consultas cabiam na pré-renderização e
  quebrou no relógio que o Postgres usa (`Date.now()` "while prerendering", em
  `/admin`, `/admin/insights` e `/[username]`). A correção documentada para
  drivers síncronos é `await connection()` antes da consulta; está em `db()`.
  Quando a `/replica-backend` trocar pelo Supabase, manter o `connection()` ou
  passar a página pública para `"use cache"` com tag por username.
- **Status 404 com streaming.** Ver S15. Se o 404 real para navegadores
  importar (SEO), a saída é checar o username no `proxy.ts` antes de renderizar.

## Depois da /replica-backend (2026-10-11)

O provisório saiu: Supabase (Postgres, Auth, Storage) no lugar do PGlite e do
login com scrypt, sem mudar nenhuma tela. Detalhes, decisões e o que falta
validar com as contas do dono em `replica/backend.md`.

- O `connection()` ficou em `db()` e entrou também no cliente do Supabase Auth,
  que lê o relógio ao abrir a sessão (o mesmo erro de pré-renderização do
  PGlite apareceu em `/admin/plano`).
- Com o banco na rede, os metadados da página pública passaram a sair antes do
  corpo e o 404 dos robôs de prévia voltou a ser 200. O `notFound()` agora roda
  já no `generateMetadata`.
- O teste de ponta a ponta da fatia ganhou a confirmação por email (lida no
  Mailpit) e deixou de esperar "rede ociosa" nos insights: os pré-carregamentos
  do menu em voo seguravam a espera.

## Depois da /replica-diff (2026-10-11)

As lacunas da `parity.md`, na ordem: temas (S08, `db83033`), formulário de
email (S11, S15, S17, `9677e3b`), audiência e CSV (S10, `e27e8f4`), redes
sociais e prévia no celular (S06, `17eae68`) e excluir só a página (S13,
`ecb2243`). Paridade de 48,9 para 64,2.

- **O formulário antes de hidratar.** O teste de teclado falhou porque o
  campo ainda estava escondido: o React 19 junta as revelações do streaming e
  mostra o conteúdo um pouco depois do `load`. Olhando isso apareceu um risco
  de verdade: antes do JavaScript carregar, enviar o formulário fazia um GET e
  punha o email na URL (logs, histórico, referer). Agora o formulário é POST e
  o botão só liga depois da hidratação.
- **Seletores que ficaram ambíguos.** O botão "Adicionar formulário de email"
  fez o `getByRole("button", { name: "Adicionar" })` dos testes de F01 e F02
  achar dois botões. O commit do formulário entrou sem rodar esses arquivos;
  a suíte inteira pegou, e os seletores ficaram exatos.
- **`server-only` nos testes do backend.** `lib/data/conta.ts` usa o cliente
  admin do Supabase, que só carrega no servidor do Next. Os testes do backend
  simulam a exclusão com `apagar_perfil` no SQL, e a exclusão completa fica no
  ponta a ponta (F10-H2, F10-E4).

## Ferramentas

- `npm audit --omit=dev`: 0 vulnerabilidades. As 5 "high" do `npm audit` são
  só de desenvolvimento, pela cadeia `eslint-config-next` → `micromatch`.

## Terceira /replica-build (2026-10-11, no WSL)

As capturas de `replica/clone-screens/` passaram a ser feitas no WSL: o
desenho é o mesmo, a fonte sai rasterizada um pouco diferente da nuvem
(layout 95 a 98 contra as antigas).

- **S16 aviso de conteúdo e trava de idade** (F11, S12, S07). Ver a linha da
  S16. Decisão: cookie de sessão, estritamente funcional, só "ok" ou
  "negado" por alvo; a data de nascimento não é gravada (LGPD e ECA
  Digital, para a `/replica-lgpd`).
- **F08 agendar com fuso** (S07). Ver a linha da S07. Os campos do diálogo
  travam enquanto salva (BUG-010).
- **S13 trocar o endereço.** Ver a linha da S13. O teste da reserva de 14
  dias mostrou o BUG-012 (erro antigo na frente da checagem nova), corrigido
  também na S03.
- **S19 QR code**, na S12. Ver a linha da S19. Dependências novas:
  `qrcode` (MIT) no app; `jsqr` e `pngjs` só nos testes.
- **S09 insights.** Ver a linha da S09. Componente novo: `GraficoColunas`.
- **BUG-010** nos 15 formulários com campos: componente `Travado`
  (`fieldset disabled` com `display: contents`, para não mudar o layout, e o
  foco no primeiro campo inválido quando a resposta volta com erro).
- **Correção 1 do `fixes.md`, cobrança sem susto**: o lembrete de 3 dias
  antes vale para toda forma de pagamento (no cartão, a cobrança é
  automática e o aviso diz quanto e quando), o recibo de cada renovação traz
  o caminho para cancelar, e quem cancela recebe a confirmação por escrito.
- **BUG-013**, variável em branco tratada como valor: `lerVariavel` e
  `lerInteiro` em `lib/env.ts`.
