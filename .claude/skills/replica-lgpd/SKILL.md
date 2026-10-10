---
name: replica-lgpd
description: >-
  Coloca o app em conformidade com a LGPD e, se houver usuários na União
  Europeia, com o GDPR na mesma passada: inventário de dados com a base legal
  das duas leis, conferido contra o schema, operadores e transferências
  internacionais (cláusulas-padrão da ANPD, adequação Brasil-UE de 2026, DPF),
  o caso do SaaS que é operador dos dados dos clientes, direitos do titular no
  produto, cookies, encarregado, incidentes com os prazos da ANPD e da UE,
  crianças e o ECA Digital, política de privacidade e uma verificação que trava
  o deploy. Use quando o usuário falar em LGPD, GDPR, ANPD, privacidade,
  proteção de dados, política de privacidade, cookies, banner, encarregado,
  DPO, consentimento, base legal, dado sensível, vazamento, incidente,
  transferência internacional, "posso guardar esse dado?", ou antes de
  /replica-deploy em qualquer app com usuários no Brasil.
---

# replica-lgpd

A `/replica-backend` pede uma política de privacidade que liste os operadores,
e a `/replica-deploy` checa se ela está no ar. Para o Brasil, isso é a LGPD
(Lei 13.709/2018), fiscalizada pela ANPD, com multa de até 2% do faturamento
no Brasil, limitada a R$ 50 milhões por infração (art. 52). Quase tudo que o
GDPR pede a LGPD também pede, então as duas andam juntas: um inventário, duas
colunas de base legal.

Lê `replica/architecture.md`, as migrações ou o schema, `replica/backend.md` e
o código. Se algum não existir (a `/replica-backend` ainda não rodou, por
exemplo), trabalhe com o que houver e liste o que falta construir como
mudança no produto. Escreve:

- `replica/dados.csv` e `replica/lgpd.json`: o inventário e a configuração
- `replica/lgpd-verificacao.md`: o relatório da ferramenta, refeito a cada
  rodada. Não escreva nele.
- `replica/lgpd.md`: o que é seu e não se sobrescreve (decisões, testes de
  balanceamento, plano de incidente, pendências do usuário, mudanças no
  produto)
- a política de privacidade no projeto e as telas de privacidade do app

Ferramenta nesta pasta. Rode da raiz do projeto, trocando `$SKILL` pela pasta
onde esta skill está instalada (por exemplo `~/.claude/skills/replica-lgpd`):

```bash
python3 $SKILL/lgpd.py varrer .                                    # terceiros no código
python3 $SKILL/lgpd.py verificar replica/dados.csv --config replica/lgpd.json \
    --codigo . --out replica/lgpd-verificacao.md                   # a trava: sai 1 se há erro
python3 $SKILL/lgpd.py prazo-incidente "2026-10-09 14:00" --pequeno-porte
```

Modelos: `dados.example.csv`, `lgpd.example.json`, `politica.md`. Leis,
resoluções, limites e datas: `referencias.md` (abra quando precisar citar
artigo ou conferir um valor).

## As regras

- **Não é parecer jurídico.** A skill aponta o que falta e monta os
  documentos. Com dado sensível, crianças, decisão automatizada ou dinheiro em
  jogo, recomende revisão por um advogado antes do lançamento.
- **Nada inventado.** Não invente artigo, prazo, nem a situação de um
  fornecedor. Se você não sabe se o fornecedor X oferece as cláusulas-padrão
  da ANPD, é certificado no Data Privacy Framework, ou se o usuário já aceitou
  o DPA, use `"a_confirmar"` no `lgpd.json` e diga onde olhar (a página de
  DPA do fornecedor, dataprivacyframework.gov). `a_confirmar` conta como erro
  até alguém confirmar, então a trava não deixa passar.
- **O usuário aceita os contratos.** Você não aceita DPA, termos ou
  cláusulas em nome dele, não cria conta e não nomeia o encarregado. Prepara
  tudo e diz o que ele precisa fazer.
- **Menos dado é menos problema.** O clone não precisa de todo campo que o
  original coleta. Corte antes de proteger.

## Passo 1: escopo

- **Público.** A LGPD vale quando o serviço é oferecido a pessoas no Brasil
  ou os dados são coletados aqui, onde quer que a empresa esteja (art. 3º). O
  GDPR vale quando você oferece a pessoas na UE ou monitora o comportamento
  delas (art. 3(2)). Grave `"publico": ["br"]` ou `["br", "ue"]`.
- **Papéis.** Controlador é quem decide para que e como os dados são usados.
  Operador trata em nome de outro. Titulares são as pessoas.
  - Para os dados dos seus clientes (conta, cobrança, logs, analytics), a
    empresa do usuário é **controladora**.
  - Quando os clientes usam o app para coletar dados das pessoas *deles*
    (convidados de uma agenda, pacientes, alunos, os contatos de um CRM), o
    cliente é o controlador e a empresa do usuário é **operadora** desses
    dados. Isso muda três coisas: a base legal é do cliente (marque
    `papel=operador` no `dados.csv`), é preciso oferecer aos clientes um
    contrato de tratamento (`dpa_para_clientes`, GDPR art. 28(3), LGPD
    art. 39), e pedidos e incidentes desses titulares vão para o cliente.
  - Os fornecedores (hospedagem, banco, email, pagamentos) são operadores da
    empresa do usuário.
- **Pequeno porte** (Resolução CD/ANPD 2/2022): ME (receita até R$ 360 mil
  por ano), EPP (até R$ 4,8 milhões), startup (até R$ 16 milhões), MEI e
  similares, desde que sem tratamento de alto risco. Alto risco é ter ao menos
  um critério geral (larga escala, ou impacto significativo nos direitos dos
  titulares) e um específico (tecnologia emergente, vigilância de área
  pública, decisão tomada só por meio automatizado, inclusive perfilamento,
  dado sensível ou de criança, adolescente ou idoso). Quem é pequeno porte
  fica dispensado de indicar encarregado (mas precisa de um canal para o
  titular), faz registro simplificado e tem prazos em dobro. Com dado sensível
  ou de crianças, trate como se não fosse até um advogado confirmar.

## Passo 2: o inventário

```bash
python3 $SKILL/lgpd.py varrer .
```

Mostra os serviços de terceiros que aparecem no código (lista em
`sdks.json`, edite se usar outro). Ele lê código, `package.json` e
`.env.example`, e nunca abre `.env` ou `.env.local`.

Depois preencha `replica/dados.csv` (modelo: `dados.example.csv`): uma linha
por grupo de dados, vindo do schema, dos formulários, dos logs, do analytics,
dos emails e dos arquivos enviados. Na coluna `colunas`, diga onde cada grupo
está no schema (`users.email; users.name`, ou `bookings.*`). Com `--codigo`,
a verificação lê as migrações SQL e o `schema.prisma` e avisa de toda coluna
com cara de dado pessoal que não aparece em nenhuma linha.

Para cada coluna, veja se o fluxo principal precisa dela. Se não precisa,
proponha ao usuário uma migração que a remove e anote em `replica/lgpd.md`.
Não edite migrações já aplicadas.

Marque `sensivel=sim` para origem racial ou étnica, religião, opinião
política, filiação a sindicato ou organização religiosa, filosófica ou
política, saúde, vida sexual, dado genético ou biométrico (art. 5º, II).
Login por rosto e selfie de verificação são biometria. Marque `crianca=sim`
para dados de menores de 18 anos.

**Campos que o cliente define** (perguntas personalizadas, notas,
anexos) podem receber dado sensível sem você saber: um terapeuta pergunta o
motivo da consulta, uma clínica pede o convênio. Escolha uma das duas saídas
e registre em `replica/lgpd.md`: proibir nos termos e avisar na tela de criar
o campo, ou suportar (o cliente marca o campo como sensível, o titular vê uma
caixa de consentimento desmarcada, a resposta fica criptografada, com
retenção curta e fora de emails, SMS, logs e analytics).

## Passo 3: as bases legais

Ponto de partida para um SaaS (linhas com `papel=controlador`):

| dado | base_lgpd | base_gdpr | por quê |
| --- | --- | --- | --- |
| conta, login, o serviço em si | contrato | contract | sem isso não há serviço |
| pagamento e cobrança | contrato | contract | |
| nota fiscal e registros fiscais | obrigacao_legal | legitimate_interests | lei fiscal brasileira não é lei da UE (GDPR art. 6(3)) |
| logs de acesso (Marco Civil, 6 meses) | obrigacao_legal | legitimate_interests | idem |
| erros, segurança, antifraude | legitimo_interesse | legitimate_interests | faça o teste de balanceamento |
| newsletter e email de marketing | consentimento | consent | caixa desmarcada, descadastro em todo email |
| analytics com cookie, pixels | consentimento | consent | quem decide é o banner |
| dado sensível | consentimento (específico e destacado) ou outra hipótese do art. 11 | explicit_consent em `condicao_art9`, mais uma base do art. 6 | |

- **Consentimento** é livre, informado, para finalidade certa e registrado
  (quando, o quê, qual versão do texto). Revogar tem de ser tão fácil quanto
  dar (art. 8º, §5º). Nunca escondido nos termos de uso.
- **Legítimo interesse** (nas duas leis) pede o teste de balanceamento do
  guia da ANPD: finalidade legítima, necessidade, expectativa do titular,
  salvaguardas. Registre em `replica/lgpd.md` e dê ao titular como se opor.

## Passo 4: operadores e transferências

Preencha os operadores em `replica/lgpd.json` (modelo:
`lgpd.example.json`): `nome`, `servico`, `pais`, `dpa`, `mecanismo_br`,
`mecanismo_ue`. O que você não sabe fica `"a_confirmar"`.

- **pais** é onde os dados ficam e de onde o fornecedor acessa. Região São
  Paulo numa empresa dos EUA continua sendo EUA, a menos que o contrato
  garanta o contrário.
- **dpa**: a maioria dos fornecedores tem um contrato de tratamento padrão no
  painel ou no site. O usuário aceita, guarda a cópia, e só então vira `true`.
- **Do Brasil para fora** (LGPD art. 33, Resolução CD/ANPD 19/2024):
  - UE e EEE: `adequacao` (Resolução CD/ANPD 32/2026, janeiro de 2026).
  - Qualquer outro país, EUA incluídos: `clausulas_padrao`, as cláusulas
    da ANPD no contrato com o fornecedor. Desde 23/08/2025, quem usa cláusula
    contratual tem de usar o modelo da ANPD; as SCCs europeias sozinhas não
    servem. Veja se o fornecedor oferece um aditivo para o Brasil. Se não
    oferecer, peça, troque de fornecedor ou fale com um advogado.
- **Da UE para fora** (GDPR cap. V): o Brasil é adequado (decisão da Comissão
  Europeia de janeiro de 2026), então operador brasileiro não precisa de
  mecanismo. Para os EUA, `dpf` se o fornecedor é certificado (confira em
  dataprivacyframework.gov), senão `sccs`, que costumam vir no DPA.
- **Representante na UE** (GDPR art. 27): quem oferece de forma contínua a
  pessoas na UE sem ter estabelecimento lá precisa de um. A exceção é só para
  tratamento ocasional e de baixo risco; se for o caso, escreva
  `"dispensado: <motivo>"`. Sem representante, a alternativa é adiar a UE.
- **Menos transferência:** região São Paulo onde houver (AWS sa-east-1;
  Supabase e Vercel também têm São Paulo), e meios de pagamento brasileiros
  (Mercado Pago, Pagar.me, Asaas), que ainda trazem Pix.

## Passo 5: os direitos dentro do produto

Construa com a `/replica-backend`, numa tela "Privacidade e dados" nas
configurações:

- **baixar meus dados** em JSON (acesso e portabilidade)
- **corrigir** o que estiver errado
- **excluir a conta** de verdade, inclusive nos operadores
- **revogar** cada consentimento
- **com quem compartilhamos**, com o país de cada operador
- o **canal do titular** ou do encarregado, no rodapé e na política

Titulares de dados em que você é operador (o convidado, o paciente do
cliente) precisam de um caminho também: um link "gerenciar meus dados" que
encaminha o pedido ao cliente e registra o encaminhamento.

Se o app decide sozinho sobre pessoas (crédito, aprovação, ranking),
explique os critérios e ofereça revisão (art. 20). Registre cada pedido e a
resposta, com data: é a prova de que o prazo foi cumprido.

## Passo 6: cookies e consentimento

- Só cookies essenciais (sessão, CSRF, preferências)? Não precisa de banner,
  basta explicar na política. Analytics sem cookie (Plausible ou contagem no
  servidor) evita o banner.
- Com analytics ou publicidade: banner no padrão europeu, que também atende
  o guia de cookies da ANPD. Aceitar e recusar com o mesmo destaque, nada
  pré-marcado, categorias separadas, scripts bloqueados até o aceite,
  revogável a qualquer momento, consentimento registrado.
- Fonte pela CDN do Google e embed comum do YouTube mandam o IP do visitante
  aos EUA: hospede a fonte, use youtube-nocookie.com.

## Passo 7: segurança e incidentes

- A segurança vem do checklist da `/replica-backend` (LGPD art. 46, GDPR
  art. 32). Acrescente: criptografia em trânsito e em repouso, acesso mínimo
  ao banco de produção, backup testado, logs de acesso guardados por 6 meses,
  sob sigilo.
- Escreva em `replica/lgpd.md` o plano de resposta: quem decide e quem
  substitui, como conter, como avaliar o risco, e os modelos de comunicação
  para a ANPD (formulário no site dela), para os titulares (o que houve,
  quais dados, quais riscos, o que foi feito, contato) e, nos dados em que
  você é operador, para o cliente.
- Num incidente, rode `python3 $SKILL/lgpd.py prazo-incidente "AAAA-MM-DD HH:MM"`:
  3 dias úteis para ANPD e titulares (6 no pequeno porte, salvo risco à
  integridade física ou moral), 72 horas para a autoridade europeia. Registre
  todo incidente, mesmo os não comunicados, e guarde por 5 anos.

## Passo 8: crianças e adolescentes

Se o app é para menores de 18 ou tende a ser usado por eles:

- LGPD art. 14: melhor interesse; para crianças (menores de 12 anos), o
  consentimento é dado por um dos pais ou pelo responsável legal, específico
  e em destaque.
- ECA Digital (Lei 15.211/2025, em vigor desde 17/03/2026, com
  regulamentação da ANPD ainda saindo): verificação de idade confiável (não
  vale autodeclaração) para conteúdo impróprio, configurações mais protetivas
  por padrão, nada de perfilamento para publicidade, ferramentas de supervisão
  dos pais, nada de dark patterns.
- GDPR art. 8: consentimento dos pais abaixo de 16 anos (cada país da UE pode
  baixar até 13).

Se o app não é para menores, diga isso nos termos e não desenhe para eles.
Se ainda assim é provável que usem, leve a um advogado.

## Passo 9: os documentos

- **Política de privacidade** a partir de `politica.md`, com as tabelas do
  relatório. Na língua do público: português para Brasil e Portugal; para
  outros países da UE, inglês ou a língua local. Linguagem simples, só o que
  está em `dados.csv`, nada copiado da política do app original. Publicada em
  `politica_url`, no rodapé, no cadastro e nas lojas (Apple e Google exigem).
- **Termos de uso**, separados da política.
- **Contrato de tratamento para os clientes**, se houver dados em que você é
  operador.
- **Registro das operações** (LGPD art. 37, GDPR art. 30): a tabela do
  relatório.
- **RIPD ou DPIA** quando houver alto risco (LGPD art. 38, GDPR art. 35).
- **Teste de balanceamento** para cada legítimo interesse.
- **DPAs** dos fornecedores aceitos, com cópia guardada.

## Passo 10: além da LGPD

Regras que encostam na privacidade e no lançamento:

- **Marco Civil da Internet** (Lei 12.965/2014, art. 15): empresa que opera
  aplicação na internet com fins econômicos guarda os logs de acesso por 6
  meses, sob sigilo.
- **Código de Defesa do Consumidor**, art. 49: em venda ao consumidor pela
  internet, ele pode desistir em 7 dias e receber tudo de volta.
- **Decreto 7.962/2013**: o site mostra razão social, CNPJ, endereço e
  contato, e oferece canal de atendimento e meio de arrependimento.
- **Consumidor na UE** (Diretiva 2011/83/UE): 14 dias para desistir de
  contrato feito à distância.

Passe os três últimos para a `/replica-launch` (preços e termos).

## Passo 11: a trava

```bash
python3 $SKILL/lgpd.py verificar replica/dados.csv --config replica/lgpd.json \
    --codigo . --out replica/lgpd-verificacao.md
```

Sai com 1 quando há erro: base legal faltando ou inválida, dado sensível sem
hipótese do art. 11, transferência sem mecanismo ou `a_confirmar`, DPA não
aceito com público na UE, terceiro no código que não foi declarado,
encarregado, canal ou representante na UE faltando, valor do exemplo
esquecido no `lgpd.json`. Zero erros antes da `/replica-deploy`: acrescente
ao checklist de `replica/deploy.md` a linha
`- [ ] lgpd.py verificar: 0 erros`. Leia cada aviso, decida e escreva a
decisão em `replica/lgpd.md`.

## Saída

`replica/dados.csv`, `replica/lgpd.json`, `replica/lgpd-verificacao.md`,
`replica/lgpd.md` (decisões, teste de balanceamento, plano de incidente,
pendências do usuário, mudanças no produto), o rascunho da política, e um
resumo: público, papéis, pequeno porte ou não, erros e avisos, para onde os
dados vão, e o que o usuário precisa fazer (aceitar DPAs, confirmar os
`a_confirmar`, nomear encarregado ou canal, revisar com advogado). Depois:
`/replica-test` se ainda está construindo, ou `/replica-deploy`.
