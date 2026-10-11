import { verificarUsername } from "@/lib/data/perfis";

// Checagem do endereço enquanto a pessoa digita (S03). Não diz de quem é.
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get("u") ?? "";
  return Response.json(await verificarUsername(u.slice(0, 60)), { headers: { "cache-control": "no-store" } });
}
