> **O pePI ainda não foi pesquisado** (2026-10-11): `replica/inpi.csv` está
> vazio. O "risco BAIXO" abaixo só cobre a comparação com o original e os
> concorrentes (`--avoid`) e as palavras descritivas da categoria. **Não vale
> como resultado de INPI.** Refazer depois de colar a busca:
>
> ```bash
> python3 .claude/skills/replica-inpi/marca.py analisar replica/inpi.csv \
>   --candidatos "Chamaqui,Logali" --classes 9,42 \
>   --avoid "Linktree,Beacons,Taplink,Campsite,Linkin.bio,Bio.link" \
>   --descritivos "link,links,bio,pagina,página,perfil" --out replica/inpi-analise.md
> ```

# Triagem de marca (INPI)

Classes do seu produto: 9, 42. Isto é triagem, não parecer: confirme com um advogado ou agente da propriedade industrial antes de gastar com o nome.

## Chamaqui: risco BAIXO
- nenhuma marca viva em classe próxima ficou parecida. Bom sinal, desde que a busca tenha coberto as variantes e as classes afins.

## Logali: risco BAIXO
- nenhuma marca viva em classe próxima ficou parecida. Bom sinal, desde que a busca tenha coberto as variantes e as classes afins.

## Plaquinha: risco BAIXO
- nenhuma marca viva em classe próxima ficou parecida. Bom sinal, desde que a busca tenha coberto as variantes e as classes afins.

## Cartaz: risco BAIXO
- nenhuma marca viva em classe próxima ficou parecida. Bom sinal, desde que a busca tenha coberto as variantes e as classes afins.

## Balcão: risco BAIXO
- nenhuma marca viva em classe próxima ficou parecida. Bom sinal, desde que a busca tenha coberto as variantes e as classes afins.

Nenhum candidato com risco alto nesta busca.

Código de saída 1 quando algum candidato fica alto. Com vários candidatos isso é normal; para usar como trava, rode só com o nome escolhido.
