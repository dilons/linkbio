// Demo do kamino: prepara o banco do pod, que é efêmero (some quando o pod
// some). Espera o Auth e o Storage criarem as tabelas deles, aplica as
// migrações em ordem e o seed, numa transação só. Se o app reiniciou e o pod
// não, o banco já está pronto e não faz nada.
//
// Uso: DATABASE_URL=... node scripts/demo-banco.mjs
import { readdir, readFile } from "node:fs/promises";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
const existe = async (tabela) => (await sql`select to_regclass(${tabela}) as t`)[0].t !== null;

for (let i = 0; !((await existe("auth.users")) && (await existe("storage.buckets"))); i++) {
  if (i === 150) throw new Error("o Auth e o Storage não criaram as tabelas em 5 minutos");
  await new Promise((r) => setTimeout(r, 2000));
}

if (await existe("public.profiles")) {
  console.log("demo-banco: banco já pronto");
} else {
  const raiz = new URL("../supabase/", import.meta.url);
  const migracoes = (await readdir(new URL("migrations/", raiz))).filter((f) => f.endsWith(".sql")).sort();
  await sql.begin(async (tx) => {
    for (const f of migracoes) {
      await tx.unsafe(await readFile(new URL(`migrations/${f}`, raiz), "utf8"));
      console.log(`demo-banco: ${f}`);
    }
    await tx.unsafe(await readFile(new URL("seed.sql", raiz), "utf8"));
  });
  console.log(`demo-banco: ${migracoes.length} migrações e o seed aplicados`);
}
await sql.end();
