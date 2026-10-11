// Temas prontos da página pública (S08). As cores de cada um moram nos tokens
// (replica/design/tokens.json, data-theme) e o contraste de todos foi conferido
// na /replica-design.
import { sql } from "drizzle-orm";
import { donoDoPerfil } from "@/lib/authz";
import { db } from "@/lib/db";
import { appearances } from "@/lib/db/schema";

export const TEMAS = [
  { id: "papel", nome: "Papel", descricao: "claro e neutro" },
  { id: "noite", nome: "Noite", descricao: "escuro, botões em cinza" },
  { id: "areia", nome: "Areia", descricao: "bege com botões cheios" },
  { id: "oceano", nome: "Oceano", descricao: "azul profundo" },
  { id: "contraste", nome: "Alto contraste", descricao: "preto e branco, para ler melhor" },
] as const;

export type Tema = (typeof TEMAS)[number]["id"];
export const IDS_DOS_TEMAS = TEMAS.map((t) => t.id) as [Tema, ...Tema[]];

/** Grava o tema do perfil (só do dono). Não mexe no tema customizado, que é da etapa 6. */
export async function definirTema(accountId: string, profileId: string, tema: Tema): Promise<boolean> {
  const conn = await db();
  if (!(await donoDoPerfil(conn, accountId, profileId))) return false;
  await conn
    .insert(appearances)
    .values({ profileId, theme: tema })
    .onConflictDoUpdate({ target: appearances.profileId, set: { theme: tema, updatedAt: sql`now()` } });
  return true;
}
