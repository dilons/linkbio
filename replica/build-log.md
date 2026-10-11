# Build log

Uma linha por tela. Estado: **feito**, **parcial** (funciona, falta parte),
**stub** (rota e moldura, sem a função) ou **não começou**.

Etapa 1 da `architecture.md`, a fatia vertical: cadastro → endereço → link →
página pública → clique contado → insights. Testada de ponta a ponta por
`tests/e2e/fatia.mjs` (38 checagens a 1440 e 390 px, a de 390 só com teclado;
axe 0 violações em 17 telas; console sem erros). Capturas em
`replica/clone-screens/`.

| tela | data | estado | o que falta | o que deu mais trabalho |
| --- | --- | --- | --- | --- |
| S01 cadastro | 2026-10-11 | parcial | login com Google; login real (Supabase Auth); limite de tentativas | o React 19 limpa o formulário depois de cada envio: as ações devolvem o que foi digitado para os campos voltarem no erro |
| S02 confirmar email | 2026-10-11 | stub | o email de confirmação (Resend) e a tela | |
| S03 endereço | 2026-10-11 | feito | | o Postgres recusa o mesmo `$2` numa coluna `citext` e numa `text` no mesmo insert; o teste pegou |
| S04 modelo por categoria | 2026-10-11 | stub | tudo (should-have, etapa 6) | |
| S05 plano no onboarding | 2026-10-11 | stub | tudo (etapa 5) | |
| S06 editor de links | 2026-10-11 | parcial | foto; editor das redes sociais; coleções; prévia no celular (hoje só o botão Abrir); estado "muitos links" não testado | o editor guarda o estado local para a prévia reagir na hora e remonta quando o servidor muda (chave pelos dados); reordenar pelo teclado anuncia em português |
| S07 editar link | 2026-10-11 | parcial | miniatura, agendamento com fuso, trava, destaque, selo de recurso pago | |
| S08 aparência | 2026-10-11 | stub | galeria de temas (etapa 2), tema customizado (etapa 6) | |
| S09 insights | 2026-10-11 | parcial | gráfico por dia, período, fontes e locais, soma diária (`daily_stats`) | o Chromium headless se apresenta como "HeadlessChrome" e o isbot (certo) não conta; o teste usa um user-agent comum |
| S10 audiência | 2026-10-11 | stub | tabela de inscritos e CSV (etapa 4) | |
| S11 editor do formulário | | não começou | tudo (etapa 4) | |
| S12 configurações | 2026-10-11 | stub | conteúdo sensível e QR code (etapa 6) | |
| S13 conta | 2026-10-11 | stub | troca de username, exclusão; hoje só sair | |
| S14 assinatura | 2026-10-11 | stub | Asaas, Pix e cartão, cancelamento (etapa 5) | |
| S15 página pública | 2026-10-11 | parcial | foto, aviso de conteúdo sensível, formulário, cache da página | o 404: com streaming o status sai no primeiro pedaço. Robôs de prévia (WhatsApp, Facebook) recebem 404 de verdade; navegadores recebem a página de 404 com `noindex` |
| S16 aviso de conteúdo sensível | | não começou | tudo (etapa 6); o componente `GateScreen` já existe | |
| S17 inscrição enviada | | não começou | tudo (etapa 4) | |
| S18 entrar | 2026-10-11 | parcial | recuperar senha (stub), Google, limite de tentativas | |
| S19 QR code | | não começou | tudo (etapa 6) | |

Placar: 1 feita, 6 parciais, 8 stubs, 4 por começar, de 19. Must-haves: 6 sim
e 4 parciais de 18.

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

## Provisório (troca na /replica-backend, sem mudar tela)

- Banco: PGlite com o mesmo `replica/schema.sql`, em `.data/pglite`
  (ou `LINKBIO_DB_DIR`). Conta demo com `LINKBIO_DEMO=1`:
  `demo@linkbio.test` / `linkbio-demo-2026`, página `/doces.da.ana`.
- Login: senha com scrypt e sessão por cookie `lb_sessao` (httpOnly, 30 dias),
  hash do token no banco. Email confirmado automaticamente.
- Sem limite de tentativas (login, cadastro, `/api/username`, `/api/e`).
- Sem job do sal diário nem soma diária: os insights contam direto dos eventos.
- Origem do clique vinda da própria página pública vira "direto", para a origem
  real ser a da visita.

## Ferramentas

- `npm audit --omit=dev`: 0 vulnerabilidades. As 5 "high" do `npm audit` são
  só de desenvolvimento, pela cadeia `eslint-config-next` → `micromatch`.
