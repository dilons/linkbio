# LGPD: (sem controlador)

Gerado por lgpd.py. Não escreva aqui: rodar de novo apaga. As decisões, os testes de balanceamento e o plano de incidente ficam em replica/lgpd.md.

Público: Brasil. Pequeno porte: não. Encarregado: não indicado. Canal do titular: não indicado.

**8 erros, 8 avisos.** Isto não é parecer jurídico.

## Erros

- **lgpd.json**: falta o controlador (quem decide sobre os dados: a sua empresa ou você)
- **lgpd.json**: falta o canal do titular (email ou formulário para pedidos de acesso, correção e exclusão)
- **lgpd.json**: falta o encarregado (nome e email), que deve ser divulgado no site (LGPD art. 41; Res. CD/ANPD 18/2024)
- **lgpd.json**: dpa_para_clientes está a confirmar: o contrato de tratamento que você oferece aos clientes ainda não existe
- **operador Supabase**: pendente: confirme no contrato do fornecedor se ele oferece as cláusulas-padrão da ANPD (aditivo para o Brasil). Se não oferecer, peça, troque de fornecedor ou fale com um advogado
- **operador Vercel**: pendente: confirme no contrato do fornecedor se ele oferece as cláusulas-padrão da ANPD (aditivo para o Brasil). Se não oferecer, peça, troque de fornecedor ou fale com um advogado
- **operador Resend**: pendente: confirme no contrato do fornecedor se ele oferece as cláusulas-padrão da ANPD (aditivo para o Brasil). Se não oferecer, peça, troque de fornecedor ou fale com um advogado
- **operador Google APIs**: pendente: confirme no contrato do fornecedor se ele oferece as cláusulas-padrão da ANPD (aditivo para o Brasil). Se não oferecer, peça, troque de fornecedor ou fale com um advogado

## Avisos

- **dados.csv:5 (endereço guardado depois de excluir ou trocar)**: legítimo interesse: faça e guarde o teste de balanceamento (guia da ANPD; GDPR art. 6(1)(f)) e dê ao titular como se opor
- **dados.csv:11 (estatísticas de visita: código do visitante no dia (hash com sal que muda todo dia; sem cookie e sem IP); país; cidade; origem; aparelho)**: legítimo interesse: faça e guarde o teste de balanceamento (guia da ANPD; GDPR art. 6(1)(f)) e dê ao titular como se opor
- **dados.csv:12 (limites de uso: hash do IP ou do email)**: legítimo interesse: faça e guarde o teste de balanceamento (guia da ANPD; GDPR art. 6(1)(f)) e dê ao titular como se opor
- **operador Supabase**: sem contrato de tratamento (DPA) aceito. A maioria dos fornecedores oferece um padrão no painel: o usuário aceita, guarda a cópia e marca "dpa": true (LGPD art. 39)
- **operador Vercel**: sem contrato de tratamento (DPA) aceito. A maioria dos fornecedores oferece um padrão no painel: o usuário aceita, guarda a cópia e marca "dpa": true (LGPD art. 39)
- **operador Resend**: sem contrato de tratamento (DPA) aceito. A maioria dos fornecedores oferece um padrão no painel: o usuário aceita, guarda a cópia e marca "dpa": true (LGPD art. 39)
- **operador Asaas**: sem contrato de tratamento (DPA) aceito. A maioria dos fornecedores oferece um padrão no painel: o usuário aceita, guarda a cópia e marca "dpa": true (LGPD art. 39)
- **operador Google APIs**: sem contrato de tratamento (DPA) aceito. A maioria dos fornecedores oferece um padrão no painel: o usuário aceita, guarda a cópia e marca "dpa": true (LGPD art. 39)

## Registro das operações (LGPD art. 37)

| dado | titular | finalidade | base LGPD | sensível ou criança | retenção | compartilhado com |
| --- | --- | --- | --- | --- | --- | --- |
| email e senha (só o hash) da conta | criador | criar a conta e entrar | contrato (art. 7º, V) | não | até excluir a conta (apagada na hora pelo app) | Supabase |
| nome e foto da conta Google (só quem entra com Google) | criador | entrar com Google | contrato (art. 7º, V) | não | até excluir a conta | Supabase; Google APIs |
| a página: endereço; título; bio; foto; links; redes; tema; fuso e categoria | criador | montar e mostrar a página pública | contrato (art. 7º, V) | não | até excluir a página ou a conta (apagada na hora) | Supabase |
| endereço guardado depois de excluir ou trocar | criador | ninguém se passar pela página logo depois; levar quem tem o endereço antigo ao novo | legitimo_interesse (art. 7º, IX) | não | 14 dias (o job de limpeza apaga) | Supabase |
| assinatura: forma de pagamento; situação; valor; ids do Asaas | criador | cobrar o plano pago | contrato (art. 7º, V) | não | enquanto a conta existir | Supabase; Asaas |
| eventos de cobrança recebidos do Asaas | criador | registrar pagamentos e estornos | obrigacao_legal (art. 7º, II) | não | 5 anos (registro de cobrança; prazo a confirmar com o contador) | Supabase; Asaas |
| nome e CPF ou CNPJ de quem paga | criador | emitir a cobrança (o Asaas exige) | contrato (art. 7º, V) | não | não fica no nosso banco: vai direto ao Asaas; lá segue o prazo do Asaas | Asaas |
| emails transacionais (confirmação; senha; cobrança) | criador | avisar o que acontece com a conta e o pagamento | contrato (art. 7º, V) | não | o registro de envio segue o prazo do Resend (a confirmar) | Resend |
| estatísticas de visita: código do visitante no dia (hash com sal que muda todo dia; sem cookie e sem IP); país; cidade; origem; aparelho | visitante da página | mostrar ao criador quantas pessoas viram e clicaram e de onde vieram | legitimo_interesse (art. 7º, IX) | não | eventos 90 dias; sal 1 dia; somas por dia até excluir a página | Supabase; Vercel |
| limites de uso: hash do IP ou do email | visitante e criador | impedir abuso (robôs; tentativa de senha; envio em massa) | legitimo_interesse (art. 7º, IX) | não | 1 dia (o job de limpeza apaga) | Supabase |
| pedidos do titular e de exclusão: email; tipo; datas | criador | provar que o pedido foi atendido no prazo | exercicio_direitos (art. 7º, VI) | não | 5 anos (prazo a confirmar com o advogado) | Supabase |
| registros de acesso (IP; data e hora; aparelho) do login e do painel | criador | cumprir o Marco Civil (art. 15) e proteger a conta | obrigacao_legal (art. 7º, II) | não | 6 meses | Supabase; Vercel |

## Dados que você trata como operador

O controlador é o seu cliente: ele define a base legal. Você segue as instruções dele, protege os dados e o avisa de incidentes.

| dado | titular | finalidade | sensível ou criança | retenção | compartilhado com |
| --- | --- | --- | --- | --- | --- |
| inscritos dos formulários de email: email; nome; texto do consentimento; data | inscrito da lista do criador | o criador mandar novidades a quem pediu | não | até o criador tirar a pessoa ou excluir a página (apagados na hora) | Supabase |

## Operadores e transferências internacionais

| operador | serviço | país | DPA | mecanismo Brasil |
| --- | --- | --- | --- | --- |
| Supabase | banco de dados, login e arquivos | US | a_confirmar | a_confirmar |
| Vercel | hospedagem e funções | US | a_confirmar | a_confirmar |
| Resend | email transacional | US | a_confirmar | a_confirmar |
| Asaas | cobrança (Pix, cartão e boleto) | BR | a_confirmar | - |
| Google APIs | login com Google (só quem escolhe) | US | a_confirmar | a_confirmar |

## Encontrado no código

- Asaas (pagamento, BR): .env.example [ASAAS_], e2e/f09-plano.spec.ts [ASAAS_], src/app/api/webhooks/asaas/route.ts [ASAAS_]
- Google APIs (integração, US): .env.example [GOOGLE_CLIENT_ID], supabase/config.toml [GOOGLE_CLIENT_ID]
- Resend (email, US): .env.example [RESEND_], src/lib/email/index.ts [RESEND_], supabase/config.toml ["resend"]
- Supabase (banco e login, US): .env.example [SUPABASE_], package.json [@supabase/], e2e/apoio.ts [@supabase/]
- Vercel (hospedagem, US): vercel.json [vercel.json], src/app/api/cron/[job]/route.ts [vercel.json], src/lib/jobs.ts [vercel.json]

## Prazos

| obrigação | Brasil |
| --- | --- |
| acesso e confirmação pedidos pelo titular | imediato no formato simplificado; até 15 dias a declaração completa (art. 19) |
| outros direitos (correção, exclusão, portabilidade...) | sem prazo em regulamento ainda: use 15 dias |
| incidente: avisar a autoridade | 3 dias úteis à ANPD (Res. 15/2024) |
| incidente: avisar os titulares | 3 dias úteis |
| registro de incidentes | guardar 5 anos, inclusive os não comunicados |
| logs de acesso à aplicação | guardar 6 meses (Marco Civil, art. 15) |

Num incidente: `python3 $SKILL/lgpd.py prazo-incidente "AAAA-MM-DD HH:MM"`
