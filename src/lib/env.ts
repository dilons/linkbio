// Variáveis de ambiente do servidor. Os valores ficam no .env.local (nunca no
// git); o .env.example lista todas, sem valor.
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
  site: () => process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? null,
};
