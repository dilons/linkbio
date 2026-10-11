import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { assinaturaDaConta, processarEvento } from "@/lib/billing";
import { emailDaConta } from "@/lib/data/emails";
import { enviarEmail } from "@/lib/email";
import { modelos } from "@/lib/email/modelos";
import { env } from "@/lib/env";

const evento = z.object({
  id: z.string().min(1).max(200),
  event: z.string().min(1).max(100),
  payment: z.object({ id: z.string().optional(), subscription: z.string().nullish(), dueDate: z.string().optional(), status: z.string().optional() }).passthrough().optional(),
  subscription: z.object({ id: z.string().optional(), status: z.string().optional() }).passthrough().optional(),
});

/** Compara o token sem vazar, pelo tempo de resposta, quantos caracteres batem. */
function tokenConfere(recebido: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado || !recebido) return false;
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(recebido), h(esperado));
}

// Eventos do Asaas (cobranças e assinaturas). O token configurado no webhook
// do Asaas vem no cabeçalho asaas-access-token. Responder 200 rápido, inclusive
// para evento ignorado ou repetido; 5xx só se não deu para gravar, para o
// Asaas tentar de novo.
export async function POST(req: Request) {
  if (!tokenConfere(req.headers.get("asaas-access-token"))) return new Response("token inválido", { status: 401 });
  const dados = evento.safeParse(await req.json().catch(() => null));
  if (!dados.success) return new Response("evento inválido", { status: 400 });

  let r: Awaited<ReturnType<typeof processarEvento>>;
  try {
    r = await processarEvento(dados.data);
  } catch (e) {
    console.error("webhook asaas: falha ao processar", dados.data.event, e instanceof Error ? e.message : e);
    return new Response("erro", { status: 500 });
  }

  // aviso por email, uma vez por evento (a chave de idempotência é o id do evento)
  if (r.accountId && (r.efeito === "ativou" || r.efeito === "renovou" || r.efeito === "venceu")) {
    const email = await emailDaConta(r.accountId);
    const site = env.site() ?? new URL(req.url).origin;
    const ate = r.fimDoPeriodo ?? new Date(Date.now() + 30 * 86400_000).toISOString();
    if (email) {
      const msg =
        r.efeito === "ativou"
          ? modelos.proAtivo(email, site, ate)
          : r.efeito === "renovou"
            ? modelos.renovou(email, site, (await assinaturaDaConta(r.accountId))?.precoCentavos ?? 0, ate)
            : modelos.pagamentoVencido(email, site);
      await enviarEmail(msg, `asaas-${dados.data.id}`);
    }
  }
  return Response.json({ ok: true, efeito: r.efeito });
}
