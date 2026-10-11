import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/** Email da conta, direto do Supabase Auth (auth.users). */
export async function emailDaConta(accountId: string): Promise<string | null> {
  const conn = await db();
  const [r] = await conn.execute<{ email: string | null }>(sql`select email from auth.users where id = ${accountId}`);
  return r?.email ?? null;
}
