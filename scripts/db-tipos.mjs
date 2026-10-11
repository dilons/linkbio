// npm run db:types: lê o banco já migrado (drizzle-kit pull) e grava
// src/lib/db/schema.ts. O drizzle-kit não reconhece citext e bytea nem declara
// auth.users (do Supabase Auth); este script completa o que falta.
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";

execFileSync("npx", ["drizzle-kit", "pull"], { stdio: "inherit" });
let s = readFileSync(".drizzle-pull/schema.ts", "utf8");

s = s.replace(/^import \{ (.+) \} from "drizzle-orm\/pg-core"/m, (_, nomes) => `import { ${nomes}, customType, pgSchema } from "drizzle-orm/pg-core"`);
for (const tipo of ["citext", "bytea"]) {
  s = s.replace(new RegExp(`\\t// TODO: failed to parse database type '${tipo}'\\n\\t(\\w+): unknown\\(`, "g"), `\t$1: ${tipo}(`);
}
if (s.includes("unknown(")) throw new Error("ainda há colunas de tipo desconhecido em schema.ts");

const cabecalho = `// Gerado por \`npm run db:types\` a partir do banco migrado (supabase/migrations).
// Não edite à mão: mude o SQL numa migração nova e gere de novo.
`;
const extras = `
// Tipos que o drizzle-kit não reconhece sozinho.
const citext = customType<{ data: string }>({ dataType: () => "citext" });
const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });

// auth.users é do Supabase Auth; aqui só o que as chaves estrangeiras usam.
export const users = pgSchema("auth").table("users", { id: uuid().primaryKey() });
`;
s = s.replace(/(import \{ sql \} from "drizzle-orm"\n)/, `$1${extras}`);
writeFileSync("src/lib/db/schema.ts", cabecalho + s);
rmSync(".drizzle-pull", { recursive: true, force: true });
console.log("src/lib/db/schema.ts atualizado");
