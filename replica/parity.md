# Paridade: linkbio × Linktree

`/replica-diff` em 2026-10-11, build `a5385ee`; placar, lacunas e
comportamento atualizados depois da segunda `/replica-build` (build
`ecb2243`). Paridade aqui é fazer o mesmo
trabalho, não ter a mesma cara: a cor e o desenho de cada tela mudam de
propósito na `/replica-brand`.

## Placar

| | nota | |
| --- | --- | --- |
| **geral** | **64,2** | só funcionalidades; com o layout indicativo, 56,4 |
| funcionalidades | 64,2 / 100 (era 48,9) | 39 contadas; must-haves **17 de 18** (eram 11) |
| layout contra o original | 25,2 (indicativo) | só a S15, 2 larguras; captura automatizada, que os termos dele proíbem: refazer à mão (ver "Layout") |
| regressão de layout do próprio clone | 99,4 a 100 | 6 telas no mesmo estado, antes e depois do backend e das correções |
| bugs abertos | 0 S1, 0 S2, 0 S3 | 1 S4 aberto (BUG-010), ver `bugs.md` |

**Veredito: ainda não dá para lançar.** Falta 1 must-have, e ele não depende
de código: validar a cobrança no sandbox do Asaas com a sua conta. Nenhum S1
aberto. Para a linha de lançamento (80), faltam sete should-haves (abaixo).

A nota vem do jeito de contar da skill (must vale 3, should 2, could 1,
parcial vale metade; os 5 itens fora do escopo não entram). O que existe
passou em 87 casos de ponta a ponta e 37 do backend.

## Funcionalidades por área, da mais fraca para a mais forte

| área | nota | itens |
| --- | --- | --- |
| compartilhamento | 0 | 2 |
| aparência | 33,3 (era 0) | 5 |
| conta | 50 (era 25) | 3 |
| insights | 54,5 | 5 |
| página pública | 60 | 2 |
| editor | 72 (era 60) | 11 |
| plano | 75 | 2 |
| onboarding | 81,2 | 6 |
| audiência | 85,7 (era 0) | 3 |

## O que falta, na ordem de construção

Feitos na segunda `/replica-build`: temas prontos (S08), formulário de
captura de email com consentimento gravado (F05, S11, S15, S17), inscritos e
CSV (F07, S10), editor das redes sociais e prévia no celular (S06) e excluir
só a página (S13).

Must-have que falta:

1. **Plano pago validado no sandbox do Asaas** (plano, S14). O código está
   pronto e testado contra um Asaas falso; falta a sua conta de sandbox
   (passos em `backend.md`, casos M3 e M4 do `test-plan.md`).

Should-haves, na ordem de valor por esforço: aviso de conteúdo sensível
(S16, o componente já existe), agendar link com fuso (o lado público já
respeita a janela), trocar o endereço, QR code, e nos insights o período, as
fontes e os locais e os únicos completos. Depois: tema customizável e fundo
com imagem, miniatura, modelo por categoria, Google (pronto, falta o app
OAuth). Could-haves: os 8 da matriz (`features.csv`).

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
| F06 resultados | visitas, únicos, cliques, taxa, ranking, fontes, países e cidades, período maior no pago | visitas, únicos, cliques, taxa e ranking dos últimos 7 dias; o job diário já soma por dia | **construir** período, fontes e locais |
| F07 exportar inscritos | CSV por link enviado por email com senha | tabela na Audiência e CSV baixado direto (só o dono, com limite por conta), pronto para o Excel em português e com fórmulas neutralizadas | **manter**: menos passos que o original. Considerar pedir a senha de novo antes do download |
| F08 agendar ou destacar | pago (Starter ou acima) | o banco e a página pública já respeitam a janela; falta a tela | **construir** a tela |
| F09 assinar | quatro planos, cartão, cancelar pelo portal | um plano, Pix, cartão ou boleto pelo Asaas, cancelar em um clique na própria tela, Pro até o fim do período | **manter** (Pix e cancelamento fácil são vantagem no Brasil); os planos ficam para a `/replica-entrepreneur` |
| F10 excluir | exclui perfil ou conta; endereço e email bloqueados por 14 dias; troca de endereço a cada 7 dias | exclui a conta (cancela a cobrança) ou só a página (a conta e o Pro continuam); apaga na hora, apaga as fotos, confirma por email; segura só o endereço por 14 dias, que a própria conta pode retomar | **manter** não segurar o email e deixar a dona retomar o endereço; **construir** a troca de endereço |
| F11 conteúdo sensível | aviso 18+, 21+, 25+ ou sensível, trava de idade | não existe (o componente da tela de aviso já está pronto) | **construir** |
| Sessão | não confirmado | sair de todos os aparelhos vale na hora; o token vencido se renova sozinho; cookies fechados ao JavaScript | manter |

## Próximos cinco

1. **Você validar a cobrança no sandbox do Asaas** (passos em `backend.md`):
   fecha o último must-have e leva a nota a **65,9**.
2. **Aviso de conteúdo sensível** (F11, S16): o `GateScreen` já existe.
3. **Agendar link com fuso** (F08, S07): a página pública já respeita a
   janela, falta a tela.
4. **Trocar o endereço e o QR code** (S13, S19).
5. **Insights com período, fontes e locais** (S09): o job diário já soma em
   `daily_stats`, falta a tela ler de lá.

Com esses, a nota vai a **80,7** (calculada com o `parity.py` sobre a matriz
com os itens marcados como feitos), a linha de lançamento. Depois disso,
`/replica-entrepreneur`.
