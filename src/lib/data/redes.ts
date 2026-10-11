// Ícones das redes sociais no topo ou no rodapé da página (S06). Cada rede
// aparece uma vez por perfil. O endereço tem que ser da própria rede: um ícone
// do Instagram que leva a outro site seria um jeito fácil de enganar o visitante.
import { and, asc, eq, sql } from "drizzle-orm";
import { donoDoPerfil, eDonoDoPerfil } from "@/lib/authz";
import { db } from "@/lib/db";
import { profiles, socialLinks } from "@/lib/db/schema";
import type { Plataforma } from "@/lib/plataformas";

export { IDS_DAS_REDES, normalizarRede, REDES, type Plataforma } from "@/lib/plataformas";

export type RedeSalva = { plataforma: Plataforma; url: string };

export async function listarRedes(accountId: string, profileId: string): Promise<RedeSalva[]> {
  const conn = await db();
  if (!(await donoDoPerfil(conn, accountId, profileId))) return [];
  const r = await conn
    .select({ plataforma: socialLinks.platform, url: socialLinks.url })
    .from(socialLinks)
    .where(eq(socialLinks.profileId, profileId))
    .orderBy(asc(socialLinks.position));
  return r as RedeSalva[];
}

/** Põe a rede no fim da fileira ou, se ela já existe, troca só o endereço. */
export async function salvarRede(accountId: string, profileId: string, plataforma: Plataforma, url: string): Promise<boolean> {
  const conn = await db();
  return conn.transaction(async (tx) => {
    if (!(await donoDoPerfil(tx, accountId, profileId))) return false;
    await tx
      .insert(socialLinks)
      .values({
        profileId,
        platform: plataforma,
        url,
        position: sql`(select coalesce(max(position) + 1, 0) from social_links where profile_id = ${profileId})`,
      })
      .onConflictDoUpdate({ target: [socialLinks.profileId, socialLinks.platform], set: { url, updatedAt: sql`now()` } });
    return true;
  });
}

export async function removerRede(accountId: string, profileId: string, plataforma: Plataforma): Promise<boolean> {
  const conn = await db();
  return conn.transaction(async (tx) => {
    if (!(await donoDoPerfil(tx, accountId, profileId))) return false;
    const r = await tx
      .delete(socialLinks)
      .where(and(eq(socialLinks.profileId, profileId), eq(socialLinks.platform, plataforma)))
      .returning({ id: socialLinks.id });
    return r.length > 0;
  });
}

/** Grava a nova ordem. Recusa se a lista não for exatamente a do perfil. */
export async function reordenarRedes(accountId: string, profileId: string, plataformas: Plataforma[]): Promise<boolean> {
  const conn = await db();
  return conn.transaction(async (tx) => {
    if (!(await donoDoPerfil(tx, accountId, profileId))) return false;
    const atuais = new Set(
      (await tx.select({ p: socialLinks.platform }).from(socialLinks).where(eq(socialLinks.profileId, profileId))).map((r) => r.p),
    );
    if (atuais.size !== plataformas.length || !plataformas.every((p) => atuais.has(p))) return false;
    for (const [i, p] of plataformas.entries()) {
      await tx
        .update(socialLinks)
        .set({ position: i, updatedAt: sql`now()` })
        .where(and(eq(socialLinks.profileId, profileId), eq(socialLinks.platform, p)));
    }
    return true;
  });
}

/** Ícones no topo (abaixo da bio) ou no rodapé da página. */
export async function posicionarRedes(accountId: string, profileId: string, posicao: "top" | "bottom"): Promise<boolean> {
  const conn = await db();
  const r = await conn
    .update(profiles)
    .set({ socialPosition: posicao, updatedAt: sql`now()` })
    .where(eDonoDoPerfil(accountId, profileId))
    .returning({ id: profiles.id });
  return r.length > 0;
}
