# Coleta de avaliações do Linktree

Enquanto as reais não chegam, `replica/mock/` tem o caminho inteiro rodando
com 60 avaliações fictícias (ver o `LEIA-ME.md` de lá). Mock não é pesquisa e
não entra aqui: o script de coleta tira do `reviews.csv` qualquer linha
`mock-*` ou com link `.invalid`.

Para a `/replica-entrepreneur`: o que os usuários do Linktree reclamam e
pedem, nas palavras deles, com o link de cada uma. Meta: **100 ou mais
avaliações de pelo menos três fontes**, as mais recentes primeiro (até 18
meses contam inteiras), lendo também as de 3 e 4 estrelas ("gosto, mas...").

Regras: só texto copiado exatamente como está na página, com o link; nada
inventado, resumido ou traduzido; sem o nome de quem escreveu; nada de
avaliação falsa, nem nossa nem contra eles. As palavras dessas pessoas são
pesquisa, não depoimento: não vão para a página de vendas.

## O formato

Tudo em `replica/reviews.csv`, uma avaliação por linha:

```csv
source,url,date,rating,text
trustpilot,https://www.trustpilot.com/reviews/<id-da-avaliação>,2026-08-14,2,"o texto exatamente como está, entre aspas se tiver vírgula ou quebra de linha"
```

- `source`: `app-store-br`, `google-play`, `trustpilot`, `capterra`, `g2`, `getapp`, `reddit`, `hacker-news`, `reclame-aqui`...
- `url`: o link da avaliação ou da conversa (o permalink, se a página tiver; senão, a página onde ela está).
- `date`: AAAA-MM-DD (AAAA-MM serve).
- `rating`: de 1 a 5, vazio se a fonte não tem estrelas.
- `text`: copiado exatamente. Aspas dentro do texto viram duas aspas (`""`).

Linha sem link ou sem texto é descartada pelo `reviews.py`.

## Automático (fontes com feed ou API oficial)

```bash
python3 replica/ferramentas/coletar_avaliacoes.py                   # App Store Brasil e EUA (até 500 cada) e Hacker News
python3 replica/ferramentas/coletar_avaliacoes.py --paises br,us,pt # mais lojas da App Store
```

Só biblioteca padrão do Python, roda em qualquer máquina com Python 3. Mantém
as linhas que você colou à mão e não repete a mesma URL. Fontes:

- **App Store**: feed RSS público de avaliações da Apple, app
  [Linktree: Link in Bio Creator](https://apps.apple.com/br/app/id1593515263)
  (id 1593515263).
- **Hacker News**: API pública do Algolia, só o que cita o Linktree.
- **Reddit** (opcional): precisa da sua chave da API oficial. Crie um app do
  tipo "script" em reddit.com/prefs/apps e rode com `REDDIT_CLIENT_ID`,
  `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT="chamaqui-pesquisa/0.1 by
  seu_usuario"` e `--reddit`.

## À mão, no navegador

Sem feed público: abra no navegador, filtre e copie, no ritmo de uma pessoa.
Nada de robô de raspagem nesses sites.

| fonte | onde | o que fazer |
| --- | --- | --- |
| Google Play | procure "Linktree" na Play Store (o app oficial é da Linktree Pty Ltd) | "Ver todas as avaliações", ordenar por mais recentes; copiar 1 a 3 estrelas e algumas de 4. A Play não tem link por avaliação: use o link do app |
| Trustpilot | [trustpilot.com/review/linktr.ee](https://www.trustpilot.com/review/linktr.ee) | filtrar 1 a 3 estrelas; cada avaliação tem link próprio (a data dela também abre o permalink) |
| Capterra | [capterra.com/p/229171/Linktree/reviews](https://www.capterra.com/p/229171/Linktree/reviews/) | os "Contras" de cada avaliação são o mais útil |
| GetApp | [getapp.ca/reviews/2047320/linktree](https://www.getapp.ca/reviews/2047320/linktree) | mesmo grupo do Capterra; conferir se não repete |
| G2 | procure "Linktree" no G2 | "What do you dislike?" de cada avaliação |
| Reclame Aqui | procure "Linktree" no reclameaqui.com.br | se houver página da empresa, as reclamações em português |
| Reddit | buscas "linktree", "linktree alternative", "switched from linktree", "linktree vs" | sem a chave da API, copie à mão os comentários que reclamam ou pedem algo (link do comentário em "Share", "Copy link") |
| changelog | a página de novidades do Linktree | não é avaliação: serve para não "consertar" o que eles já consertaram. Anote em `replica/fixes.md` |

Depois:

```bash
python3 ~/.claude/skills/replica-entrepreneur/reviews.py replica/reviews.csv \
  --themes replica/temas.json --out replica/feedback.md
```

`replica/temas.json` tem os temas de link na bio em português e inglês (conta
suspensa, link bloqueado pelo Instagram, marca do Linktree, Pix e reais...).
