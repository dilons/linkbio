import postgres from "postgres";

// Antes de tudo: o Supabase local responde, e os limites de uso começam
// zerados (cada rodada não herda as tentativas da anterior). Só com banco local.
export default async function preparar() {
  const url = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
  if (!/@(127\.0\.0\.1|localhost)[:/]/.test(url)) throw new Error("os testes de ponta a ponta só rodam com o banco local");
  const sql = postgres(url, { max: 1 });
  await sql`delete from rate_limits`;
  await sql.end();
  const auth = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" },
  }).catch(() => null);
  if (!auth?.ok) throw new Error("Supabase local fora do ar: rode npm run db:start");
}
