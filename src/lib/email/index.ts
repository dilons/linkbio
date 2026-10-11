// Emails do app (cobrança, conta). Os de login (confirmação, senha) saem pelo
// próprio Supabase Auth, com os modelos de supabase/templates.
//
// Produção: Resend, do domínio próprio (SPF, DKIM e DMARC configurados lá).
// Desenvolvimento: o Mailpit do Supabase local (http://127.0.0.1:54324), que
// guarda tudo e não manda nada para fora.

export type Email = { para: string; assunto: string; html: string; texto: string };
import { lerVariavel } from "@/lib/env";
import { MARCA } from "@/lib/marca";

const remetente = () => lerVariavel("EMAIL_FROM") ?? MARCA.remetente;

/**
 * Manda o email. `chave` evita mandar duas vezes a mesma coisa (o Resend
 * descarta repetidos com a mesma chave por 24 horas). Nunca escreve o
 * endereço em log.
 */
export async function enviarEmail(email: Email, chave?: string): Promise<boolean> {
  try {
    if (process.env.RESEND_API_KEY) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "content-type": "application/json",
          ...(chave ? { "idempotency-key": chave } : {}),
        },
        body: JSON.stringify({ from: remetente(), to: [email.para], subject: email.assunto, html: email.html, text: email.texto }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!r.ok) console.error("email: o Resend respondeu", r.status);
      return r.ok;
    }
    if (process.env.MAILPIT_URL) {
      const [, nome, endereco] = remetente().match(/^(.*?)\s*<(.+)>$/) ?? [null, "", remetente()];
      const r = await fetch(`${process.env.MAILPIT_URL.replace(/\/$/, "")}/api/v1/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          From: { Email: endereco, Name: nome },
          To: [{ Email: email.para }],
          Subject: email.assunto,
          HTML: email.html,
          Text: email.texto,
        }),
        signal: AbortSignal.timeout(5_000),
      });
      return r.ok;
    }
    console.warn(`email: nenhum envio configurado; "${email.assunto}" não saiu`);
    return false;
  } catch (e) {
    console.error("email: falha no envio", e instanceof Error ? e.name : e);
    return false;
  }
}
