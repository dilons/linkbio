# Paridade: linkbio × Linktree

`/replica-diff` em 2026-10-11, build `a5385ee`. Paridade aqui é fazer o mesmo
trabalho, não ter a mesma cara: a cor e o desenho de cada tela mudam de
propósito na `/replica-brand`.

## Placar

| | nota | |
| --- | --- | --- |
| **geral** | **48,9** | só funcionalidades: o layout contra o original não foi medido |
| funcionalidades | 48,9 / 100 | 39 contadas; must-haves **11 de 18** |
| layout contra o original | não medido | a rede deste ambiente bloqueia `linktr.ee`; `replica/screens/` está vazio |
| regressão de layout do próprio clone | 99,4 a 100 | 6 telas no mesmo estado, antes e depois do backend e das correções |
| bugs abertos | 0 S1, 0 S2, 0 S3 | 1 S4 aberto (BUG-010), ver `bugs.md` |

**Veredito: não dá para lançar.** Faltam 7 must-haves (3 não começados, 4
parciais). Nenhum S1 aberto.

A nota de 48,9 vem do jeito de contar da skill (must vale 3, should 2, could 1,
parcial vale metade; os 5 itens fora do escopo não entram). Ela é baixa porque
a aparência, a audiência e o compartilhamento ainda estão em zero, não porque o
que existe esteja pela metade: o que foi construído passou em 64 casos de ponta
a ponta.

## Funcionalidades por área, da mais fraca para a mais forte

| área | nota | itens |
| --- | --- | --- |
| aparência | 0 | 5 |
| audiência | 0 | 3 |
| compartilhamento | 0 | 2 |
| conta | 25 | 3 |
| insights | 54,5 | 5 |
| editor | 60 | 11 |
| página pública | 60 | 2 |
| plano | 75 | 2 |
| onboarding | 81,2 | 6 |

## O que falta, na ordem de construção

Must-haves (sem eles não lança):

1. **Temas prontos** (aparência, S08): hoje só o tema "papel".
2. **Formulário de captura de email na página** (audiência, F05, S11, S17), com
   consentimento e finalidade na hora da coleta (LGPD).
3. **Ver inscritos e exportar CSV** (audiência, F07, S10).
4. **Excluir só a página**, sem excluir a conta (conta, S13). Excluir a conta
   inteira já funciona.
5. **Prévia ao vivo no celular** (editor, S06). No computador já reage na hora.
6. **Editor dos ícones de redes sociais** (editor, S06). A exibição no topo ou
   no rodapé já funciona.
7. **Plano pago validado no sandbox do Asaas** (plano, S14). O código está
   pronto e testado contra um Asaas falso; falta a sua conta de sandbox.

Should-haves: tema customizável e fundo com imagem, QR code, trocar o
endereço, agendar link, miniatura, período e fontes e locais nos insights,
modelo por categoria, aviso de conteúdo sensível, Google (pronto, falta o app
OAuth). Could-haves: os 8 da matriz (`features.csv`).

## Layout

**Contra o original: não medido.** O diff de layout precisa das duas capturas
no mesmo viewport (1440×900 e 390×844) e no mesmo estado, e as do Linktree não
puderam ser tiradas daqui: a política de rede do ambiente bloqueia `linktr.ee`.
Para medir, uma das duas:

- liberar `linktr.ee` na rede do ambiente (Network access, Allowed domains) e
  eu capturo as páginas públicas (por exemplo `linktr.ee/linktree`) para a S15;
- você salvar em `replica/screens/` capturas das telas do seu próprio painel,
  se tiver conta (e se os termos dela permitirem esse uso), com os nomes
  `S06-1440.png`, `S09-1440.png` e assim por diante.

Depois: `python3 $SKILL/imgdiff.py replica/screens/S15-390.png
replica/clone-screens/S15-390.png --json > replica/diffs/S15-390.json` e o
`parity.py --visual`.

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
| F02 links | arrastar, coleções, miniatura, agendar (pago), destacar (pago), arquivar | arrastar com mouse ou teclado (com anúncio em português), ligar e desligar, endereço completado com `https://`, recusa `javascript:` e endereços sem domínio | **manter** o teclado; **construir** coleções, miniatura, agendamento e destaque |
| F03 aparência | temas grátis e pagos, tema customizável, fundo com imagem ou vídeo | um tema fixo | **construir** (must) |
| F04 visitante | rodapé com a marca no grátis; aviso de conteúdo sensível | igual no rodapé; robôs e prévias de redes não contam; `/@usuario` funciona; link desligado mostra página com volta; prévia no WhatsApp com nome e bio | **manter**; **construir** o aviso sensível |
| F05 deixar o email | formulário com email, nome, telefone, lista | não existe | **construir** (must), com consentimento LGPD |
| F06 resultados | visitas, únicos, cliques, taxa, ranking, fontes, países e cidades, período maior no pago | visitas, únicos, cliques, taxa e ranking dos últimos 7 dias; o job diário já soma por dia | **construir** período, fontes e locais |
| F07 exportar inscritos | CSV por link enviado por email com senha | não existe | **construir** (must). Melhoria possível: baixar direto, pedindo a senha de novo, sem a ida e volta do email |
| F08 agendar ou destacar | pago (Starter ou acima) | o banco e a página pública já respeitam a janela; falta a tela | **construir** a tela |
| F09 assinar | quatro planos, cartão, cancelar pelo portal | um plano, Pix, cartão ou boleto pelo Asaas, cancelar em um clique na própria tela, Pro até o fim do período | **manter** (Pix e cancelamento fácil são vantagem no Brasil); os planos ficam para a `/replica-entrepreneur` |
| F10 excluir | exclui perfil ou conta; endereço e email bloqueados por 14 dias; troca de endereço a cada 7 dias | exclui a conta: apaga na hora, cancela a cobrança, apaga as fotos, confirma por email, segura só o endereço por 14 dias | **manter** não segurar o email (guarda menos dado); **construir** excluir só a página e a troca de endereço |
| F11 conteúdo sensível | aviso 18+, 21+, 25+ ou sensível, trava de idade | não existe (o componente da tela de aviso já está pronto) | **construir** |
| Sessão | não confirmado | sair de todos os aparelhos vale na hora; o token vencido se renova sozinho; cookies fechados ao JavaScript | manter |

## Próximos cinco

1. **Temas prontos** (S08): galeria com os temas que já estão nos tokens
   (papel, noite, areia...), na prévia e na página pública. Tira a aparência
   do zero.
2. **Formulário de captura de email** (F05, S11, S17): bloco na página
   pública, consentimento gravado com cada inscrição, limite por visitante e
   campo isca contra robô. O schema (`forms`, `submissions`) já existe.
3. **Inscritos e CSV** (F07, S10): tabela e download direto.
4. **Editor das redes sociais e prévia no celular** (S06): os dois parciais mais
   baratos do editor.
5. **Excluir só a página** (S13), e você **validar a cobrança no sandbox do
   Asaas** (passos em `backend.md`), que fecham os dois últimos must-haves.

Com esses cinco, os 18 must-haves fecham e a nota vai a **65,9** (calculada
com o `parity.py` sobre a matriz com esses itens marcados como feitos). Para
passar de 80, a linha de lançamento, entram ainda sete should-haves: aviso de
conteúdo sensível, agendamento, troca de endereço, QR code e os três de
insights (únicos completos, período, fontes e locais), o que dá **80,7**.

Próximo passo: `/replica-build` para essas lacunas, começando pela etapa 2 da
`architecture.md` (temas). A `/replica-entrepreneur` vem quando a paridade
estiver lá.
