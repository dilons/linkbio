// Exclusão da conta (LGPD): registra o pedido, cancela a cobrança, apaga os
// arquivos e o usuário. O banco esvazia os perfis na hora (gatilho
// antes_de_apagar_conta) e o job de limpeza solta o username depois de 14 dias.
import { eq } from "drizzle-orm";
import { cancelarAssinatura } from "@/lib/billing";
import { db } from "@/lib/db";
import { dataRequests, profiles } from "@/lib/db/schema";
import { enviarEmail } from "@/lib/email";
import { modelos } from "@/lib/email/modelos";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apagarUsuario } from "./auth";

export const BUCKET_AVATARES = "avatares";

/** Apaga as fotos de todos os perfis da conta (pasta <perfil>/ no bucket). */
export async function apagarArquivosDaConta(accountId: string): Promise<void> {
  const conn = await db();
  const perfis = await conn.select({ id: profiles.id }).from(profiles).where(eq(profiles.accountId, accountId));
  const storage = supabaseAdmin().storage.from(BUCKET_AVATARES);
  for (const { id } of perfis) {
    const { data } = await storage.list(id);
    if (data?.length) await storage.remove(data.map((f) => `${id}/${f.name}`));
  }
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
