# Plano de teste: linkbio

Build: `ecb2243` (suíte escrita sobre `74e2040`; 23 casos novos na segunda
`/replica-build`, para S06, S08, S10, S11, S13, S15 e S17).
Data: 2026-10-11. Ambiente: build de produção local (`next start`), Supabase
local (Postgres, Auth, Storage, Mailpit) com o seed, Asaas falso
(`tests/asaas-falso.mjs`), Chromium 141.

```bash
npm run db:start && npm run db:reset && npm run build
npm run test:e2e          # 87 casos, Playwright (e2e/)
npm run test:backend      # 37 casos, node:test (tests/backend/)
```

Cada caso de ponta a ponta falha com erro no console ou resposta 5xx, roda o
axe nas telas que visita e se apresenta com um IP próprio (os limites de uso
são por IP). As quatro últimas rodadas da suíte inteira passaram sem falha.

**2026-10-11, WSL (Node 22.23.3, Docker 29.3.0):** na primeira rodada fora da
nuvem, F03-E1 e F04-E9 falharam sempre. Era o teste, não o app: o esqueleto
do Suspense da página pública já tem `data-theme="papel"`, e o conteúdo chega
uns 300 ms depois do load (medido: load em 30 ms, `h1` em 330 ms). O axe rodava
sobre o esqueleto e os Tabs passavam antes de haver um link. Agora o
`semViolacoes` espera não haver `aria-busy` e o F04-E9 espera o link. Depois:
87 de 87 e 37 de 37.

## Resultado

| | casos | passaram | falharam |
| --- | --- | --- | --- |
| ponta a ponta (Playwright) | 115 | 115 | 0 |
| backend (node:test) | 53 | 53 | 0 |
| bloqueados (fluxo não construído) | 3 | | |
| manuais (precisam de conta real) | 7 | | pendentes |

Na primeira rodada, 12 de 61 falharam: 6 por defeito do app (BUG-002 a
BUG-007) e 6 por erro do teste (espera curta, seletor, reenvio antes do
intervalo do Auth), dois dos quais mostraram defeitos S4 (BUG-009 e BUG-010).
BUG-008 apareceu na rodada seguinte, com os testes rodando em paralelo. Os
casos F09-E8 e F12-N3 foram escritos depois, caçando um defeito suspeito
(BUG-001 e BUG-011), e falharam antes da correção. Bugs em
`replica/bugs.md`: 11 no total, todos os S1 a S3 corrigidos com o teste
falhando antes.

Na segunda `/replica-build`, os 23 casos novos rodaram junto com a suíte
inteira, que passou. Dois tropeços foram do teste: o campo do formulário
ainda escondido logo depois do `load` (o React revela o streaming um pouco
depois) e seletores de "Adicionar" que ficaram ambíguos com os botões novos.
O primeiro mostrou um risco real, corrigido junto: enviar o formulário antes
da hidratação punha o email na URL. Outro achado do teste de teclado: os
modais abertos pelo estado não devolviam o foco a quem os abriu (corrigido
no `Dialog`).

## Casos automatizados

| case | flow | type | o que verifica | auto | result |
| --- | --- | --- | --- | --- | --- |
| F01-H1 | cria a página e compartilha | feliz | cadastro, confirmação por email, endereço, primeiro link e URL copiada | e2e `f01-cria-pagina.spec.ts` | passou |
| F01-E1 | cria a página e compartilha | borda | endereço em uso, reservado ou inválido avisa enquanto digita e não é aceito; depois de recusado, digitar outro tira o erro | e2e `f01-cria-pagina.spec.ts` | passou (estendido: achou BUG-012) |
| F01-E2 | cria a página e compartilha | borda | email que já tem conta: mesma tela de quem não tem, e o dono recebe o caminho para entrar | e2e `f01-cria-pagina.spec.ts` | passou (achou BUG-007) |
| F01-E3 | cria a página e compartilha | borda | abandona depois de confirmar e volta: entrar leva a escolher o endereço | e2e `f01-cria-pagina.spec.ts` | passou |
| F01-E4 | cria a página e compartilha | borda | dois cliques seguidos em Criar minha conta: uma conta, tela de confirmação | e2e `f01-cria-pagina.spec.ts` | passou |
| F01-E5 | cria a página e compartilha | borda | email com maiúsculas e +: a conta vale em minúsculas | e2e `f01-cria-pagina.spec.ts` | passou |
| F01-E6 | cria a página e compartilha | borda | duas abas escolhendo o endereço: a segunda vai para o painel, sem perfil duplicado | e2e `f01-cria-pagina.spec.ts` | passou |
| F01-E7 | cria a página e compartilha | borda | link de confirmação usado de novo: aviso, sem quebrar | e2e `f01-cria-pagina.spec.ts` | passou |
| F01-E8 | cria a página e compartilha | borda | recarregar a tela de confirmação e pedir o link de novo por /confirmar | e2e `f01-cria-pagina.spec.ts` | passou |
| F01-E9 | cria a página e compartilha | borda | só teclado, a 390 px: cadastro, endereço e primeiro link | e2e `f01-cria-pagina.spec.ts` | passou |
| F01-E10 | cria a página e compartilha | borda | pedir o link de novo cedo demais: aviso para esperar, sem erro genérico | e2e `f01-cria-pagina.spec.ts` | passou |
| F01-N1 | cria a página e compartilha | negativo | senha curta e email inválido: erros nos campos, nada criado | e2e `f01-cria-pagina.spec.ts` | passou |
| F02-H1 | adiciona e organiza links | feliz | adicionar, editar, reordenar, desligar e excluir, com a prévia e a página pública acompanhando | e2e `f02-links.spec.ts` | passou |
| F02-H2 | adiciona e organiza links | feliz | reordenar só com teclado (espaço, setas, espaço) | e2e `f02-links.spec.ts` | passou |
| F02-E1 | adiciona e organiza links | borda | endereço sem https é completado; com espaços nas pontas, aparado | e2e `f02-links.spec.ts` | passou |
| F02-E2 | adiciona e organiza links | borda | endereços inválidos ou perigosos são recusados | e2e `f02-links.spec.ts` | passou |
| F02-E3 | adiciona e organiza links | borda | título vazio, só espaços ou longo demais é recusado; 100 caracteres passa | e2e `f02-links.spec.ts` | passou (achou BUG-010) |
| F02-E4 | adiciona e organiza links | borda | emoji, acentos e HTML no título aparecem como texto na página pública | e2e `f02-links.spec.ts` | passou |
| F02-E5 | adiciona e organiza links | borda | o mesmo endereço duas vezes vira dois links | e2e `f02-links.spec.ts` | passou |
| F02-E6 | adiciona e organiza links | borda | cem links: painel e página pública abrem, e o último sobe para o topo | e2e `f02-links.spec.ts` | passou |
| F02-E7 | adiciona e organiza links | borda | dois cliques seguidos em Adicionar criam um link só | e2e `f02-links.spec.ts` | passou |
| F02-E8 | adiciona e organiza links | borda | sem rede: adicionar e ligar avisam e o painel continua de pé | e2e `f02-links.spec.ts` | passou (achou BUG-003) |
| F02-E9 | adiciona e organiza links | borda | duas abas: excluído numa, editar na outra avisa que o link não existe mais | e2e `f02-links.spec.ts` | passou |
| F02-E10 | adiciona e organiza links | borda | título e bio longos: limites respeitados e nada vaza a 390 px | e2e `f02-links.spec.ts` | passou (achou BUG-004) |
| F02-N1 | adiciona e organiza links | negativo | sessão perdida no meio: salvar leva ao login sem perder o painel dos outros | e2e `f02-links.spec.ts` | passou (achou BUG-002) |
| F02-E13 | adiciona e organiza links | borda | enviando, os campos travam; com erro, o foco volta ao campo e o que se digita depois fica | e2e `f02-links.spec.ts` | passou (BUG-010; falha sem a correção) |
| F02-H3 | adiciona e organiza links | feliz | redes sociais: pôr pelo @ e pelo número, reordenar com teclado, mudar para o rodapé e tirar, com a prévia e a página acompanhando | e2e `f02-redes.spec.ts` | passou |
| F02-E11 | adiciona e organiza links | borda | endereço de outro site, @ inválido ou número sem DDD são recusados e nada é gravado | e2e `f02-redes.spec.ts` | passou |
| F02-E12 | adiciona e organiza links | borda | a 390 px a prévia abre em tela cheia, acompanha o que mudou e devolve o foco ao fechar | e2e `f02-redes.spec.ts` | passou (achou o foco perdido nos modais) |
| F03-H1 | personaliza a aparência | feliz | escolher um tema muda a prévia na hora, salva e vale na página pública | e2e `f03-aparencia.spec.ts` | passou |
| F03-E1 | personaliza a aparência | borda | cada tema pronto passa no axe na página pública (contraste) | e2e `f03-aparencia.spec.ts` | passou |
| F03-E2 | personaliza a aparência | borda | só teclado e a 390 px: chega no tema e escolhe com Enter | e2e `f03-aparencia.spec.ts` | passou |
| F03-E3 | personaliza a aparência | borda | sem rede: o tema volta ao salvo e avisa | e2e `f03-aparencia.spec.ts` | passou |
| F04-H1 | visitante abre e clica | feliz | abre a página, a visita conta, o clique conta e leva ao destino | e2e `f04-visitante.spec.ts` | passou |
| F04-E1 | visitante abre e clica | borda | endereço livre: 404 de verdade para robô de prévia, página de 404 com noindex no navegador | e2e `f04-visitante.spec.ts` | passou (achou BUG-009) |
| F04-E2 | visitante abre e clica | borda | perfil excluído some (404) e o clique antigo não redireciona | e2e `f04-visitante.spec.ts` | passou |
| F04-E3 | visitante abre e clica | borda | link desligado depois que a página abriu: o clique mostra uma página amigável, não um texto cru | e2e `f04-visitante.spec.ts` | passou (achou BUG-005) |
| F04-E4 | visitante abre e clica | borda | robôs e prévias de redes não contam visita nem clique | e2e `f04-visitante.spec.ts` | passou |
| F04-E5 | visitante abre e clica | borda | endereço com maiúsculas ou @ abre a mesma página | e2e `f04-visitante.spec.ts` | passou (achou BUG-006) |
| F04-E6 | visitante abre e clica | borda | celular com rede lenta: a página abre, sem rolagem lateral | e2e `f04-visitante.spec.ts` | passou |
| F04-E7 | visitante abre e clica | borda | /r/ com id inválido, inexistente ou de outro tipo não redireciona para lugar nenhum | e2e `f04-visitante.spec.ts` | passou |
| F04-E8 | visitante abre e clica | borda | link agendado fora da janela não aparece nem redireciona | e2e `f04-visitante.spec.ts` | passou |
| F04-E9 | visitante abre e clica | borda | só teclado: Tab até o link e Enter abre o destino | e2e `f04-visitante.spec.ts` | passou |
| F04-E10 | visitante abre e clica | borda | a prévia do link no WhatsApp tem título e descrição do perfil | e2e `f04-visitante.spec.ts` | passou |
| F05-H1 | visitante deixa o email | feliz | o criador põe o formulário e ajusta os textos (S11); o visitante se inscreve (S17) com o consentimento gravado | e2e `f05-formulario.spec.ts` | passou |
| F05-E1 | visitante deixa o email | borda | email inválido ou sem marcar o aceite: avisa e não grava nada | e2e `f05-formulario.spec.ts` | passou |
| F05-E2 | visitante deixa o email | borda | o mesmo email de novo, em outra caixa: mesma resposta, uma inscrição só | e2e `f05-formulario.spec.ts` | passou |
| F05-E3 | visitante deixa o email | borda | dois cliques seguidos em Quero receber: uma inscrição | e2e `f05-formulario.spec.ts` | passou |
| F05-E4 | visitante deixa o email | borda | robô (campo isca ou navegador de robô) recebe ok e nada é gravado | e2e `f05-formulario.spec.ts` | passou |
| F05-E5 | visitante deixa o email | negativo | sem aceite pela API, formulário desligado ou inexistente: nada é gravado | e2e `f05-formulario.spec.ts` | passou |
| F05-E6 | visitante deixa o email | borda | muitos envios do mesmo visitante no mesmo formulário: o sexto espera | e2e `f05-formulario.spec.ts` | passou |
| F05-E7 | visitante deixa o email | borda | textos do formulário são validados no editor (S11) | e2e `f05-formulario.spec.ts` | passou |
| F05-E8 | visitante deixa o email | borda | a 390 px e só com teclado: o visitante se inscreve | e2e `f05-formulario.spec.ts` | passou (achou o envio antes da hidratação) |
| F06-H1 | acompanha os resultados | feliz | a demo vê os totais, a série por dia e o ranking dos links | e2e `f06-resultados.spec.ts` | passou |
| F06-E1 | acompanha os resultados | borda | sem dados ainda: zeros, taxa sem número, e convite quando não há links | e2e `f06-resultados.spec.ts` | passou |
| F06-E2 | acompanha os resultados | borda | outra conta só vê os próprios números | e2e `f06-resultados.spec.ts` | passou |
| F06-E4 | acompanha os resultados | borda | o período muda a janela e a série: 7 dias por dia, 90 por semana, 12 meses por mês; valor estranho vira 28 | e2e `f06-resultados.spec.ts` | passou |
| F06-E5 | acompanha os resultados | borda | origens, aparelhos e país da demo; cidade vazia diz que não há dado | e2e `f06-resultados.spec.ts` | passou |
| F06-E6 | acompanha os resultados | borda | a visita que veio pelo QR code aparece como origem "QR code" | e2e `f06-resultados.spec.ts` | passou |
| F06-E7 | acompanha os resultados | borda | a 390 px: nada vaza e a tabela da série abre pelo teclado | e2e `f06-resultados.spec.ts` | passou |
| F07-H1 | exporta os inscritos | feliz | a lista mostra os inscritos e o CSV vem certo (BOM, ponto e vírgula, sem fórmula) | e2e `f07-audiencia.spec.ts` | passou |
| F07-E1 | exporta os inscritos | borda | lista vazia: convite para pôr o formulário e nenhum botão de CSV | e2e `f07-audiencia.spec.ts` | passou |
| F07-E2 | exporta os inscritos | borda | tirar uma pessoa da lista: some da tela e do CSV | e2e `f07-audiencia.spec.ts` | passou |
| F07-E3 | exporta os inscritos | negativo | o CSV é só do dono: sem sessão 401, outra conta não vê os inscritos | e2e `f07-audiencia.spec.ts` | passou |
| F07-E4 | exporta os inscritos | borda | a 390 px a tabela rola dentro dela, sem rolar a página | e2e `f07-audiencia.spec.ts` | passou |
| F08-H1 | agenda um link | feliz | agendar para amanhã: o cartão avisa, a prévia e a página escondem; com a janela aberta, aparece | e2e `f08-agendar.spec.ts` | passou |
| F08-E1 | agenda um link | borda | fim antes do começo e fim que já passou são recusados, e nada muda no banco | e2e `f08-agendar.spec.ts` | passou |
| F08-E2 | agenda um link | borda | no fuso do Amazonas: grava em UTC-4 e reabre no mesmo horário e fuso | e2e `f08-agendar.spec.ts` | passou |
| F08-E3 | agenda um link | borda | tirar o agendamento: o link volta a ficar sempre na página | e2e `f08-agendar.spec.ts` | passou |
| F08-E4 | agenda um link | borda | a 390 px: o agendamento cabe na tela e o link encerrado aparece como encerrado | e2e `f08-agendar.spec.ts` | passou |
| F09-H1 | assina o plano | feliz | assina por Pix, paga, perde a marca e cancela em um clique | e2e `f09-plano.spec.ts` | passou |
| F09-E1 | assina o plano | borda | CPF inválido é recusado antes de falar com o Asaas | e2e `f09-plano.spec.ts` | passou |
| F09-E2 | assina o plano | borda | dois cliques seguidos em Assinar criam uma assinatura só no Asaas | e2e `f09-plano.spec.ts` | passou |
| F09-E3 | assina o plano | borda | assinatura pendente: assinar de novo com a mesma forma volta para a mesma cobrança | e2e `f09-plano.spec.ts` | passou |
| F09-E4 | assina o plano | borda | trocar a forma enquanto pendente cancela a cobrança anterior no Asaas | e2e `f09-plano.spec.ts` | passou |
| F09-E5 | assina o plano | borda | estorno devolve a página ao grátis (marca volta), sem apagar nada | e2e `f09-plano.spec.ts` | passou |
| F09-E6 | assina o plano | borda | Asaas fora do ar: mensagem clara e nada gravado | e2e `f09-plano.spec.ts` | passou |
| F09-E7 | assina o plano | borda | webhook: sem token ou token errado 401, corpo inválido 400, repetido e em paralelo aplicado uma vez | e2e `f09-plano.spec.ts` | passou |
| F09-E8 | assina o plano | borda | duas abas assinando ao mesmo tempo criam uma assinatura só no Asaas | e2e `f09-plano.spec.ts` | passou (achou BUG-001) |
| F10-H1 | exclui a conta | feliz | excluir: confirmação forte, tudo apagado na hora, email, endereço segurado | e2e `f10-conta.spec.ts` | passou |
| F10-E1 | exclui a conta | borda | com o Pro ativo, a assinatura é cancelada no Asaas antes de excluir | e2e `f10-conta.spec.ts` | passou |
| F10-E2 | exclui a conta | borda | Asaas fora do ar com o Pro ativo: a conta não é excluída e a pessoa sabe por quê | e2e `f10-conta.spec.ts` | passou |
| F10-E3 | exclui a conta | borda | recadastro com o mesmo email depois de excluir: conta nova, endereço antigo ainda reservado | e2e `f10-conta.spec.ts` | passou |
| F10-H2 | exclui a conta ou a página | feliz | excluir só a página: tudo dela apagado, email, a conta continua e o endereço pode ser retomado por ela | e2e `f10-conta.spec.ts` | passou |
| F10-E5 | exclui a conta ou a página | borda | com o Pro ativo, excluir só a página não mexe na assinatura | e2e `f10-conta.spec.ts` | passou |
| F11-H1 | marca como sensível | feliz | a página marcada como 18+ na S12 pede a data antes; adulto vê os links e a visita só conta depois | e2e `f11-aviso.spec.ts` | passou |
| F11-E1 | marca como sensível | borda | idade insuficiente: não vê os links, recarregar continua negado e o /r/ direto volta ao aviso | e2e `f11-aviso.spec.ts` | passou |
| F11-E2 | marca como sensível | borda | link com aviso, marcado na S07: cadeado na página, aviso antes do destino, clique contado uma vez | e2e `f11-aviso.spec.ts` | passou |
| F11-E3 | marca como sensível | borda | link com idade: data inválida avisa na tela do aviso, e voltar leva à página | e2e `f11-aviso.spec.ts` | passou (achou a volta com erro indo para o /r/, que perdia o aviso) |
| F11-E4 | marca como sensível | borda | sem o JavaScript do app (antes de hidratar ou se ele não carregar): o aviso funciona | e2e `f11-aviso.spec.ts` | passou |
| F11-E5 | marca como sensível | borda | só teclado, a 390 px: escolher o aviso na S12 e passar por ele na página | e2e `f11-aviso.spec.ts` | passou |
| F11-E6 | marca como sensível | borda | a prévia no WhatsApp de uma página com aviso não mostra a bio | e2e `f11-aviso.spec.ts` | passou |
| F11-N1 | marca como sensível | negativo | a rota do aviso recusa alvo inválido e não grava nada para página sem aviso | e2e `f11-aviso.spec.ts` | passou |
| F10-H3 | troca o endereço | feliz | trocar o endereço: a página vai para o novo, o antigo redireciona (307, também para robô) e os links seguem funcionando | e2e `f10-endereco.spec.ts` | passou |
| F10-E4 | troca o endereço | borda | uma troca a cada 7 dias: na mesma semana o formulário some e o servidor recusa | e2e `f10-endereco.spec.ts` | passou |
| F10-E6 | troca o endereço | borda | o antigo fica guardado 14 dias: outra conta não pega; depois disso, fica livre | e2e `f10-endereco.spec.ts` | passou (achou BUG-012) |
| F10-E7 | troca o endereço | borda | a própria conta retoma o endereço antigo (depois dos 7 dias), sem sobrar linha guardada | e2e `f10-endereco.spec.ts` | passou |
| F10-E8 | troca o endereço | negativo | o mesmo endereço, um reservado ou um inválido: avisa e não troca | e2e `f10-endereco.spec.ts` | passou |
| F10-E9 | troca o endereço | borda | só teclado, a 390 px: troca o endereço | e2e `f10-endereco.spec.ts` | passou |
| S19-H1 | QR code (S12) | feliz | a S12 mostra o QR; o PNG baixado leva à página com ?origem=qr (decodificado no teste) e o SVG baixa com nome | e2e `s19-qr.spec.ts` | passou |
| S19-E1 | QR code (S12) | borda | quem chega pelo QR conta com a origem "qr" e o ?origem some do endereço | e2e `s19-qr.spec.ts` | passou |
| S19-E2 | QR code (S12) | negativo | endereço que não existe não ganha QR | e2e `s19-qr.spec.ts` | passou |
| S19-E3 | QR code (S12) | borda | a 390 px o QR e os botões cabem e dá para baixar só com teclado | e2e `s19-qr.spec.ts` | passou |
| F12-H1 | acesso (derivado) | feliz | entrar e sair deste aparelho | e2e `f12-acesso.spec.ts` | passou (achou BUG-008) |
| F12-E1 | acesso (derivado) | borda | recuperar a senha: resposta neutra, link abre em outro navegador, senha nova vale e avisa por email | e2e `f12-acesso.spec.ts` | passou |
| F12-E2 | acesso (derivado) | borda | sair de todos os aparelhos derruba a outra sessão na hora | e2e `f12-acesso.spec.ts` | passou |
| F12-E3 | acesso (derivado) | borda | sessão com o token vencido se renova sozinha | e2e `f12-acesso.spec.ts` | passou |
| F12-E4 | acesso (derivado) | borda | dez senhas erradas seguidas para o mesmo email: as próximas tentativas esperam | e2e `f12-acesso.spec.ts` | passou |
| F12-E5 | acesso (derivado) | borda | voltar no navegador depois de sair não mostra o painel | e2e `f12-acesso.spec.ts` | passou |
| F12-E6 | acesso (derivado) | borda | cookies da sessão fechados para o JavaScript da página | e2e `f12-acesso.spec.ts` | passou |
| F12-E7 | acesso (derivado) | borda | sem sessão o painel leva ao login; com sessão, login e cadastro levam ao painel | e2e `f12-acesso.spec.ts` | passou |
| F12-E8 | acesso (derivado) | borda | jobs e webhook não abrem sem o segredo | e2e `f12-acesso.spec.ts` | passou |
| F12-N1 | acesso (derivado) | negativo | senha errada e email sem conta dão a mesma resposta | e2e `f12-acesso.spec.ts` | passou |
| F12-N2 | acesso (derivado) | negativo | email ainda sem confirmar: não entra e pode pedir o link de novo | e2e `f12-acesso.spec.ts` | passou |
| F12-N3 | acesso (derivado) | negativo | alguém errando a senha de outra pessoa de outro lugar não tranca a conta dela | e2e `f12-acesso.spec.ts` | passou (achou BUG-011) |

Cobertos pelos testes do backend (`tests/backend/`), sem tela: segundo
usuário não lê nem altera nada do primeiro (F02, F06); API REST e Storage
fechados para a chave pública, anônimo e logado; webhook idempotente, fora de
ordem e em paralelo (F09); limites atômicos; job diário no fuso do perfil
(F06, fuso horário; o Brasil não tem horário de verão desde 2019); exclusão
apaga na hora e libera o endereço depois de 14 dias (F10); página excluída:
outra conta não pega o endereço guardado e a dona retoma; redes sociais
(endereço de outro site recusado, número do WhatsApp, segunda conta).

## Bloqueados: fluxo ainda não construído

| case | flow | o que testar quando existir |
| --- | --- | --- |
| F03-E4 | personaliza a aparência | tema customizado: cor com contraste ruim é recusada ou avisada |
| F03-E5 | | imagem de fundo pesada é recusada (5 MB) |
| F03-E6 | | tema pago no plano grátis |

Construído e ainda sem caso: lista grande na Audiência (mais de 1000: a tela
mostra os 1000 mais novos e o CSV traz todos).

## Passada manual (precisa das contas reais)

Não dá para automatizar aqui: precisam das contas e chaves do dono (ver
`replica/backend.md`) ou de aparelhos reais.

| case | o que fazer | esperado | result |
| --- | --- | --- | --- |
| M1 | criar conta com um email de verdade (Gmail e Outlook) com o Resend configurado | confirmação chega na caixa de entrada, não no spam, do domínio próprio | pendente |
| M2 | entrar com Google, conta nova e conta existente | volta ao painel; conta nova vai escolher o endereço | pendente |
| M3 | no sandbox do Asaas: assinar por Pix e confirmar o pagamento pelo painel do sandbox | webhook real chega, a marca some do rodapé | pendente |
| M4 (F09-N1) | no sandbox: cartão recusado e cartão aprovado (cartões de teste do Asaas) | recusado: continua grátis, sem cobrança; aprovado: Pro | pendente |
| M5 | VoiceOver (iPhone) e TalkBack (Android): F01 e F04 inteiros | tudo anunciado, nada inalcançável | pendente |
| M6 | Safari no iPhone e Chrome no Android, página pública e painel; colar o link no WhatsApp e no Instagram | layout certo, prévia com nome e bio | pendente |
| M7 | depois do deploy: conferir em `job_runs` que os quatro crons rodaram no horário | uma linha por job por dia, `ok = true` | pendente |
