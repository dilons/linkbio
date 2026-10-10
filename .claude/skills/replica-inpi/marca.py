#!/usr/bin/env python3
"""Triagem de marca no Brasil para replica-inpi. Só biblioteca padrão.

Três comandos:

    python3 marca.py variantes "Agendei"                     # o que digitar no pePI
    python3 marca.py checklist "Agendei" --classes 9,42      # todas as buscas, com links
    python3 marca.py analisar replica/inpi.csv --candidatos "Agendei,Slotwise" \\
        --classes 9,42 --avoid "Calendly" --descritivos "agenda,agendamento"

O CSV de `analisar` tem uma linha por marca que a busca no pePI encontrou
(colunas extras são ignoradas):

    marca         o nome como aparece no INPI                  (obrigatório)
    situacao      como o pePI mostra: "Registro de marca em vigor",
                  "Aguardando exame de mérito", "Pedido arquivado"... (obrigatório)
    classe        classe NCL: 9, 42, "NCL(13) 42"              (obrigatório)
    processo      número do processo                            (recomendado)
    titular       quem é o dono
    apresentacao  nominativa | mista | figurativa | tridimensional

Isto é triagem, não parecer. O exame do INPI olha semelhança gráfica, fonética
e ideológica (de sentido) e a afinidade entre produtos e serviços. Este script
aproxima só a gráfica, a fonética e a classe. "baixo" não garante registro;
"alto" é motivo para trocar de nome antes de gastar dinheiro com ele.

Saída 1 quando algum candidato fica com risco alto, para servir de trava.
"""

import argparse
import csv
import json
import re
import sys
import unicodedata

PEPI = "https://busca.inpi.gov.br/pePI/"
NCL = "https://www.gov.br/inpi/pt-br/servicos/marcas/classificacao-marcas"

# Palavras que não distinguem uma marca de outra. Ficam de fora da comparação
# de radical, porque dividir "app" ou "pay" com alguém não é colidência.
GENERICOS = {
    "a", "o", "e", "de", "da", "do", "the", "my", "meu", "minha", "your", "seu", "sua",
    "app", "apps", "aplicativo", "online", "digital", "tech", "tecnologia", "web", "net",
    "br", "brasil", "brazil", "pay", "pag", "club", "clube", "hub", "lab", "labs",
    "plus", "pro", "go", "now", "ai", "ia", "io", "co", "sistema", "sistemas",
    "solucoes", "servicos", "store", "loja", "cloud", "smart", "easy", "facil",
    "express", "max", "top", "mais", "ja", "agora", "hq", "inc", "ltda", "me",
}

# Afinidade estimada entre classes, pensada para quem lança um app ou SaaS.
# O INPI decide afinidade caso a caso pelo mercado, não por esta tabela.
_AFINS = {
    9: {35, 36, 38, 39, 41, 42, 43, 44, 45},
    42: {35, 36, 38, 39, 41, 43, 44, 45},
    35: {36}, 38: {41, 45}, 41: {45},
}
AFINS = {}
for _c, _outras in _AFINS.items():
    for _o in _outras:
        AFINS.setdefault(_c, set()).add(_o)
        AFINS.setdefault(_o, set()).add(_c)

VIVA_SEMPRE = ("recurso", "sobrest")
MORTA = ("arquivad", "extint", "indeferid", "caducad", "cancelad", "renunci")
VIVA = ("vigor", "aguardando", "exame", "publicad", "deferid", "oposi", "pedido",
        "concedid", "exigencia", "deposit", "registro")

# Regras de pronúncia do português do Brasil, na ordem em que são aplicadas.
# Aproximam como um brasileiro fala o nome, inclusive nomes em inglês.
_FONETICA = [
    (r"ph", "f"), (r"th", "t"),
    (r"sch", "x"), (r"ch", "x"), (r"sh", "x"),
    (r"lh", "l"), (r"nh", "n"),
    (r"qu(?=[ei])", "k"), (r"gu(?=[ei])", "g"), (r"q", "k"),
    (r"sc(?=[eiy])", "s"), (r"xc(?=[eiy])", "s"),
    (r"ck", "k"), (r"c(?=[eiy])", "s"), (r"c", "k"),
    (r"g(?=[eiy])", "j"),
    (r"oo", "u"), (r"ee", "i"),
    (r"w", "u"), (r"y", "i"), (r"z", "s"),
    (r"ks", "x"),
    (r"h", ""),
    (r"m(?=[^aeiou]|$)", "n"),
    (r"e$", "i"), (r"o$", "u"),
    (r"(.)\1+", r"\1"),
]


class CsvError(Exception):
    pass


# ------------------------------------------------------------------ texto

def sem_acento(texto):
    nfd = unicodedata.normalize("NFD", texto or "")
    return "".join(c for c in nfd if unicodedata.category(c) != "Mn")


def grafia(texto):
    """Só letras e números, minúsculas, sem acento: como o nome se escreve."""
    return re.sub(r"[^a-z0-9]", "", sem_acento(texto).lower())


def fonetica(texto):
    """Chave de pronúncia: 'Agendy' e 'Ajende' dão a mesma."""
    t = (texto or "").lower().replace("ç", "s")
    t = re.sub(r"[^a-z]", "", sem_acento(t))
    for padrao, troca in _FONETICA:
        t = re.sub(padrao, troca, t)
    return t


def palavras(texto):
    """Quebra 'AgendaFácil', 'agenda-facil' e 'agenda facil' nas mesmas palavras."""
    t = re.sub(r"([a-zà-ÿ])([A-ZÀ-Þ])", r"\1 \2", texto or "")
    return [grafia(p) for p in re.split(r"[\s_\-.]+", t) if grafia(p)]


def nucleo(texto, descritivos=()):
    """O que sobra do nome sem as palavras genéricas e descritivas."""
    fora = GENERICOS | set(descritivos)
    return "".join(p for p in palavras(texto) if p not in fora)


def semelhanca(a, b):
    """1.0 é igual, 0.0 é nada em comum (Levenshtein normalizado)."""
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    anterior = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        atual = [i]
        for j, cb in enumerate(b, 1):
            atual.append(min(anterior[j] + 1, atual[j - 1] + 1,
                             anterior[j - 1] + (ca != cb)))
        anterior = atual
    return 1.0 - anterior[-1] / float(max(len(a), len(b)))


def maior_trecho_comum(a, b):
    melhor = ""
    for i in range(len(a)):
        for j in range(i + len(melhor) + 1, len(a) + 1):
            if a[i:j] in b:
                melhor = a[i:j]
            else:
                break
    return melhor


def radical_comum(a, b, descritivos=()):
    """O trecho distintivo que os dois nomes dividem, ou '' se não dividem."""
    na, nb = nucleo(a, descritivos), nucleo(b, descritivos)
    if len(na) < 3 or len(nb) < 3:
        return ""
    if na in nb or nb in na:
        return na if len(na) <= len(nb) else nb
    trecho = maior_trecho_comum(na, nb)
    if len(trecho) >= 4 and len(trecho) >= 0.5 * min(len(na), len(nb)):
        return trecho
    return ""


# ------------------------------------------------------------------ INPI

def classe_de(texto):
    """'NCL(13) 42' -> 42. Classes nacionais antigas ('NAC 40/15') -> None."""
    t = (texto or "").lower()
    if "nac" in t or "/" in t or ":" in t:
        return None
    numeros = [int(n) for n in re.findall(r"\d+", t)]
    numeros = [n for n in numeros if 1 <= n <= 45]
    return numeros[-1] if numeros else None


def situacao_de(texto):
    t = sem_acento(texto or "").lower()
    if any(p in t for p in VIVA_SEMPRE):
        return "viva"
    if any(p in t for p in MORTA):
        return "morta"
    if any(p in t for p in VIVA):
        return "viva"
    return "desconhecida"


def relacao_de_classe(classe, alvo):
    if classe is None:
        return "desconhecida"
    if classe in alvo:
        return "mesma"
    if any(classe in AFINS.get(c, ()) for c in alvo):
        return "afim"
    return "outra"


def carregar(caminho):
    with open(caminho, newline="", encoding="utf-8-sig") as fh:
        leitor = csv.DictReader(fh)
        if leitor.fieldnames is None:
            raise CsvError("%s está vazio" % caminho)
        colunas = [c.strip().lower() for c in leitor.fieldnames]
        for precisa in ("marca", "situacao", "classe"):
            if precisa not in colunas:
                raise CsvError("%s não tem a coluna '%s'. Colunas: marca, situacao, "
                               "classe, processo, titular, apresentacao" % (caminho, precisa))
        linhas = []
        for n, bruto in enumerate(leitor, start=2):
            linha = {(k or "").strip().lower(): (v or "").strip() for k, v in bruto.items()}
            if linha.get("marca"):
                linha["linha"] = n
                linhas.append(linha)
    return linhas


def comparar(candidato, linha, alvo, avoid=(), descritivos=()):
    marca = linha["marca"]
    g = semelhanca(grafia(candidato), grafia(marca))
    f = semelhanca(fonetica(candidato), fonetica(marca))
    s = max(g, f)
    rad = radical_comum(candidato, marca, descritivos)
    classe = classe_de(linha.get("classe", ""))
    rel = relacao_de_classe(classe, alvo)
    sit = situacao_de(linha.get("situacao", ""))
    famosa = any(semelhanca(grafia(marca), grafia(a)) >= 0.85 or
                 (len(grafia(a)) >= 4 and grafia(a) in grafia(marca)) for a in avoid)
    viva = sit != "morta"
    perto = rel in ("mesma", "afim", "desconhecida")
    onde = {"mesma": "na mesma classe", "afim": "em classe afim",
            "desconhecida": "em classe que não deu para ler (confira)"}.get(rel, "")
    estado = "viva" if sit == "viva" else "de situação incerta"

    if viva and rel in ("mesma", "desconhecida") and (s >= 0.8 or rad):
        nivel, motivo = "alto", "marca %s %s" % (estado, onde)
    elif viva and rel == "afim" and s >= 0.8:
        nivel, motivo = "alto", "marca %s quase igual %s" % (estado, onde)
    elif famosa and (s >= 0.7 or rad):
        nivel, motivo = "alto", ("parecida com o app original ou um concorrente famoso: "
                                 "marca conhecida tem proteção além da classe")
    elif viva and perto and (s >= 0.7 or rad):
        nivel, motivo = "medio", "parecida ou com o mesmo radical, %s" % onde
    elif viva and rel == "outra" and s >= 0.9:
        nivel, motivo = "medio", "quase igual, em outra classe"
    elif not viva and rel in ("mesma", "afim") and (s >= 0.9 or rad):
        nivel, motivo = "medio", ("extinta ou arquivada, mas alguém pode depositar de "
                                  "novo; veja por que ela morreu")
    else:
        nivel, motivo = "baixo", ""
    return {
        "marca": marca, "processo": linha.get("processo", ""),
        "classe": classe, "classe_texto": linha.get("classe", ""),
        "situacao": linha.get("situacao", ""), "estado": sit,
        "titular": linha.get("titular", ""), "relacao": rel,
        "grafica": round(g, 2), "fonetica": round(f, 2),
        "radical": rad, "risco": nivel, "motivo": motivo,
    }


ORDEM = {"alto": 0, "medio": 1, "baixo": 2}


def analisar(candidatos, linhas, alvo, avoid=(), descritivos=()):
    resultado = []
    for cand in candidatos:
        notas = []
        comparadas = [comparar(cand, l, alvo, avoid, descritivos) for l in linhas]
        conflitos = [c for c in comparadas if c["risco"] != "baixo"]
        parecidas = [c for c in comparadas if c["risco"] == "baixo" and
                     (max(c["grafica"], c["fonetica"]) >= 0.7 or c["radical"])]
        for c in parecidas:
            c["motivo"] = "parecida, mas %s" % (
                "morta (arquivada ou extinta)" if c["estado"] == "morta"
                else "em classe distante")
        for a in avoid:
            g = semelhanca(grafia(cand), grafia(a))
            f = semelhanca(fonetica(cand), fonetica(a))
            rad = radical_comum(cand, a, descritivos)
            if max(g, f) >= 0.7 or rad:
                conflitos.append({
                    "marca": a, "processo": "", "classe": None, "classe_texto": "",
                    "situacao": "nome a evitar (--avoid)", "estado": "viva",
                    "titular": "", "relacao": "-", "grafica": round(g, 2),
                    "fonetica": round(f, 2), "radical": rad, "risco": "alto",
                    "motivo": "parecido demais com o app que você clonou; é o que o "
                              "INPI e as lojas barram"})
        conflitos.sort(key=lambda c: (ORDEM[c["risco"]], -max(c["grafica"], c["fonetica"])))
        core = nucleo(cand, descritivos)
        if not core:
            notas.append("só tem palavras genéricas ou descritivas: o INPI não registra "
                         "sinal genérico ou descritivo (art. 124, VI, da Lei 9.279/96)")
        else:
            usadas = [p for p in palavras(cand) if p in set(descritivos)]
            if usadas:
                notas.append("'%s' descreve o serviço; a proteção fica só em '%s'"
                             % ("', '".join(usadas), core))
        if len(core) and len(core) < 4:
            notas.append("núcleo muito curto ('%s'): colide com facilidade" % core)
        pior = conflitos[0]["risco"] if conflitos else "baixo"
        resultado.append({"candidato": cand, "risco": pior, "conflitos": conflitos,
                          "parecidas": parecidas, "notas": notas, "nucleo": core})
    # do menor risco para o maior; no mesmo risco, na ordem em que vieram
    resultado.sort(key=lambda r: -ORDEM[r["risco"]])
    return resultado


# ------------------------------------------------------------------ variantes

# Trocas de grafia que costumam manter o som. Só ficam as que dão exatamente a
# mesma chave fonética, o que descarta "qualenda" para "kalenda".
_TROCAS = [("k", "c"), ("c", "k"), ("qu", "k"), ("k", "qu"), ("s", "z"), ("z", "s"),
           ("ss", "s"), ("s", "ss"), ("x", "ch"), ("ch", "x"), ("sh", "x"),
           ("i", "y"), ("y", "i"), ("w", "u"), ("u", "w"), ("v", "w"), ("w", "v"),
           ("f", "ph"), ("ph", "f"), ("j", "g"), ("g", "j"), ("ai", "ay"), ("ei", "ey")]
# Como um brasileiro lê grafias em inglês. Não passam pelo filtro fonético.
_PRONUNCIA = [("wise", "uais"), ("ight", "ait"), ("oo", "u"), ("ee", "i"),
              ("ly", "li"), ("ful", "fu")]
VOGAIS = "aeiouy"


def _mesmo_som(core):
    chave = fonetica(core)
    for de, para in _TROCAS:
        i = core.find(de)
        while i >= 0:
            # ninguém começa palavra com "ss", e "zlot" não é como se escreve "slot"
            inicio = i == 0 and (de in ("s", "z", "ss") or para == "ss")
            # uma letra só não se troca no meio de uma dupla ("kassa" não vira "kazsa")
            dupla = len(de) == 1 and (core[i - 1:i] == de or core[i + 1:i + 2] == de)
            if not (inicio or dupla):
                v = core[:i] + para + core[i + len(de):]
                if v != core and fonetica(v) == chave and not re.search(r"(.)\1\1", v):
                    yield v
            i = core.find(de, i + 1)
    if core.startswith("h"):
        yield core[1:]  # h mudo
    elif core[:1] in ("a", "e", "i", "o", "u"):
        yield "h" + core
    if len(core) >= 2 and core[-2] not in VOGAIS:
        for fim, troca in (("e", "i"), ("i", "e"), ("o", "u"), ("u", "o")):
            if core.endswith(fim):
                yield core[:-1] + troca


def variantes(nome, descritivos=(), limite=12):
    """O que digitar no pePI. A busca Radical acha quem contém o termo, mas não
    acha grafias diferentes com o mesmo som; por isso as variantes."""
    base = grafia(nome)
    core = nucleo(nome, descritivos) or base
    saida = []

    def add(termo, por_que):
        termo = termo.strip()
        if termo and termo not in [s[0] for s in saida]:
            saida.append((termo, por_que))

    add(sem_acento(nome).lower(), "exata")
    if core != base:
        add(core, "radical: o núcleo, sem palavras genéricas")
    for p in palavras(nome):
        if len(p) >= 4 and p not in GENERICOS and p not in set(descritivos) and p != core:
            add(p, "radical: cada palavra distintiva")
    raiz = re.sub(r"[aeiouy]+$", "", core)
    if raiz != core and len(raiz) >= 5:
        add(raiz, "radical sem a vogal final: pega derivações")
    n = 0
    for v in _mesmo_som(core):
        if n >= limite:
            break
        antes = len(saida)
        add(v, "mesmo som, outra grafia")
        n += len(saida) - antes
    for de, para in _PRONUNCIA:
        if de in core:
            add(core.replace(de, para), "como se fala em português")
    add(core + "s", "plural")
    return saida


# ------------------------------------------------------------------ saída

def render_analise(resultado, alvo):
    out = ["# Triagem de marca (INPI)", ""]
    out.append("Classes do seu produto: %s. Isto é triagem, não parecer: confirme "
               "com um advogado ou agente da propriedade industrial antes de gastar "
               "com o nome." % (", ".join(str(c) for c in sorted(alvo)) or "nenhuma"))
    for r in resultado:
        out.append("")
        out.append("## %s: risco %s" % (r["candidato"], r["risco"].upper()))
        for n in r["notas"]:
            out.append("- %s" % n)
        if not r["conflitos"]:
            out.append("- nenhuma marca viva em classe próxima ficou parecida. Bom sinal, "
                       "desde que a busca tenha coberto as variantes e as classes afins.")
        linhas = r["conflitos"][:12] + r.get("parecidas", [])[:6]
        if not linhas:
            continue
        out.append("")
        out.append("| risco | marca | processo | classe | situação | gráfica | fonética "
                   "| radical | por quê |")
        out.append("| --- | --- | --- | --- | --- | --- | --- | --- | --- |")
        for c in linhas:
            classe = c["classe_texto"] or ("-" if c["classe"] is None else c["classe"])
            out.append("| %s | %s | %s | %s | %s | %d%% | %d%% | %s | %s |" % (
                c["risco"], c["marca"], c["processo"] or "-", classe,
                c["situacao"] or "-", round(c["grafica"] * 100), round(c["fonetica"] * 100),
                c["radical"] or "-", c["motivo"]))
    out.append("")
    altos = [r["candidato"] for r in resultado if r["risco"] == "alto"]
    if altos:
        out.append("Risco alto: %s. Troque de nome ou leve a um especialista antes "
                   "de depositar." % ", ".join(altos))
    else:
        out.append("Nenhum candidato com risco alto nesta busca.")
    out.append("")
    out.append("Código de saída 1 quando algum candidato fica alto. Com vários candidatos "
               "isso é normal; para usar como trava, rode só com o nome escolhido.")
    return "\n".join(out) + "\n"


def render_variantes(nome, lista):
    out = ["Pesquise cada termo no pePI (%s), sem login, primeiro no modo Radical "
           "e sem filtrar classe:" % PEPI, ""]
    for termo, por_que in lista:
        out.append("  %-24s %s" % (termo, por_que))
    out.append("")
    out.append("Depois pense no sentido: traduções e sinônimos de '%s' também "
               "colidem (semelhança ideológica). Isso nenhum script pega." % nome)
    return "\n".join(out)


def render_checklist(nome, classes, descritivos=()):
    g = grafia(nome)
    termos = ", ".join(t for t, _ in variantes(nome, descritivos))
    linhas = [
        ("INPI: marcas no Brasil", "pePI, modo Radical e Exata, todas as classes, "
         "termos: %s" % termos, PEPI),
        ("INPI: confirmar as classes", "lista NCL 13-2026; classes pensadas: %s"
         % (", ".join(str(c) for c in classes) or "defina"), NCL),
        ("Marcas internacionais", "o original pode ter registro via Protocolo de Madri "
         "designando o Brasil", "https://branddb.wipo.int"),
        ("Domínio .com.br", "`whois %s.com.br` (registrar .br pede CPF ou CNPJ)" % g,
         "https://registro.br"),
        ("Domínio .com", "`whois %s.com`" % g, ""),
        ("Nome empresarial", "consulta de viabilidade de nome na Junta Comercial do "
         "seu estado (REDESIM)", "https://www.gov.br/empresas-e-negocios/pt-br/redesim"),
        ("App Store e Google Play (Brasil)", "buscar o nome exato", ""),
        ("Redes", "Instagram, TikTok, X, YouTube, GitHub: @%s" % g, ""),
        ("Web", "buscar \"%s\" + a categoria do app" % nome, ""),
    ]
    out = ["# Checagens de nome: %s" % nome, "",
           "Marque o resultado e a data de cada uma. Nunca escreva \"livre\" numa "
           "checagem que ninguém rodou.", "",
           "| checagem | o que fazer | onde | resultado | data |",
           "| --- | --- | --- | --- | --- |"]
    for item, oque, onde in linhas:
        out.append("| %s | %s | %s | a executar | |" % (item, oque, onde or "-"))
    return "\n".join(out) + "\n"


def lista(texto):
    return [x.strip() for x in (texto or "").split(",") if x.strip()]


def classes_de(texto):
    alvo = set()
    for x in lista(texto):
        c = classe_de(x)
        if c is None:
            raise ValueError("classe inválida: %r (use números de 1 a 45)" % x)
        alvo.add(c)
    return alvo


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    v = sub.add_parser("variantes", help="termos para pesquisar no pePI")
    v.add_argument("nome")
    v.add_argument("--descritivos", default="")
    c = sub.add_parser("checklist", help="todas as checagens do nome, em markdown")
    c.add_argument("nome")
    c.add_argument("--classes", default="9,42")
    c.add_argument("--descritivos", default="")
    a = sub.add_parser("analisar", help="risco de colidência com o que o pePI achou")
    a.add_argument("csv")
    a.add_argument("--candidatos", required=True, help="nomes separados por vírgula")
    a.add_argument("--classes", default="9,42", help="classes NCL do seu produto")
    a.add_argument("--avoid", default="", help="o app original e concorrentes famosos")
    a.add_argument("--descritivos", default="",
                   help="palavras que descrevem o serviço (agenda, entrega...)")
    a.add_argument("--json", action="store_true")
    a.add_argument("--out", help="grava o relatório markdown aqui")
    args = ap.parse_args(argv)

    try:
        descritivos = [grafia(x) for x in lista(args.descritivos)]
        if args.cmd == "variantes":
            print(render_variantes(args.nome, variantes(args.nome, descritivos)))
            return 0
        alvo = classes_de(args.classes)
        if args.cmd == "checklist":
            sys.stdout.write(render_checklist(args.nome, sorted(alvo), descritivos))
            return 0
        linhas = carregar(args.csv)
        candidatos = lista(args.candidatos)
        if not candidatos:
            raise ValueError("passe ao menos um nome em --candidatos")
        resultado = analisar(candidatos, linhas, alvo, lista(args.avoid), descritivos)
    except (CsvError, OSError, ValueError) as exc:
        print("marca: %s" % exc, file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(resultado, indent=2, ensure_ascii=False))
    else:
        texto = render_analise(resultado, alvo)
        if args.out:
            with open(args.out, "w", encoding="utf-8") as fh:
                fh.write(texto)
            print("gravado em %s" % args.out)
        else:
            sys.stdout.write(texto)
    return 1 if any(r["risco"] == "alto" for r in resultado) else 0


if __name__ == "__main__":
    sys.exit(main())
