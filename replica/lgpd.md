# LGPD: decisões, testes e pendências

`/replica-lgpd` em 2026-10-11 (WSL). Inventário em `replica/dados.csv`,
configuração em `replica/lgpd.json`, relatório da ferramenta em
`replica/lgpd-verificacao.md` (gerado; não editar). Isto não é parecer
jurídico: com dinheiro, conteúdo para maiores e dados de terceiros em jogo,
um advogado revisa antes do lançamento.

## Situação

**8 erros, 8 avisos** na verificação de 2026-10-11 (a trava da
`/replica-deploy` exige 0 erros). Os 8 erros dependem de você (ver "O que é
seu"); nenhum é de código.

| | |
| --- | --- |
| público | Brasil (`["br"]`): preço em reais, CPF ou CNPJ na cobrança, tudo em português. Se um dia abrir para a UE, as bases do GDPR já estão no `dados.csv`, mas faltam representante e mecanismos |
| papéis | o app é **controlador** dos dados dos criadores (conta, página, cobrança), das estatísticas de visita e dos limites de uso; é **operador** dos inscritos que cada criador coleta no formulário (o criador é o controlador) |
| pequeno porte | **não**, até você confirmar (ver "O que é seu"). Com pequeno porte, os prazos de incidente dobram e o encarregado fica dispensado (o canal continua obrigatório) |
| operadores | Supabase, Vercel, Resend e Google (EUA) e Asaas (Brasil). Os quatro dos EUA precisam das cláusulas-padrão da ANPD |
| cookies | só os necessários: sessão do login (`httpOnly`) e a resposta ao aviso de conteúdo (sessão, "ok" ou "negado"). Analytics sem cookie: **sem banner** |
| fontes e embeds | a fonte (Inter) vem do próprio app, não do Google Fonts; nenhum embed de vídeo hoje |

## Decisões

- **Estatísticas de visita: controlador, legítimo interesse.** O app decide
  o que coleta e como (sem cookie, sem IP), para mostrar ao criador as visitas
  da página dele. Por isso é controlador, não operador. Teste abaixo.
- **Inscritos: operador.** O criador escreve o texto do consentimento, que fica
  gravado com cada inscrição, e decide o que faz com a lista. Pedidos de um
  inscrito vão para o criador; o app ajuda (o criador tira a pessoa da lista na
  Audiência). Falta o contrato de tratamento nos termos (`dpa_para_clientes`).
- **Data de nascimento do aviso de idade: não é gravada.** Serve só para a
  conta, no servidor; fica um cookie de sessão com "ok" ou "negado".
- **Sem IA.** O app não tem recurso de IA e nenhum dado vai para provedor de
  IA. Saíram do `supabase/config.toml` os blocos desligados que citavam
  OpenAI (a IA do Studio local), Twilio (SMS), SendGrid (exemplo de SMTP) e um
  S3 externo: não eram usados e apareciam como terceiros na varredura. Escrever
  nos termos é a correção 7 do `fixes.md` (no rascunho).
- **Minimização, proposta e não aplicada:** `submissions.phone` e
  `submissions.extra` existem no schema, mas o formulário não as preenche. Uma
  migração nova pode tirá-las até o campo de telefone existir. **Decisão sua**;
  migração aplicada não se edita.
- **Campos que o criador define:** hoje o formulário só tem email, nome
  opcional e o texto do consentimento; nenhum campo livre, então nenhum dado
  sensível entra sem querer. Se vier o campo livre, decidir entre proibir dado
  sensível nos termos (com aviso na tela) ou suportar (consentimento
  destacado, criptografia, retenção curta).

## Testes de balanceamento (legítimo interesse)

Formato do guia da ANPD: finalidade legítima, necessidade, expectativa do
titular, salvaguardas. A pessoa pode se opor pelo canal do titular.

**1. Endereço guardado 14 dias depois de excluir ou trocar**
(`profiles.deleted_at`, `profiles.moved_to`).

- Finalidade: impedir que outra pessoa pegue o endereço logo depois e se
  passe pela página (golpe com o link que ainda está nas bios e nos cartões);
  levar ao endereço novo quem tem o antigo.
- Necessidade: só o endereço e a data; todo o resto é apagado na hora.
- Expectativa: quem exclui ou troca é avisado na tela e por email que o
  endereço fica guardado 14 dias.
- Salvaguardas: só a própria conta retoma; o job apaga depois de 14 dias;
  o redirecionamento só existe na troca, nunca para página excluída.

**2. Estatísticas de visita** (`events`, `daily_stats`, `daily_breakdowns`,
`analytics_salts`).

- Finalidade: mostrar ao criador quantas pessoas viram e clicaram e de onde
  vieram, o que é o motivo de ter uma página de links.
- Necessidade: sem cookie e sem IP. O visitante vira um código do dia
  (hash de IP, navegador e página com um sal que é apagado depois de um dia),
  e daí só país, cidade, origem e aparelho. Únicos contados só dentro do dia.
- Expectativa: visitar uma página pública e ela contar a visita é esperado;
  ninguém é seguido entre páginas ou entre dias.
- Salvaguardas: robôs não contam; eventos brutos apagados em 90 dias; só a
  soma por dia fica; o criador vê só números agregados, nunca uma pessoa.

**3. Limites de uso** (`rate_limits`).

- Finalidade: impedir abuso (tentativa de senha, robô criando contas, envio
  em massa nos formulários).
- Necessidade: só o hash da chave (IP ou email) e a contagem na janela.
- Expectativa: proteção contra abuso é esperada em qualquer serviço.
- Salvaguardas: chave só em hash; apagado em 1 dia.

## Plano de incidente

1. **Quem decide:** você (o controlador). Substituto: a definir.
2. **Conter:** trocar as chaves vazadas (Supabase, Asaas, Resend, Vercel,
   `CRON_SECRET`), derrubar sessões (`sair de todos os aparelhos` vale na
   hora), tirar do ar a rota afetada.
3. **Avaliar o risco:** quais dados, de quantas pessoas, se dá para
   identificar alguém, se há dado de cobrança. Registrar tudo, mesmo o que não
   for comunicado, e guardar por 5 anos.
4. **Prazos:** `python3 .claude/skills/replica-lgpd/lgpd.py prazo-incidente "AAAA-MM-DD HH:MM"`
   (3 dias úteis para a ANPD e os titulares; 6 no pequeno porte, salvo risco à
   integridade física ou moral).
5. **Comunicar:** ANPD pelo formulário do site dela; titulares por email (o
   que houve, quais dados, quais riscos, o que foi feito, contato); e, se
   envolver inscritos, **os criadores**, que são os controladores desses dados.

## Crianças, adolescentes e o ECA Digital

O app não é feito para menores de 18 anos e os termos dirão isso. Mas o
aviso de conteúdo para maiores (S16), como o do original, é **autodeclaração**
(a pessoa digita a data de nascimento), e o ECA Digital (Lei 15.211/2025, em
vigor desde 17/03/2026) pede verificação de idade **confiável**, que não vale
autodeclaração, para conteúdo impróprio. Duas saídas, para decidir com o
advogado:

- os termos proíbem conteúdo pornográfico e a venda a menores do que a lei
  proíbe, e o aviso de idade vira só um aviso (como "conteúdo sensível");
- ou uma verificação de idade de terceiro, que traz custo e um operador novo.

## Mudanças no produto

Feitas em 2026-10-11:

- **Baixar meus dados** (S13): `GET /api/me/export`, JSON com página, links,
  redes, aparência, formulários, inscritos, estatísticas por dia, assinatura e
  pedidos; registra o pedido em `data_requests`.
- **Com quem compartilhamos** (S13): os operadores e o país, de
  `src/lib/privacidade.ts` (tem de bater com o `lgpd.json`).
- Já existiam: excluir a conta ou a página de verdade (apaga na hora, nos
  operadores também: Storage e Asaas), corrigir os dados no editor,
  consentimento gravado nos formulários.

Faltam:

- **Páginas `/privacidade` e `/termos`**, a partir dos rascunhos
  (`replica/politica-de-privacidade.md`, `replica/termos-de-uso.md`), depois
  que você preencher o controlador e o encarregado e o advogado revisar. Link
  no rodapé do painel, no cadastro e na página pública.
- **Canal do titular** no rodapé e na política (o email que você escolher).
- **Registros de acesso por 6 meses** (Marco Civil, art. 15): confirmar quanto
  tempo o Supabase guarda o log de auditoria do login (IP e data) e a Vercel
  guarda os logs; se for menos de 6 meses, guardar aqui, numa tabela própria
  com limpeza depois de 6 meses.
- **Revogar consentimento:** não há consentimento do criador hoje (nenhuma
  newsletter do app); quando houver, revogar na mesma tela.

## O que é seu

1. **Controlador:** nome (ou razão social), CPF ou CNPJ, endereço e contato.
2. **Pequeno porte:** você é pessoa física, MEI, ME, EPP ou startup, sem
   tratamento de alto risco? Se sim, `"pequeno_porte": true` no `lgpd.json`.
3. **Encarregado** (nome e email, publicados no site) ou, no pequeno porte,
   só o **canal do titular** (um email como privacidade@seu-dominio).
4. **Contratos de tratamento (DPA)**, aceitar no painel de cada um e guardar
   a cópia: Supabase (supabase.com/legal/customer-resources/data-processing-addendum), Vercel (vercel.com/legal/dpa),
   Resend (página de DPA no site deles), Asaas (termos de uso e política no
   painel). Depois, `"dpa": true` em cada um.
5. **Cláusulas-padrão da ANPD** (Res. CD/ANPD 19/2024; obrigatórias desde
   23/08/2025) com os quatro dos EUA. Na busca de 2026-10-11, os contratos
   públicos de Supabase e Vercel tratam do GDPR (cláusulas da UE) e não citam a
   ANPD; o do Resend não apareceu. Pedir a cada um o aditivo para o Brasil; se
   algum não oferecer, trocar ou levar ao advogado. O Google entra só no login
   com Google, onde ele é controlador da conta Google da pessoa: confirmar com o
   advogado como declarar.
6. **Prazos:** quanto tempo guardar os eventos de cobrança (o contador) e os
   pedidos de titular (o advogado).
7. **ECA Digital:** qual das duas saídas acima.
8. **Minimização:** tirar ou não `submissions.phone` e `submissions.extra`.
9. **Revisão do advogado** da política e dos termos.
