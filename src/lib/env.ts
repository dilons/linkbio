// Variáveis de ambiente do servidor. Os valores ficam no .env.local (nunca no
// git); o .env.example lista todas, sem valor.

/**
 * A variável, ou undefined se ausente ou em branco. "X=" no .env ou um campo
 * vazio no painel da Vercel chega como "", e "" com ?? passava por valor:
 * preço zero, pool zero, links relativos (BUG-013).
 */
export function lerVariavel(nome: string): string | undefined {
  return process.env[nome]?.trim() || undefined;
}

/** Inteiro positivo da variável, ou o padrão (em branco, zero ou inválido). */
export function lerInteiro(nome: string, padrao: number): number {
  const v = Number(lerVariavel(nome));
  return Number.isInteger(v) && v > 0 ? v : padrao;
}
function exigir(nome: string): string {
  const v = process.env[nome];
  if (!v) throw new Error(`${nome} não está definida. Veja o .env.example.`);
  return v;
}

export const env = {
  supabaseUrl: () => exigir("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseChavePublica: () => exigir("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  supabaseChaveSecreta: () => exigir("SUPABASE_SECRET_KEY"),
  /** Origem pública do app, para links em emails e no Asaas (ex.: https://chamaqui.com.br). */
  site: () => lerVariavel("NEXT_PUBLIC_SITE_URL")?.replace(/\/$/, "") ?? null,
};
