import { defineConfig } from "drizzle-kit";

// As migrações são o SQL em supabase/migrations (aplicado pelo Supabase CLI).
// O Drizzle só lê o banco já migrado para gerar os tipos: npm run db:types.
export default defineConfig({
  dialect: "postgresql",
  out: "./.drizzle-pull",
  schemaFilter: ["public"],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  },
});
