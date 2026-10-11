# Marca no Brasil (INPI): Chamaqui

`/replica-inpi` em 2026-10-11. **A busca no pePI ainda não foi feita.** Daqui
não dá: a rede do ambiente bloqueia o INPI e o Registro.br, e a busca é para
ser feita por uma pessoa, um termo por vez (nada de script contra o site do
INPI). Este arquivo tem tudo pronto para você pesquisar e colar o resultado;
depois eu rodo a análise e fecho a escolha.

No Brasil a marca é de quem deposita primeiro (art. 129 da Lei 9.279/96). A
exceção é quem já usava de boa-fé há pelo menos seis meses (art. 129, §1º).
Por isso: pesquisar, e se estiver limpo, **depositar antes de divulgar o nome**
(antes do logo, do domínio em uso e do lançamento).

## A escolha (provisória até a busca)

| | nome | por quê |
| --- | --- | --- |
| escolhido | **Chamaqui** | escolhido pelo dono na `/replica-brand`. Palavra inventada (composta de "chama aqui"), o que tende a dar marca forte; diz o ângulo (vende e atende); fácil de falar em português |
| reserva | **Logali** | o outro nome inventado da lista final (de "logo ali"). Plaquinha, Cartaz e Balcão são palavras comuns: a busca tende a trazer muita coisa e o registro é mais fraco |

Nenhum dos dois se parece com o original nem com os concorrentes maiores
(Linktree, Beacons, Taplink, Campsite, Linkin.bio, Bio.link), e nenhum é só
uma palavra que descreve o serviço (art. 124, VI): ver `inpi-analise.md`.
Isso foi o que deu para conferir sem o pePI.

## As classes

NCL 13-2026 (em uso no INPI desde 1º de janeiro de 2026).

| classe | por quê | depositar? |
| --- | --- | --- |
| **42** | software como serviço: a plataforma onde a pessoa cria e publica a página | sim |
| **9** | aplicativo para baixar. Hoje o produto é só web, mas os concorrentes têm app e um app próprio pode vir; é onde mora o conflito mais provável | sim |
| 35 | entra se a empresa passar a prestar o serviço em si: vitrine ou loja com produtos de terceiros, publicidade para os criadores | decidir com o especialista; hoje não |
| 38 | mensagens e comunicação. O app leva ao WhatsApp, mas não transmite mensagens | não |

Os termos exatos de cada classe estão na lista oficial (gov.br/inpi,
"Classificação de produtos e serviços"). Cada classe é uma taxa: 9 e 42
primeiro.

## O que pesquisar

Em https://busca.inpi.gov.br/pePI/ (entrar sem login, Marca), cada termo
primeiro no modo **Radical**, sem filtrar classe, e depois no modo **Exata**.
Abra cada resultado nas classes 9, 42, 35 e 38 (classes que conversam entre
si).

| termo | de onde veio | Radical | Exata |
| --- | --- | --- | --- |
| chamaqui | o nome | a executar | a executar |
| chamaq | radical: pega derivações | a executar | - |
| chamaki | mesmo som, outra grafia | a executar | a executar |
| xamaqui | mesmo som, outra grafia | a executar | a executar |
| chamaquis | plural | a executar | a executar |
| chama aqui | o sentido (é assim que se lê) | a executar | a executar |
| chamaaqui | como se escreve de ouvido | a executar | a executar |
| chame aqui | mesmo sentido | a executar | a executar |
| me chama | mesmo sentido, comum em bio de vendedor | a executar | a executar |
| chama | a palavra base: vai trazer centenas. Olhe só as classes 9, 35, 38 e 42 | a executar | a executar |
| llama aqui | tradução (espanhol) | a executar | a executar |
| call here | tradução (inglês) | a executar | a executar |
| logali | reserva | a executar | a executar |
| logal | reserva, radical | a executar | - |
| logaly, logale, logalis | reserva, grafias e plural | a executar | a executar |
| logo ali | reserva, o sentido | a executar | a executar |
| linktree | o original: em que classes está (pode ter registro via Protocolo de Madri) | a executar | a executar |
| beacons, taplink | concorrentes: em que classes estão | a executar | a executar |

Os termos de "mesmo som" saíram da ferramenta (`marca.py variantes`); os de
sentido e tradução, de mim: semelhança de sentido também colide, e nenhum
script pega.

## Como me mandar o resultado

Do jeito mais fácil para você:

- **Colar no `replica/inpi.csv`**, uma marca por linha, nas colunas
  `marca,situacao,classe,processo,titular,apresentacao,termo,modo,data`, com a
  situação como o pePI mostra ("Registro de marca em vigor", "Aguardando exame
  de mérito", "Pedido definitivamente arquivado"...). Exemplo:
  `CHAMA AQUI,Registro de marca em vigor,NCL(13) 35,912345678,Fulano Ltda,nominativa,chama aqui,Radical,2026-10-12`
- **Ou colar no chat** o texto da tela de resultados (ou mandar o print), termo
  por termo, que eu passo para o CSV.

Mande também os termos que não trouxeram nada ("chamaqui, Radical: 0
resultados"): a cobertura conta tanto quanto os achados.

## A análise

`replica/inpi-analise.md`, refeita a cada busca colada. Hoje ela só cobre a
comparação com o original, os concorrentes e as palavras descritivas.
Triagem não é parecer: a ferramenta vê a grafia, o som e a classe, não o
logotipo, a cor nem o mercado de cada marca.

## As checagens no Brasil

| checagem | o que fazer | onde | resultado | data |
| --- | --- | --- | --- | --- |
| INPI: marcas no Brasil | os termos acima, Radical e Exata | https://busca.inpi.gov.br/pePI/ | a executar | |
| INPI: confirmar as classes | lista NCL 13-2026; classes pensadas: 9, 42 | https://www.gov.br/inpi/pt-br/servicos/marcas/classificacao-marcas | a executar | |
| Marcas internacionais | o original pode ter registro via Protocolo de Madri designando o Brasil | https://branddb.wipo.int | a executar | |
| Domínio .com.br | `whois chamaqui.com.br` e `chamaaqui.com.br` (registrar .br pede CPF ou CNPJ) | https://registro.br | a executar | |
| Domínio .com | `whois chamaqui.com` | - | a executar | |
| Nome empresarial | consulta de viabilidade de nome na Junta Comercial do seu estado (REDESIM) | https://www.gov.br/empresas-e-negocios/pt-br/redesim | a executar | |
| App Store e Google Play (Brasil) | buscar "Chamaqui" | - | a executar | |
| Redes | Instagram, TikTok, X, YouTube, GitHub: @chamaqui | - | a executar | |
| Web | "Chamaqui" + link na bio | busca na web | nenhum app ou serviço com o nome; os resultados foram para o Cerro Champaquí (Argentina) | 2026-10-11 |

O nome empresarial (Junta, vale no estado) e a marca (INPI, vale no país) são
proteções diferentes: o nome do app é protegido pela marca.

## O depósito (você faz)

Quando a busca vier limpa e um especialista tiver olhado:

1. **Quem deposita:** a pessoa física ou jurídica que exerce de fato a
   atividade (art. 128, §1º): você (CPF) ou um MEI ou empresa com CNAE
   compatível com software.
2. **Cadastro no e-INPI**, emissão e pagamento da **GRU** do serviço de
   depósito, e a **petição** no sistema eletrônico de marcas. Pessoa física,
   MEI, ME e EPP, entre outros, têm desconto: confira a tabela de retribuições
   vigente no site do INPI (eu não pus valores aqui de propósito, porque
   mudam).
3. **Apresentação nominativa** primeiro (só a palavra "Chamaqui", que vale em
   qualquer letra e cor). A mista, com o logo, depois que o logo existir.
4. **Classes 9 e 42**, com os termos da lista oficial (a 35 só se o
   especialista recomendar).
5. **Depois:** o pedido sai na Revista da Propriedade Industrial (RPI) e
   terceiros têm 60 dias para se opor (art. 158). Acompanhe a RPI toda semana:
   exigência tem prazo, e prazo perdido arquiva o pedido. Concedido e paga a
   taxa, o registro vale 10 anos, prorrogáveis (art. 133). Use ® só depois da
   concessão.
6. **Fora do Brasil:** pelo Protocolo de Madri (o Brasil entrou em 2019), o
   pedido brasileiro pode ser estendido a outros países.

Antes de pagar, vale pedir a um advogado ou agente da propriedade industrial
a busca e a opinião, ou pedir a busca oficial paga ao INPI. Isto aqui é
triagem, não parecer.
