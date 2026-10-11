# Recon map: Linktree (web responsivo)

Escopo: o núcleo (conta, editor de links, página pública, aparência, insights,
plano pago) mais o formulário de captura de email dos visitantes.
Para: produto para vender no Brasil, para criadores e pequenos negócios.
Data: 2026-10-10

## Como esta recon foi feita

- Só fontes públicas. Nenhuma conta do Linktree foi usada, nenhum código do app
  foi lido, nenhuma API não oficial. Um "Linktree API" de terceiros
  (ScrapeCreators) apareceu na busca e foi descartado: é raspagem.
- A rede do ambiente bloqueou `linktr.ee`, `help.linktr.ee`, `apps.apple.com` e
  `play.google.com`. **Em 2026-10-11, com a rede aberta, as páginas oficiais
  foram lidas e o que mudou está em "Confirmações", no fim.** As páginas foram lidas pela busca na web, que traz resumos
  das páginas públicas. O que só uma fonte de terceiros afirma está marcado como
  **(não confirmado)**.
- Ainda não há screenshots em `replica/screens/` (ver "Pendências").

## Fontes

| # | fonte | URL | o que deu |
| --- | --- | --- | --- |
| 1 | ajuda: Insights | https://help.linktr.ee/en/articles/5434178-understanding-your-insights | métricas: views, views únicas, cliques, cliques únicos, taxa de clique, mais clicados, fontes de tráfego, países e cidades |
| 2 | ajuda: captura de email | https://help.linktr.ee/en/articles/5434187-how-to-collect-email-sign-ups-on-your-linktree | link do tipo formulário, modelos, campos (email, nome, telefone, dropdown) |
| 3 | ajuda: integrações de audiência | https://linktr.ee/help/en/articles/11069074-setting-up-third-party-audience-integrations | aba Audience, exportar CSV com senha enviada por email, integrações (Pro e Premium) |
| 4 | ajuda: aparência | https://help.linktr.ee/en/articles/8614125-customize-your-linktree-appearance | tema customizável: texto, cores, botões, header, fundo |
| 5 | ajuda: temas | https://help.linktr.ee/en/articles/5434137-choose-a-theme-for-your-linktree | temas grátis e temas pagos marcados com raio |
| 6 | ajuda: fonte | https://help.linktr.ee/en/articles/5549899-how-to-change-your-font-and-font-color | fonte e cor do texto valem para a página toda |
| 7 | ajuda: fundo com imagem ou vídeo | https://linktr.ee/help/en/articles/5434177-how-to-add-a-custom-image-or-video-background-to-your-linktree | upload de imagem ou vídeo; Unsplash e Canva |
| 8 | ajuda: ícones sociais | https://help.linktr.ee/en/articles/5434155-how-to-display-your-social-icons-on-your-linktree | adicionar por plataforma, reordenar arrastando, posição topo ou rodapé |
| 9 | ajuda: foto de perfil | https://help.linktr.ee/en/articles/9036585-add-or-change-your-linktree-profile-image | header com layouts Classic e Hero (Hero e outros são pagos) |
| 10 | ajuda: agendar links | https://help.linktr.ee/en/articles/5434174-schedule-links-on-your-linktree | data e hora para aparecer e sumir, com fuso; Starter ou acima |
| 11 | ajuda: recursos pagos | https://linktr.ee/help/en/articles/5434140-an-overview-of-paid-features-available-on-linktree | destaque e animação de links, período maior de Insights |
| 12 | ajuda: conteúdo sensível | https://linktr.ee/help/en/articles/5434166-sensitive-content-labels | tela de confirmação 18+, 21+, 25+ ou "conteúdo sensível", na página toda ou num link |
| 13 | ajuda: trava de idade | https://linktr.ee/help/en/articles/5443080-age-lock-on-links | visitante digita a data de nascimento antes de abrir o link |
| 14 | ajuda: excluir conta ou perfil | https://linktr.ee/help/en/articles/5434126-how-to-delete-your-linktree-account-or-profile | vários perfis por conta; exclusão permanente; username e email bloqueados por 14 dias |
| 15 | ajuda: trocar username | https://linktr.ee/help/en/articles/5434119-change-your-linktree-username | uma troca a cada 7 dias, só na web |
| 16 | ajuda: vídeo do YouTube | https://linktr.ee/help/en/articles/5434857-how-to-display-a-youtube-video-playlist-or-channel-on-your-linktree | tocar o vídeo na página ou mandar para o YouTube |
| 17 | página de recurso: formulários | https://linktr.ee/features/contact-forms | inscritos no painel Audience, exportação |
| 18 | página de recurso: integrações de email | https://linktr.ee/features/email-integrations | Mailchimp, Klaviyo, Kit, Beehiiv, Google Sheets; sincroniza envios passados e futuros |
| 19 | página de recurso: analytics | https://linktr.ee/features/analytics | o que é grátis e o que é pago em analytics |
| 20 | regras da comunidade | https://linktr.ee/s/community-standards/ | conteúdo adulto só como link marcado sensível, nunca em imagens |
| 21 | TechCrunch, agendar e arquivar links (2024) | https://techcrunch.com/2024/01/29/linktree-launches-features-to-schedule-and-archive-links/ | agendar, desativar automaticamente, destacar e animar |
| 22 | Supademo, fluxo de cadastro | https://supademo.com/user-flow-examples/linktree | pergunta o tipo de conta no cadastro; 31 passos até compartilhar o link (análise de terceiros) |
| 23 | ajuda (espelho Intercom), cadastro | https://intercom.help/linktree-ff524ba1864c/en/articles/5434134-how-to... | email, username que vira a URL, plano, links, tema |
| 24 | preços (resumo de terceiros; página oficial bloqueada) | https://www.saasworthy.com/product/linktree/pricing | Free, Starter, Pro, Premium; taxas sobre vendas |
| 25 | preços (resumo de terceiros) | https://www.elev8or.io/blog/bio/linktree-pricing | Starter US$ 8, Pro US$ 15, Premium US$ 35 por mês (não confirmado; os valores em dólar não deu para conferir daqui, ver "Confirmações") |
| 26 | Hypebot, marketplace (2022) | https://www.hypebot.com/hypebot/2022/06/linktree-launches-marketplace-to-showcase-spotify-tiktok-bandsintown-and-30-app-integrations.html | mais de 30 apps integrados (Spotify, Twitch, YouTube...) |
| 27 | apis.io, servidor MCP | https://apis.io/providers/linktree/ | sem API pública geral; servidor MCP com ferramentas para perfis, links, coleções, aparência e analytics (**confirmado** em 2026-10-11 no próprio servidor, ver "Confirmações") |

## Ciclo principal

O criador monta uma página com os links dele e põe o endereço na bio. O
visitante abre a página e clica. O criador vê o que foi clicado e de onde veio
o público. Quem paga, paga por: tirar a marca do rodapé, temas e layouts melhores,
Insights por mais tempo, agendar e destacar links, integrações de email.

## Telas

| ID | tela | rota ou como chegar | para quê | componentes principais | estados |
| --- | --- | --- | --- | --- | --- |
| S01 | cadastro | `/cadastro` | criar conta por email ou Google | input, botão, OAuth | vazio, erro (email em uso, senha fraca), carregando |
| S02 | confirmar email | link no email | ativar a conta | mensagem, reenviar | enviado, expirado, já confirmado |
| S03 | escolher username | onboarding | definir a URL `/username` | input com checagem ao vivo, prévia da URL | livre, ocupado, inválido, reservado |
| S04 | tipo de conta e modelo | onboarding | sugerir modelo de página pela categoria | cards de categoria, galeria de modelos | nada escolhido, escolhido |
| S05 | plano | onboarding e configurações | escolher grátis ou pago | cards de plano, comparação | grátis selecionado, pago selecionado |
| S06 | editor de links | `/admin` | montar a página | header editável, lista arrastável, botão adicionar, ícones sociais, coleções, prévia de celular | vazio (primeiro link), com links, muitos links, salvando, erro |
| S07 | editar um link | inline na S06 | título, URL e opções do link | inputs, upload de miniatura, agendamento, trava, destaque, alternar visível | novo, editando, URL inválida, agendado, travado, recurso pago bloqueado |
| S08 | aparência | `/admin/aparencia` | tema e estilo | galeria de temas, cor, fonte, botões, fundo, layout do header | tema pronto, customizado, recurso pago bloqueado |
| S09 | insights | `/admin/insights` | métricas | cards de número, gráfico, ranking de links, fontes, mapa ou lista de locais, período | sem dados, com dados, período limitado pelo plano |
| S10 | audiência | `/admin/audiencia` | ver e exportar inscritos | tabela, exportar CSV, integrações | vazio, com inscritos, exportação enviada |
| S11 | editor do formulário | inline na S06 (link do tipo formulário) | campos do formulário | lista de campos, tipo, obrigatório, modelo | vazio, editando |
| S12 | configurações da página | `/admin/configuracoes` | conteúdo sensível, QR code | toggles, seletor de rótulo, baixar QR | sem rótulo, com rótulo |
| S13 | conta | `/admin/conta` | username, perfis, exclusão | lista de perfis, menu de ações, zona de perigo | normal, troca bloqueada (7 dias), confirmar exclusão |
| S14 | assinatura | `/admin/plano` | assinar, mudar, cancelar | cards, checkout, portal de cobrança | grátis, pago, pagamento falhou, cancelado |
| S15 | página pública | `/username` | o que o visitante vê | header, ícones sociais, botões de link, coleções, vídeo, formulário, rodapé com marca (grátis) | normal, link agendado escondido, perfil inexistente (404), perfil excluído, celular |
| S16 | aviso de conteúdo sensível | antes da S15 ou de um link | confirmar idade ou ciência | mensagem, botões, data de nascimento | aviso, idade insuficiente |
| S17 | inscrição enviada | na S15, depois do formulário | confirmar ao visitante | mensagem | enviado, erro, email inválido |
| S18 | entrar e recuperar senha | `/entrar` | acesso | inputs, OAuth, link de recuperação | erro, email de recuperação enviado |
| S19 | QR code | modal na S12 | baixar o QR da página | imagem, download | padrão; cor e logo (pago) |

## Fluxos

```
F01 Criador cria a página e compartilha
    S01 -> S02 -> S03 -> S04 -> S05 -> S06 (primeiro link) -> copiar a URL
    passos no original: 31 até compartilhar, segundo a Supademo (não confirmado)
    meta do clone: até 8 cliques do cadastro até a URL copiada
    edge: username ocupado ou reservado, email já usado, abandona no meio e volta

F02 Criador adiciona e organiza links
    S06 adicionar -> S07 título e URL -> arrastar para reordenar -> coleção
    edge: URL sem https, URL inválida, link repetido, título de 80 caracteres,
          emoji, 100 links, desligar sem excluir

F03 Criador personaliza a aparência
    S08 escolher tema -> customizar cor, fonte, botão, fundo -> ver na prévia
    edge: contraste ruim, imagem pesada, vídeo de fundo no celular, tema pago no plano grátis

F04 Visitante abre a página e clica num link
    S15 -> (S16 se houver aviso) -> link externo, com o clique contado
    edge: perfil inexistente, perfil excluído, link agendado fora da janela,
          robô ou pré-visualização de rede social não conta, celular lento

F05 Visitante deixa o email
    S15 bloco do formulário -> S17
    edge: email inválido, repetido, envio duplo, robô, consentimento

F06 Criador acompanha os resultados
    S09 escolher período -> ver ranking, fontes, locais
    edge: sem dados ainda, fuso horário, período maior que o do plano

F07 Criador exporta os inscritos
    S10 exportar CSV -> email com o link de download
    edge: lista vazia, arquivo grande, link expirado

F08 Criador agenda ou destaca um link
    S07 agendar (com fuso) ou destacar -> S15 mostra ou esconde no horário
    edge: horário de verão, fim antes do começo, recurso pago no plano grátis

F09 Criador assina um plano
    S14 escolher plano -> checkout -> recursos liberados; cancelar pelo portal
    edge: cartão recusado, voltar ao grátis com recursos pagos configurados

F10 Criador troca o username ou exclui a conta
    S13 trocar (1 vez a cada 7 dias) ou excluir (perfil ou conta inteira)
    edge: username liberado só depois de 14 dias, confirmação forte antes de excluir

F11 Criador marca a página ou um link como sensível
    S12 ou S07 escolher o rótulo -> S15 mostra o aviso S16 antes
    edge: idade insuficiente, aviso em link dentro de página sem aviso
```

## Componentes

| componente | variantes | estados | usado em |
| --- | --- | --- | --- |
| Botão | primário, secundário, fantasma, perigo | normal, hover, foco, desabilitado, carregando | todas |
| Botão de link público | quadrado, arredondado, pílula; cheio, contorno, sombra | normal, hover, foco, destacado (animado) | S15 |
| Input e textarea | texto, URL, email, senha, busca | vazio, preenchido, erro, desabilitado | S01, S03, S07, S11, S18 |
| Toggle | | ligado, desligado, bloqueado (pago) | S06, S07, S12 |
| Card de link editável | link, cabeçalho, vídeo, formulário | normal, arrastando, desligado, agendado, travado | S06 |
| Lista arrastável | | parada, arrastando, soltando | S06, ícones sociais |
| Prévia de celular | | atualizando | S06, S08 |
| Card de tema | grátis, pago | normal, selecionado, bloqueado | S08 |
| Seletor de cor e de fonte | | aberto, fechado | S08 |
| Upload de imagem | avatar, miniatura, fundo | vazio, enviando, erro de tamanho ou tipo | S06, S07, S08 |
| Data e hora com fuso | | vazio, válido, fim antes do começo | S07 |
| Card de número e gráfico | | sem dados, com dados, carregando | S09 |
| Tabela | | vazia, com linhas, paginada | S10 |
| Selo de recurso pago e convite para assinar | | | S07, S08, S09, S12 |
| Linha de ícones sociais | topo, rodapé | | S06, S15 |
| Bloco de formulário público | | vazio, erro, enviado | S15, S17 |
| Tela de aviso | 18+, 21+, 25+, sensível, data de nascimento | | S16 |
| Modal e toast | | | todas |
| QR code | padrão, personalizado | | S19 |

## Modelo de dados inferido

```
Conta       id, email, senha (hash) ou login social, plano, cliente de cobrança, criada_em
            evidência: S01, S14, ajuda "excluir conta"          confiança: alta

Perfil      id, conta_id, username (único; troca a cada 7 dias; liberado 14 dias
            após exclusão), titulo, bio, avatar_url, layout_header (classic | hero),
            posicao_icones (topo | rodape), rotulo_sensivel (nenhum | 18 | 21 | 25 |
            sensivel), excluido_em
            evidência: ajuda de vários perfis, username, exclusão, conteúdo sensível
            confiança: alta

Link        id, perfil_id, colecao_id?, posicao, tipo (link | cabecalho | video |
            formulario), titulo, url, miniatura_url, ativo, inicio_em?, fim_em?, fuso,
            trava (nenhuma | sensivel | idade:N), destaque (nenhum | animar | spotlight)
            evidência: S07, ajuda de agendar, trava de idade, TechCrunch
            confiança: média-alta

Colecao     id, perfil_id, titulo, posicao                    confiança: média
IconeSocial id, perfil_id, plataforma, url, posicao           confiança: alta
Aparencia   perfil_id, tema_id ou customizado {fundo (cor | gradiente | imagem |
            video), botao {forma, preenchimento, sombra, cor, cor_texto},
            fonte {familia, cor}}                             confiança: média
Formulario  link_id, campos [{rotulo, tipo (email | nome | telefone | lista | texto),
            obrigatorio, opcoes}]                             confiança: média
Inscricao   id, perfil_id, formulario_id, valores (json), criada_em
            evidência: ajuda de captura e exportação         confiança: média
Evento      id, perfil_id, link_id?, tipo (view | clique | inscricao), em,
            visitante (para contar únicos), pais, cidade, origem, dispositivo
            evidência: ajuda de Insights (únicos, fontes, locais)
            confiança: média; como o original identifica o visitante único é palpite
Assinatura  conta_id, plano (gratis | starter | pro | premium), status, fim_periodo
            confiança: alta
Integracao  perfil_id, provedor, status                       confiança: média (could)
```

Relações: Conta 1-n Perfil; Perfil 1-n Link, Colecao, IconeSocial, Evento,
Inscricao; Colecao 1-n Link; Link (formulário) 1-n Inscricao.

## Matriz de funcionalidades

Ver `features.csv`. Must: 18, should: 13, could: 8, skip: 5.

## Fora do escopo (não pode ou não deve ser clonado)

- O marketplace de apps e as integrações dos parceiros (Spotify, TikTok,
  Bandsintown...): é a rede de parceiros deles.
- Loja, afiliados e venda de produtos: fora da fatia escolhida.
- App mobile: a plataforma escolhida é web.
- Recursos de IA e os quadros de stickers de 2026: fora do núcleo. Os de IA estão confirmados no changelog oficial (ver "Confirmações"); os stickers, não conferidos.
- A marca, o verde, o logotipo, os textos e os modelos de tema do Linktree.
- Domínio próprio: as fontes se contradizem sobre o original ter ou não. Fica
  como candidato a melhoria na `/replica-entrepreneur`, não como paridade.

## Notas para as próximas skills

- **/replica-lgpd:** a página guarda dados de visitantes (IP vira país e cidade,
  contagem de únicos) e o formulário coleta dados das pessoas do criador. O app
  é controlador dos dados dos criadores e operador dos dados dos visitantes que
  o criador coleta. O aviso de conteúdo sensível e a trava de idade puxam a
  parte de crianças e o ECA Digital. Analytics sem cookie evita o banner.
- **/replica-entrepreneur:** um blog de terceiros dizia que os termos do Linktree
  de julho de 2026 passaram a prever compartilhamento de dados com a OpenAI.
  **Confirmado em 2026-10-11** (está no Aviso de Privacidade, com como desligar;
  ver "Confirmações"). As avaliações mostram o desconforto, mas fraco: 6, todas
  dos EUA (`replica/fixes.md`).
- **/replica-backend:** cobrança no Brasil com Pix (Mercado Pago, Pagar.me ou
  Asaas) em vez de só cartão.

## Pendências

- **Screenshots** em `replica/screens/` (1440x900 e 390x844): páginas públicas
  de perfis (por exemplo `linktr.ee/linktree`), a página de preços e as telas
  da loja de apps. Precisa liberar os domínios na rede do ambiente ou o
  usuário salvar as capturas.
- **Página de preços oficial** para confirmar planos, valores e o que cada um
  libera.
- **Conta própria (opcional):** se o usuário tiver uma conta no Linktree, ler
  os termos antes. Alguns serviços proíbem usar a conta para construir um
  concorrente; nesse caso, ficamos só nas fontes públicas.

## Tamanho

Telas 19, fluxos 11, entidades 11. Partes difíceis: analytics de visitantes
únicos sem rastrear mais do que precisa (LGPD) e aguentando volume de eventos;
lista arrastável acessível com prévia ao vivo; tema customizável que mantém o
contraste; exportação de CSV com link por email; cobrança com Pix.
Tamanho: **M** (algumas semanas) para o escopo todo. A fatia vertical (conta,
username, links, página pública, contagem de cliques) cabe num fim de semana.

## Confirmações (2026-10-11)

Feitas com a rede aberta, nas páginas oficiais. Os artigos de ajuda foram
lidos um a um (as URLs antigas de `help.linktr.ee` redirecionam para
`linktr.ee/help/...`). Os 31 passos do cadastro (fonte 22) continuam de
terceiros: confirmar exige uma conta própria.

### Preços e planos

[linktr.ee/s/pricing](https://linktr.ee/s/pricing/), aberta do Brasil em
2026-10-11. A página mostra a moeda local ("shown in local currency"): daqui
saem **reais**. Os valores em dólar das fontes 24 e 25 não deu para
conferir daqui e seguem não confirmados.

| plano | por mês, cobrado por ano | por mês, cobrado por mês | o que acrescenta (na página) |
| --- | --- | --- | --- |
| Free | grátis | grátis | links básicos ilimitados; inscrição por email e telefone |
| Starter | R$ 15 | R$ 22 | página personalizada; links em destaque ilimitados; analytics básico |
| Pro | R$ 32 | R$ 42 | tirar a marca do rodapé; designs próprios; vender com 0% de taxa; integrações de lista de email; teste grátis de 7 dias |
| Premium | R$ 94 | R$ 123 | regras de link; integrações de IA; analytics de todo o período; exportar dados; agendar posts; respostas automáticas no Instagram; teste grátis de 7 dias |

O rodapé do site tem "Português (Brasil)". A ficha do app na App Store (API
de consulta da Apple, 2026-10-11) lista o português entre os idiomas.

### Tabela de fontes, linhas 1 a 16

| # | resultado | precisão ou correção |
| --- | --- | --- |
| 1 | corrigido | views, únicos, cliques, taxa e fontes confirmados; "mais clicados" e visitantes (fontes de tráfego, países, cidades, aparelhos) só no Pro e Premium. Histórico: Free 28 dias, Starter 90, Pro 365, Premium todo o período |
| 2 | corrigido | o formulário é um "Contact Form" adicionado como link, em branco ou de modelo; a página não lista os tipos de campo. Sincronizar com terceiros: Pro e Premium |
| 3 | corrigido | o CSV é de todos os planos, inclusive o Free; a senha do arquivo é a pessoa quem define, e o email leva só o link. Integrações (Google Sheets, Mailchimp, Kit, Klaviyo, Beehiiv, Flodesk): Pro e Premium |
| 4 | confirmado | o artigo mudou de endereço (`8614125-customizing-your-linktree-design`). No Free o fundo é cor sólida; imagem ou vídeo, Pro e acima |
| 5 | confirmado | temas com raio: Pro e Premium (não Starter) |
| 6 | corrigido em parte | fonte e cor valem para a página toda, mas a cor do texto do botão é à parte, e há uma fonte alternativa para o título, no Pro e Premium |
| 7 | confirmado | Pro e Premium. Imagem até 10 MB; vídeo até 50 MB, em loop e sem som; Unsplash, Canva e Coverr |
| 8 | confirmado | um ícone por plataforma, arrastar para reordenar, topo ou rodapé; sem plano citado |
| 9 | confirmado | cinco layouts de cabeçalho: Classic (grátis), Hero, Banner, Cutout e Shape (Pro e Premium) |
| 10 | confirmado | aparecer e sumir com data, hora e fuso: Starter, Pro e Premium |
| 11 | corrigido (precisão) | Insights: Starter 90 dias, Pro 365, Premium todo o período. Pro e Premium: cabeçalho Hero, tirar a marca do rodapé, QR code personalizado, integrações de audiência, Meta Pixel, UTM, Google Analytics |
| 12 | confirmado | 18+, 21+, 25+ e "Sensitive Content", na página toda ou num link; nenhum plano citado |
| 13 | confirmado | data de nascimento antes de abrir o link, idade mínima escolhida pelo criador; nenhum plano citado |
| 14 | confirmado | vários perfis por conta; não dá para desfazer; username e email indisponíveis por 14 dias |
| 15 | corrigido | uma troca a cada 7 dias, confirmado. "Só na web" a página não diz. Se o username antigo fica guardado, e por quanto tempo, a página não diz |
| 16 | confirmado | tocar o vídeo na página ou ir para o YouTube; o último vídeo automático e as playlists, Pro e Premium |

### Os quatro "não confirmados"

| item | resultado | fonte | data |
| --- | --- | --- | --- |
| preços | confirmados em reais (tabela acima); em dólar, não | [linktr.ee/s/pricing](https://linktr.ee/s/pricing/) | 2026-10-11 |
| domínio próprio | **não tem**: "We don’t offer the option to use a custom domain to replace the linktr.ee URL" (artigo de 2024-10-15) | [ajuda 6571689](https://linktr.ee/help/en/articles/6571689-can-i-change-the-linktree-url-to-a-custom-domain) | 2026-10-11 |
| servidor MCP | **existe**, no domínio deles: `mcp.linktr.ee/mcp` responde 401 sem token; o OAuth sai de `ciam.linktr.ee`; a documentação lista 34 ferramentas (perfis, links, coleções, aparência, redes, workspaces, analytics, mensagens) e erro `UPGRADE_REQUIRED` para opções pagas | [mcp.linktr.ee/docs](https://mcp.linktr.ee/docs), [metadados OAuth](https://mcp.linktr.ee/.well-known/oauth-protected-resource) | 2026-10-11 |
| dados com a OpenAI nos termos de julho de 2026 | **procede, com nuance**. Termos e Aviso de Privacidade em vigor desde 5 de julho de 2026. Termos, seção 14 ("Generative AI"): entradas e saídas dos recursos de IA podem ir para "service providers (including AI model providers)". Aviso de Privacidade: dados do perfil vão para integrações "such as OpenAI" (exemplo: buscar perfis pelo app deles dentro do ChatGPT, com foto, bio resumida e métricas), e não em todas as regiões (não na União Europeia). Dá para desligar o compartilhamento nas configurações da conta, mas o que já foi compartilhado fica com o terceiro. A cláusula está no Aviso de Privacidade, não nos Termos | [Termos](https://linktr.ee/s/terms), [Aviso de Privacidade](https://linktr.ee/s/privacy) | 2026-10-11 |

### Changelog

O oficial fica no Beamer, linkado no rodapé do blog:
[app.getbeamer.com/linktree/en](https://app.getbeamer.com/linktree/en),
lido em 2026-10-11. Os lançamentos desde 2024 estão em `replica/fixes.md`
("O que o original já resolveu"). Os recursos de IA (chatbot, 2024-12;
design e títulos com IA, 2025-09; Insights Chat, 2026-03) estão
confirmados.

### Efeito na `features.csv`

Nenhuma linha mudou de `original`. As notas ganharam o plano que cada recurso
exige no original. Domínio próprio não tem linha (o original não tem, e nas
avaliações o pedido é fraco: 2).
