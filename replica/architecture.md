# Arquitetura: linkbio (as funcionalidades principais do Linktree, refeitas)

Lê `replica/recon.md` e `replica/features.csv`. O SQL está em
`replica/schema.sql` e vira a primeira migração.

## Stack

| camada | escolha | por quê |
| --- | --- | --- |
| web | Next.js (App Router) + TypeScript | a página pública sai renderizada no servidor (abre rápido e gera prévia no WhatsApp e no Instagram); o editor usa server actions |
| estilo | Tailwind, com os tokens da `/replica-design` | |
| banco | Postgres no Supabase, região São Paulo (sa-east-1) | dados no Brasil, gerenciado, com backup |
| ORM | Drizzle | SQL explícito e migrações versionadas no repositório |
| login | Supabase Auth: email e senha com confirmação, Google | mesma plataforma do banco; sessão em cookie httpOnly |
| cobrança | Asaas (assinatura por Pix, cartão ou boleto), atrás de um módulo `lib/billing` | empresa brasileira, então os dados de pagamento ficam no Brasil, e tem Pix. No Stripe, a assinatura com Pix tem documentação contraditória hoje; o módulo permite trocar depois |
| email | Resend, do domínio próprio; também como SMTP do Supabase Auth | confirmações e senha saem do domínio do produto |
| jobs | Vercel Cron | 4 jobs diários, sem fila |
| arquivos | Supabase Storage | avatar, miniatura e fundo, servidos por um domínio separado do app |
| hospedagem | Vercel, funções na região gru1 (São Paulo) | perto do banco. A região gru1 exige o plano Pro da Vercel; no plano grátis as funções rodam nos EUA |
| local do visitante | cabeçalhos de geolocalização da Vercel (país e cidade) | não precisa guardar IP |
| robôs | pacote `isbot` | robôs e prévias de redes sociais não contam como visita |
| erros | Sentry, depois da primeira versão, com `sendDefaultPii: false` | |

Um banco, um app. Nada de microsserviços.

## Regra de acesso

RLS ligado em todas as 17 tabelas e **nenhuma política**. A API REST do Supabase,
que fica exposta com a chave anon, não lê nem escreve nada. O app acessa o banco
só pelo servidor, com Drizzle, e cada consulta de dono passa por
`lib/authz.ts`, que confere se `profile.account_id` é o usuário da sessão.
Rotas públicas leem só dados publicados (perfil não excluído, link ativo e dentro
da janela de agendamento) e nunca dados de outra conta.

## Schema

17 tabelas (ver `replica/schema.sql`, testado no PGlite):

| grupo | tabelas |
| --- | --- |
| contas | `accounts`, `reserved_usernames`, `profiles` |
| página | `collections`, `links`, `social_links`, `appearances` |
| audiência | `forms`, `submissions` |
| insights | `events`, `analytics_salts`, `daily_stats`, `daily_breakdowns` |
| cobrança | `subscriptions`, `billing_events` |
| operação | `rate_limits`, `data_requests` |

As regras que o banco garante, não a tela:

- username único sem diferenciar maiúsculas (`citext`), de 3 a 30 caracteres
  (letras, números, ponto e sublinhado), sem ponto ou sublinhado nas pontas, e
  fora da lista de reservados
- link só com `http` ou `https` (barra `javascript:`), e link ou vídeo sempre
  com URL
- agendamento com fim depois do começo; trava de idade sempre com a idade
- uma inscrição por email por página (sem diferenciar maiúsculas): enviar duas
  vezes não duplica
- um webhook processado uma vez só (o id do evento é a chave)
- um total por dia por página e por link
- excluir a conta apaga em cascata perfis, links, inscrições e estatísticas

## Rotas e ações

| método e caminho | o que faz | quem chama | entrada | saída | fluxo |
| --- | --- | --- | --- | --- | --- |
| action `signUp` | cria a conta (Supabase Auth) | público, com limite | email, senha | email de confirmação enviado | F01 |
| GET `/auth/callback` | confirma o email ou o login Google e abre a sessão | público | código | redireciona | F01 |
| GET `/api/username?u=` | diz se o username está livre | logado, com limite | username | `{livre, motivo}` | F01, F10 |
| action `createProfile` | cria o perfil e a aparência padrão | logado | username, categoria, modelo | perfil | F01 |
| action `updateHeader` | título, bio, avatar, layout | dono | campos | perfil | F02 |
| POST `/api/upload` | URL assinada para enviar imagem ao Storage | dono | tipo, tamanho | URL assinada | F02, F03 |
| action `addLink`, `updateLink`, `deleteLink` | cria, edita, exclui | dono | campos do link | link | F02, F08 |
| action `toggleLink` | liga e desliga sem excluir | dono | id, ativo | link | F02 |
| action `reorderLinks` | grava a nova ordem numa transação | dono | ids em ordem | ok | F02 |
| action `saveSocialLinks`, `reorderSocial` | ícones sociais e posição | dono | lista | ok | F02 |
| action `saveForm` | campos e texto de consentimento do formulário | dono | campos | ok | F05 |
| action `updateAppearance` | tema pronto ou customizado (validado) | dono | tema ou objeto | ok | F03 |
| action `updateSensitive` | rótulo da página | dono | rótulo | ok | F11 |
| GET `/[username]` | página pública, renderizada no servidor com cache por tag | público | | HTML ou 404 | F04 |
| GET `/r/[linkId]` | conta o clique e redireciona (302) para a URL guardada | público | | redireciona ou 404 | F04 |
| POST `/api/e` | registra a visita (beacon do navegador; robôs não rodam JS) | público, com limite | perfil | 204 | F04 |
| POST `/api/forms/[linkId]` | grava a inscrição com o consentimento | público, com limite e campo isca | campos, aceite | ok ou erro | F05 |
| GET `/admin/insights` | totais, ranking, fontes, locais no período | dono | período | página | F06 |
| GET `/api/audiencia.csv?perfil=` | baixa os inscritos em CSV | dono | perfil | CSV | F07 |
| GET `/api/qr/[username]` | QR code da página em PNG | público | | PNG | S19 |
| action `startCheckout` | cria cliente e assinatura no Asaas, devolve o link de pagamento | dono | plano, forma (pix, cartão, boleto) | URL de pagamento | F09 |
| POST `/api/webhooks/asaas` | atualiza a assinatura pelo evento | Asaas (token no cabeçalho) | evento | 200 | F09 |
| action `cancelSubscription` | cancela no fim do período, em um clique | dono | | ok | F09 |
| action `changeUsername` | troca, uma vez a cada 7 dias | dono | novo username | perfil | F10 |
| action `deleteProfile`, `deleteAccount` | apaga os dados na hora e segura o username por 14 dias | dono | confirmação | ok | F10 |
| GET `/api/me/export` | todos os dados da conta em JSON (LGPD) | dono | | JSON | F10 |

30 rotas e ações (26 linhas; algumas linhas agrupam ações irmãs).

**Webhooks de entrada:** Asaas (pagamento confirmado, vencido, estornado;
assinatura criada, alterada, cancelada). A lista exata de eventos sai da
documentação do Asaas na hora de construir. **De saída:** nenhum.

**Jobs** (Vercel Cron, horário UTC):

| quando | job |
| --- | --- |
| 00:05 | cria o sal do dia e apaga os de mais de um dia |
| 03:10 (meia-noite de São Paulo) | soma os eventos do dia anterior em `daily_stats` e `daily_breakdowns`, no fuso de cada perfil |
| 06:00 | apaga eventos com mais de 90 dias, perfis excluídos há mais de 14 dias (e os arquivos deles), e `rate_limits` velhos |
| 12:00 | cobrança: avisa quem tem renovação por Pix em 3 dias, e volta ao plano grátis quem está vencido há mais de 5 dias |

## O que dá trabalho

- **Fuso horário:** agenda em UTC com o fuso do perfil para mostrar; o total do
  dia é calculado no fuso do perfil (padrão `America/Sao_Paulo`).
- **Webhook repetido:** `billing_events` com o id do evento como chave; o handler
  é idempotente.
- **Concorrência:** dois cadastros no mesmo username, o banco recusa um; a
  reordenação e a troca de username (limite de 7 dias) rodam em transação.
- **Limites de uso:** cadastro, checagem de username, formulário e beacon de
  visita contados em `rate_limits` por chave (hash do visitante e perfil).
- **Arquivos:** avatar e miniatura até 2 MB, fundo até 5 MB, só jpg, png e
  webp; vídeo de fundo (could) até 15 MB; envio por URL assinada.
- **Busca, tempo real, offline:** não precisa. A prévia do editor atualiza no
  próprio navegador.
- **Entrega de email:** SPF, DKIM e DMARC no domínio do Resend; o Supabase Auth
  usa o mesmo SMTP.
- **Separação entre contas:** toda consulta de dono passa por `lib/authz.ts`;
  ids são UUID, então não dá para adivinhar o de outra conta.
- **Exclusão (LGPD):** apaga na hora título, bio, avatar, links, inscrições e
  estatísticas; a linha do perfil fica 14 dias só com o username, para
  ninguém tomar o endereço logo depois; o job remove de vez. Cancela a
  assinatura no Asaas.
- **Visitante único sem rastrear:** hash de (sal do dia + IP + navegador +
  perfil). O IP não é gravado e o sal é apagado depois de um dia, então o hash
  não volta a uma pessoa.
- **Cache da página pública:** os dados do perfil ficam em cache e são
  invalidados por tag a cada edição; a janela de agendamento é aplicada na hora
  do pedido.
- **Redirecionamento seguro:** `/r/[linkId]` só manda para a URL gravada de um
  link ativo, e o banco só aceita `http` e `https`.
- **Abuso:** páginas de link na bio são usadas para golpe e phishing. Primeira
  versão: botão "denunciar" e bloqueio manual; depois, checar as URLs numa lista
  de sites perigosos.
- **Plano vencido:** os recursos pagos configurados ficam guardados, mas param
  de aparecer (a marca volta ao rodapé, o agendamento para de valer).

## Ordem de construção

1. **Fatia vertical**, feia mesmo: cadastro, username, adicionar link, página
   pública, clique contado.
   Telas S01, S02, S03, S06 (básica), S15. Tabelas `accounts`,
   `reserved_usernames`, `profiles`, `links`, `events`, `analytics_salts`.
   Rotas `signUp`, `/auth/callback`, `/api/username`, `createProfile`,
   `addLink`, `updateLink`, `deleteLink`, `/[username]`, `/r/[linkId]`.
2. **Must-haves do editor e da página:** reordenar, ligar e desligar, foto,
   título e bio, ícones sociais, prévia ao vivo, temas prontos, 404 e perfil
   excluído. Telas S06, S07, S08 (temas), S15. Tabelas `social_links`,
   `appearances`. Rotas `updateHeader`, `/api/upload`, `toggleLink`,
   `reorderLinks`, `saveSocialLinks`, `reorderSocial`, `updateAppearance`.
3. **Must-haves de insights:** views e cliques por dia. Tela S09. Tabelas
   `daily_stats`, `daily_breakdowns`. Rotas `/api/e`, `/admin/insights`, jobs
   do sal e da soma diária.
4. **Must-haves de audiência:** formulário, inscritos, CSV. Telas S11, S17,
   S10. Tabelas `forms`, `submissions`, `rate_limits`. Rotas `saveForm`,
   `/api/forms/[linkId]`, `/api/audiencia.csv`.
5. **Must-haves de conta e cobrança:** plano pago, marca fora do rodapé,
   cancelamento, senha, exclusão. Telas S05, S13, S14, S18. Tabelas
   `subscriptions`, `billing_events`, `data_requests`. Rotas `startCheckout`,
   `/api/webhooks/asaas`, `cancelSubscription`, `deleteProfile`,
   `deleteAccount`, `/api/me/export`, job de cobrança.
6. **Should-haves:** Google, modelo por categoria (S04), tema customizado,
   fundo com imagem, miniatura, agendamento, únicos e taxa de clique, ranking,
   fontes e locais, período, QR code (S19), conteúdo sensível (S12, S16),
   troca de username.
7. **Could-haves:** coleções, destaque, vídeo do YouTube, fundo com vídeo,
   layouts de header, vários perfis, integração com ferramenta de email, QR
   personalizado.
8. **As melhorias** que a `/replica-entrepreneur` encontrar.

## Pendente de confirmar

- No Asaas: a lista de eventos de webhook, se a assinatura por Pix gera uma
  cobrança por ciclo (o cliente paga um QR por mês) ou tem débito automático
  (Pix Automático), e o link de pagamento de cada cobrança.
- Na Vercel: o custo do plano Pro para usar a região gru1.
- No Supabase: confirmar a região São Paulo ao criar o projeto.
