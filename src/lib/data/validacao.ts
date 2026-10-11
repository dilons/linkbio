import { z } from "zod";

export const USERNAME = /^[a-z0-9._]{3,30}$/;

/**
 * "@Doces.Da.Ana " vira "doces.da.ana". Aceita o segmento da URL ainda
 * codificado ("%40ana"): quem compartilha chamaqui.com.br/@ana, no hábito do
 * Instagram, cai na página certa (BUG-006).
 */
export function normalizarUsername(bruto: string): string {
  let texto = bruto;
  try {
    texto = decodeURIComponent(bruto);
  } catch {
    // sequência % inválida: segue como veio e o formato reprova
  }
  return texto.trim().replace(/^@+/, "").toLowerCase();
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

/** Aviso antes de abrir um link (S07, S16): nenhum, sensível ou idade mínima. */
export const TRAVAS = ["none", "sensitive", "18", "21", "25"] as const;
export type Trava = (typeof TRAVAS)[number];
export const travaSchema = z.enum(TRAVAS).catch("none");

/** Colunas `lock` e `lock_min_age` para o valor único da tela, e de volta. */
export function travaDoBanco(lock: string, idade: number | null): Trava {
  if (lock === "sensitive") return "sensitive";
  if (lock === "age" && (idade === 18 || idade === 21 || idade === 25)) return String(idade) as Trava;
  return "none";
}
export function travaParaBanco(t: Trava): { lock: "none" | "sensitive" | "age"; lockMinAge: number | null } {
  if (t === "none" || t === "sensitive") return { lock: t, lockMinAge: null };
  return { lock: "age", lockMinAge: Number(t) };
}

export const cabecalhoSchema = z.object({
  titulo: z.string().trim().max(60, "Use no máximo 60 caracteres."),
  bio: z.string().trim().max(160, "Use no máximo 160 caracteres."),
});

export const credenciaisSchema = z.object({
  email: z.string().trim().toLowerCase().email("Confira o email."),
  senha: z.string().min(8, "A senha precisa de pelo menos 8 caracteres.").max(200),
});
