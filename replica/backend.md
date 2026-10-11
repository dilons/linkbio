# Backend do linkbio

Feito pela `/replica-backend` em 2026-10-11, sobre a `architecture.md`. Troca a
camada provisória da fatia vertical (PGlite e login com scrypt) pelo stack de
verdade, sem mudar nenhuma tela: as funções de `src/lib/data` mantêm as
assinaturas.

| camada | o que roda | onde está |
| --- | --- | --- |
| banco | Postgres do Supabase; migrações SQL em `supabase/migrations`, tipos gerados para o Drizzle | `src/lib/db`, `npm run db:types` |
| acesso | RLS ligado sem políticas, permissões de `anon` e `authenticated` revogadas; o app fala com o banco só pelo servidor, e toda consulta de dono passa por `src/lib/authz.ts` | migração `..._contas_e_exclusao.sql` |
| login | Supabase Auth (`@supabase/ssr`): email e senha com confirmação, recuperação de senha, Google, sair deste ou de todos os aparelhos, excluir conta | `src/lib/data/auth.ts`, `src/proxy.ts`, `src/app/auth/*` |
| arquivos | Supabase Storage, bucket `avatares` (público, 2 MB, JPG, PNG, WebP), envio por URL assinada | `src/lib/data/fotos.ts`, `/api/upload` |
| cobrança | Asaas (Pix, cartão, boleto), página de pagamento do próprio Asaas, webhook idempotente | `src/lib/billing`, `/api/webhooks/asaas` |
| email | Auth: SMTP do Resend configurado no Supabase, modelos em `supabase/templates`. App: API do Resend; no dev, Mailpit | `src/lib/email` |
| jobs | Vercel Cron, 4 por dia, 3 tentativas e fila de mortos em `job_runs` | `src/lib/jobs.ts`, `/api/cron/[job]`, `vercel.json` |
| limites | contador atômico em `rate_limits`, chaves só com hash | `src/lib/data/limites.ts` |

## Rodar e testar na sua máquina

Precisa de Docker. Tudo local, nenhuma conta necessária.

```bash
npm run db:start                  # Supabase local: Postgres, Auth, Storage, API e Mailpit
npm run db:reset                  # aplica as migrações e o seed (conta demo)
cp .env.example .env.local        # e preencha com o que o db:start imprimiu
npm run dev
```

Emails do desenvolvimento (confirmação, senha, cobrança) aparecem no Mailpit,
em http://127.0.0.1:54324. Conta demo: `demo@linkbio.test` /
`linkbio-demo-2026`, página `/doces.da.ana`.

Testes:

```bash
npm run test:backend              # 30 testes contra o banco local (node:test)
npm run build && npm run test:e2e # 64 casos no navegador (Playwright sobe o app e o Asaas falso)
```

O `.env.local` de teste aponta `ASAAS_API_URL` para `http://127.0.0.1:4010/v3`.

## O que você precisa criar (com as suas contas e chaves)

Nada disto foi criado por mim: as contas, as senhas e as chaves são suas. As
variáveis vão no `.env.local` e no painel da Vercel; o `.env.example` lista
todas, sem valor.

1. **Supabase.** Projeto na região São Paulo (`sa-east-1`). Em Settings >
   API Keys: a chave publicável e a secreta. Em Settings > Database: a string
   do pooler de transação (porta 6543) para o `DATABASE_URL`. Depois:
   `npx supabase link` e `npm run db:push` (aplica as migrações) e
   `npx supabase config push` (modelos de email, senha mínima de 8,
   confirmação de email ligada). Em Authentication > URL Configuration: o
   domínio e as prévias da Vercel na lista de URLs permitidas.
2. **Backups.** No painel, Database > Backups. No plano Pro há backup diário;
   no Free, não conte com isso. Ligar antes de abrir para o público (a
   `/replica-deploy` confere).
3. **Resend.** Domínio próprio verificado (SPF, DKIM, DMARC). A chave vai em
   `RESEND_API_KEY` (emails do app) e também como senha do SMTP no Supabase
   Auth (host `smtp.resend.com`, porta 465, usuário `resend`), para os emails
   de login saírem do mesmo domínio.
4. **Asaas, sandbox primeiro.** Conta no sandbox, chave da API em
   `ASAAS_API_KEY`. Webhook apontando para `https://SEU-DOMINIO/api/webhooks/asaas`,
   com um token seu (o mesmo em `ASAAS_WEBHOOK_TOKEN`), envio sequencial, e os
   eventos `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`,
   `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED`, `SUBSCRIPTION_DELETED`,
   `SUBSCRIPTION_INACTIVATED`. Chave e URL de produção só na `/replica-deploy`.
5. **Google (login).** No Google Cloud: tela de consentimento com só `email`
   e `profile` (escopos básicos, sem a verificação demorada de escopos
   sensíveis; se usar logo e nome de marca, o Google revisa a marca, o que leva
   alguns dias: comece cedo). Cliente OAuth do tipo Web com o redirect
   `https://SEU-PROJETO.supabase.co/auth/v1/callback`. Cliente e segredo no
   Supabase (Authentication > Providers > Google) e `NEXT_PUBLIC_LOGIN_GOOGLE=1`
   no app.
6. **Vercel.** As variáveis do `.env.example`, um `CRON_SECRET` longo e
   aleatório, e `NEXT_PUBLIC_SITE_URL` com o domínio.

## Integrações

| integração | API oficial | escopos e permissões | revisão do provedor | limites |
| --- | --- | --- | --- | --- |
| Supabase Auth | `@supabase/ssr` e `@supabase/supabase-js` | chave publicável no servidor para login; chave secreta só para excluir usuário e para o Storage | nenhuma | padrão do Auth (emails por hora pelo SMTP próprio, logins por IP); os limites do app vêm antes |
| Supabase Storage | URL assinada (`createSignedUploadUrl`) | o navegador só envia para o caminho assinado, dentro da pasta do perfil | nenhuma | 2 MB e tipos no próprio bucket |
| Asaas | API v3 (`/customers`, `/subscriptions`, `/subscriptions/{id}/payments`), cabeçalho `access_token`, `User-Agent` obrigatório | chave da conta do dono | conta aprovada pelo Asaas para produção | não documentado nas páginas lidas; o app chama só no checkout e no cancelamento |
| Resend | `POST /emails` com `idempotency-key` | chave só de envio | verificação do domínio (DNS) | plano do Resend |
| Google | OAuth 2.0 via Supabase Auth | `email`, `profile` | sem verificação de escopo (básicos); revisão de marca se tiver logo | padrão |
| Vercel Cron | `vercel.json` + `CRON_SECRET` | o cron manda `Authorization: Bearer` | nenhuma | o plano define quantos crons e a duração |

Fontes do Asaas (o site da documentação não abre daqui; li pelas páginas
indexadas): [autenticação](https://docs.asaas.com/docs/autentica%C3%A7%C3%A3o-1),
[criar assinatura](https://docs.asaas.com/reference/criar-nova-assinatura),
[criando uma assinatura](https://docs.asaas.com/docs/criando-uma-assinatura),
[listar cobranças](https://docs.asaas.com/reference/listar-cobrancas),
[receber eventos no webhook](https://docs.asaas.com/docs/receive-asaas-events-at-your-webhook-endpoint),
[eventos de cobrança](https://docs.asaas.com/docs/payment-events),
[eventos de assinatura](https://docs.asaas.com/docs/subscription-events),
[criar cliente](https://docs.asaas.com/reference/criar-novo-cliente).

## Decisões que valem saber

- **Sessão conferida no Auth a cada pedido do painel.** O proxy usa
  `getUser()`, que pergunta ao Supabase Auth, e não `getClaims()`, que só
  confere a assinatura do token. Custa uma ida ao Auth por navegação no painel
  e faz "sair de todos os aparelhos" valer na hora (com `getClaims()`, o outro
  aparelho seguia logado até o token vencer, em até uma hora; o teste pegou).
- **Cookies `httpOnly`.** O app nunca usa o cliente do Supabase no navegador,
  então o token não fica legível pelo JavaScript da página.
- **Links dos emails com `token_hash`** (`/auth/confirm`), não com o código
  PKCE: funcionam abrindo o email em outro aparelho ou navegador.
- **Ninguém descobre quem tem conta.** Cadastro de email existente,
  recuperação de senha de email sem conta: a resposta é a mesma.
- **CPF ou CNPJ vai direto ao Asaas** (a cobrança exige) e não fica no nosso
  banco. O linkbio não vê nem guarda cartão.
- **Webhook idempotente e em ordem qualquer.** O id do evento é chave, a linha
  fica travada durante o processamento, e cada evento grava um estado (o fim
  do período só cresce). Testado com o mesmo evento três vezes em paralelo.
- **Cancelar é um clique**, sem tela de "tem certeza". O Pro continua até o fim
  do período pago.
- **Exclusão de verdade.** Apagar o usuário no Auth (pelo app, pelo painel do
  Supabase ou pela API) dispara o gatilho que apaga na hora links, inscritos,
  estatísticas, foto e textos; a linha do perfil fica 14 dias só com o
  username e o job de limpeza remove. O app antes cancela a assinatura (se não
  conseguir, não exclui), apaga as fotos do Storage, registra o pedido em
  `data_requests` (prova do prazo) e manda a confirmação por email.
- **Status 404.** Robôs de prévia (WhatsApp, Facebook) recebem 404 de verdade
  para endereço livre; navegadores recebem a página de 404 com `noindex` e
  status 200, porque o streaming começa antes. Se importar para SEO, checar o
  username no `proxy.ts`.
- **Limites de uso por IP confiam no `x-forwarded-for`**, que a Vercel
  sobrescreve com o IP real. Fora da Vercel, trocar pela fonte de IP do
  provedor.
- **Preço provisório:** R$ 19/mês em `PRECO_PRO_CENTAVOS`. A
  `/replica-entrepreneur` decide.

## Falta validar com as suas contas

- **Asaas sandbox de verdade.** Testei contra um Asaas falso que segue a
  documentação. No sandbox, conferir: o cliente exige `cpfCnpj` mesmo; o
  `invoiceUrl` vem na primeira cobrança logo depois de criar a assinatura;
  os nomes exatos dos eventos de assinatura.
- **Google.** O código e a configuração estão prontos; sem o app OAuth não deu
  para testar o vai e volta.
- **Resend.** O caminho do Mailpit foi testado; o do Resend só com a chave.
- **Vercel Cron.** Os jobs foram testados chamando a função; o agendamento
  vale depois do deploy.

## Checklist de segurança

- [x] segredos só em variáveis de ambiente; `.env*` no `.gitignore` (o
  `.env.example` entra, sem valores); a chave secreta só em módulo com
  `server-only`
- [x] entrada validada no servidor (zod) em toda ação e rota: cadastro, login,
  senha, link, cabeçalho, checkout, upload, visita, webhook
- [x] autorização em toda leitura e escrita (`lib/authz.ts`), testada com um
  segundo usuário (`tests/backend/authz.test.ts`); API REST e Storage
  fechados para as chaves públicas, testado anônimo e logado
- [x] limites de uso no cadastro, login, reenvio de confirmação, recuperação de
  senha, checagem de endereço, upload, checkout, visitas e cliques
- [x] webhook confere o token (comparação em tempo constante) e responde 401
- [x] uploads: 2 MB e só JPG, PNG, WebP, checados no servidor e no próprio
  bucket, servidos pelo domínio do Supabase
- [x] nada de dado pessoal na URL (o email da tela "confira seu email" não vai
  na URL) nem nos logs (os logs de erro não levam email)
- [x] `npm audit --omit=dev`: 0 vulnerabilidades. As 9 do `npm audit` completo
  são de ferramentas de desenvolvimento (`drizzle-kit`, `eslint-config-next`)
- [ ] política de privacidade com cada operador (Supabase, Vercel, Resend,
  Asaas, Google): fica para a `/replica-lgpd`
