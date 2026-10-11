import { createHash, timingSafeEqual } from "node:crypto";
import { JOBS, rodarJob, type NomeJob } from "@/lib/jobs";

// O Vercel Cron chama com "Authorization: Bearer <CRON_SECRET>" (vercel.json).
// Sem o segredo certo, ninguém de fora dispara um job.
function autorizado(req: Request): boolean {
  const segredo = process.env.CRON_SECRET;
  const recebido = req.headers.get("authorization");
  if (!segredo || !recebido) return false;
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(recebido), h(`Bearer ${segredo}`));
}

export const maxDuration = 300;

export async function GET(req: Request, ctx: RouteContext<"/api/cron/[job]">) {
  if (!autorizado(req)) return new Response("não autorizado", { status: 401 });
  const { job } = await ctx.params;
  if (!(job in JOBS)) return new Response("job desconhecido", { status: 404 });
  const r = await rodarJob(job as NomeJob);
  return Response.json(r, { status: r.ok ? 200 : 500 });
}
