---
name: replica-inpi
description: >-
  Triagem de marca no Brasil para o nome do seu app: escolhe as classes NCL,
  gera os termos e variantes fonéticas para pesquisar no pePI do INPI, conduz
  a busca, mede o risco de colidência de cada candidato com as marcas
  encontradas, e lista as outras checagens brasileiras (domínio .com.br, nome
  empresarial na Junta, lojas, redes) e os passos do depósito. Use quando o
  usuário disser "buscar no INPI", "registrar a marca", "o nome está livre no
  Brasil?", "posso usar esse nome?", "pesquisa de marca", "classe de Nice",
  "depositar marca", "check trademark in Brazil", ou depois de /replica-brand
  sempre que o app for lançado no Brasil.
---

# replica-inpi

No Brasil, a marca é de quem registra primeiro no INPI (sistema atributivo,
art. 129 da Lei 9.279/96). A exceção é quem já usava a marca de boa-fé há pelo
menos seis meses antes do depósito de outra pessoa (art. 129, §1º). Por isso a
busca vem antes de gastar com logo, domínio e lançamento. A `/replica-brand`
cobre EUA, UE, Canadá e OMPI; esta skill cobre o Brasil.

Lê `replica/brand.md` (os candidatos), `replica/brand.json` (o `avoid`: o app
original e concorrentes) e `replica/fixes.md` (a categoria do app; se não
existir, a categoria costuma estar em `brand.md`, ou pergunte). Escreve:

- `replica/inpi.csv`: o que a busca achou
- `replica/inpi-analise.md`: a saída da ferramenta, que pode ser refeita
- `replica/inpi.md`: o que é seu e não se sobrescreve (o nome escolhido e
  por quê, a cobertura da busca, as checagens com resultado e data)

Ferramenta nesta pasta. Rode da raiz do projeto, trocando `$SKILL` pela pasta
onde esta skill está instalada (por exemplo `~/.claude/skills/replica-inpi`):

```bash
python3 $SKILL/marca.py variantes "Agendei" --descritivos "agenda,agendamento"
python3 $SKILL/marca.py checklist "Agendei" --classes 9,42
python3 $SKILL/marca.py analisar replica/inpi.csv --candidatos "Agendei,Horaly" \
    --classes 9,42 --avoid "Calendly" --descritivos "agenda,agendamento" \
    --out replica/inpi-analise.md
```

## As regras

- **Leitura, não raspagem.** O pePI é uma base pública. Pesquise como uma
  pessoa pesquisa: o usuário, ou você por uma ferramenta de navegador ligada
  ao navegador do próprio usuário, um termo por vez, com o usuário presente.
  Nada de scripts, loops ou downloads em massa contra o site do INPI.
- **Rodada, não presumida.** Toda checagem leva o resultado e a data em que
  foi feita. Nunca escreva "livre" ou "disponível" para uma busca que ninguém
  rodou.
- **Triagem não é parecer.** A ferramenta aproxima semelhança gráfica e
  fonética e a classe. O exame do INPI também pesa o sentido (semelhança
  ideológica) e a afinidade de mercado. Antes de pagar o depósito, sugira que
  um advogado ou agente da propriedade industrial faça a busca, ou que o
  usuário peça a busca oficial paga ao INPI.
- **O usuário deposita.** Você não cria conta no e-INPI, não emite nem paga
  GRU e não assina petição. Você prepara tudo e diz exatamente o que fazer.

## Passo 1: as classes

A proteção vale para as classes depositadas (salvo marca de alto renome). O
INPI usa a Classificação de Nice, 13ª edição (NCL 13-2026), desde 1º de
janeiro de 2026. Ponto de partida para apps:

| o app | classes |
| --- | --- |
| qualquer app ou SaaS | **9** (app para baixar) e **42** (software como serviço, plataforma online) |
| marketplace, anúncios, varejo online, ou se você também presta o serviço (agendar pelo cliente, central de atendimento) | 35 |
| pagamentos, carteira digital, crédito | 36 |
| chat, mensagens, fóruns, transmissão | 38 |
| entrega, transporte, mobilidade | 39 |
| cursos, educação, jogos, entretenimento | 41 |
| reserva de restaurante ou hospedagem | 43 |
| saúde, telemedicina, bem-estar | 44 |
| rede social, encontros, serviços jurídicos | 45 |

Confirme os termos exatos na lista oficial
(gov.br/inpi, "Classificação de produtos e serviços"). Cada classe é uma taxa,
então 9 e 42 primeiro, as outras se o negócio depende delas. Um SaaS que só
oferece o software (de agendamento, por exemplo) fica em 9 e 42; a 35 entra
quando a empresa também presta o serviço em si. Na dúvida, deixe a pergunta
para o especialista do passo 6.

## Passo 2: o que pesquisar

```bash
python3 $SKILL/marca.py variantes "Nome" --descritivos "palavras,que,descrevem,o,serviço"
```

A busca Radical do pePI acha marcas que contêm o termo, mas não acha outra
grafia com o mesmo som. "Agendei" não traz "Ajendey", e "Horaly" não traz
"Oraly". Por isso a ferramenta gera as variantes (k/c/q, s/z/ss, x/ch, i/y,
h mudo, e/i e o/u no fim, como se lê em português um nome em inglês, plural),
o radical sem a vogal final e o núcleo sem palavras genéricas ("app", "pay",
"online").

Pense também no sentido, que nenhum script pega: traduções e sinônimos
colidem. Se o candidato é "Booked", pesquise "Agendado" e "Reservado".

Pesquise também o nome do app original e dos dois ou três maiores
concorrentes, para saber em que classes eles estão. Marca de alto renome
(art. 125) é protegida em todas as classes, e marca notoriamente conhecida
(art. 126) é protegida no seu ramo mesmo sem registro no Brasil.

## Passo 3: a busca no pePI

Em `https://busca.inpi.gov.br/pePI/`, entre sem login (a busca anônima é
permitida), escolha Marca e pesquise cada termo:

1. Modo **Radical**, sem filtrar classe. Depois, modo **Exata**.
2. Abra cada resultado que esteja nas suas classes ou em classes afins
   (9, 42 e as do passo 1 conversam entre si).
3. Copie para `replica/inpi.csv` (modelo: `inpi.example.csv` nesta pasta):
   `marca, situacao, classe, processo, titular, apresentacao`, com a situação
   como o pePI mostra ("Registro de marca em vigor", "Aguardando exame de
   mérito", "Pedido definitivamente arquivado").

Se houver uma ferramenta de navegador conectada, conduza a busca com o
usuário presente. Se não houver, entregue a lista de termos e o CSV vazio e
espere ele colar os resultados.

Se o usuário já trouxer resultados (colados em texto, print, planilha),
passe para o CSV e confira a cobertura contra a lista do passo 2: cada termo
pesquisado, nos dois modos, e as classes afins revisadas quando um radical
trouxe centenas de resultados. Anote em `replica/inpi.md` o que foi coberto e
diga ao usuário o que faltou, em vez de tratar a busca parcial como completa.
Colunas extras no CSV (`termo`, `modo`, `data`) são bem-vindas e ignoradas
pela ferramenta.

Marcas antigas aparecem com classe nacional ("NAC 40/15", anterior a 2000):
a ferramenta trata como mesma classe até alguém conferir.

## Passo 4: a análise

```bash
python3 $SKILL/marca.py analisar replica/inpi.csv --candidatos "A,B,C" --classes 9,42 \
    --avoid "Nome Do Original" --descritivos "agenda,agendamento" \
    --out replica/inpi-analise.md
```

Para cada candidato, compara com cada marca achada e com os nomes do
`--avoid`:

- **alto**: marca viva (registrada ou em andamento) quase igual ou com o mesmo
  radical na mesma classe; quase igual em classe afim; ou parecida com o app
  original ou um concorrente famoso. Troque de nome ou leve a um especialista.
- **medio**: parecida em classe igual ou afim, quase igual em outra classe, ou
  uma marca morta muito parecida (alguém pode depositar de novo; veja por que
  ela morreu).
- **baixo**: nada perto nesta busca. Não é garantia: só vale o que a busca
  cobriu.

Também lista as marcas parecidas que ficaram baixas por estarem mortas ou em
classe distante, para você ver o que foi descartado, e avisa quando o nome é
só genérico ou descritivo, que o INPI não registra (art. 124, VI). Sai com
código 1 se algum candidato ficar alto; com vários candidatos isso é normal.
Leia os conflitos você mesmo: a ferramenta não vê logotipo, cor nem sentido.

**A escolha.** Fique com o candidato de menor risco. No empate, o que melhor
serve o ângulo de `fixes.md` e o público (fácil de falar e de soletrar em
português, se o público é brasileiro). Guarde um segundo nome de reserva.
Escreva a escolha e o motivo em `replica/inpi.md`, e só então rode as
checagens do passo 5 para o nome escolhido.

## Passo 5: as outras checagens no Brasil

```bash
python3 $SKILL/marca.py checklist "Nome" --classes 9,42
```

Gera a tabela com todas as checagens, com "a executar" em cada linha: pePI,
lista NCL, marcas internacionais (o original pode ter registro pelo Protocolo
de Madri designando o Brasil), `whois nome.com.br` no registro.br (registrar
.br pede CPF ou CNPJ), nome empresarial na Junta Comercial do estado, App
Store e Google Play do Brasil, redes sociais e busca na web. Cole em
`replica/inpi.md`, preencha o que já foi feito, rode o resto e anote o
resultado e a data de cada uma.

O nome empresarial (registrado na Junta, vale no estado) e a marca
(registrada no INPI, vale no país) são proteções diferentes. O nome do app é
protegido pela marca.

## Passo 6: o depósito (o usuário faz)

- **Quem deposita:** a pessoa física ou jurídica que exerce de fato a
  atividade (art. 128, §1º). Um MEI ou uma empresa com CNAE compatível.
- **Como:** cadastro no e-INPI, emissão da GRU e petição no sistema
  eletrônico de marcas. Há desconto para pessoa física, MEI, ME e EPP, entre
  outros: confira a tabela de retribuições vigente no site do INPI.
- **Apresentação:** a **nominativa** (só a palavra) protege o nome em qualquer
  letra ou cor, então vem primeiro. A mista (palavra e logo) pode vir depois,
  quando o logo existir.
- **Depois:** o pedido sai na Revista da Propriedade Industrial (RPI), e
  terceiros têm 60 dias para se opor (art. 158). Acompanhe a RPI toda semana:
  exigências têm prazo, e perder um prazo arquiva o pedido. Concedido o
  registro e paga a taxa, ele vale 10 anos e pode ser prorrogado (art. 133).
  Use ® só depois da concessão.
- **Fora do Brasil:** o Brasil faz parte do Protocolo de Madri desde 2019,
  então o pedido brasileiro pode ser estendido a outros países.

## Saída

`replica/inpi.csv`, `replica/inpi-analise.md`, `replica/inpi.md` (o nome
escolhido e por quê, a cobertura da busca, as checagens com resultado e data)
e um resumo: o nome escolhido e o de reserva, o risco, as classes, o que
falta checar e o próximo passo do depósito. Atualize `replica/brand.md` com a
decisão. Depois: `/replica-launch`.
