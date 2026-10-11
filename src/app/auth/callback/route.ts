import { redirect } from "next/navigation";
import { trocarCodigo } from "@/lib/data/auth";

// A volta do login com Google: troca o código pela sessão e vai ao painel.
export async function GET(req: Request) {
  const codigo = new URL(req.url).searchParams.get("code");
  const r = codigo ? await trocarCodigo(codigo) : { ok: false };
  redirect(r.ok ? "/admin" : "/entrar?aviso=google");
}
