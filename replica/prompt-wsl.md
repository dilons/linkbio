# Prompt para o Claude Code no WSL: pesquisas bloqueadas e próximas tarefas

Para começar, abra o Claude Code na raiz do repositório e mande:

> Leia `replica/prompt-wsl.md` e siga. Comece pela Parte 0 e me pergunte
> antes de cada passo que precise de conta, chave ou decisão minha.

Tudo abaixo é o prompt.

---

Você vai continuar o **Chamaqui** (repositório `dilons/linkbio`, branch
`main`): uma página de link na bio para quem vende e atende pelas redes no
Brasil, construída com o pacote Replica (as skills estão em
`.claude/skills/`). As etapas anteriores rodaram num ambiente na nuvem cuja
rede bloqueava quase todas as fontes externas. Aqui, no WSL da minha máquina,
a rede é aberta. Sua tarefa:

- **Parte 0**: preparar o ambiente e confirmar que tudo passa.
- **Parte 1**: fazer as pesquisas que ficaram bloqueadas.
- **Parte 2**: seguir com as próximas tarefas do projeto, na ordem.

## Onde o projeto está

- Next.js 16 (App Router, Cache Components), React 19, Tailwind 4,
  Supabase (Postgres, Auth, Storage) com Drizzle, cobrança pelo Asaas, emails
  pelo Resend (Mailpit no local), Vercel Cron. Antes de mexer em código do
  Next, leia o `AGENTS.md` (esta versão do Next mudou APIs).
- Paridade de funcionalidades 64,2/100. Must-haves: 17 de 18; falta validar
  a cobrança no sandbox do Asaas. 87 testes de ponta a ponta e 37 do
  backend, todos passando.
- Nome de trabalho **Chamaqui**, em `src/lib/marca.ts`. A paleta "brasa" está
  em `replica/design/tokens.json` e o sweep contra o original está limpo. As
  buscas de marca não foram feitas.
- As avaliações do original em `replica/mock/` são **fictícias**: um mock
  para testar o caminho. O ângulo "feito para quem vende no Brasil" saiu dele
  e precisa ser confirmado com dados reais.

Leia antes de começar: `README.md`, `replica/recon.md`,
`replica/parity.md`, `replica/build-log.md`, `replica/backend.md`,
`replica/test-plan.md`, `replica/bugs.md`, `replica/coleta.md`,
`replica/mock/LEIA-ME.md`, `replica/brand.md`, `replica/inpi.md`.

## As regras (não negociáveis)

1. **Nada inventado.** Nenhuma avaliação, citação, nota, contagem, resultado
   de busca ou disponibilidade inventados. Toda checagem leva o resultado e
   a data em que rodou. O que ninguém rodou fica "a executar". Nunca escreva
   "livre" ou "disponível" sem a busca.
2. **Citação é literal e tem link.** O WebFetch passa a página por um modelo
   que resume, então **não serve para citar avaliação**. Avaliações só entram
   de dois jeitos: pelo script de feeds oficiais ou pelo texto que eu copiar
   e colar. O WebFetch serve para confirmar fatos (preço, recurso), sempre
   com a URL.
3. **Leitura, não raspagem.** Nada de script contra Google Play, Trustpilot,
   Capterra, G2, GetApp, Reclame Aqui ou o pePI do INPI. Nesses, quem lê sou
   eu, no navegador, e você me ajuda a organizar. Feeds e APIs oficiais (feed
   RSS da App Store, API do Algolia do Hacker News, API do Reddit com a minha
   chave) podem ser usados dentro dos termos de cada um, no ritmo de uma
   pessoa.
4. **Eu crio as contas e as chaves.** Você nunca cria conta, nunca digita
   senha, cartão ou chave de produção, nunca paga taxa nem assina petição.
   Prepare tudo e me diga exatamente o que fazer. Cobrança só em sandbox.
5. **Mock não é dado.** Nada de `replica/mock/` entra em `replica/reviews.csv`,
   `replica/feedback.md`, `replica/fixes.md` ou `replica/features.csv`. O
   script de coleta já tira linhas `mock-*` e links `.invalid`.
6. **Nada do original no produto.** Nem o nome, nem o domínio, nem as cores,
   nem textos copiados. Rode o sweep antes de cada commit que toque o
   produto:
   `python3 .claude/skills/replica-brand/sweep.py . --config replica/brand.json`
7. **Testes verdes antes e depois.** Commits em português, um por etapa ou
   tela, com o push no `main` do `dilons/linkbio`.

## Parte 0: o ambiente no WSL

1. Pré-requisitos: Node 22, Python 3, Docker (Docker Desktop com a integração
   do WSL 2 ligada, ou o Docker Engine dentro do WSL), `git`, `whois`
   (`sudo apt install whois`).
2. `npm install` e depois `npx playwright install chromium`, que baixa o
   Chromium da versão fixada no `package.json`.
3. `npm run db:start`. Ele sobe o Supabase local com o `project_id`
   "chamaqui" e aplica as migrações e o seed.
4. Copie `.env.example` para `.env.local` e preencha com os valores locais:
   - `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
   - a chave publicável e a secreta que o `db:start` imprimiu
   - `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres`
   - `MAILPIT_URL=http://127.0.0.1:54324`
   - `CRON_SECRET=segredo-local-dos-jobs`
   - para o Asaas falso dos testes: `ASAAS_API_URL=http://127.0.0.1:4010/v3`,
     `ASAAS_API_KEY=chave-do-asaas-falso`, `ASAAS_WEBHOOK_TOKEN=token-local-do-webhook`
   - deixe vazio o que não tiver (Resend, Google)
5. Confira: `npm run typecheck && npm run lint && npm run build`, depois
   `npm run test:backend` (37) e `npm run test:e2e` (87; o Playwright sobe o
   app e o Asaas falso sozinho). Se algo falhar aqui, é ambiente: resolva
   antes de seguir.
6. Teste a rede. Estes endereços precisam responder:
   `itunes.apple.com`, `hn.algolia.com`, `linktr.ee`, `help.linktr.ee`,
   `busca.inpi.gov.br`, `registro.br`, `tmsearch.uspto.gov`,
   `branddb.wipo.int`, `api-sandbox.asaas.com`. Se algum não responder, me
   diga qual.

## Parte 1: o que a rede anterior bloqueou

Faça na ordem. Ao fim de cada item: o que rodou (com data), os números, o que
ficou pendente e as decisões que são minhas.

### 1.1 Avaliações reais do original (`/replica-entrepreneur`)

1. `python3 replica/ferramentas/coletar_avaliacoes.py --paises br,us,pt` busca
   a App Store (feed RSS oficial, app id 1593515263) e o Hacker News.
   O Reddit só entra se eu criar um app "script" em reddit.com/prefs/apps e
   passar `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` e `REDDIT_USER_AGENT`,
   rodando com `--reddit`.
2. As fontes sem feed eu copio à mão, seguindo o `replica/coleta.md`: Google
   Play, Trustpilot, Capterra, GetApp, G2 e Reclame Aqui. Você confere o
   formato e o link de cada linha e me diz quantas faltam para a meta.
3. A meta são **100 ou mais avaliações de pelo menos três fontes**. Diga o
   número real, seja qual for.
4. Gere o feedback:
   `python3 .claude/skills/replica-entrepreneur/reviews.py replica/reviews.csv --themes replica/temas.json --out replica/feedback.md`.
   Leia à mão a lista "Read these by hand". Se aparecer um tema que o
   `temas.json` não tem, acrescente o tema sem forçar o encaixe.
5. Leia o changelog ou a página de novidades do original, para não propor
   "consertar" o que eles já consertaram.
6. Escreva o `replica/fixes.md` real, no formato do
   `replica/mock/fixes.mock.md`:
   - as três listas (o que odeiam, o que falta, o que ninguém resolve), cada
     item com contagem, número de fontes e citações literais com link; tema
     fraco marcado como fraco;
   - o plano de 5 a 8 correções, cruzado com o que o app já faz;
   - três ângulos e uma recomendação.
7. Acrescente as correções à `replica/features.csv` com `original` = `no`.
8. **Compare com o mock.** O ângulo "feito para quem vende no Brasil" se
   sustenta? Se não, avise: a voz e os textos da `/replica-brand` mudam, e
   talvez o nome. Não apague o `replica/mock/` sem eu pedir.

### 1.2 Confirmar a recon (`replica/recon.md`)

A recon foi feita só com resumos de busca, porque `linktr.ee` e
`help.linktr.ee` estavam bloqueados.

- Abra os artigos de ajuda da tabela de fontes (linhas 1 a 16) e a página
  oficial de preços.
- Confirme ou corrija o que está marcado como **(não confirmado)**:
  - os preços dos planos (Starter, Pro, Premium);
  - se o original tem domínio próprio;
  - o servidor MCP deles;
  - a afirmação de um blog de que os termos de julho de 2026 preveem
    compartilhar dados com a OpenAI. Leia os termos oficiais.
- Os 31 passos do cadastro vêm de terceiros e não dá para confirmar sem
  conta própria. Deixe como está.
- Anote a URL e a data de cada confirmação na `recon.md`. Se a coluna
  `original` de alguma funcionalidade mudar, atualize a `features.csv`.

### 1.3 Layout contra o original (`/replica-diff`)

1. **Capturas do original.** Capture com o Playwright, no ritmo de uma
   pessoa e sem login, 2 ou 3 **páginas públicas de perfil de marcas
   conhecidas**, nunca de pessoas físicas comuns (por exemplo
   `linktr.ee/linktree`). Use 1440×900 e 390×844 e grave em
   `replica/screens/S15-1440.png` e `S15-390.png`.
2. **Telas do painel** (S06, S08, S09, S10): só se eu tiver conta própria e os
   termos dela permitirem esse uso. Leia os termos primeiro e me diga. Se não
   permitirem, ficam de fora.
3. **Comparação.** Rode `imgdiff.py` contra `replica/clone-screens/` no mesmo
   estado, com quantidade parecida de links. O modo layout ignora cor, então
   a marca nova não pesa. Depois `parity.py --visual`; atualize a seção de
   layout da `replica/parity.md`.

### 1.4 Marca fora do Brasil, domínios e perfis (`/replica-brand`)

Para **Chamaqui** e para a reserva **Logali**, e também "chama aqui" nas
bases de marca. Preencha a tabela de checagens da `replica/brand.md` com o
resultado e a data.

- **Marcas:**
  - USPTO (tmsearch.uspto.gov, classes 9 e 42);
  - EUIPO eSearch ou TMview;
  - base do Canadá (ised-isde.canada.ca);
  - WIPO Global Brand Database.

  Se o site barrar automação, eu pesquiso e você organiza.
- **Domínios:**
  - `whois chamaqui.com`
  - `whois -h whois.registro.br chamaqui.com.br`
  - `chamaaqui.com.br`
  - os da reserva `logali.*`
- **Lojas:**
  - App Store pela API de busca oficial
    (`https://itunes.apple.com/search?term=chamaqui&country=br&entity=software`);
  - Google Play, que eu busco no navegador.
- **Perfis:** @chamaqui no Instagram, TikTok, X, YouTube e GitHub. Status HTTP
  não é confiável no Instagram e no TikTok, então eu confiro no navegador.
- **Cores do original:** confirme na página de marca oficial deles, se
  existir. Hoje o `replica/brand.json` tem três valores de fontes que
  divergem. Rode o sweep de novo.

### 1.5 INPI (`/replica-inpi`)

1. Eu faço a busca no pePI (https://busca.inpi.gov.br/pePI/, sem login,
   Marca), com os 18 termos da `replica/inpi.md`, nos modos Radical e Exata.
   Você me guia termo por termo e passa o que eu colar (texto ou print) para
   o `replica/inpi.csv`, com `termo`, `modo` e `data`, **incluindo os termos
   que não trouxeram nada**.
2. Rode a análise com o comando que está no topo do
   `replica/inpi-analise.md` e tire o aviso de "não vale como resultado"
   quando a busca real estiver lá.
3. Feche a escolha (Chamaqui ou Logali) com o motivo na `replica/inpi.md`.
   Preencha também as checagens brasileiras: Registro.br, viabilidade de nome
   na Junta (REDESIM) e o registro do original via Protocolo de Madri na
   base da WIPO.
4. O depósito eu faço. Revise comigo o passo a passo: e-INPI, GRU, petição,
   apresentação nominativa, classes 9 e 42.
5. **Se o nome mudar**, a troca é em três lugares:
   - `src/lib/marca.ts`;
   - `supabase/templates/*.html` e os assuntos em `supabase/config.toml`;
   - a migração que reserva endereços (crie uma nova; não edite a antiga).

   Depois rode o sweep, os testes e refaça as capturas.

### 1.6 Contas reais em sandbox (`/replica-backend`, checagens M1 a M4 do `test-plan.md`)

- **Asaas sandbox (M3, M4).** Eu crio a conta no sandbox e a chave. No
  `.env.local`:
  - `ASAAS_API_URL=https://api-sandbox.asaas.com/v3`
  - a minha chave
  - um token de webhook meu

  O webhook precisa de URL pública: use um túnel
  (`cloudflared tunnel --url http://localhost:3000` ou ngrok) e eu cadastro
  `https://.../api/webhooks/asaas` no painel do sandbox, com os eventos
  listados na `replica/backend.md`. Confira os três pontos de "Falta validar"
  da `backend.md`. Depois faça:
  - assinar por Pix e confirmar pelo painel;
  - cartão recusado e cartão aprovado, com os cartões de teste do Asaas.

  Se passar: "Plano pago com assinatura e cancelamento" vira `yes` na
  `features.csv` e o `parity.py` deve dar 65,9 com 18 de 18 must-haves. Volte
  o `.env.local` para o Asaas falso antes de rodar a suíte.
- **Google (M2).** Eu crio o cliente OAuth no Google Cloud (tela de
  consentimento só com `email` e `profile`). Para o local:
  - redirect `http://127.0.0.1:54321/auth/v1/callback`;
  - cliente e segredo no `.env` da raiz, para o Supabase CLI;
  - `NEXT_PUBLIC_LOGIN_GOOGLE=1`.

  Teste com uma conta nova e com uma conta que já existe.
- **Resend (M1).** Depende do domínio, que depende do item 1.5. Pode ficar
  para o deploy.

Anote cada resultado, com data, na tabela da passada manual do
`replica/test-plan.md`.

### 1.7 Arrumação

- Apague o branch temporário no outro repositório (o proxy anterior
  recusou): `git push origin --delete linkbio-temporario` num clone do
  `dilons/random`.
- Depois da decisão do nome, eu posso renomear o repositório `dilons/linkbio`
  no GitHub (o GitHub redireciona o nome antigo). Só me lembre.

## Parte 2: as próximas tarefas, na ordem

1. **`/replica-entrepreneur` com dados reais** (item 1.1). Se o ângulo mudar,
   revise a voz e os textos da `/replica-brand` (tabela das 10 strings na
   `brand.md`).
2. **Decisão do nome** (itens 1.4 e 1.5). Depois disso, os passos são meus:
   registrar os domínios, criar os perfis, encomendar o logo pelo briefing da
   `brand.md` e depositar no INPI. Quando o logo chegar, troque o monograma
   provisório (`src/app/icon.svg` e `favicon.ico`) e crie a imagem social
   1200×630 (Open Graph), que o app ainda não tem.
3. **`/replica-build`, terceira rodada**, até a linha de lançamento (80,7 no
   `parity.py`). São os sete should-haves, mais as correções que o
   `fixes.md` real priorizar:
   - aviso de conteúdo sensível e trava de idade (F11, S16 e o ajuste na S12;
     o componente `GateScreen` já existe);
   - agendar link com fuso (F08, S07; a página pública já respeita a janela e
     o `datetime-tz` já existe);
   - trocar o endereço (S13; o antigo fica reservado 14 dias, como na
     exclusão);
   - QR code da página (S19), gerado no próprio app, sem serviço de
     terceiros;
   - insights com período, fontes de tráfego e locais, e únicos completos
     (S09; o job diário já preenche `daily_stats` e `daily_breakdowns`);
   - o BUG-010 (S4): travar os campos com `fieldset disabled` enquanto envia.

   Cada tela deve sair com:
   - todos os estados, a 390 e a 1440;
   - teclado e axe;
   - teste de ponta a ponta;
   - `features.csv` atualizada e captura em `replica/clone-screens/`;
   - um commit por tela e uma linha no `build-log.md`.
4. **`/replica-test`** nas telas novas: casos no `test-plan.md` e a suíte
   inteira verde. Bug reproduzido vai para o `bugs.md`; um S1 ou S2 se
   corrige com teste antes.
5. **`/replica-diff`**: recalcule. A meta é 80 ou mais, com 18 de 18
   must-haves, mais o layout contra o original (item 1.3).
6. **`/replica-lgpd`** ainda não rodou e é obrigatória antes do deploy no
   Brasil. Pontos já mapeados:
   - o app é controlador dos dados dos criadores e operador dos inscritos
     que cada criador coleta, então precisa de termos para o criador como
     controlador;
   - operadores e transferências internacionais: Supabase em São Paulo,
     Vercel, Resend, Asaas;
   - "baixar meus dados" ainda falta na S13;
   - analytics sem cookie, então sem banner;
   - ECA Digital pela trava de idade;
   - encarregado, incidentes, e as páginas de política de privacidade e de
     termos.
7. **`/replica-launch`**:
   - landing a partir do ângulo confirmado;
   - preço em reais, comparado com os preços públicos do original
     (confirmados no item 1.2) e com as reclamações sobre preço do
     `fixes.md`;
   - listagem de loja não se aplica enquanto o produto for só web.
8. **`/replica-deploy`**:
   - projeto Supabase em São Paulo e a Vercel;
   - DNS do domínio e do email (SPF, DKIM e DMARC do Resend);
   - Asaas de produção e Google OAuth de produção;
   - crons e monitoramento;
   - a trava de pré-lançamento: testes verdes, must-haves feitos, sweep
     limpo, páginas legais no ar.

   Depois do deploy, as checagens manuais M5 a M7: leitor de tela, aparelhos
   reais e os jobs rodando.

## Como me reportar

No fim de cada item, poucas linhas:
- o que rodou, com data e números reais;
- o que mudou no repositório (commits);
- o que ficou pendente e por quê;
- as perguntas que só eu posso responder.

Se uma fonte não abrir, diga qual e siga com o resto; não substitua por
dado inventado.
