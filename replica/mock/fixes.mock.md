# Correções e ângulo (MOCK)

> **MOCK. Dados fictícios, não é pesquisa.** Tudo aqui sai das 60 avaliações
> inventadas de `reviews.mock.csv` (fontes `mock-*`, links `.invalid`). Serve
> para ver o formato e o caminho até o app; **não decide nada**. Antes de
> usar na `/replica-brand` ou na `/replica-launch`, rode com as avaliações de
> verdade (`replica/coleta.md`) e escreva o `replica/fixes.md` real. Os
> números abaixo são do mock e vão mudar.

Amostra: 60 avaliações (mock) de 4 fontes (mock), 48 com estrelas. Abaixo de
100 e de fontes reais, isto é um esqueleto, não uma direção.

## 1. O que eles odeiam

| # | problema | avaliações | fontes | exemplo (mock) |
| --- | --- | --- | --- | --- |
| 1 | Preço alto e cobrado em dólar, com IOF | 11 | 4 | "O plano pago vem em dólar e ainda tem IOF." [001](https://mock.invalid/avaliacao/001) |
| 2 | Cobrança depois de cancelar, cancelamento difícil, reembolso que não vem | 6 | 3 | "Couldn't find where to cancel, got charged twice." [032](https://mock.invalid/avaliacao/032) |
| 3 | Suporte que não responde, robô, só em inglês | 6 | 3 | "Customer support is a chatbot loop." [024](https://mock.invalid/avaliacao/024) |
| 4 | Conta suspensa ou excluída sem aviso nem motivo | 5 | 4 | "Excluíram minha conta por "violação" e não disseram qual." [018](https://mock.invalid/avaliacao/018) |
| 5 | Login com quebra-cabeça que não passa; sem como recuperar | 4 | 2 | "O quebra-cabeça da verificação aparece toda vez e nunca aceita." [004](https://mock.invalid/avaliacao/004) |
| 6 | Página lenta no 4G | 3 | 3 | "A página demora para abrir no 4G." [046](https://mock.invalid/avaliacao/046) |
| 7 | Atualização que piorou o editor | 3 | 3 | "Era melhor antes." [053](https://mock.invalid/avaliacao/053) |
| 8 | Erros e travamentos | 3 | 3 | "Trava toda vez que tento salvar um link novo." [012](https://mock.invalid/avaliacao/012) |

Ralos (menos de 3 avaliações): editor confuso (2), link marcado pelo
Instagram (2), rastreamento de visitantes (2).

## 2. O que falta

| # | pedido | avaliações | fontes | exemplo (mock) |
| --- | --- | --- | --- | --- |
| 1 | Pagar com Pix ou boleto, em reais, e tudo em português | 9 | 4 | "Não tem boleto nem Pix." [020](https://mock.invalid/avaliacao/020) |
| 2 | Tirar a marca do rodapé e usar domínio próprio sem o plano mais caro | 6 | 4 | "I wish I could remove the logo without upgrading." [025](https://mock.invalid/avaliacao/025) |
| 3 | Captar emails e exportar CSV sem integração paga | 4 | 3 | "Would be great to export subscribers as CSV without connecting a paid email tool." [031](https://mock.invalid/avaliacao/031) |
| 4 | Métricas por período e de onde vem o acesso, no grátis | 4 | 3 | "Can't compare months." [039](https://mock.invalid/avaliacao/039) |
| 5 | Mais temas, fontes e fundos no grátis | 4 | 3 | "the free ones all look the same." [034](https://mock.invalid/avaliacao/034) |

Ralos: app do celular (2), agendar link (2), vender pelo link (2, uma fonte),
várias páginas num login (2).

## 3. O que ninguém resolve

| grupo | o que falta para ele | avaliações | fontes |
| --- | --- | --- | --- |
| Quem vende e atende no Brasil | Pix, preço em reais, suporte em português, consentimento da LGPD no formulário | 9 a 11 (os temas 1 do "odeiam" e 1 do "falta") | 4 |
| Agências e quem cuida de várias páginas | várias páginas num login só | 2 (ralo) | 2 |
| Lojas pequenas no WhatsApp | catálogo e botão de comprar pelo WhatsApp | 2 (ralo) | 1 |
| Músicos | datas de show sem integração paga | 1 (ralo) | 1 |

## O plano de correções (MOCK)

Evidência do mock vezes o custo, conferido contra o que o linkbio já faz
hoje (`features.csv`, build `1d81dac`). Os itens ainda **não** foram para a
`features.csv`: entram quando os dados reais confirmarem.

| # | o que fazer | tamanho | skill | evidência (mock) | estado no linkbio |
| --- | --- | --- | --- | --- | --- |
| 1 | **Moderação que avisa antes.** Email com o link e a regra, prazo para corrigir (fora conteúdo ilegal), botão de contestar, e exportar os dados mesmo com a página suspensa | M | `/replica-backend`, `/replica-lgpd` (revisão de decisão, LGPD art. 20) | conta suspensa, 5 de 4 fontes | não existe |
| 2 | **Suporte em português com prazo.** Formulário de contato no painel, resposta de gente em 1 dia útil, prometido na página | M | `/replica-build`, `/replica-launch` | suporte, 6 de 3 fontes | não existe |
| 3 | **Cobrança sem susto.** Email a cada cobrança com o link de cancelar; email de "cancelado, sem novas cobranças" | S | `/replica-backend` | cobrança, 6 de 3 fontes | cancelar em um clique já existe; faltam os emails |
| 4 | **Preço em reais, com Pix e boleto** | S | `/replica-launch` (preço) | preço e Brasil, 11 + 9 de 4 fontes | feito no código (Asaas); falta validar no sandbox e definir o preço |
| 5 | **Login sem quebra-cabeça.** Verificação invisível (Turnstile) só depois de tentativas suspeitas; recuperar por email | S | `/replica-backend` | login, 4 de 2 fontes | recuperar por email já existe; sem captcha hoje |
| 6 | **Página leve no 4G.** Orçamento de peso, cache da página pública, medir em 4G | M | `/replica-build` | lento, 3 de 3 fontes | página sem cache ainda (build-log, S15) |
| 7 | **Métricas por período e origem no grátis** | M | `/replica-build` | métricas, 4 de 3 fontes | só os últimos 7 dias (should-have já na fila) |
| 8 | **Domínio próprio no plano pago mais barato** | L | `/replica-backend`, `/replica-deploy` | marca e domínio, 6 de 4 fontes | marca sai no Pro; domínio próprio não existe |

Já resolvido no linkbio e que o mock aponta como dor do original: formulário
de email com o consentimento gravado (LGPD) e CSV baixado direto, sem
integração paga (F05, F07); interface e emails em português.

Linhas para a `features.csv` quando os dados reais confirmarem (com
`original` = `no`): moderação com aviso e contestação; suporte em português
com prazo; emails de cobrança com link de cancelar; login com verificação só
quando suspeito; página pública abaixo de um peso alvo; domínio próprio no
plano pago.

## O ângulo (MOCK)

**A. Feito para quem vende no Brasil.** (recomendado, se os dados reais
confirmarem)

> Para quem vende e atende pelo Instagram no Brasil e cansou de pagar em
> dólar e falar com robô em inglês, o linkbio cobra em reais, com Pix, e
> responde em português.
> Evidência (mock): preço e cobrança em dólar, 11 avaliações de 4 fontes;
> Pix, reais e português, 9 de 4; suporte, 6 de 3.

**B. A página que não some.**

> Para quem vive do link na bio e tem medo de acordar com a página fora do
> ar, o linkbio avisa antes, diz o motivo e dá prazo para corrigir.
> Evidência (mock): conta suspensa sem aviso, 5 avaliações de 4 fontes.

**C. Contatos com a LGPD em dia.**

> Para quem junta contatos pela bio, o linkbio guarda o consentimento de cada
> pessoa e entrega a lista em CSV, sem integração paga.
> Evidência (mock): captura e exportação, 4 de 3 fontes; rastreamento, 2
> (ralo).

Por que A: é o tema com mais avaliações e mais fontes no mock, e o linkbio
já entrega boa parte (Pix pelo Asaas, tudo em português). B é um bom segundo
recado e um recurso que o original não tem. O nome do original não entra no
nome do app, nos anúncios nem na loja; página de comparação é assunto para um
advogado no Brasil.
