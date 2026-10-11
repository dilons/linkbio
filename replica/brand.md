# Marca: Chamaqui

`/replica-brand` em 2026-10-11. Nome de trabalho escolhido pelo dono entre os
cinco finalistas. **As buscas de marca ainda não foram feitas** (a rede deste
ambiente bloqueia INPI, USPTO, EUIPO, WIPO, whois e as lojas): antes de gastar
com o nome (domínio, logo, registro), rodar as checagens abaixo e a
`/replica-inpi`. O nome está num lugar só (`src/lib/marca.ts`), então trocar
custa uma linha.

## O ângulo

Do `replica/mock/fixes.mock.md`, que é **mock** (avaliações fictícias, ver o
`LEIA-ME` de lá): "feito para quem vende e atende pelas redes no Brasil",
com cobrança em reais e Pix e resposta em português. O nome e a voz partem
dessa hipótese. Se as avaliações reais apontarem outro ângulo, revisar.

## O nome

### Os 20 candidatos e o corte

| estilo | candidato | ficou? | por quê |
| --- | --- | --- | --- |
| descritivo | Vitrine | não | palavra comum, muito usada no comércio: marca fraca |
| descritivo | Balcão | finalista | o balcão onde se vende e atende; mas palavra comum e com til no domínio |
| descritivo | Na Bio | não | colado em "link na bio" e nos nomes com "bio" da categoria |
| descritivo | Lojinha | não | genérico, usado por muitas lojas |
| composto | Vendezap | não | "zap" remete ao WhatsApp: risco com a marca de outra empresa |
| composto | Bioloja | não | "bio" de novo, perto dos concorrentes |
| composto | **Chamaqui** | **escolhido** | "chama aqui", o convite que todo vendedor põe na bio; uma palavra só, inventada |
| composto | Tudoaqui | não | frase comum, nome de muitas lojas |
| inventado | Logali | finalista | de "logo ali"; distintivo, mas pode ser lido como "logo" |
| inventado | Pertim | não | regional (mineiro) e grafia ambígua (pertim, pertin) |
| inventado | Vitri | não | derivado de vitrine, perto das marcas com esse nome |
| metáfora | Plaquinha | finalista | a plaquinha do balcão com o @ e o QR; calorosa, mas longa e comum |
| metáfora | Cartaz | finalista | "ter cartaz" é ser procurado; mas palavra comum |
| metáfora | Banca | não | ambíguo (banca de jornal, de advogados, de prova) |
| metáfora | Feira | não | genérico demais |
| metáfora | Quintal | não | fala de casa e lazer, não de vender |
| verbo | Chama | não | comum; a forma composta (Chamaqui) diz mais e é mais distintiva |
| verbo | Toca | não | perto de uma marca conhecida de jogos (classe 9) |
| verbo | Bora | não | usado por muitos apps |
| verbo | Achei | não | usado por classificados |

Nenhum tem árvore, galho, raiz ou folha, nem trocadilho com o nome do
original, nem é um "-ly" dele.

### As checagens

Triagem, não liberação jurídica. Antes de gastar com o nome, um advogado de
marcas faz a busca de verdade. "a rodar" = ninguém rodou ainda.

| checagem | Chamaqui | Logali | Plaquinha | Cartaz | Balcão |
| --- | --- | --- | --- | --- | --- |
| Brasil, INPI (pePI), classes 9, 35, 42 | a rodar (`/replica-inpi`) | a rodar | a rodar | a rodar | a rodar |
| EUA (tmsearch.uspto.gov, 9 e 42) | a rodar | a rodar | a rodar | a rodar | a rodar |
| UE (EUIPO eSearch ou TMview) | a rodar | a rodar | a rodar | a rodar | a rodar |
| Canadá (ised-isde.canada.ca) | a rodar | a rodar | a rodar | a rodar | a rodar |
| global (WIPO Global Brand Database) | a rodar | a rodar | a rodar | a rodar | a rodar |
| domínio .com.br (Registro.br) | a rodar | a rodar | a rodar | a rodar | a rodar |
| domínio .com (whois) | a rodar | a rodar | a rodar | a rodar | a rodar |
| App Store e Google Play (nome exato) | a rodar | a rodar | a rodar | a rodar | a rodar |
| perfis (Instagram, TikTok, X, GitHub) | a rodar | a rodar | a rodar | a rodar | a rodar |
| nome empresarial (Junta Comercial) | a rodar | a rodar | a rodar | a rodar | a rodar |
| web: "nome + categoria" | **2026-10-11**: nenhum app ou serviço com o nome; os resultados foram para o Cerro Champaquí (Argentina), outra grafia | **2026-10-11**: nenhum app com o nome; só nomes parecidos de outras áreas (Logi-App, LogDog) | **2026-10-11**: nada com o nome na categoria | **2026-10-11**: nenhum app de link na bio; "Cartaz" aparece como categoria de design no Canva | **2026-10-11**: nada específico na categoria |

A busca na web foi feita por uma ferramenta de busca que devolve resumo e
links, não pelo Google: vale como primeiro filtro, nada mais.

Para o Chamaqui, registrar também a grafia que alguém escreve de ouvido
(`chamaaqui`) e reservar os endereços parecidos dentro do app (feito na
migração `20261011000300_reservar_marca.sql`: chamaqui, chamaaqui,
chama.aqui, chama_aqui, oficial, equipe).

## A paleta: brasa

"Chama" também é chama de fogo: a cor principal é um laranja de brasa. Longe
das cores do original (verde e violeta, abaixo), do verde-água do Pix e do
roxo de bancos digitais conhecidos. Como laranja fica perto do vermelho, o
perigo foi para o carmim, para "Excluir" não parecer a ação principal. Os
neutros puxam para o quente.

| papel | antes (provisório) | agora |
| --- | --- | --- |
| accent | #4338ca | **#c2410c** |
| accent-hover | #3730a3 | #9a3412 |
| accent-soft | #eef0ff | #fff1e8 |
| focus | #4338ca | #c2410c |
| danger | #b42318 | #b0153f |
| warning | #8f5300 | #8a4b00 |
| surface / surface-2 | #f5f6f8 / #eceef2 | #f7f5f2 / #eeeae5 |
| border / border-input | #e2e5ea / #7d8592 | #e5e0d9 / #81776d |
| text / text-muted | #15181d / #555d6b | #1a1613 / #5c534b |

Contraste (`contrast.py`, `replica/design/contrast.txt`): 42 pares, **0
falhas AA**. Texto no botão 5,18:1, foco 5,18:1 sobre o fundo, borda do campo
4,38:1. Os temas da página pública (papel, noite, areia, oceano, alto
contraste) são escolha do criador e não mudaram.

As cores vêm de um lugar só: `replica/design/tokens.json` gera
`src/app/tokens.css` e `src/lib/cores.ts` (emails e a página crua de link
indisponível) com `npm run tokens`. Os modelos de email do Supabase
(`supabase/templates`) têm as cores escritas à mão: mudar lá também.

**Cores do original** no `brand.json`, só para o sweep pegar alguma que
escape: #43e660 e #39e09b (verdes) e #7551e9 (violeta). As fontes públicas
divergem e nenhuma é a página de marca deles:
[Brandkit](https://brandkit.pro/brand/linktree),
[Brandfetch](https://brandfetch.com/linktree.com.md).

## Briefing do logo

Não é o logo: é o pedido para quem vai fazer (você, um designer ou um modelo
de imagem).

- **A ideia:** um chamado caloroso. "Chama aqui" (o convite para falar com
  quem vende) e a brasa de "chama", sem virar fogo de liquidação.
- **Tipo:** símbolo + logotipo. O logotipo em minúsculas ("chamaqui"), sem
  serifa, arredondado e humano; o símbolo sozinho funciona como ícone.
- **Tamanhos:** legível a 16 px (favicon) e bonito a 1024 px (ícone do app).
- **Cores:** brasa #c2410c com branco; tinta #1a1613. Versões positiva,
  negativa e de uma cor.
- **Entregas:** SVG (símbolo, logotipo e os dois juntos); ícone de app
  1024×1024 **sem transparência** (iOS); favicon (ICO 16/32/48, SVG e
  apple-touch-icon 180×180); imagem social 1200×630 (Open Graph, que o app
  ainda não tem).
- **Não pode lembrar a marca do original:** nada de árvore, galho, folha,
  asterisco ou forma radial, nem o par verde e violeta, nem truque de letra
  parecido. Também longe do balão redondo com telefone do WhatsApp, do losango
  verde-água do Pix e da câmera em gradiente do Instagram. Colocar os rascunhos
  ao lado desses logos e comparar antes de escolher.
- **Hoje:** um monograma "c" provisório na brasa (`src/app/icon.svg` e
  `favicon.ico`), só para a aba não mostrar o ícone padrão do Next. Sai quando o
  logo chegar.

## A voz

Três palavras, e o que cada uma não é:

- **Próxima, não íntima.** Fala de você para você, como quem atende no
  balcão. Sem gíria forçada, sem apelido, sem emoji em toda frase.
- **Direta, não seca.** Uma frase diz o que aconteceu e o que fazer agora. Sem
  "Ops!" e sem jargão; uma palavra gentil quando cabe.
- **Confiável, não burocrática.** Diz o que acontece com o dinheiro e com os
  dados, em português claro. Nada de "conforme os termos", nada de promessa
  que o produto não cumpre.

| faça | não faça |
| --- | --- |
| "Pronto, o link está na página." | "Seu link foi salvo com sucesso!!" |
| "Sem internet agora. Nada foi perdido: tente de novo quando a conexão voltar." | "Ops! Algo deu errado :(" |
| "Cobrança em reais, no Pix, no boleto ou no cartão." | "Pagamento facilitado com as melhores condições do mercado!" |
| "Cancele quando quiser, em um clique." | "O cancelamento está sujeito às condições do plano." |
| "É o endereço que vai na sua bio. Escolha com calma." | "Escolha seu username personalizado exclusivo agora mesmo!" |

### As 10 strings mais vistas, reescritas

| onde | antes | agora |
| --- | --- | --- |
| rodapé de toda página pública (o texto mais visto do app) | Feito com linkbio | **Faça a sua no Chamaqui** (agora é link para a home) |
| descrição do site (busca e prévia de link) | Todos os seus links numa página só. | Seus links, seu WhatsApp e seus contatos numa página só, para pôr na bio. |
| home | Uma página com todos os seus links, para pôr na bio. Pronta em um minuto. | Tudo o que você vende e onde te chamar, numa página só para a bio. Pronta em um minuto, grátis para começar. |
| cadastro, subtítulo | Grátis. Em um minuto você tem um endereço para pôr na bio. | Grátis para começar, sem cartão. Em um minuto sua bio ganha um endereço. |
| cadastro, botão | Criar minha conta | Criar minha página |
| escolher o endereço | É o link que você vai pôr na bio. Dá para trocar depois. | É o endereço que vai na sua bio e no seu cartão. Escolha com calma. |
| editor vazio | Sua página ainda não tem links. Comece pelo mais importante: ele vai ficar no topo. | Nada por aqui ainda. Comece pelo link que mais importa, como seu WhatsApp ou sua loja: ele fica no topo. |
| aviso de link adicionado | Link adicionado | Pronto, o link está na página |
| sem internet (todas as telas) | Sem conexão com o servidor. Confira a internet e tente de novo. | Sem internet agora. Nada foi perdido: tente de novo quando a conexão voltar. |
| endereço que não existe (404) | Essa página não existe (ainda) / Confira o endereço. Se ele estiver livre, pode ser seu. | Ninguém mora neste endereço (ainda) / Confira se digitou certo. Se o endereço estiver livre, ele pode ser seu. |

A do endereço era também uma correção: "dá para trocar depois" prometia uma
função que ainda não existe (trocar o endereço é should-have, ainda por
fazer). Os testes de ponta a ponta acompanharam os textos novos.

## O sweep

```bash
python3 ~/.claude/skills/replica-brand/sweep.py . --config replica/brand.json
```

**Limpo** em 2026-10-11 (saída 0). Antes da troca eram 10 achados: o README
apresentava o app pelo nome do original, e o script de coleta de avaliações,
que precisa citá-lo, morava em `scripts/` (foi para
`replica/ferramentas/`, a pasta de planejamento que não vai para produção).

Trocado também o nome provisório "linkbio" em tudo o que é entregue: títulos
das páginas (um modelo só no layout raiz), cabeçalhos do painel e da entrada,
endereço mostrado nas telas (`chamaqui.com.br/...`), emails do app e do login
(assuntos, logotipo em texto, cores), descrição da cobrança no Asaas, seed e
conta demo (`demo@chamaqui.test`), `project_id` do Supabase local, nome do
pacote e testes. Conferido no olho: favicon, títulos, um email renderizado e as
capturas em `replica/clone-screens/` (todas refeitas). Continuam de propósito:
"linkbio" na lista de endereços reservados (ninguém pega o nome antigo) e nos
documentos de `replica/`, que são o histórico do projeto.

## O que falta para o nome valer

1. Rodar as checagens da tabela, começando pela `/replica-inpi` (classes 9,
   35 e 42) e pelo Registro.br (`chamaqui.com.br` e `chamaaqui.com.br`).
2. Com o nome livre: registrar os domínios e os perfis, encomendar o logo com
   o briefing acima e trocar o monograma provisório.
3. Opcional: renomear o repositório `dilons/linkbio` no GitHub (o GitHub
   mantém o redirecionamento do nome antigo).
4. Quando chegarem as avaliações reais, conferir se o ângulo se mantém.
