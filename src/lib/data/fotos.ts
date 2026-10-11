// Foto de perfil no Supabase Storage (bucket "avatares", público, até 2 MB, só
// JPG, PNG e WebP: o próprio Storage recusa o resto). O navegador envia direto
// para o Storage com uma URL assinada que só vale para um caminho dentro da
// pasta do perfil.
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { eDonoDoPerfil } from "@/lib/authz";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { supabaseAdmin } from "@/lib/supabase/server";
import { BUCKET_AVATARES } from "./conta";

export const TIPOS_DE_FOTO: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const FOTO_MAX_BYTES = 2 * 1024 * 1024;

/** Endereço público da foto (domínio do Supabase, separado do app). */
export function urlDaFoto(caminho: string | null): string | undefined {
  if (!caminho) return undefined;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return base ? `${base}/storage/v1/object/public/${BUCKET_AVATARES}/${caminho}` : undefined;
}

export type Envio = { ok: true; caminho: string; url: string } | { ok: false; erro: string };

export async function prepararEnvio(profileId: string, tipo: string, tamanho: number): Promise<Envio> {
  const ext = TIPOS_DE_FOTO[tipo];
  if (!ext) return { ok: false, erro: "Use JPG, PNG ou WebP." };
  if (!Number.isFinite(tamanho) || tamanho <= 0 || tamanho > FOTO_MAX_BYTES) return { ok: false, erro: "A imagem passa de 2 MB." };
  const caminho = `${profileId}/${randomUUID()}.${ext}`;
  const { data, error } = await supabaseAdmin().storage.from(BUCKET_AVATARES).createSignedUploadUrl(caminho);
  if (error || !data) return { ok: false, erro: "Não deu para preparar o envio agora." };
  return { ok: true, caminho, url: data.signedUrl };
}

/** Grava a foto enviada como a do perfil e apaga a anterior. */
export async function definirFoto(accountId: string, profileId: string, caminho: string | null): Promise<boolean> {
  if (caminho !== null && !new RegExp(`^${profileId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`).test(caminho)) return false;
  const storage = supabaseAdmin().storage.from(BUCKET_AVATARES);
  if (caminho) {
    // a foto precisa ter chegado ao Storage
    const nome = caminho.split("/")[1];
    const { data } = await storage.list(profileId, { search: nome });
    if (!data?.some((f) => f.name === nome)) return false;
  }
  const conn = await db();
  const [antes] = await conn.select({ caminho: profiles.avatarPath }).from(profiles).where(eDonoDoPerfil(accountId, profileId));
  if (!antes) return false;
  await conn
    .update(profiles)
    .set({ avatarPath: caminho, updatedAt: new Date().toISOString() })
    .where(eq(profiles.id, profileId));
  if (antes.caminho && antes.caminho !== caminho) await storage.remove([antes.caminho]);
  return true;
}
