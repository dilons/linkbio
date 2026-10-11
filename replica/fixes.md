# Correções e ângulo

`/replica-entrepreneur` com avaliações reais, em 2026-10-11. Saída do
`reviews.py` em `replica/feedback.md`; temas em `replica/temas.json`.

## A amostra

| fonte | como | linhas | período |
| --- | --- | --- | --- |
| App Store, EUA | feed RSS oficial da Apple (as 500 mais recentes que o feed dá) | 500 | 2023-03 a 2026-10 |
| App Store, Brasil | o mesmo feed (todas as que existem) | 83 | 2022-07 a 2026-09 |
| App Store, Portugal | o mesmo feed | 6 | 2022-07 a 2026-03 |
| Hacker News | API do Algolia: 285 citam o nome, **18** opinam sobre o produto | 18 | 2021-08 a 2026-09 |

**605 avaliações** (duas repetidas tiradas) de **2 plataformas**, 587 com
estrelas. Passa das 100, mas **não fecha a meta de três fontes**: as três
lojas da Apple são uma plataforma só. Falta pelo menos uma das que você cola à
mão (`replica/coleta.md`): Google Play, Trustpilot, Capterra, GetApp, G2 ou
Reclame Aqui. O Reddit precisa da sua chave.

As 267 linhas do Hacker News que só citam o nome (link de currículo, artista
divulgando a página, notícia, a proibição de agregadores no Twitter em 2022)
estão em `replica/reviews-fora.csv`, com o motivo, e não voltam numa coleta
nova.

**Viés que pesa na leitura:** 97% da amostra é avaliação do **app de iOS**
deles. Login em loop, tela branca e "use pelo navegador" são problemas do app
de celular, que o Chamaqui (só web) não tem. O que transfere é o que está por
baixo: perder o acesso à página, não ter quem ajude, ser cobrado sem esperar.

Em "fontes" abaixo, conto plataformas (App Store e Hacker News), não lojas de
país. Tema com menos de 3 avaliações ou de uma plataforma só está marcado
como **fraco**. "BR" é quantas vêm da App Store do Brasil.

## 1. O que eles odeiam

| # | problema | avaliações | fontes | BR | últimos 18 meses | exemplos |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Erros, travamentos e tela branca no app | 109 | 1 (**fraco** por fonte) | 19 | 52 | "It just crashes when you try to add a link." [EUA, 2026-08](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-14476334677); "Péssimo, tudo trava e dá erro o tempo todo" [BR, 2025-06](https://apps.apple.com/br/app/id1593515263?see-all=reviews#review-12794988574) |
| 2 | Não consegue entrar: login em loop, código que não chega, deslogado do nada | 84 | 1 (**fraco** por fonte) | 18 | 22 | "Puts me in a loop between login screen and the welcome/create account/login screen." [EUA, 2025-10](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-13216298693); "Não consigo entrar na minha conta, fica no looping eterno" [BR, 2025-10](https://apps.apple.com/br/app/id1593515263?see-all=reviews#review-13231465590) |
| 3 | Suporte que demora dias ou não responde | 38 | 1 (**fraco** por fonte) | 2 | 14 | "Takes days to get a response and after confirming a bunch of information they expect you to provide the date you opened your account." [EUA, 2026-08](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-14462664580); "Sem suporte. Nota zero." [BR, 2025-11](https://apps.apple.com/br/app/id1593515263?see-all=reviews#review-13444290255) |
| 4 | Preço alto e o grátis encolhendo | 36 | 2 | 4 | 19 | "charging $20 a month for something that’s literally just a page of links is wild." [EUA, 2025-11](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-13436718702); "Raised the price of the starter tier and removed features that were previously free in it." [EUA, 2025-11](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-13384868107); "it makes me nuts that there are some paid functions that really should be free." [HN, 2026-05](https://news.ycombinator.com/item?id=47978875) |
| 5 | Cobrança sem aviso, cancelamento difícil, estorno que não vem | 33 | 1 (**fraco** por fonte) | 6 | 13 | "They charge without notifications, renew without authorizations and never refund." [EUA, 2026-06](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-14236916982); "debitaram 122 da minha conta e não tive retorno do estorno ou do que fazer!!!!!!" [BR, 2025-02](https://apps.apple.com/br/app/id1593515263?see-all=reviews#review-12305991736) |
| 6 | Uma atualização piorou | 17 | 1 (**fraco**) | 0 | 10 | "Used to run perfectly, but the last few updates have rendered the app useless." [EUA, 2026-09](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-14500161878) |
| 7 | O app do celular é pior que o site | 15 | 1 (**fraco**) | 2 | 7 | "Don’t waste your time downloading the app, just use the browser version on a computer." [EUA, 2026-09](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-14508265614); "Está pior do que usar pelo navegador, que já é ruim!" [BR, 2025-07](https://apps.apple.com/br/app/id1593515263?see-all=reviews#review-12868529520) |
| 8 | Conta suspensa ou marcada sem dizer o motivo nem o link | 14 | 1 (**fraco**) | 0 | 6 | "reached out multiple times for help on which link they were referring to so I can delete and have my account in good standing and have not received any help." [EUA, 2025-11](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-13413549284); "Linktree gave me NO warning and just deactivated my account ultimately hurting my business." [EUA, 2024-06](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-11425999060) |
| 9 | Reordenar e pôr links em coleções não funciona | 14 | 1 (**fraco**) | 2 | 2 | "I try to move my links around to order them and they move in the opposite direction I am moving them to." [EUA, 2024-12](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-12057263950) |
| 10 | Empurra o plano pago: pop-ups, avisos e emails, até para quem já paga | 12 | 2 | 0 | 8 | "The constant popups on the app to upgrade to the pro version feel extremely predatory." [EUA, 2026-04](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-13928748683); "Every second a popup is blocking me from trying to do what I need to do." [EUA, 2025-05](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-12615052068) |
| 11 | Editor confuso | 12 | 1 (**fraco**) | 2 | 4 | "Getting the app or website to get you to the free option is nearly impossible." [EUA, 2025-05](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-12685943987) |
| 12 | Lento ou pesado | 10 | 2 | 1 | 4 | "pages loading very slowly and, at times, failing to load altogether." [EUA, 2026-03](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-13844326345); "an (empty) linktree profile is 1MB" [HN, 2022-10](https://news.ycombinator.com/item?id=33286315) |
| 13 | Link que não abre no Instagram ou no TikTok, ou marcado como inseguro | 9 | 1 (**fraco**) | 2 | 4 | "Instagram states “This site’s security certificate is not trusted” while Twitter is just a blank screen." [EUA, 2025-10](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-13316776607) |
| 14 | Inacessível com leitor de tela, depois de uma atualização | 7 | 1 (**fraco**) | 0 | 7 | "this app is no longer usable for voiceover users" [EUA, 2026-02](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-13713928675); "I open it and my screen reader isnt able to read anything on it." [EUA, 2026-06](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-14246885929) |
| 15 | Termos novos: conteúdo dos usuários para IA | 6 | 1 (**fraco**) | 0 | 6 | "Apparently linktree plans to feed everyone's images into Open AI's DALL-E program with no way to opt out starting on June 5th." [EUA, 2026-05](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-14129966794); "They updated their terms of service so they get to do whatever they want with your content" [EUA, 2026-08](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-14463952153) |

Fracos e soltos: privacidade e rastreamento (4, uma fonte); "You may also
like", que leva o visitante para a página de outra pessoa (1:
"The last thing I want when someone on my link in bio page is for them to be
tempted to navigate to somebody else’s page."
[EUA, 2023-11](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-10642314579)).

Sobre o item 15: as seis são de maio a agosto de 2026, todas dos EUA. Elas
falam de uma mudança nos termos de uso, mas **são avaliações, não os
termos**. A afirmação sobre os termos é conferida na recon (item 1.2), na
página oficial.

## 2. O que falta

| # | pedido | avaliações | fontes | BR | últimos 18 meses | exemplos |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Personalizar sem pagar: cor de fundo, forma do botão, fonte | 39 | 2 | 2 | 8 | "You have to pay to put a solid color background ? Ridiculous." [EUA, 2023-09](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-10352201202); "I can't customize my buttons to be rounded unless I use a template?" [EUA, 2025-04](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-12559995354) |
| 2 | Métricas no grátis, e números que batem | 21 | 2 | 1 | 10 | "Basic accounts don’t get basic analytics." [EUA, 2025-07](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-12901295441); "the analytics are always different some saying more. Some less it is not consistent at all." [EUA, 2026-03](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-13885709740) |
| 3 | O app em português | 13 | 1 (**fraco**) | 12 | **0** | "poderia ficar mais se tivesse idioma português" [BR, 2024-03](https://apps.apple.com/br/app/id1593515263?see-all=reviews#review-11043212277). **Já resolvido pelo original**: o app lista o português (PT) entre os idiomas (API de consulta da Apple, 2026-10-11) e a última reclamação é de 2025-03 |
| 4 | Receber as comissões e vender pela página | 11 | 1 (**fraco**) | 0 | 6 | "I have yet to be paid from commissions earned in August 2025 up until now." [EUA, 2026-10](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-14643389906) |
| 5 | Várias páginas sem pagar outra conta | 7 | 2 | 1 | 2 | "In order to have 2 linktrees, they tell you to upgrade to a pro account." [EUA, 2023-07](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-10129577918); "Só acho que poderiam para adicionar mais contas." [BR, 2022-08](https://apps.apple.com/br/app/id1593515263?see-all=reviews#review-8938486956) |
| 6 | Exportar os contatos | 3 | 2 | 0 | 3 | "Literally can’t handle a basic function of showing the button to export CSV files" [EUA, 2026-04](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-13965242158) |

Fracos: agendar link (2), link de grupo do WhatsApp (2: "Não está mais
aceitando link de grupo do WhatsApp!"
[BR, 2025-10](https://apps.apple.com/br/app/id1593515263?see-all=reviews#review-13282599583)),
tirar a marca ou usar domínio próprio (2).

**Zero menções**, em 605 avaliações, a Pix, reais, R$ ou boleto.

## 3. O que ninguém resolve

| grupo | o que falta para ele | avaliações | fontes |
| --- | --- | --- | --- |
| Quem depende da página para trabalhar | não perder o acesso, ter alguém que responda e ser avisado antes de qualquer suspensão (temas 2, 3 e 8 juntos) | 118 sem repetir; 109 de 1 a 3 estrelas | 1 (**fraco** por fonte) |
| Quem paga e se sente enganado | preço que não sobe tirando recurso, cobrança avisada e estorno que chega, nenhum pop-up empurrando plano (temas 4, 5 e 10 juntos) | 68 sem repetir; 62 de 1 a 3 estrelas ou sem nota | 2 |
| Pessoas cegas que usam leitor de tela | o app parou de funcionar com o VoiceOver numa atualização | 7, todas de 2025-09 a 2026-08 | 1 (**fraco**) |
| Quem não quer o próprio conteúdo usado por IA | termos que não dão o conteúdo para IA; o original vai no sentido contrário (ver "o que já resolveram") | 6, mais 4 de privacidade | 1 (**fraco**) |
| Agências e quem cuida de várias páginas | várias páginas sem uma conta paga para cada | 7 | 2 |

## O que o original já resolveu

O changelog oficial (Beamer, linkado no rodapé do blog deles;
[app.getbeamer.com/linktree/en](https://app.getbeamer.com/linktree/en), lido
em 2026-10-11) e a ficha do app, para não "consertar" o que já está feito:

| data | o que lançaram | efeito nas listas |
| --- | --- | --- |
| 2026-03-24 | "Insights Chat", conversa com IA sobre as métricas | nenhum tema pede isso; reforça a direção de IA |
| 2025-09-24 | ferramentas de design com IA ("Enhance"), **prévia ao vivo antes de publicar**, títulos sugeridos por IA, temas e fontes novos (vídeo e fundo animado só no Pro) | a reclamação de não ver o design enquanto edita ([EUA, 2025-01](https://apps.apple.com/us/app/id1593515263?see-all=reviews#review-12222153688)) foi resolvida |
| 2024-12-13 | chatbot com IA na página | |
| 2024-09-04 | DM automática no Instagram | |
| 2024-05-29 | link com código de desconto | |
| 2024-03-24 | link de texto, com descrição | o pedido de descrição em cada link ([HN, 2024-09](https://news.ycombinator.com/item?id=41463961)) foi resolvido |
| (ficha da App Store) | o app em português | pedido 3 do "o que falta" resolvido |

O changelog não fala de login, estabilidade, acessibilidade, cobrança nem
preço: os temas 1, 2, 3, 5 e 14 continuam abertos. A página
[linktr.ee/whats-new](https://linktr.ee/whats-new) tem só dois textos de
dicas (setembro e outubro de 2026).

## O plano de correções

Evidência vezes custo, conferido contra o que o Chamaqui já faz hoje
(`features.csv`, build `97b7057`). As oito estão na `features.csv` com
`original` = `no`, o que não mexe no placar de paridade.

| # | o que fazer | tamanho | skill | evidência | estado no Chamaqui |
| --- | --- | --- | --- | --- | --- |
| 1 | **Cobrança sem susto.** Aviso 3 dias antes de **toda** renovação (hoje só no Pix), email de "cancelado, sem novas cobranças", recibo com o link de cancelar. Sem teste grátis que vira cobrança | S | `/replica-backend` | cobrança, 33 (1 fonte); "charge without notifications" | **feito em 2026-10-11** (`replica/build-log.md`): lembrete em toda forma, recibo na renovação, email de cancelado |
| 2 | **Nada de empurrar o plano.** Nenhum pop-up de upgrade; o recurso pago aparece com selo, sem tapar a tela; nenhum email de venda sem pedir; o que é grátis hoje continua grátis (escrito na página de preço) | S | `/replica-launch`, `/replica-brand` | upsell, 12 (2 fontes); preço, 36 (2) | o painel não tem pop-up hoje; falta a promessa escrita e uma checagem na `/replica-test` |
| 3 | **Personalização básica no grátis.** Cor de fundo, forma do botão e fonte no plano grátis | M | `/replica-build` (S08) | personalização, 39 (2 fontes) | 5 temas prontos, todos grátis; o tema customizável é should-have na fila |
| 4 | **Métricas no grátis, com período, e que batem.** Período escolhido, fontes e locais sem pagar; os números da tela batem com a soma diária | M | `/replica-build` (S09) | métricas, 21 (2 fontes) | **feito em 2026-10-11**: os quatro períodos, origens, aparelho, país e cidade, todos grátis |
| 5 | **Acesso que não se perde.** Entrar por um link no email quando a senha falha; contato no painel, em português, com prazo de resposta escrito | M | `/replica-build`, `/replica-launch` (operação) | login, 84; suporte, 38 (1 fonte, quase tudo do app de iOS) | recuperar a senha por email já existe e é testado; sem entrar por link e sem canal de suporte |
| 6 | **Moderação que explica.** Denúncia de link; tira só o link, não a página; email dizendo qual link e qual regra; botão de contestar | M | `/replica-backend`, `/replica-lgpd` (revisão de decisão automatizada, LGPD art. 20) | conta suspensa, 14 (1 fonte, **fraco**) | não existe; precisa existir antes do lançamento de qualquer jeito (abuso) |
| 7 | **Termos sem IA.** Escrito nos termos e na página de preço: o que o criador publica não treina IA nem vai para serviço de IA de terceiros | S | `/replica-lgpd` | IA e termos, 6, mais privacidade, 4 (1 fonte, **fraco**, todas de 2026) | o produto não tem IA; falta escrever |
| 8 | **Leitor de tela de verdade.** A passada manual M5 (VoiceOver e TalkBack) antes do lançamento, e o axe já roda em cada tela | S | `/replica-test` | acessibilidade, 7 (1 fonte, **fraco**) | axe com 0 violações e testes só de teclado; M5 pendente |

Já resolvido no Chamaqui e apontado como dor do original:

- **reordenar** com mouse ou teclado, com anúncio em português (F02-H2);
- **tudo pelo navegador do celular**, sem app (os testes rodam a 390 px);
- **exportar os inscritos** em CSV direto, sem integração paga (F07);
- **página sem "You may also like"**: ninguém é levado para outra página.

O link de grupo do WhatsApp (`chat.whatsapp.com/...`) entra como link comum.
Vale um caso de teste.

Preço (temas 4 e 5) vai para a `/replica-launch`: comparar com os preços
oficiais confirmados no item 1.2 da recon.

## Os ângulos

**A. Sem pegadinha no dinheiro.** (recomendado)

> Para quem paga por uma página de links e sente que é empurrado a pagar
> mais a cada tela, o Chamaqui tem um preço só, em reais, avisa antes de
> cobrar, cancela em um clique e nunca tira do grátis o que já deu.
> Evidência: preço, cobrança e upsell, 68 avaliações sem repetir, de 2
> fontes (33 dos últimos 18 meses).

**B. Sua página não some.**

> Para quem vive do link na bio e já ficou sem acesso, ou com a página
> derrubada sem explicação, o Chamaqui deixa entrar por email quando a senha
> falha, responde em português com prazo e, se precisar tirar algo, tira só
> o link e diz por quê.
> Evidência: login, suporte e suspensão, 118 avaliações sem repetir, de 1
> fonte, quase todas do app de iOS deles.

**C. Para todo mundo, e sem IA no seu conteúdo.**

> Para quem usa leitor de tela, ou não quer o próprio trabalho alimentando
> IA, o Chamaqui funciona com VoiceOver e TalkBack e não entrega o seu
> conteúdo para IA.
> Evidência: acessibilidade, 7; IA e termos, 6; privacidade, 4. Fraco: uma
> fonte, todas dos EUA.

**Por que A.** É o único bloco grande com duas fontes. O Chamaqui já entrega
metade (cancelar em um clique, Pix, lembrete antes do Pix) e o resto é
barato (correções 1 e 2). B tem mais avaliações, mas de uma fonte só e quase
todas sobre o app de iOS, que o Chamaqui não tem. Funciona como segundo
recado, com as correções 5 e 6. C é fraco demais para liderar.

**Provisório.** A recomendação vale para 605 avaliações de 2 plataformas.
Google Play, Trustpilot, Capterra, G2 e Reclame Aqui podem mudar a ordem,
principalmente o Reclame Aqui, que é a voz do Brasil que a App Store não
traz.

## Comparado com o mock

O mock (`replica/mock/fixes.mock.md`) recomendava **"feito para quem vende no
Brasil"**: Pix, reais e português, com 9 a 11 avaliações (inventadas) de 4
fontes. Nos dados reais, **esse ângulo não se sustenta**:

- **Pix, reais, R$, boleto:** 0 menções em 605 avaliações, 83 delas do
  Brasil.
- **Vender ou clientes:** 0 menções nas brasileiras. "Vender" aparece só nas
  dos EUA, sobre as comissões dos produtos do próprio original.
- **WhatsApp:** 2 (uma do Brasil), sobre link de grupo.
- **Português:** era um pedido real do Brasil (12 avaliações, de 2022 a
  2025), mas o original já resolveu.
- **O que os brasileiros reclamam** é o mesmo que os americanos: login (18
  de 83), erros (19), cobrança (6), preço (4).

O que o mock acertou: cobrança e cancelamento, suporte e conta suspensa estão
nos dados reais. O que errou: o peso do Brasil e a dor do dólar.

Ser em reais, com Pix e em português continua sendo **como** o Chamaqui
entrega o ângulo A no Brasil. Só não é **o motivo** que as avaliações dão
para trocar.

Isso mexe na `/replica-brand`:

- **A voz** quase não muda. "Confiável, não burocrática. Diz o que acontece
  com o dinheiro" já é o ângulo A.
- **Os textos** voltados para "o que você vende" (home, descrição do site,
  editor vazio) passam a falar de preço claro e controle. A troca fica na
  tabela das 10 strings da `brand.md` (Parte 2, item 1).
- **O nome** "Chamaqui" (o "chama aqui" de quem vende no WhatsApp) não
  contradiz o ângulo A, mas deixa de dizê-lo. A decisão é sua: manter (o
  nome não precisa carregar o ângulo) ou reabrir a lista da `brand.md`
  antes de gastar com o INPI.

`replica/mock/` continua lá até você pedir para apagar.
