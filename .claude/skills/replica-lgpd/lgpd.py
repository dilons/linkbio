#!/usr/bin/env python3
"""Verificação de LGPD + GDPR para replica-lgpd. Só biblioteca padrão.

    python3 lgpd.py varrer .                                  # terceiros no código
    python3 lgpd.py verificar replica/dados.csv --config replica/lgpd.json --codigo .
    python3 lgpd.py verificar replica/dados.csv --config replica/lgpd.json \\
        --codigo . --out replica/lgpd-verificacao.md
    python3 lgpd.py prazo-incidente "2026-10-09 14:00" --pequeno-porte

dados.csv, uma linha por dado pessoal (colunas extras são ignoradas):

    dado           o que é ("email do convidado")
    titular        de quem é (cliente, convidado, funcionário...)
    finalidade     para que serve, em uma frase
    base_lgpd      consentimento | obrigacao_legal | administracao_publica |
                   pesquisa | contrato | exercicio_direitos | protecao_vida |
                   tutela_saude | legitimo_interesse | protecao_credito |
                   prevencao_fraude (este, só para dado sensível)
    base_gdpr      consent | contract | legal_obligation | vital_interests |
                   public_task | legitimate_interests   (público na UE)
    condicao_art9  explicit_consent | employment | vital_interests | nonprofit |
                   made_public | legal_claims | public_interest | health_care |
                   public_health | research   (dado sensível, público na UE)
    sensivel       sim | nao
    crianca        sim | nao   (de crianças ou adolescentes)
    retencao       por quanto tempo ("até excluir a conta + 30 dias")
    operadores     quem mais recebe, separado por ; ("Supabase; Resend")
    papel          controlador (padrão) | operador: o dado é do seu cliente, que
                   decide a base legal (ex.: o que o convidado responde ao anfitrião)
    colunas        onde está no schema: "users.email; users.name" ou "bookings.*".
                   Com --codigo, toda coluna com cara de dado pessoal que não
                   aparecer aqui vira aviso

Ainda não sabe o mecanismo de transferência de um fornecedor ou se aceitou o
DPA? Use "a_confirmar": conta como erro até alguém confirmar.

lgpd.json: veja lgpd.example.json nesta pasta.

`varrer` só lê código, package.json, requirements e .env.example. Nunca abre
.env nem .env.local, onde ficam as chaves.

Sai com código 1 quando há erro, para travar o deploy. Não é parecer
jurídico: aponta o que falta, e um advogado confirma o resto.
"""

import argparse
import csv
import datetime as _dt
import json
import os
import re
import sys
import unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
SERVICOS = os.path.join(AQUI, "sdks.json")

BASES_LGPD = {
    "consentimento": "art. 7º, I", "obrigacao_legal": "art. 7º, II",
    "administracao_publica": "art. 7º, III", "pesquisa": "art. 7º, IV",
    "contrato": "art. 7º, V", "exercicio_direitos": "art. 7º, VI",
    "protecao_vida": "art. 7º, VII", "tutela_saude": "art. 7º, VIII",
    "legitimo_interesse": "art. 7º, IX", "protecao_credito": "art. 7º, X",
}
BASES_SENSIVEL = {
    "consentimento": "art. 11, I", "obrigacao_legal": "art. 11, II, a",
    "administracao_publica": "art. 11, II, b", "pesquisa": "art. 11, II, c",
    "exercicio_direitos": "art. 11, II, d", "protecao_vida": "art. 11, II, e",
    "tutela_saude": "art. 11, II, f", "prevencao_fraude": "art. 11, II, g",
}
BASES_GDPR = {
    "consent": "art. 6(1)(a)", "contract": "art. 6(1)(b)",
    "legal_obligation": "art. 6(1)(c)", "vital_interests": "art. 6(1)(d)",
    "public_task": "art. 6(1)(e)", "legitimate_interests": "art. 6(1)(f)",
}
APELIDOS_GDPR = {
    "consentimento": "consent", "contrato": "contract",
    "obrigacao_legal": "legal_obligation", "protecao_vida": "vital_interests",
    "interesse_vital": "vital_interests", "interesse_publico": "public_task",
    "legitimo_interesse": "legitimate_interests",
}
CONDICOES_ART9 = {
    "explicit_consent": "art. 9(2)(a)", "employment": "art. 9(2)(b)",
    "vital_interests": "art. 9(2)(c)", "nonprofit": "art. 9(2)(d)",
    "made_public": "art. 9(2)(e)", "legal_claims": "art. 9(2)(f)",
    "public_interest": "art. 9(2)(g)", "health_care": "art. 9(2)(h)",
    "public_health": "art. 9(2)(i)", "research": "art. 9(2)(j)",
}
APELIDOS_ART9 = {"consentimento": "explicit_consent",
                 "consentimento_explicito": "explicit_consent",
                 "consent": "explicit_consent"}

# União Europeia e Espaço Econômico Europeu: os 30 que o Brasil reconheceu como
# adequados (Resolução CD/ANPD nº 32/2026) e entre os quais o GDPR circula livre.
EEE = {"AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
       "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
       "SE", "IS", "LI", "NO"}
# Decisões de adequação da Comissão Europeia (out. 2026). Os EUA só valem para
# empresas certificadas no Data Privacy Framework: use o mecanismo "dpf".
# Confira a lista atual no site da Comissão.
ADEQUADOS_UE = {"AD", "AR", "BR", "CA", "FO", "GG", "IL", "IM", "JP", "JE", "NZ", "KR",
                "CH", "GB", "UY"}

MECANISMOS_BR = {
    "adequacao": "art. 33, I (o Brasil só reconheceu UE/EEE: Res. CD/ANPD 32/2026)",
    "clausulas_padrao": "art. 33, II, b (cláusulas-padrão da ANPD, Res. CD/ANPD 19/2024)",
    "clausulas_especificas": "art. 33, II, a (precisa de aprovação da ANPD)",
    "normas_corporativas": "art. 33, II, c (precisa de aprovação da ANPD)",
    "consentimento": "art. 33, VIII",
    "contrato": "art. 33, IX",
}
MECANISMOS_UE = {
    "adequacao": "GDPR art. 45", "dpf": "GDPR art. 45 (EU-US Data Privacy Framework)",
    "sccs": "GDPR art. 46(2)(c)", "bcrs": "GDPR art. 47", "derrogacao": "GDPR art. 49",
}

PULAR_PASTAS = {".git", "node_modules", ".next", ".nuxt", ".svelte-kit", "dist", "build",
                "out", ".vercel", ".turbo", ".cache", "coverage", "__pycache__", ".venv",
                "venv", "Pods", ".expo", ".gradle", "replica", ".claude", "vendor"}
PULAR_ARQUIVOS = {"package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb",
                  "poetry.lock", "Podfile.lock", "sdks.json"}
EXTENSOES = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".json", ".py", ".rb", ".go",
             ".php", ".html", ".htm", ".vue", ".svelte", ".astro", ".toml", ".yaml",
             ".yml", ".txt", ".kt", ".swift", ".dart"}
ENV_PERMITIDOS = {".env.example", ".env.sample", ".env.template"}

NAO_VALE = re.compile(r"indefinid|para sempre|sem prazo|permanente|eterno|nunca apag", re.I)


class EntradaError(Exception):
    pass


def chave(texto):
    """'Legítimo interesse' -> 'legitimo_interesse'."""
    t = unicodedata.normalize("NFD", (texto or "").strip().lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "_", t).strip("_")


def nome_op(texto):
    """'Google Fonts (CDN)' e 'google fonts' viram a mesma chave."""
    return chave(re.sub(r"\(.*?\)", "", texto or ""))


def sim(texto):
    return chave(texto) in ("sim", "s", "yes", "y", "true", "1", "x")


# ------------------------------------------------------------------ entradas

def carregar_dados(caminho):
    with open(caminho, newline="", encoding="utf-8-sig") as fh:
        leitor = csv.DictReader(fh)
        if leitor.fieldnames is None:
            raise EntradaError("%s está vazio" % caminho)
        colunas = [c.strip().lower() for c in leitor.fieldnames]
        for precisa in ("dado", "finalidade", "base_lgpd", "retencao"):
            if precisa not in colunas:
                raise EntradaError("%s não tem a coluna '%s'. Veja dados.example.csv"
                                   % (caminho, precisa))
        linhas = []
        for n, bruto in enumerate(leitor, start=2):
            linha = {(k or "").strip().lower(): (v or "").strip() for k, v in bruto.items()}
            if linha.get("dado"):
                linha["linha"] = n
                linhas.append(linha)
    return linhas


def carregar_config(caminho):
    with open(caminho, encoding="utf-8") as fh:
        cfg = json.load(fh)
    if not isinstance(cfg, dict):
        raise EntradaError("%s precisa ser um objeto JSON" % caminho)
    return cfg


def carregar_servicos(caminho=SERVICOS):
    with open(caminho, encoding="utf-8") as fh:
        return json.load(fh).get("servicos", [])


# ------------------------------------------------------------------ varredura

def varrer(raiz, servicos):
    """{nome do serviço: [(arquivo, padrão), ...]} para o que aparece no código."""
    achados = {}
    raiz = os.path.abspath(raiz)
    for pasta, subpastas, arquivos in os.walk(raiz):
        subpastas[:] = sorted(d for d in subpastas if d not in PULAR_PASTAS)
        for nome in sorted(arquivos):
            if nome in PULAR_ARQUIVOS:
                continue
            if nome.startswith(".env") and nome not in ENV_PERMITIDOS:
                continue  # chaves de verdade: não abrir
            ext = os.path.splitext(nome)[1].lower()
            caminho = os.path.join(pasta, nome)
            rel = os.path.relpath(caminho, raiz)
            texto = ""
            if ext in EXTENSOES or nome in ENV_PERMITIDOS:
                try:
                    if os.path.getsize(caminho) <= 2_000_000:
                        with open(caminho, encoding="utf-8", errors="replace") as fh:
                            texto = fh.read()
                except OSError:
                    texto = ""
            for s in servicos:
                for p in s["padroes"]:
                    if p == nome or (texto and p in texto):
                        lista = achados.setdefault(s["nome"], [])
                        if len(lista) < 3 and (rel, p) not in lista:
                            lista.append((rel, p))
                        break
    return achados


# ------------------------------------------------------------------ schema

# Nomes de coluna que costumam guardar dado de pessoa.
PESSOAL = re.compile(
    r"(e_?mail|^nome|name$|^name|phone|fone|telefone|celular|whatsapp|cpf|^rg$|cnpj"
    r"|^ip$|_ip$|ip_?addr|address|endereco|^cep$|zip|postal|birth|nascimento|gender"
    r"|genero|sexo|^lat$|latitude|^lng$|longitude|location|localizacao|avatar|photo"
    r"|foto|selfie|answers|respostas|notes|notas|message|mensagem|user_?agent"
    r"|password|senha|documento|document_number|cartao|card_|health|saude|biometr)", re.I)
NAO_COLUNA = {"constraint", "primary", "foreign", "unique", "check", "exclude", "key",
              "index", "like"}


def _corpo_entre_parenteses(texto, inicio):
    """Do '(' em `inicio` até o ')' que fecha, respeitando parênteses internos."""
    nivel = 0
    for i in range(inicio, len(texto)):
        if texto[i] == "(":
            nivel += 1
        elif texto[i] == ")":
            nivel -= 1
            if nivel == 0:
                return texto[inicio + 1:i]
    return texto[inicio + 1:]


def _partes(corpo):
    """Separa as definições de coluna pelas vírgulas de fora dos parênteses."""
    partes, nivel, atual = [], 0, ""
    for ch in corpo:
        if ch == "(":
            nivel += 1
        elif ch == ")":
            nivel -= 1
        if ch == "," and nivel == 0:
            partes.append(atual)
            atual = ""
        else:
            atual += ch
    partes.append(atual)
    return [p.strip() for p in partes if p.strip()]


def _limpo(nome):
    return nome.strip().strip('"`[]').split(".")[-1].lower()


def colunas_sql(texto):
    texto = re.sub(r"--[^\n]*", "", texto)
    saida = []
    for m in re.finditer(r"create\s+table\s+(?:if\s+not\s+exists\s+)?([\w.\"`]+)\s*\(",
                         texto, re.I):
        tabela = _limpo(m.group(1))
        for parte in _partes(_corpo_entre_parenteses(texto, m.end() - 1)):
            nome = parte.split()[0]
            if _limpo(nome) not in NAO_COLUNA:
                saida.append("%s.%s" % (tabela, _limpo(nome)))
    for m in re.finditer(r"alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?([\w.\"`]+)\s+"
                         r"add\s+(?:column\s+)?(?:if\s+not\s+exists\s+)?([\w\"`]+)",
                         texto, re.I):
        coluna = _limpo(m.group(2))
        if coluna not in NAO_COLUNA:
            saida.append("%s.%s" % (_limpo(m.group(1)), coluna))
    return saida


def colunas_prisma(texto):
    saida = []
    for m in re.finditer(r"model\s+(\w+)\s*\{(.*?)\}", texto, re.S):
        for linha in m.group(2).splitlines():
            linha = linha.strip()
            if linha and not linha.startswith(("@@", "//")):
                saida.append("%s.%s" % (m.group(1).lower(), linha.split()[0].lower()))
    return saida


def ler_schema(raiz):
    """Todas as colunas 'tabela.coluna' das migrações SQL e do schema.prisma."""
    colunas = []
    for pasta, subpastas, arquivos in os.walk(os.path.abspath(raiz)):
        subpastas[:] = sorted(d for d in subpastas if d not in PULAR_PASTAS)
        for nome in sorted(arquivos):
            if not (nome.endswith(".sql") or nome == "schema.prisma"):
                continue
            try:
                with open(os.path.join(pasta, nome), encoding="utf-8", errors="replace") as fh:
                    texto = fh.read()
            except OSError:
                continue
            colunas += colunas_prisma(texto) if nome == "schema.prisma" else colunas_sql(texto)
    vistas = []
    for c in colunas:
        if c not in vistas:
            vistas.append(c)
    return vistas


def _coberta(coluna, mapeadas):
    tabela = coluna.split(".")[0]
    return coluna in mapeadas or ("%s.*" % tabela) in mapeadas


# ------------------------------------------------------------------ verificação

PENDENTE = "a_confirmar"
EXEMPLOS = ("sua empresa ltda", "00.000.000/0001-00", "seuapp")


def _exemplo(valor):
    v = str(valor or "").lower()
    return any(e in v for e in EXEMPLOS)


def papel_de(d):
    return "operador" if chave(d.get("papel")) == "operador" else "controlador"


def verificar(dados, cfg, achados=None, servicos=(), colunas=None):
    problemas = []

    def erro(onde, msg):
        problemas.append({"nivel": "erro", "onde": onde, "msg": msg})

    def aviso(onde, msg):
        problemas.append({"nivel": "aviso", "onde": onde, "msg": msg})

    publico = {chave(p) for p in cfg.get("publico", [])}
    ue = "ue" in publico or "eu" in publico
    if not publico or not publico <= {"br", "ue", "eu"}:
        erro("lgpd.json", "'publico' deve listar \"br\", \"ue\" ou os dois")
    pequeno = bool(cfg.get("pequeno_porte"))
    sensiveis = sum(1 for d in dados if sim(d.get("sensivel")))
    criancas = sum(1 for d in dados if sim(d.get("crianca")))

    ctrl = cfg.get("controlador") or {}
    if not ctrl.get("nome"):
        erro("lgpd.json", "falta o controlador (quem decide sobre os dados: a sua "
             "empresa ou você)")
    for campo, valor in (("controlador.nome", ctrl.get("nome")),
                         ("controlador.cnpj", ctrl.get("cnpj")),
                         ("canal_titular", cfg.get("canal_titular")),
                         ("politica_url", cfg.get("politica_url"))):
        if valor and _exemplo(valor):
            erro("lgpd.json", "%s ainda é o valor do exemplo ('%s')" % (campo, valor))
    if not cfg.get("canal_titular"):
        erro("lgpd.json", "falta o canal do titular (email ou formulário para pedidos "
             "de acesso, correção e exclusão)")
    enc = cfg.get("encarregado") or {}
    if not (enc.get("nome") and enc.get("email")):
        if not pequeno:
            erro("lgpd.json", "falta o encarregado (nome e email), que deve ser "
                 "divulgado no site (LGPD art. 41; Res. CD/ANPD 18/2024)")
        elif sensiveis or criancas:
            aviso("lgpd.json", "pequeno porte sem encarregado, mas com dados sensíveis ou "
                  "de crianças: isso pode ser alto risco e tirar o regime (Res. CD/ANPD "
                  "2/2022, art. 4º). Até um advogado confirmar, indique um encarregado e "
                  "use os prazos normais (3 dias úteis num incidente)")
        else:
            aviso("lgpd.json", "pequeno porte está dispensado de indicar encarregado "
                  "(Res. CD/ANPD 2/2022, art. 11), mas o canal do titular é obrigatório "
                  "e precisa aparecer na política")
    elif pequeno and (sensiveis or criancas):
        aviso("lgpd.json", "dados sensíveis ou de crianças, somados a larga escala ou a "
              "impacto significativo, são alto risco e tiram o regime de pequeno porte "
              "(Res. CD/ANPD 2/2022, art. 4º). Até confirmar, use os prazos normais")
    if not cfg.get("politica_url"):
        aviso("lgpd.json", "falta politica_url: a política de privacidade precisa estar "
              "publicada antes do lançamento")
    if ue:
        rep = str(cfg.get("representante_ue") or "").strip()
        if not rep:
            erro("lgpd.json", "sem estabelecimento na UE e oferecendo de forma contínua a "
                 "pessoas de lá, o GDPR exige um representante na UE (art. 27). A exceção "
                 "é só para tratamento ocasional, sem dado sensível em larga escala e de "
                 "baixo risco. Se for o seu caso, escreva \"dispensado: <motivo>\"")
        elif chave(rep).startswith("dispensad"):
            aviso("lgpd.json", "representante na UE dispensado (%s). Confirme com um "
                  "advogado%s" % (rep, "; com dado sensível, a exceção do art. 27(2) "
                                  "dificilmente vale" if sensiveis else ""))

    operadores = {}
    for op in cfg.get("operadores", []):
        if (op.get("nome") or "").strip():
            operadores[nome_op(op["nome"])] = op
            for apelido in op.get("apelidos", []):
                operadores.setdefault(nome_op(apelido), op)

    usados = set()
    mapeadas = set()
    tem_colunas = any("colunas" in d for d in dados)
    como_operador = 0
    for d in dados:
        onde = "dados.csv:%d (%s)" % (d["linha"], d["dado"])
        sensivel = sim(d.get("sensivel"))
        crianca = sim(d.get("crianca"))
        for c in re.split(r"[;,\s]+", d.get("colunas", "")):
            if c.strip():
                mapeadas.add(c.strip().lower())
        if not d.get("finalidade"):
            erro(onde, "sem finalidade. Todo dado precisa de um porquê (LGPD art. 6º, I)")
        ret = d.get("retencao", "")
        if not ret:
            erro(onde, "sem prazo de retenção (LGPD art. 15 e 16; GDPR art. 5(1)(e))")
        elif NAO_VALE.search(ret):
            aviso(onde, "retenção '%s': guardar sem prazo fere a necessidade. Diga até "
                  "quando, ou qual evento encerra" % ret)
        for nome in [x.strip() for x in re.split(r"[;,]", d.get("operadores", "")) if x.strip()]:
            if nome_op(nome) in operadores:
                usados.add(id(operadores[nome_op(nome)]))
            else:
                erro(onde, "operador '%s' não está em lgpd.json" % nome)
        if crianca:
            aviso(onde, "dado de criança ou adolescente: melhor interesse (art. 14), "
                  "consentimento de um dos pais ou do responsável legal para menores de "
                  "12 quando a base for consentimento, e as regras do ECA Digital "
                  "(Lei 15.211/2025)")

        if papel_de(d) == "operador":
            # a base legal é do cliente, que é o controlador desses dados
            como_operador += 1
            if sensivel:
                aviso(onde, "dado sensível que o seu cliente coleta pelo app: a base "
                      "legal é dele, mas ofereça salvaguardas (marcar o campo como "
                      "sensível, caixa de consentimento desmarcada, criptografia, "
                      "retenção curta) e diga nos termos o que ele pode coletar")
            continue

        base = chave(d.get("base_lgpd"))
        validas = BASES_SENSIVEL if sensivel else BASES_LGPD
        if not base:
            erro(onde, "sem base legal da LGPD")
        elif base not in validas:
            if sensivel and base in BASES_LGPD:
                erro(onde, "'%s' não serve para dado sensível (art. 11). Use "
                     "consentimento específico e destacado, ou exercicio_direitos se o "
                     "dado é necessário para cumprir o contrato" % base)
            else:
                erro(onde, "'%s' não é base legal da LGPD. Opções: %s"
                     % (base, ", ".join(sorted(validas))))
        g = ""
        if ue:
            g = chave(d.get("base_gdpr"))
            g = APELIDOS_GDPR.get(g, g)
            if not g:
                erro(onde, "público na UE e sem base do GDPR (art. 6)")
            elif g not in BASES_GDPR:
                erro(onde, "'%s' não é base do GDPR. Opções: %s"
                     % (g, ", ".join(sorted(BASES_GDPR))))
            elif g == "legal_obligation" and base == "obrigacao_legal":
                aviso(onde, "se a obrigação vem de lei brasileira (Marco Civil, lei "
                      "fiscal), ela não vale como base no GDPR, que exige lei da UE ou "
                      "de um Estado-membro (art. 6(3)): use legitimate_interests. Se vem "
                      "de lei da UE, está certo")
            if sensivel:
                c = chave(d.get("condicao_art9"))
                c = APELIDOS_ART9.get(c, c)
                if not c:
                    erro(onde, "dado sensível com público na UE precisa também de uma "
                         "condição do art. 9(2) do GDPR (em apps, quase sempre "
                         "explicit_consent)")
                elif c not in CONDICOES_ART9:
                    erro(onde, "'%s' não é condição do art. 9(2). Opções: %s"
                         % (c, ", ".join(sorted(CONDICOES_ART9))))
        if base == "legitimo_interesse" or g == "legitimate_interests":
            aviso(onde, "legítimo interesse: faça e guarde o teste de balanceamento "
                  "(guia da ANPD; GDPR art. 6(1)(f)) e dê ao titular como se opor")

    if como_operador:
        dpa_clientes = cfg.get("dpa_para_clientes")
        if dpa_clientes is True:
            pass
        elif chave(str(dpa_clientes)) == PENDENTE:
            erro("lgpd.json", "dpa_para_clientes está a confirmar: o contrato de "
                 "tratamento que você oferece aos clientes ainda não existe")
        else:
            texto = ("você trata dados como operador dos seus clientes (%d linhas com "
                     "papel=operador): ofereça a eles um contrato de tratamento com as "
                     "instruções, a segurança, a lista de suboperadores e o aviso de "
                     "incidente, e encaminhe a eles os pedidos dos titulares. Depois, "
                     "marque \"dpa_para_clientes\": true" % como_operador)
            if ue:
                erro("lgpd.json", texto + " (GDPR art. 28(3); LGPD art. 39)")
            else:
                aviso("lgpd.json", texto + " (LGPD art. 39)")

    vistos = set()
    for op in operadores.values():
        if id(op) in vistos:
            continue
        vistos.add(id(op))
        onde = "operador %s" % op.get("nome")
        pais = (op.get("pais") or "").strip().upper()
        if not pais:
            erro(onde, "sem país. Use o código de duas letras (US, BR, IE...) de onde "
                 "os dados ficam ou são acessados")
            continue
        if pais != "BR":
            mbr = chave(op.get("mecanismo_br"))
            if not mbr:
                erro(onde, "transferência internacional (%s) sem mecanismo da LGPD "
                     "(art. 33). Para fornecedores, o usual são as cláusulas-padrão da "
                     "ANPD (clausulas_padrao), obrigatórias em contratos desde "
                     "23/08/2025. Se ainda não sabe, use \"a_confirmar\"" % pais)
            elif mbr == PENDENTE:
                erro(onde, "pendente: confirme no contrato do fornecedor se ele oferece as "
                     "cláusulas-padrão da ANPD (aditivo para o Brasil). Se não oferecer, "
                     "peça, troque de fornecedor ou fale com um advogado")
            elif mbr not in MECANISMOS_BR:
                erro(onde, "mecanismo_br '%s' inválido. Opções: %s, ou a_confirmar"
                     % (mbr, ", ".join(sorted(MECANISMOS_BR))))
            elif mbr == "adequacao" and pais not in EEE:
                erro(onde, "o Brasil só reconheceu como adequados os países da UE/EEE "
                     "(Res. CD/ANPD 32/2026); %s não está entre eles" % pais)
            elif mbr == "consentimento":
                aviso(onde, "consentimento como base de transferência é frágil: tem de "
                      "ser específico, em destaque e revogável (art. 33, VIII)")
            elif mbr == "contrato":
                aviso(onde, "art. 33, IX só cobre a transferência necessária para "
                      "executar o contrato com o titular. Para infraestrutura, o usual "
                      "são as cláusulas-padrão da ANPD. Confirme com um advogado")
        mue = chave(op.get("mecanismo_ue"))
        if ue and pais not in EEE and (mue or pais not in ADEQUADOS_UE):
            if not mue:
                erro(onde, "dados de pessoas na UE indo para %s sem mecanismo do GDPR "
                     "(cap. V). Se ainda não sabe, use \"a_confirmar\"" % pais)
            elif mue == PENDENTE:
                erro(onde, "pendente: confirme se o fornecedor é certificado no Data "
                     "Privacy Framework (dataprivacyframework.gov) ou se o DPA dele traz "
                     "as SCCs")
            elif mue not in MECANISMOS_UE:
                erro(onde, "mecanismo_ue '%s' inválido. Opções: %s, ou a_confirmar"
                     % (mue, ", ".join(sorted(MECANISMOS_UE))))
            elif mue == "dpf" and pais != "US":
                erro(onde, "o Data Privacy Framework só vale para empresas dos EUA")
            elif mue == "adequacao" and pais == "US":
                erro(onde, "os EUA só são adequados para empresas certificadas no Data "
                     "Privacy Framework: use 'dpf' e confira a certificação em "
                     "dataprivacyframework.gov, ou use 'sccs'")
            elif mue == "adequacao" and pais not in ADEQUADOS_UE:
                erro(onde, "%s não tem decisão de adequação da Comissão Europeia" % pais)
        if op.get("dpa") is not True:
            texto = ("sem contrato de tratamento (DPA) aceito. A maioria dos fornecedores "
                     "oferece um padrão no painel: o usuário aceita, guarda a cópia e "
                     "marca \"dpa\": true")
            if ue:
                erro(onde, texto + " (GDPR art. 28)")
            else:
                aviso(onde, texto + " (LGPD art. 39)")
        if id(op) not in usados:
            aviso(onde, "nenhum dado de dados.csv vai para este operador. O que ele "
                  "recebe? Inclua na coluna 'operadores'")

    detectados = []
    for nome, onde_achou in sorted((achados or {}).items()):
        info = next((s for s in servicos if s["nome"] == nome), {})
        cat = info.get("categoria", "")
        detectados.append({"nome": nome, "categoria": cat,
                           "pais": info.get("pais", ""), "onde": onde_achou})
        onde = "código: %s" % onde_achou[0][0]
        declarado = nome_op(nome) in operadores
        if cat == "fontes":
            correcao = ("a fonte pela CDN do Google manda o IP de cada visitante para os "
                        "EUA. Hospede a fonte no seu domínio (next/font já faz isso)")
        elif cat == "vídeo":
            correcao = ("o embed comum do YouTube rastreia o visitante. Use "
                        "youtube-nocookie.com ou carregue o vídeo só depois do clique")
        else:
            correcao = ""
        if correcao:
            if declarado:
                aviso(onde, "%s: %s" % (nome, correcao))
            else:
                erro(onde, "%s: %s, e o problema some. Ou, se for manter, declare como "
                     "operador em lgpd.json" % (nome, correcao))
            continue
        if not declarado:
            erro(onde, "%s aparece no código mas não está nos operadores de lgpd.json"
                 % nome)
        if cat in ("analytics", "publicidade"):
            aviso(onde, "%s é rastreamento: carregue só depois do aceite no banner de "
                  "cookies (obrigatório na UE; no Brasil, siga o guia de cookies da ANPD)"
                  % nome)

    if colunas:
        ignoradas = {c.lower() for c in cfg.get("colunas_ignoradas", [])}
        pessoais = [c for c in colunas if PESSOAL.search(c.split(".")[-1])
                    and c not in ignoradas]
        if not tem_colunas:
            if pessoais:
                aviso("schema", "dados.csv não tem a coluna 'colunas', então o schema não "
                      "foi conferido. Estas colunas parecem dado pessoal: %s"
                      % ", ".join(pessoais))
        else:
            for c in pessoais:
                if not _coberta(c, mapeadas):
                    aviso("schema", "a coluna %s parece dado pessoal e não está em "
                          "nenhuma linha de dados.csv. Inclua na coluna 'colunas', ou "
                          "em colunas_ignoradas de lgpd.json se não for" % c)

    return problemas, detectados


# ------------------------------------------------------------------ prazos

FERIADOS_FIXOS = [(1, 1), (4, 21), (5, 1), (9, 7), (10, 12), (11, 2), (11, 15),
                  (11, 20), (12, 25)]


def pascoa(ano):
    a, b, c = ano % 19, ano // 100, ano % 100
    d, e = b // 4, b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = c // 4, c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    mes = (h + l - 7 * m + 114) // 31
    dia = (h + l - 7 * m + 114) % 31 + 1
    return _dt.date(ano, mes, dia)


def feriados(ano):
    dias = {_dt.date(ano, m, d) for m, d in FERIADOS_FIXOS}
    dias.add(pascoa(ano) - _dt.timedelta(days=2))  # Sexta-feira Santa
    return dias


def dias_uteis_depois(inicio, n):
    """O n-ésimo dia útil depois de `inicio` (o dia do início não conta)."""
    dia = inicio
    contados = 0
    while contados < n:
        dia += _dt.timedelta(days=1)
        if dia.weekday() < 5 and dia not in feriados(dia.year):
            contados += 1
    return dia


def ler_momento(texto):
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M", "%Y-%m-%d"):
        try:
            return _dt.datetime.strptime(texto.strip(), fmt)
        except ValueError:
            continue
    raise ValueError("data inválida: %r (use AAAA-MM-DD HH:MM)" % texto)


SEMANA = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]


def prazo_incidente(momento, pequeno=False):
    n = 6 if pequeno else 3
    br = dias_uteis_depois(momento.date(), n)
    ue = momento + _dt.timedelta(hours=72)
    return {"ciencia": momento, "dias_uteis": n, "anpd_e_titulares": br, "ue": ue}


def render_prazo(p):
    def dia(d):
        return "%s (%s)" % (d.strftime("%d/%m/%Y"), SEMANA[d.weekday()])
    out = [
        "Ciência do incidente com dados pessoais: %s às %s"
        % (dia(p["ciencia"]), p["ciencia"].strftime("%H:%M")),
        "",
        "ANPD e titulares (Brasil): até o fim de %s, %d dias úteis%s"
        % (dia(p["anpd_e_titulares"]), p["dias_uteis"],
           " (em dobro: pequeno porte, Res. CD/ANPD 2/2022, art. 14)"
           if p["dias_uteis"] == 6 else " (Res. CD/ANPD 15/2024)"),
        "Autoridade da UE (se houver titulares lá e risco): até %s às %s, 72 horas "
        "(GDPR art. 33)" % (dia(p["ue"]), p["ue"].strftime("%H:%M")),
        "Titulares na UE: sem demora indevida, se o risco for alto (GDPR art. 34)",
        "",
        "Comunicação à ANPD pelo formulário do site dela. Faltou informação? Mande o que "
        "tem no prazo e complemente depois.",
        "Registre o incidente, mesmo se não comunicar: guarde por 5 anos no Brasil.",
        "Conta só feriados nacionais e a Sexta-feira Santa. Carnaval, Corpus Christi e "
        "feriados locais não são pulados, então o prazo daqui nunca é maior que o real.",
    ]
    if p["dias_uteis"] == 6:
        out.append("O prazo em dobro não vale se o incidente pode comprometer a "
                   "integridade física ou moral dos titulares: nesse caso, 3 dias úteis.")
    return "\n".join(out)


# ------------------------------------------------------------------ relatório

def _marcas(d):
    m = [t for t, col in (("sensível", "sensivel"), ("criança", "crianca")) if sim(d.get(col))]
    return ", ".join(m) or "não"


def render(dados, cfg, problemas, detectados):
    publico = {chave(p) for p in cfg.get("publico", [])}
    ue = "ue" in publico or "eu" in publico
    pequeno = bool(cfg.get("pequeno_porte"))
    ctrl = (cfg.get("controlador") or {}).get("nome") or "(sem controlador)"
    erros = [p for p in problemas if p["nivel"] == "erro"]
    avisos = [p for p in problemas if p["nivel"] == "aviso"]
    enc = cfg.get("encarregado") or {}
    out = ["# LGPD%s: %s" % (" + GDPR" if ue else "", ctrl), ""]
    out.append("Gerado por lgpd.py. Não escreva aqui: rodar de novo apaga. As decisões, "
               "os testes de balanceamento e o plano de incidente ficam em "
               "replica/lgpd.md.")
    out.append("")
    out.append("Público: %s. Pequeno porte: %s. Encarregado: %s. Canal do titular: %s."
               % (" e ".join("Brasil" if p == "br" else "UE" for p in sorted(publico)) or "-",
                  "sim" if pequeno else "não",
                  ("%s (%s)" % (enc.get("nome"), enc.get("email"))) if enc.get("nome")
                  else "não indicado", cfg.get("canal_titular") or "não indicado"))
    out.append("")
    out.append("**%d erros, %d avisos.** Isto não é parecer jurídico." % (len(erros), len(avisos)))
    for titulo, lista in (("Erros", erros), ("Avisos", avisos)):
        if lista:
            out += ["", "## %s" % titulo, ""]
            out += ["- **%s**: %s" % (p["onde"], p["msg"]) for p in lista]

    proprios = [d for d in dados if papel_de(d) == "controlador"]
    de_clientes = [d for d in dados if papel_de(d) == "operador"]
    out += ["", "## Registro das operações (LGPD art. 37%s)" % (" / GDPR art. 30" if ue else ""), ""]
    cab = "| dado | titular | finalidade | base LGPD |"
    sep = "| --- | --- | --- | --- |"
    if ue:
        cab += " base GDPR |"
        sep += " --- |"
    out += [cab + " sensível ou criança | retenção | compartilhado com |",
            sep + " --- | --- | --- |"]
    for d in proprios:
        base = chave(d.get("base_lgpd"))
        art = (BASES_SENSIVEL if sim(d.get("sensivel")) else BASES_LGPD).get(base, "?")
        linha = "| %s | %s | %s | %s (%s) |" % (d["dado"], d.get("titular", ""),
                                                d.get("finalidade", ""), base or "-", art)
        if ue:
            g = APELIDOS_GDPR.get(chave(d.get("base_gdpr")), chave(d.get("base_gdpr")))
            c = APELIDOS_ART9.get(chave(d.get("condicao_art9")), chave(d.get("condicao_art9")))
            if c and sim(d.get("sensivel")):
                g = "%s + %s (%s)" % (g or "-", c, CONDICOES_ART9.get(c, "?"))
            linha += " %s |" % (g or "-")
        linha += " %s | %s | %s |" % (_marcas(d), d.get("retencao", ""),
                                      d.get("operadores", "") or "-")
        out.append(linha)

    if de_clientes:
        out += ["", "## Dados que você trata como operador", "",
                "O controlador é o seu cliente: ele define a base legal. Você segue as "
                "instruções dele, protege os dados e o avisa de incidentes.", "",
                "| dado | titular | finalidade | sensível ou criança | retenção | "
                "compartilhado com |", "| --- | --- | --- | --- | --- | --- |"]
        for d in de_clientes:
            out.append("| %s | %s | %s | %s | %s | %s |" % (
                d["dado"], d.get("titular", ""), d.get("finalidade", ""), _marcas(d),
                d.get("retencao", ""), d.get("operadores", "") or "-"))

    ops = cfg.get("operadores", [])
    if ops:
        out += ["", "## Operadores e transferências internacionais", ""]
        out.append("| operador | serviço | país | DPA | mecanismo Brasil |%s"
                   % (" mecanismo UE |" if ue else ""))
        out.append("| --- | --- | --- | --- | --- |%s" % (" --- |" if ue else ""))
        for op in ops:
            pais = (op.get("pais") or "").upper()
            mbr = "-" if pais == "BR" else (chave(op.get("mecanismo_br")) or "FALTA")
            dpa = op.get("dpa")
            dpa = "sim" if dpa is True else (PENDENTE if chave(str(dpa)) == PENDENTE else "não")
            linha = "| %s | %s | %s | %s | %s |" % (op.get("nome", ""), op.get("servico", ""),
                                                    pais or "?", dpa, mbr)
            if ue:
                mue = chave(op.get("mecanismo_ue"))
                if pais in EEE:
                    mue = "-"
                elif not mue:
                    mue = "adequacao" if pais in ADEQUADOS_UE else "FALTA"
                linha += " %s |" % mue
            out.append(linha)

    if detectados:
        out += ["", "## Encontrado no código", ""]
        for d in detectados:
            out.append("- %s (%s, %s): %s" % (d["nome"], d["categoria"], d["pais"],
                                             ", ".join("%s [%s]" % x for x in d["onde"])))

    dobro = (" (em dobro para pequeno porte, salvo risco à integridade física ou moral "
             "dos titulares)" if pequeno else "")
    out += ["", "## Prazos", "",
            "| obrigação | Brasil | UE |" if ue else "| obrigação | Brasil |",
            "| --- | --- | --- |" if ue else "| --- | --- |"]
    linhas = [
        ("acesso e confirmação pedidos pelo titular",
         "imediato no formato simplificado; até 15 dias a declaração completa (art. 19)" + dobro,
         "1 mês, prorrogável por mais 2 (art. 12(3))"),
        ("outros direitos (correção, exclusão, portabilidade...)",
         "sem prazo em regulamento ainda: use 15 dias" + dobro, "1 mês, prorrogável por mais 2"),
        ("incidente: avisar a autoridade",
         "3 dias úteis à ANPD (Res. 15/2024)" + dobro, "72 horas, se houver risco (art. 33)"),
        ("incidente: avisar os titulares", "3 dias úteis" + dobro,
         "sem demora indevida, se risco alto (art. 34)"),
        ("registro de incidentes", "guardar 5 anos, inclusive os não comunicados",
         "documentar todos (art. 33(5))"),
        ("logs de acesso à aplicação", "guardar 6 meses (Marco Civil, art. 15)", "-"),
    ]
    for o, br, eu in linhas:
        out.append("| %s | %s | %s |" % (o, br, eu) if ue else "| %s | %s |" % (o, br))
    out.append("")
    out.append("Num incidente: `python3 $SKILL/lgpd.py prazo-incidente \"AAAA-MM-DD HH:MM\"%s`"
               % (" --pequeno-porte" if pequeno else ""))
    return "\n".join(out) + "\n"


def render_varredura(achados, servicos):
    if not achados:
        return "Nenhum serviço conhecido no código. Confira sdks.json se usa algum outro."
    out = ["| serviço | categoria | país da empresa | onde |", "| --- | --- | --- | --- |"]
    for nome, onde in sorted(achados.items()):
        info = next((s for s in servicos if s["nome"] == nome), {})
        out.append("| %s | %s | %s | %s |" % (nome, info.get("categoria", ""),
                                              info.get("pais", ""),
                                              ", ".join("%s [%s]" % x for x in onde)))
    out.append("")
    out.append("O país é onde a empresa fica. Onde os dados ficam depende da região "
               "escolhida no painel: confirme antes de preencher lgpd.json.")
    return "\n".join(out)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    v = sub.add_parser("varrer", help="serviços de terceiros encontrados no código")
    v.add_argument("raiz", nargs="?", default=".")
    v.add_argument("--servicos", default=SERVICOS)
    v.add_argument("--json", action="store_true")
    c = sub.add_parser("verificar", help="confere o inventário de dados e o lgpd.json")
    c.add_argument("dados", help="dados.csv")
    c.add_argument("--config", required=True, help="lgpd.json")
    c.add_argument("--codigo", help="raiz do projeto, para conferir terceiros no código")
    c.add_argument("--servicos", default=SERVICOS)
    c.add_argument("--json", action="store_true")
    c.add_argument("--out", help="grava o relatório markdown aqui")
    p = sub.add_parser("prazo-incidente", help="prazos de comunicação de um incidente")
    p.add_argument("momento", help="quando você soube: AAAA-MM-DD HH:MM")
    p.add_argument("--pequeno-porte", action="store_true")
    args = ap.parse_args(argv)

    try:
        if args.cmd == "prazo-incidente":
            print(render_prazo(prazo_incidente(ler_momento(args.momento), args.pequeno_porte)))
            return 0
        servicos = carregar_servicos(args.servicos)
        if args.cmd == "varrer":
            achados = varrer(args.raiz, servicos)
            if args.json:
                print(json.dumps(achados, indent=2, ensure_ascii=False))
            else:
                print(render_varredura(achados, servicos))
            return 0
        dados = carregar_dados(args.dados)
        cfg = carregar_config(args.config)
        achados = varrer(args.codigo, servicos) if args.codigo else None
        colunas = ler_schema(args.codigo) if args.codigo else None
    except (EntradaError, OSError, ValueError, KeyError) as exc:
        print("lgpd: %s" % exc, file=sys.stderr)
        return 2

    problemas, detectados = verificar(dados, cfg, achados, servicos, colunas)
    if args.json:
        print(json.dumps({"problemas": problemas, "detectados": detectados},
                         indent=2, ensure_ascii=False))
    else:
        texto = render(dados, cfg, problemas, detectados)
        if args.out:
            with open(args.out, "w", encoding="utf-8") as fh:
                fh.write(texto)
            erros = sum(1 for x in problemas if x["nivel"] == "erro")
            print("gravado em %s: %d erros, %d avisos" % (args.out, erros,
                                                           len(problemas) - erros))
        else:
            sys.stdout.write(texto)
    return 1 if any(x["nivel"] == "erro" for x in problemas) else 0


if __name__ == "__main__":
    sys.exit(main())
