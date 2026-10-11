# Paridade: Chamaqui × Linktree

`/replica-diff` em 2026-10-11, build `a5385ee`; recalculada no WSL em
2026-10-11, build `04d78ed`, depois da terceira `/replica-build`. Paridade
aqui é fazer o mesmo trabalho, não ter a mesma cara: a cor e o desenho de
cada tela mudam de propósito na `/replica-brand`.

## Placar

| | nota | |
| --- | --- | --- |
| **geral** | **79,0** | só funcionalidades; com o layout indicativo, 68,2 |
| funcionalidades | 79,0 / 100 (era 64,2) | 39 contadas; must-haves **17 de 18** |
| layout contra o original | 25,2 (indicativo) | só a S15, 2 larguras; captura automatizada, que os termos dele proíbem: refazer à mão (ver "Layout") |
| regressão de layout do próprio clone | 95 a 98 | as capturas passaram a ser do WSL (fonte rasterizada diferente da nuvem); mesmo desenho |
| bugs abertos | 0 S1, 0 S2, 0 S3 | nenhum S4 aberto (BUG-010 corrigido; BUG-012 e BUG-013 achados e corrigidos), ver `bugs.md` |

**Veredito: ainda não dá para lançar, por um must-have que não depende de
código:** validar a cobrança no sandbox do Asaas com a sua conta. Com ele,
a nota vai a **80,7** (calculada), a linha de lançamento. Nenhum S1 aberto.

A nota vem do jeito de contar da skill (must vale 3, should 2, could 1,
parcial vale metade; os 5 itens fora do escopo não entram, nem as 8 linhas
que são só do Chamaqui). O que existe passou em 115 casos de ponta a ponta e
56 do backend.

## Funcionalidades por área, da mais fraca para a mais forte

| área | nota | itens |
| --- | --- | --- |
| aparência | 33,3 | 5 |
| compartilhamento | 66,7 (era 0) | 2 |
| plano | 75 | 2 |
| editor | 80 (era 72) | 11 |
| onboarding | 81,2 | 6 |
| conta | 83,3 (era 50) | 3 |
| audiência | 85,7 | 3 |
| página pública | 100 (era 60) | 2 |
| insights | 100 (era 54,5) | 5 |

## O que falta, na ordem de construção

Feitos na terceira `/replica-build` (2026-10-11, WSL): aviso de conteúdo e
trava de idade (S16, S12, S07), agendar com fuso (S07), trocar o endereço
(S13), QR code (S19), insights com período, origens, locais e únicos (S09),
BUG-010 nos 15 formulários; e, do `fixes.md`, a correção 1 (cobrança sem
susto).

Must-have que falta:

1. **Plano pago validado no sandbox do Asaas** (plano, S14). Passos em
   `backend.md`; casos M3 e M4 do `test-plan.md`.

Should-haves que faltam: tema customizável (cor de fundo, botão e fonte; é
também a correção 3 do `fixes.md`, que pede no plano grátis), fundo com
imagem, miniatura no link, modelo por categoria, e o Google (pronto, falta o
app OAuth). Could-haves: os 8 da matriz.

## Layout

**Contra o original, 2026-10-11: 28,3 a 1440 e 22,2 a 390 ("different"),
indicativo.** S15 (página pública), modo layout, contra a página de uma marca
com 4 links; o clone no mesmo estado, com os mesmos 4 títulos
(`replica/clone-screens/S15-diff-*.png`). Com o layout, o `parity.py
--visual` dá **56,4** (funcionalidades 64,2, layout 25,2). A linha de
lançamento continua sendo a das funcionalidades.

**Por que indicativo.** As capturas do original foram feitas com o
Playwright, e os termos do original (em vigor desde 5 de julho de 2026)
proíbem "scripts, bots, scraping tools or other automated means or processes
to access [...] Linktree user profiles or the Platform", inclusive para quem
só visita. Por isso a captura do original e a imagem do diff **não estão no
repositório**, só os números (`replica/diffs/S15-*.json`). Para valer, você
captura no seu navegador, à mão (1440x900 e, nas ferramentas do
desenvolvedor, 390x844), salva em `replica/screens/S15-1440.png` e
`S15-390.png`, e eu rodo o `imgdiff.py` de novo.

**O que difere** (a hierarquia é a mesma: foto, links, rodapé):

- no topo, o original tem uma barra com o logo dele e um botão de
  compartilhar; o clone não tem barra;
- o original deixa mais espaço entre a foto e o primeiro link e, nessa
  página, não mostra o título; o clone mostra o nome;
- cada link do original tem miniatura e um menu "⋮" (compartilhar o link);
  o clone tem botões sem miniatura;
- a 1440, o original põe a página num cartão sobre fundo cinza; o clone usa
  uma coluna sobre o fundo do tema.

Nada disso é para copiar (é a cara dele, e a skill diz para não perseguir o
visual). Dois pontos viram funcionalidade a considerar: o **botão de
compartilhar** na página pública e a **miniatura** no link (esta já é
should-have na `features.csv`).

**Telas do painel (S06, S08, S09, S10): fora.** Os termos proíbem
"Copying, reproducing [...] the Platform or any part of it" e o uso de meios
automatizados; capturar o painel com uma conta própria para comparar com um
concorrente cai nisso. Sem essas capturas.

**Regressão do próprio clone** (modo layout e modo pixel, capturas da fatia
vertical em `0fb4ae8` contra as atuais; imagens em `replica/diffs/regressao/`):

| tela | layout | pixel | |
| --- | --- | --- | --- |
| 404 (1440) | 100 | 100 | |
| S01 cadastro (1440) | 100 | 100 | |
| S01 cadastro (390) | 100 | 100 | |
| S18 entrar (1440) | 100 | 100 | |
| S15 página da demo (390) | 100 | 100 | |
| S09 insights da demo (1440) | 99,4 | 99,9 | só os números mudaram (visitas novas da demo) |

O backend e as correções da `/replica-test` não mexeram no desenho de nenhuma
dessas telas.

## Comportamento

Fonte do lado do original: as páginas públicas listadas no recon (central de
ajuda, páginas de recurso, análises de terceiros, marcadas quando não
confirmadas). Nenhum fluxo do original foi refeito aqui: o site está bloqueado
pela rede.

| fluxo | o original faz | o clone faz | corrigir ou manter |
| --- | --- | --- | --- |
| F01 criar a página | pergunta o tipo de conta e o plano no cadastro; 31 passos até compartilhar (Supademo, não confirmado) | 6 cliques da home à URL copiada: criar conta, confirmar no email, escolher endereço, adicionar link, copiar | **manter**: bate a meta do recon (até 8). Categoria e modelo entram como passo opcional, depois |
| F01 email já cadastrado | não confirmado | mesma tela de um cadastro novo, e o dono do email recebe o caminho para entrar (não revela quem é cliente) | manter |
| F01 Google | entra com Google | pronto no código, sem o app OAuth não aparece | **corrigir** quando houver o app OAuth |
| F02 links | arrastar, coleções, miniatura, agendar (pago), destacar (pago), arquivar | arrastar com mouse ou teclado (com anúncio em português), ligar e desligar, endereço completado com `https://`, recusa `javascript:` e endereços sem domínio; redes pelo @ ou número, só com endereço da própria rede; prévia em tela cheia no celular | **manter** o teclado e a checagem do domínio das redes; **construir** coleções, miniatura, agendamento e destaque |
| F03 aparência | temas grátis e pagos, tema customizável, fundo com imagem ou vídeo | 5 temas prontos, todos grátis, com contraste conferido; a prévia muda na hora | **manter** os temas grátis; **construir** o customizável e o fundo |
| F04 visitante | rodapé com a marca no grátis; aviso de conteúdo sensível | igual no rodapé; robôs e prévias de redes não contam; `/@usuario` funciona; link desligado mostra página com volta; prévia no WhatsApp com nome e bio | **manter**; **construir** o aviso sensível |
| F05 deixar o email | formulário com email, nome, telefone, lista | email e nome opcional; o criador escreve o consentimento e ele fica gravado com cada inscrição; o mesmo email não duplica; campo isca e limite por visitante | **manter** o consentimento gravado (LGPD); **construir** o telefone |
| F06 resultados | visitas, únicos, cliques, taxa, ranking, fontes, países e cidades, período maior no pago (Free 28 dias; Starter 90; Pro 365; fontes e locais só Pro e Premium) | 7, 28, 90 dias e 12 meses, todos grátis; únicos por dia (sem cookie); série por dia, semana ou mês; ranking com únicos; origem (com QR code), aparelho, país e cidade | **manter**: mais que o grátis do original, sem cookie |
| F07 exportar inscritos | CSV por link enviado por email com senha | tabela na Audiência e CSV baixado direto (só o dono, com limite por conta), pronto para o Excel em português e com fórmulas neutralizadas | **manter**: menos passos que o original. Considerar pedir a senha de novo antes do download |
| F08 agendar ou destacar | pago (Starter ou acima) | agendar com fuso, grátis; selo no cartão; prévia e página escondem fora da janela | **manter**; **construir** o destaque (could) |
| F09 assinar | quatro planos (Starter R$ 15 a 22, Pro R$ 32 a 42, Premium R$ 94 a 123 por mês), teste grátis de 7 dias, renova sozinho | um plano, Pix, cartão ou boleto pelo Asaas, sem teste grátis; aviso 3 dias antes de toda renovação, recibo, cancelar em um clique com confirmação por email | **manter** (é o ângulo A do `fixes.md`); o preço fica para a `/replica-launch` |
| F10 excluir e trocar | exclui perfil ou conta; endereço e email bloqueados por 14 dias; troca de endereço a cada 7 dias (a ajuda não diz o que acontece com o antigo) | exclui a conta ou só a página; troca o endereço uma vez a cada 7 dias, e o antigo leva ao novo por 14 dias, guardado só para a dona | **manter**: o redirecionamento do antigo é vantagem |
| F11 conteúdo sensível | aviso 18+, 21+, 25+ ou sensível, na página ou num link; data de nascimento | o mesmo, no servidor (os links não vão no HTML antes da resposta); a data não é gravada; menor fica negado na sessão; prévia nas redes sem a bio | **manter** |
| Sessão | não confirmado | sair de todos os aparelhos vale na hora; o token vencido se renova sozinho; cookies fechados ao JavaScript | manter |

## Próximos cinco

1. **Você validar a cobrança no sandbox do Asaas** (passos em `backend.md`):
   fecha o último must-have e leva a nota a **80,7**.
2. **Tema customizável no plano grátis** (S08; correção 3 do `fixes.md`,
   39 avaliações de 2 fontes): cor de fundo, forma do botão e fonte, com o
   contraste conferido.
3. **Capturas do original à mão** (S15 a 1440 e 390) para o layout valer.
4. **Entrar por link no email** (correção 5) e **moderação que explica**
   (correção 6): a segunda precisa existir antes do lançamento de qualquer
   jeito.
5. **Miniatura no link e fundo com imagem** (S07, S08).
