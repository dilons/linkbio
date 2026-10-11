<!--
RASCUNHO da /replica-lgpd (2026-10-11). Não publicar antes de:
1. preencher o que está entre {{ }} (controlador, encarregado ou canal, data);
2. confirmar os operadores (DPA e cláusulas da ANPD, ver replica/lgpd.md);
3. a revisão de um advogado.
Escrito do zero a partir de replica/dados.csv e replica/lgpd.json. Nada do app
original. O nome do app sai de src/lib/marca.ts quando virar página.
-->

# Política de Privacidade do Chamaqui

Última atualização: {{AAAA-MM-DD}}

## 1. Quem somos

O Chamaqui é oferecido por {{nome ou razão social}}, {{CPF ou CNPJ}},
{{endereço}}. Nós somos o controlador dos seus dados: decidimos como e por que
eles são usados.

Esta política vale para quem cria uma página no Chamaqui (o criador) e para
quem visita uma página.

## 2. Fale com a gente sobre seus dados

{{Encarregado pelo tratamento de dados: nome, email.}}
<!-- Pequeno porte sem encarregado: "Canal para pedidos sobre dados pessoais: {{email}}." -->

## 3. Quais dados usamos e por quê

**Se você cria uma página:**

| dado | para quê | base legal | por quanto tempo |
| --- | --- | --- | --- |
| email e senha (guardamos só um código que não volta à senha) | criar a sua conta e deixar você entrar | contrato | até você excluir a conta |
| nome e foto da conta Google, se você entrar com Google | entrar com Google | contrato | até você excluir a conta |
| a sua página: endereço, título, bio, foto, links, redes, tema e fuso | montar e mostrar a página | contrato | até você excluir a página ou a conta: apagamos na hora |
| o endereço da página, depois de excluir ou trocar | ninguém se passar pela sua página logo depois; levar ao endereço novo quem tem o antigo | legítimo interesse | 14 dias |
| a assinatura: forma de pagamento, situação, valor | cobrar o plano pago | contrato | enquanto a conta existir |
| os avisos de pagamento que o Asaas nos manda | registrar pagamentos e estornos | obrigação legal | {{prazo, a confirmar com o contador}} |
| nome e CPF ou CNPJ de quem paga | emitir a cobrança (o Asaas exige) | contrato | não ficam com a gente: vão direto ao Asaas |
| os emails da conta e da cobrança | avisar você do que acontece com a conta e o pagamento | contrato | {{o prazo do registro de envio do Resend}} |
| data, hora e IP de quando você entra | cumprir o Marco Civil da Internet e proteger a sua conta | obrigação legal | 6 meses |
| os seus pedidos sobre dados (cópia, exclusão) | provar que atendemos no prazo | exercício regular de direitos | {{prazo, a confirmar com o advogado}} |

**Se você visita uma página:**

| dado | para quê | base legal | por quanto tempo |
| --- | --- | --- | --- |
| um código do dia (calculado a partir do IP e do navegador, com um valor que muda todo dia; o IP não é guardado), país, cidade, de onde você veio e o tipo de aparelho | mostrar ao criador quantas pessoas viram a página e clicaram, e de onde vieram | legítimo interesse | 90 dias; depois, só o total por dia |
| um código do IP, por um dia | impedir abuso, como robôs | legítimo interesse | 1 dia |
| se você confirmou um aviso de conteúdo | não perguntar de novo na mesma visita | necessário para o que você pediu | até fechar o navegador |

Se uma página pedir a sua data de nascimento, ela é usada só para conferir a
idade e não é guardada.

O que cada base legal quer dizer para você: **contrato**, sem isso não
conseguimos prestar o serviço que você pediu; **obrigação legal**, a lei manda
guardar; **legítimo interesse**, um uso que você espera, com cuidados para não
pesar sobre você (os testes estão no nosso registro) e do qual você pode se
opor pelo contato da seção 2.

## 4. Com quem compartilhamos

**Se você deixa o seu email no formulário de uma página**, quem decide sobre
esse email é o dono da página: ele é o controlador, e nós guardamos em nome
dele. Pedidos sobre esses dados (sair da lista, apagar) vão para ele; nós
ajudamos a atender.

Usamos fornecedores que tratam dados em nosso nome, sob contrato:

| fornecedor | o que faz | onde |
| --- | --- | --- |
| Supabase | banco de dados, login e arquivos | empresa nos Estados Unidos; dados na região de São Paulo |
| Vercel | hospedagem do site | empresa nos Estados Unidos; o site roda em São Paulo |
| Resend | envio dos emails da conta e da cobrança | Estados Unidos |
| Asaas | cobrança do plano pago (Pix, cartão e boleto) | Brasil |
| Google | login com Google, só para quem escolhe entrar assim | Estados Unidos |

Não vendemos seus dados e não os usamos para treinar inteligência artificial.

## 5. Transferência para outros países

Supabase, Vercel, Resend e Google são empresas dos Estados Unidos. A
transferência segue o art. 33 da LGPD, por meio das cláusulas-padrão
contratuais da ANPD. {{Confirmar com cada fornecedor antes de publicar: ver
replica/lgpd.md.}}

## 6. Cookies

Usamos só cookies necessários: o da sessão, para você continuar entrado, e o
que lembra a sua resposta a um aviso de conteúdo durante a visita. Não usamos
cookies de estatística nem de publicidade.

## 7. Seus direitos

Você pode, a qualquer momento e sem custo (LGPD, art. 18):

- confirmar se tratamos seus dados e acessá-los;
- corrigir dados incompletos, errados ou desatualizados;
- pedir anonimização, bloqueio ou eliminação de dados desnecessários ou
  excessivos;
- levar seus dados para outro serviço (portabilidade);
- saber com quem compartilhamos seus dados;
- se opor a um uso feito por legítimo interesse;
- pedir revisão de decisões tomadas só por meios automatizados.

Na conta, em **Conta > Privacidade e dados**, você baixa uma cópia de tudo e vê
com quem compartilhamos; no editor, corrige o que quiser; em **Conta**, exclui
a página ou a conta, e apagamos na hora. O resto, pelo contato da seção 2.
Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de
Proteção de Dados (ANPD).

## 8. Crianças e adolescentes

O Chamaqui não é feito para menores de 18 anos. {{Regras do aviso de idade
conforme a decisão do ECA Digital: ver replica/lgpd.md.}}

## 9. Segurança

Os dados viajam criptografados e ficam num banco que só o servidor do app
acessa; o navegador nunca fala direto com ele. A senha fica só como um código
que não volta à senha. Se houver um incidente que possa trazer risco ou dano
relevante a você, avisamos você e a ANPD.

## 10. Mudanças nesta política

Quando ela mudar de forma relevante, avisamos por email antes de a mudança
valer.
