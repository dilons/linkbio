import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { confirmarToken } from "@/lib/data/auth";

const DESTINOS: Partial<Record<EmailOtpType, string>> = {
  email: "/admin", // cadastro confirmado: o painel manda escolher o endereço se ainda não tem
  signup: "/admin",
  recovery: "/entrar/nova-senha",
  email_change: "/admin/conta",
};

// O link dos emails do Supabase Auth (supabase/templates). Usa o token_hash, que
// funciona mesmo abrindo o email em outro aparelho ou navegador.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as EmailOtpType | null;
  const destino = tipo ? DESTINOS[tipo] : undefined;
  if (!token || !destino) redirect("/entrar?aviso=link-invalido");
  const r = await confirmarToken(token, tipo!);
  redirect(r.ok ? destino : "/entrar?aviso=link-invalido");
}
