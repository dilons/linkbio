#!/usr/bin/env python3
"""Coleta avaliações do Linktree pelas fontes oficiais e públicas, para a
/replica-entrepreneur. Só biblioteca padrão do Python.

    python3 replica/ferramentas/coletar_avaliacoes.py                 # App Store (br, us) e Hacker News
    python3 replica/ferramentas/coletar_avaliacoes.py --paises br,us,pt --paginas 10
    REDDIT_CLIENT_ID=... REDDIT_CLIENT_SECRET=... REDDIT_USER_AGENT="chamaqui-pesquisa/0.1 by seu_usuario" \\
        python3 replica/ferramentas/coletar_avaliacoes.py --reddit

Fontes, todas dentro dos termos de cada uma:
- App Store: o feed RSS público de avaliações da Apple (customerreviews).
- Hacker News: a API pública do Algolia (hn.algolia.com/api/v1).
- Reddit: só com a sua chave da API oficial (app "script" em reddit.com/prefs/apps),
  seguindo os termos da API de dados do Reddit.

Google Play, Trustpilot, Capterra, G2 e GetApp não têm feed público: essas
você lê no navegador e cola à mão (ver replica/coleta.md).

O texto vai como está na fonte. A única transformação é tirar o HTML do
Hacker News e do Reddit (as entidades viram os caracteres e <p> vira quebra de
linha), que é o texto que a pessoa vê na página. Nada é resumido nem traduzido.
Linhas que já estão no CSV (inclusive as coladas à mão) são mantidas; a mesma
URL não entra duas vezes. Não grava o nome de quem escreveu.
"""

import argparse
import base64
import csv
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

APP_STORE_ID = "1593515263"  # Linktree: Link in Bio Creator (apps.apple.com/br/app/id1593515263)
CAMPOS = ["source", "url", "date", "rating", "text"]
MENCIONA = re.compile(r"linktree|linktr\.ee", re.I)
PAUSA = 1.0  # segundos entre pedidos: no ritmo de uma pessoa, sem martelar ninguém


def pegar(url, cabecalhos=None, dados=None):
    pedido = urllib.request.Request(url, data=dados, headers={"User-Agent": "chamaqui-pesquisa/0.1", **(cabecalhos or {})})
    with urllib.request.urlopen(pedido, timeout=30) as r:
        corpo = r.read().decode("utf-8")
    time.sleep(PAUSA)
    return json.loads(corpo)


def texto_de_html(trecho):
    t = re.sub(r"<p>|<br\s*/?>", "\n", trecho or "", flags=re.I)
    t = re.sub(r"<[^>]+>", "", t)
    return html.unescape(t).strip()


def app_store(paises, paginas):
    linhas = []
    for pais in paises:
        for p in range(1, paginas + 1):
            url = f"https://itunes.apple.com/{pais}/rss/customerreviews/page={p}/id={APP_STORE_ID}/sortBy=mostRecent/json"
            try:
                feed = pegar(url).get("feed", {})
            except Exception as e:  # página vazia ou fora do ar: segue para o próximo país
                print(f"  app-store {pais} página {p}: {e}", file=sys.stderr)
                break
            entradas = feed.get("entry", [])
            if isinstance(entradas, dict):
                entradas = [entradas]
            avaliacoes = [e for e in entradas if "im:rating" in e]
            if not avaliacoes:
                break
            for e in avaliacoes:
                rid = e["id"]["label"]
                titulo = e.get("title", {}).get("label", "").strip()
                corpo = e.get("content", {}).get("label", "").strip()
                linhas.append({
                    "source": f"app-store-{pais}",
                    "url": f"https://apps.apple.com/{pais}/app/id{APP_STORE_ID}?see-all=reviews#review-{rid}",
                    "date": e.get("updated", {}).get("label", "")[:10],
                    "rating": e["im:rating"]["label"],
                    "text": f"{titulo}\n{corpo}" if titulo else corpo,
                })
            print(f"  app-store {pais} página {p}: {len(avaliacoes)}", file=sys.stderr)
    return linhas


def hacker_news(consultas, paginas):
    linhas = []
    for q in consultas:
        for tag in ("comment", "story"):
            for p in range(paginas):
                url = "https://hn.algolia.com/api/v1/search_by_date?" + urllib.parse.urlencode(
                    {"query": q, "tags": tag, "hitsPerPage": 100, "page": p})
                r = pegar(url)
                for h in r.get("hits", []):
                    texto = texto_de_html(h.get("comment_text") or h.get("story_text") or "")
                    if tag == "story" and h.get("title"):
                        texto = f"{h['title']}\n{texto}".strip()
                    if not MENCIONA.search(texto):
                        continue
                    linhas.append({
                        "source": "hacker-news",
                        "url": f"https://news.ycombinator.com/item?id={h['objectID']}",
                        "date": (h.get("created_at") or "")[:10],
                        "rating": "",
                        "text": texto,
                    })
                if p + 1 >= r.get("nbPages", 0):
                    break
    print(f"  hacker-news: {len(linhas)} que citam o Linktree", file=sys.stderr)
    return linhas


def reddit(consultas, limite_de_conversas):
    cid, segredo, ua = (os.environ.get(k) for k in ("REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USER_AGENT"))
    if not (cid and segredo and ua):
        print("  reddit: sem REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET e REDDIT_USER_AGENT; pulando", file=sys.stderr)
        return []
    basico = base64.b64encode(f"{cid}:{segredo}".encode()).decode()
    token = pegar("https://www.reddit.com/api/v1/access_token", {"Authorization": f"Basic {basico}", "User-Agent": ua},
                  b"grant_type=client_credentials")["access_token"]
    cab = {"Authorization": f"bearer {token}", "User-Agent": ua}
    linhas, conversas = [], []
    for q in consultas:
        r = pegar("https://oauth.reddit.com/search?" + urllib.parse.urlencode({"q": q, "sort": "new", "limit": 100, "type": "link"}), cab)
        for c in r.get("data", {}).get("children", []):
            d = c["data"]
            texto = f"{d.get('title', '')}\n{html.unescape(d.get('selftext', ''))}".strip()
            data = time.strftime("%Y-%m-%d", time.gmtime(d.get("created_utc", 0)))
            if MENCIONA.search(texto):
                linhas.append({"source": "reddit", "url": f"https://www.reddit.com{d['permalink']}", "date": data, "rating": "", "text": texto})
            conversas.append(d["id"])
    for pid in list(dict.fromkeys(conversas))[:limite_de_conversas]:
        r = pegar(f"https://oauth.reddit.com/comments/{pid}?" + urllib.parse.urlencode({"limit": 200, "depth": 4}), cab)
        pilha = list(r[1]["data"]["children"]) if len(r) > 1 else []
        while pilha:
            c = pilha.pop()
            if c.get("kind") != "t1":
                continue
            d = c["data"]
            texto = html.unescape(d.get("body", "")).strip()
            if MENCIONA.search(texto):
                linhas.append({
                    "source": "reddit",
                    "url": f"https://www.reddit.com{d['permalink']}",
                    "date": time.strftime("%Y-%m-%d", time.gmtime(d.get("created_utc", 0))),
                    "rating": "",
                    "text": texto,
                })
            respostas = d.get("replies")
            if isinstance(respostas, dict):
                pilha.extend(respostas["data"]["children"])
    print(f"  reddit: {len(linhas)} que citam o Linktree", file=sys.stderr)
    return linhas


def e_mock(r):
    """Linha do mock (replica/mock/): fonte mock-* ou link .invalid. Nunca entra nos dados reais."""
    host = urllib.parse.urlparse(r.get("url", "")).hostname or ""
    return r.get("source", "").startswith("mock") or host.endswith(".invalid")


def juntar(caminho, novas):
    existentes = []
    if os.path.exists(caminho):
        with open(caminho, newline="", encoding="utf-8-sig") as f:
            existentes = [{k: (v or "") for k, v in r.items() if k in CAMPOS} for r in csv.DictReader(f)]
    mock = [r for r in existentes if e_mock(r)]
    if mock:
        print(f"  {len(mock)} linhas do mock tiradas de {caminho}: avaliação inventada não entra nos dados reais", file=sys.stderr)
        existentes = [r for r in existentes if not e_mock(r)]
    novas = [r for r in novas if not e_mock(r)]
    vistas = {r["url"] for r in existentes}
    acrescentadas = 0
    for r in novas:
        if r["url"] in vistas or not r["text"].strip():
            continue
        vistas.add(r["url"])
        existentes.append(r)
        acrescentadas += 1
    os.makedirs(os.path.dirname(caminho) or ".", exist_ok=True)
    with open(caminho, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        w.writerows(existentes)
    return acrescentadas, len(existentes)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--saida", default="replica/reviews.csv")
    ap.add_argument("--paises", default="br,us", help="lojas da App Store, separadas por vírgula")
    ap.add_argument("--paginas", type=int, default=10, help="páginas do feed por país (50 avaliações cada, a Apple dá até 10)")
    ap.add_argument("--sem-app-store", action="store_true")
    ap.add_argument("--sem-hn", action="store_true")
    ap.add_argument("--reddit", action="store_true", help="precisa da sua chave da API oficial do Reddit")
    a = ap.parse_args()

    novas = []
    if not a.sem_app_store:
        novas += app_store([p.strip() for p in a.paises.split(",") if p.strip()], a.paginas)
    if not a.sem_hn:
        novas += hacker_news(["linktree", "linktr.ee"], 3)
    if a.reddit:
        novas += reddit(["linktree", "linktree alternative", "linktree vs", "alternativa ao linktree"], 40)
    acrescentadas, total = juntar(a.saida, novas)
    print(f"{acrescentadas} novas; {total} no total em {a.saida}")


if __name__ == "__main__":
    main()
