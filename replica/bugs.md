# Bugs do linkbio

Achados pela `/replica-test` em 2026-10-11, build `74e2040` (antes das
correções), Chromium 141, local com Supabase local e o Asaas falso. Só entra
aqui o que foi reproduzido; o resto está em "A conferir", no fim.

| | quantos | corrigidos |
| --- | --- | --- |
| S1 | 1 | 1 |
| S2 | 0 | 0 |
| S3 | 7 | 7 |
| S4 | 3 | 1 (1 não vai ser corrigido, 1 aberto) |

Nenhum S1 aberto.

### BUG-001: duas abas assinando juntas criam duas assinaturas no Asaas

- Severity: S1 (cobrança errada)
- Flow / case: F09 / F09-E8
- Screen: S14
- Build: 74e2040  Browser / device: Chromium 141, 1440 px

Steps
1. Entrar, abrir `/admin/plano` em duas abas.
2. Nas duas: Pix, nome, CPF válido.
3. Clicar em "Assinar e ir para o pagamento" nas duas ao mesmo tempo.

Expected: um cliente e uma assinatura no Asaas; as duas abas vão para a mesma cobrança.
Actual: dois clientes e duas assinaturas no Asaas. O banco guarda só a última; a outra seguiria gerando cobranças mensais que o app nem enxerga (os webhooks dela são ignorados).
Evidence: F09-E8, "Expected length: 1, Received length: 2" com os dois `POST /v3/subscriptions` (clientes `cus_aa60ee28-9f6` e `cus_0e23cb24-9c7`).
Suspected cause: checkout lia o estado, chamava o Asaas e só depois gravava, sem nada impedindo duas execuções juntas para a mesma conta.
Status: fixed in 7a561b3 (trava `pg_advisory_xact_lock` por conta no checkout e no cancelamento)

### BUG-002: sessão perdida no meio da edição derruba o painel

- Severity: S3
- Flow / case: F02 / F02-N1
- Screen: S06
- Build: 74e2040  Browser / device: Chromium 141, 1440 px

Steps
1. Entrar e abrir o painel.
2. Perder a sessão (cookies apagados, sessão expirada ou "sair de todos os aparelhos" em outro lugar).
3. Preencher um link e clicar em "Adicionar".

Expected: ir para a tela de entrar.
Actual: a página inteira vira "This page couldn't load. Reload to try again, or go back." (tela genérica do Next, em inglês) e o botão fica preso.
Evidence: F02-N1, `error-context.md` com o heading "This page couldn’t load"; teste estourou 60 s.
Suspected cause: o proxy redirecionava também o POST da ação do servidor; o navegador recebia o HTML de `/entrar` no lugar da resposta da ação.
Status: fixed in 08914f6

### BUG-003: sem rede, enviar um formulário ou ligar um link derruba o painel

- Severity: S3
- Flow / case: F02 / F02-E8
- Screen: S06 (e todos os formulários)
- Build: 74e2040  Browser / device: Chromium 141, 1440 px

Steps
1. Abrir o painel com pelo menos um link.
2. Ficar sem internet.
3. Clicar em "Adicionar" ou na chave de mostrar um link.

Expected: um aviso de que não há conexão, o que foi digitado continua, a chave volta ao estado salvo.
Actual: "This page couldn't load" no lugar do painel; ao ligar e desligar, a chave ficava no estado errado.
Evidence: F02-E8, mesmo `error-context.md` da tela genérica.
Suspected cause: a ação do servidor rejeita com erro de rede e nada o tratava; não havia `error.tsx`.
Status: fixed in 1a59239 (`semQuebrar` e `tentar` em todas as chamadas do navegador, mudança otimista desfeita, `error.tsx` na raiz e no painel)

### BUG-004: texto sem espaços estica a página para 1292 px no celular

- Severity: S3
- Flow / case: F02 / F02-E10
- Screen: S06, S15
- Build: 74e2040  Browser / device: Chromium 141, 390 px

Steps
1. A 390 px, editar o título e a bio com um texto sem espaços (60 e 160 caracteres; na vida real, um endereço colado na bio).
2. Salvar e olhar o painel e a página pública.

Expected: o texto quebra a linha dentro da largura da tela.
Actual: a página fica com 1292 px de largura e rolagem lateral.
Evidence: F02-E10, "Expected: <= 390, Received: 1292".
Status: fixed in 3972b50 e 1a59239 (`wrap-anywhere` no título, na bio, nos botões e na tabela de insights)

### BUG-005: link desligado depois que a página abriu mostra um texto cru

- Severity: S3
- Flow / case: F04 / F04-E3
- Screen: S15 → `/r/[id]`
- Build: 74e2040  Browser / device: Chromium 141, 1440 px

Steps
1. Abrir a página pública de um perfil.
2. O dono desliga um link (ou ele sai do horário agendado).
3. O visitante clica no link na página que já estava aberta.

Expected: uma página explicando que o link não está mais disponível, com caminho de volta.
Actual: uma linha de texto puro "Este link não existe ou foi desligado.", sem estilo nem saída.
Evidence: F04-E3, nenhum heading na página.
Status: fixed in 43a047a (página com caminho para o perfil, status 404, noindex)

### BUG-006: linkbio.com.br/@usuario dá 404 no navegador

- Severity: S3
- Flow / case: F04 / F04-E5
- Screen: S15
- Build: 74e2040  Browser / device: Chromium 141, 1440 px

Steps
1. Abrir `/@doces.da.ana` (o jeito do Instagram de escrever o endereço).

Expected: a página da Doces da Ana.
Actual: "Essa página não existe (ainda)" no navegador; para robôs de prévia, a página certa (os dois caminhos discordavam).
Evidence: F04-E5; `curl -A WhatsApp` dava 200 e o navegador mostrava o 404.
Suspected cause: a página recebia o segmento ainda codificado (`%40doces.da.ana`) e a normalização só tirava o `@` literal.
Status: fixed in fca347e

### BUG-007: cadastro com email que já tem conta mostra um erro genérico

- Severity: S3
- Flow / case: F01 / F01-E2
- Screen: S01
- Build: 74e2040  Browser / device: Chromium 141, 1440 px

Steps
1. Em `/cadastro`, usar o email de uma conta que já existe e uma senha qualquer.
2. Clicar em "Criar minha conta".

Expected: a mesma tela de um cadastro novo (sem revelar que o email é cliente) e um caminho para a pessoa entrar.
Actual: "Não deu certo agora. Tente de novo em instantes.", e tentar de novo dá o mesmo erro para sempre.
Evidence: F01-E2; o Auth responde `422 user_already_exists`, que o app não traduzia.
Status: fixed in f369e9a (mesma tela S02 e um email "Você já tem conta no linkbio" com o link para entrar)

### BUG-008: pré-carregamentos do painel viram 404 no console depois de sair

- Severity: S4
- Flow / case: F12 / F12-H1
- Screen: S13 → S18
- Build: 74e2040  Browser / device: Chromium 141, 1440 px

Steps
1. Entrar, abrir Conta e clicar em "Sair deste aparelho".

Expected: console limpo.
Actual: quatro "Failed to load resource: 404" para `/entrar?_rsc=...`.
Evidence: cadeia rastreada: o Next pré-carrega `/admin/configuracoes`, o proxy redireciona para `/entrar`, o Next redireciona de novo para conferir o `_rsc` e o resultado é 404. Sem efeito visível.
Status: fixed in 08914f6 (pré-carregamentos fora do matcher do proxy, como a documentação do Next indica)

### BUG-009: a página de 404 traz três meta robots iguais

- Severity: S4
- Flow / case: F04 / F04-E1
- Screen: 404
- Build: 74e2040  Browser / device: Chromium 141, 1440 px

Steps
1. Abrir um endereço livre, por exemplo `/ninguem.mora.aqui`.

Expected: um `<meta name="robots" content="noindex">`.
Actual: três iguais.
Evidence: F04-E1, "strict mode violation: resolved to 3 elements". No HTML sem JavaScript são 2; numa rota que não existe no app (`/a/b/c`), 1.
Suspected cause: o Next injeta uma por `notFound()` (nos metadados, que dá o 404 de verdade aos robôs de prévia, e na página) e mais uma no navegador durante o streaming.
Status: won't fix: as tags dizem a mesma coisa e tirar um dos `notFound()` desfaz o 404 dos robôs ou o da página

### BUG-010: digitar enquanto o envio anterior ainda volta apaga o que foi digitado

- Severity: S4
- Flow / case: F02 / F02-E3
- Screen: S06 (e qualquer formulário com erro de validação)
- Build: 74e2040  Browser / device: Chromium 141, 1440 px

Steps
1. Enviar o formulário de link com erro (título vazio).
2. Antes da resposta voltar (cerca de 200 ms), digitar um título novo.

Expected: o título digitado continua.
Actual: quando a resposta chega, o React 19 reinicia o formulário e o campo volta ao valor anterior.
Evidence: primeira rodada da F02-E3: o campo título estava vazio e o erro era "Dê um título ao link." depois de digitar 101 caracteres.
Suspected cause: reinício automático do formulário depois de uma ação, no React 19.
Status: open. Janela curta, difícil para uma pessoa; mitigação possível: travar os campos (`fieldset disabled`) enquanto envia.

### BUG-011: errar a senha de outra pessoa de propósito tranca a conta dela

- Severity: S3 (segurança: disponibilidade)
- Flow / case: F12 / F12-N3
- Screen: S18
- Build: 74e2040  Browser / device: Chromium 141, 1440 px

Steps
1. De um IP qualquer, tentar entrar 11 vezes com o email de outra pessoa e senhas erradas.
2. A dona da conta, de outro IP, entra com a senha certa.

Expected: ela entra.
Actual: "Muitas tentativas em pouco tempo" por 15 minutos.
Evidence: F12-N3 falhou 4 de 4 antes da correção.
Suspected cause: o limite de login era só por email, valendo para qualquer IP.
Status: fixed in 9666c81 (limite por email e IP; a força bruta segue limitada por IP e pelo Auth)

## A conferir (não reproduzido)

- **Duas abas reordenando:** se uma aba reordena com a lista desatualizada, o
  servidor recusa e a aba volta à ordem que ela tinha, não à do servidor, até
  recarregar.
- **Cliente órfão no Asaas:** se o Asaas aceita o cliente e recusa a
  assinatura logo depois, o cliente fica sem uso e a próxima tentativa cria
  outro. Não gera cobrança.
- **Força bruta distribuída:** de muitos IPs contra uma conta, o limite é só o
  do Auth. Considerar o CAPTCHA (Turnstile) que o Supabase Auth suporta.
- **O dono abrindo a própria página conta como visita.** Decidir se deve.
- **Menu do painel no celular:** os itens da direita ficam escondidos, sem
  sinal de que a fileira rola.
