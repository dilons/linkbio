# Mock da /replica-entrepreneur

**Nada nesta pasta é pesquisa.** As avaliações foram escritas à mão para
testar o caminho inteiro enquanto as de verdade não chegam (a rede deste
ambiente bloqueia App Store, Google Play, Trustpilot, Capterra, G2, Reddit e
Hacker News).

| arquivo | o que é |
| --- | --- |
| `reviews.mock.csv` | 60 avaliações fictícias, mesmo formato do `replica/reviews.csv` |
| `feedback.mock.md` | a saída do `reviews.py` sobre o mock |
| `fixes.mock.md` | as três listas, o plano de correções e o ângulo, no formato final |

Como o mock fica separado dos dados reais:

- fontes `mock-*` e links em `https://mock.invalid/...` (o `.invalid` é
  reservado e não existe);
- os textos falam de "o app", sem citar o Linktree nem pessoas;
- o `replica/ferramentas/coletar_avaliacoes.py` tira do `replica/reviews.csv` qualquer
  linha `mock-*` ou `.invalid`;
- nada daqui foi para a `features.csv`, o `replica/feedback.md` ou o
  `replica/fixes.md`.

Não use estas frases em página, anúncio, loja ou apresentação: são
inventadas.

## Trocar pelos dados reais

```bash
python3 replica/ferramentas/coletar_avaliacoes.py      # ou cole à mão (replica/coleta.md)
python3 .claude/skills/replica-entrepreneur/reviews.py replica/reviews.csv \
  --themes replica/temas.json --out replica/feedback.md
```

Depois, `replica/fixes.md` no formato do `fixes.mock.md`, com os números e as
frases de verdade, e as linhas novas na `features.csv`. Esta pasta pode ser
apagada.
