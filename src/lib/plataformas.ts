// Redes sociais aceitas na fileira de ícones e como o endereço de cada uma é
// montado a partir do que a pessoa digita. Sem banco: o editor (navegador) usa
// os nomes e exemplos, e o servidor usa a mesma regra para validar.
type Definicao = {
  id: string;
  nome: string;
  /** rótulo do campo no editor */
  rotulo: string;
  exemplo: string;
  /** domínios aceitos (subdomínios também) */
  dominios: string[];
  /** o @ ou nome de usuário válido nessa rede; sem isso, só endereço completo */
  usuario?: RegExp;
  endereco?: (usuario: string) => string;
};

export const REDES = [
  {
    id: "instagram",
    nome: "Instagram",
    rotulo: "Seu @ no Instagram",
    exemplo: "@docesdaana",
    dominios: ["instagram.com"],
    usuario: /^[a-z0-9._]{1,30}$/i,
    endereco: (u) => `https://www.instagram.com/${u}`,
  },
  {
    id: "tiktok",
    nome: "TikTok",
    rotulo: "Seu @ no TikTok",
    exemplo: "@docesdaana",
    dominios: ["tiktok.com"],
    usuario: /^[a-z0-9._]{2,24}$/i,
    endereco: (u) => `https://www.tiktok.com/@${u}`,
  },
  {
    id: "youtube",
    nome: "YouTube",
    rotulo: "Seu canal no YouTube (@ ou endereço)",
    exemplo: "@docesdaana",
    dominios: ["youtube.com", "youtu.be"],
    usuario: /^[a-z0-9._-]{3,30}$/i,
    endereco: (u) => `https://www.youtube.com/@${u}`,
  },
  {
    id: "whatsapp",
    nome: "WhatsApp",
    rotulo: "Seu WhatsApp com DDD",
    exemplo: "(11) 91234-5678",
    dominios: ["wa.me", "whatsapp.com"],
  },
  {
    id: "x",
    nome: "X",
    rotulo: "Seu @ no X",
    exemplo: "@docesdaana",
    dominios: ["x.com", "twitter.com"],
    usuario: /^[a-z0-9_]{1,15}$/i,
    endereco: (u) => `https://x.com/${u}`,
  },
  {
    id: "facebook",
    nome: "Facebook",
    rotulo: "Sua página no Facebook (nome ou endereço)",
    exemplo: "docesdaana",
    dominios: ["facebook.com", "fb.com"],
    usuario: /^[a-z0-9.]{5,50}$/i,
    endereco: (u) => `https://www.facebook.com/${u}`,
  },
  {
    id: "spotify",
    nome: "Spotify",
    rotulo: "Endereço do Spotify",
    exemplo: "open.spotify.com/artist/…",
    dominios: ["spotify.com", "spotify.link"],
  },
] as const satisfies readonly Definicao[];

export type Plataforma = (typeof REDES)[number]["id"];
export const IDS_DAS_REDES = REDES.map((r) => r.id) as [Plataforma, ...Plataforma[]];
export const MAX_ENDERECO = 300;

const definicao = (p: Plataforma): Definicao => REDES.find((r) => r.id === p)!;

export type Normalizado = { ok: true; url: string } | { ok: false; erro: string };

const doDominio = (host: string, dominios: string[]) => {
  const h = host.toLowerCase().replace(/^(www|m|mobile)\./, "");
  return dominios.some((d) => h === d || h.endsWith(`.${d}`));
};

/**
 * Transforma o que a pessoa digitou no endereço da rede: aceita o @, o nome de
 * usuário, o endereço com ou sem https:// e, no WhatsApp, o número em qualquer
 * formato (o 55 do Brasil entra sozinho).
 */
export function normalizarRede(plataforma: Plataforma, entrada: string): Normalizado {
  const rede = definicao(plataforma);
  const texto = entrada.trim();
  if (!texto) return { ok: false, erro: rede.usuario ? `Escreva o seu @ ou o endereço do ${rede.nome}.` : `Cole o endereço do ${rede.nome}.` };
  if (texto.length > MAX_ENDERECO) return { ok: false, erro: "Endereço longo demais." };

  const pareceEndereco = /^https?:\/\//i.test(texto) || texto.includes("/") || doDominio(texto.split(/[/?#]/)[0], rede.dominios);
  if (pareceEndereco) {
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    } catch {
      return { ok: false, erro: "Confira o endereço." };
    }
    if (!doDominio(url.hostname, rede.dominios)) return { ok: false, erro: `Esse endereço não é do ${rede.nome}.` };
    if (url.pathname === "/" || url.pathname === "") return { ok: false, erro: `Falta o seu perfil no endereço do ${rede.nome}.` };
    if (url.username || url.password) return { ok: false, erro: "Confira o endereço." };
    url.protocol = "https:";
    return { ok: true, url: url.toString() };
  }

  if (plataforma === "whatsapp") {
    // Com + é o número internacional completo; sem +, um número do Brasil.
    const internacional = texto.startsWith("+");
    let numero = texto.replace(/\D/g, "");
    if (!internacional) numero = numero.replace(/^0+/, "");
    if (!internacional && (numero.length === 10 || numero.length === 11)) numero = `55${numero}`;
    const valido = numero.startsWith("55") ? /^55\d{10,11}$/.test(numero) : internacional && /^[1-9]\d{7,14}$/.test(numero);
    if (!valido) return { ok: false, erro: "Confira o número: DDD e número, com 10 ou 11 dígitos." };
    return { ok: true, url: `https://wa.me/${numero}` };
  }

  if (!rede.usuario || !rede.endereco) return { ok: false, erro: `Cole o endereço completo do ${rede.nome}.` };
  const usuario = texto.replace(/^@/, "");
  if (!rede.usuario.test(usuario)) return { ok: false, erro: `Confira o seu @ no ${rede.nome}.` };
  return { ok: true, url: rede.endereco(usuario) };
}
