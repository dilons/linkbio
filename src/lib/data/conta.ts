// Exclusão da conta ou só da página (LGPD): registra o pedido, apaga os
// arquivos e os dados. Na conta, também cancela a cobrança e apaga o usuário; o
// banco esvazia os perfis na hora (gatilho antes_de_apagar_conta). Nos dois
// casos o job de limpeza solta o username depois de 14 dias.
import { eq, sql } from "drizzle-orm";
import { eDonoDoPerfil } from "@/lib/authz";
import { cancelarAssinatura } from "@/lib/billing";
import { db } from "@/lib/db";
import { dataRequests, profiles } from "@/lib/db/schema";
import { enviarEmail } from "@/lib/email";
import { modelos } from "@/lib/email/modelos";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apagarUsuario } from "./auth";

export const BUCKET_AVATARES = "avatares";

/** Apaga as fotos de um perfil (pasta <perfil>/ no bucket). */
async function apagarArquivosDoPerfil(profileId: string): Promise<void> {
  const storage = supabaseAdmin().storage.from(BUCKET_AVATARES);
  const { data } = await storage.list(profileId);
  if (data?.length) await storage.remove(data.map((f) => `${profileId}/${f.name}`));
}

/** Apaga as fotos de todos os perfis da conta. */
export async function apagarArquivosDaConta(accountId: string): Promise<void> {
  const conn = await db();
  const perfis = await conn.select({ id: profiles.id }).from(profiles).where(eq(profiles.accountId, accountId));
  for (const { id } of perfis) await apagarArquivosDoPerfil(id);
}

export type ResultadoExclusao = { ok: true } | { ok: false; erro: string };

export async function excluirConta(accountId: string, email: string): Promise<ResultadoExclusao> {
  // sem cancelar a cobrança, não exclui: a pessoa continuaria pagando
  if (!(await cancelarAssinatura(accountId))) {
    return { ok: false, erro: "Não deu para cancelar sua assinatura agora, então a conta não foi excluída. Tente de novo em instantes." };
  }
  await apagarArquivosDaConta(accountId);
  const conn = await db();
  // prova de que o pedido foi atendido no prazo; a ligação com a conta some junto com ela
  const [pedido] = await conn
    .insert(dataRequests)
    .values({ accountId, requesterEmail: email, kind: "delete", notes: "pelo app, tela Conta" })
    .returning({ id: dataRequests.id });
  if (!(await apagarUsuario(accountId))) {
    await conn.delete(dataRequests).where(eq(dataRequests.id, pedido.id));
    return { ok: false, erro: "Não deu para excluir a conta agora. Tente de novo em instantes." };
  }
  await conn.update(dataRequests).set({ completedAt: new Date().toISOString() }).where(eq(dataRequests.id, pedido.id));
  await enviarEmail(modelos.contaExcluida(email));
  return { ok: true };
}

/**
 * Exclui só a página: links, redes, aparência, inscritos, estatísticas, foto e
 * textos somem agora. A conta (login e assinatura) continua, e o endereço fica
 * guardado 14 dias, que só a própria conta pode usar de novo.
 */
export async function excluirPagina(accountId: string, email: string, profileId: string): Promise<ResultadoExclusao> {
  const conn = await db();
  const [perfil] = await conn.select({ username: profiles.username }).from(profiles).where(eDonoDoPerfil(accountId, profileId)).limit(1);
  if (!perfil) return { ok: false, erro: "Essa página não existe mais." };
  await apagarArquivosDoPerfil(profileId);
  await conn.transaction(async (tx) => {
    await tx.execute(sql`select public.apagar_perfil(${profileId}::uuid)`);
    await tx.insert(dataRequests).values({
      accountId,
      requesterEmail: email,
      kind: "delete",
      notes: `só a página ${perfil.username}, pelo app, tela Conta`,
      completedAt: new Date().toISOString(),
    });
  });
  await enviarEmail(modelos.paginaExcluida(email, perfil.username));
  return { ok: true };
}
