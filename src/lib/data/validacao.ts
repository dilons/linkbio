import { z } from "zod";

export const USERNAME = /^[a-z0-9._]{3,30}$/;

/** "@Doces.Da.Ana " vira "doces.da.ana". */
export function normalizarUsername(bruto: string): string {
  return bruto.trim().replace(/^@+/, "").toLowerCase();
}

export function problemaNoUsername(u: string): string | null {
  if (u.length < 3) return "Use pelo menos 3 caracteres.";
  if (u.length > 30) return "Use no máximo 30 caracteres.";
  if (!USERNAME.test(u)) return "Use só letras sem acento, números, ponto e sublinhado.";
  if (/^[._]|[._]$/.test(u)) return "Não comece nem termine com ponto ou sublinhado.";
  return null;
}

/** "exemplo.com.br/x" vira "https://exemplo.com.br/x". Só aceita http e https. */
export function normalizarUrl(bruta: string): string | null {
  const t = bruta.trim();
  if (!t) return null;
  const comEsquema = /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(comEsquema);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export const linkSchema = z.object({
  titulo: z.string().trim().min(1, "Dê um título ao link.").max(100, "Use no máximo 100 caracteres."),
  url: z
    .string()
    .transform((v, ctx) => {
      const u = normalizarUrl(v);
      if (!u || u.length > 2048) {
        ctx.addIssue({ code: "custom", message: "Esse endereço não parece um link válido." });
        return z.NEVER;
      }
      return u;
    }),
});

export const cabecalhoSchema = z.object({
  titulo: z.string().trim().max(60, "Use no máximo 60 caracteres."),
  bio: z.string().trim().max(160, "Use no máximo 160 caracteres."),
});

export const credenciaisSchema = z.object({
  email: z.string().trim().toLowerCase().email("Confira o email."),
  senha: z.string().min(8, "A senha precisa de pelo menos 8 caracteres.").max(200),
});
