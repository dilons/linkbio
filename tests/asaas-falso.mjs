// Um Asaas de mentira para testes locais (o sandbox de verdade precisa da
// conta e da chave do dono do produto). Responde só às rotas que o app usa,
// no formato da documentação da API v3, e recusa pedido sem access_token ou
// sem campo obrigatório. Uso: node tests/asaas-falso.mjs [porta]
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const porta = Number(process.argv[2] ?? 4010);
const chave = process.env.ASAAS_API_KEY ?? "chave-do-asaas-falso";
const clientes = new Map();
const assinaturas = new Map();
const pedidos = [];

function responder(res, status, corpo) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(corpo));
}

createServer(async (req, res) => {
  let texto = "";
  for await (const parte of req) texto += parte;
  const corpo = texto ? JSON.parse(texto) : undefined;
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/__pedidos") return responder(res, 200, pedidos);
  // a página de fatura é pública, como a do Asaas
  if (req.method === "GET" && (url.pathname.startsWith("/i/") || url.pathname === "/favicon.ico")) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end("<!doctype html><title>Fatura (Asaas falso)</title><h1>Fatura de teste</h1>");
  }
  pedidos.push({ metodo: req.method, caminho: url.pathname, corpo, userAgent: req.headers["user-agent"] });
  if (req.headers.access_token !== chave) return responder(res, 401, { errors: [{ code: "invalid_access_token" }] });
  // Asaas fora do ar, para os testes: nome de cliente ou id de assinatura com "falha-simulada"
  if (JSON.stringify(corpo ?? "").includes("falha-simulada") || url.pathname.includes("falha-simulada")) {
    return responder(res, 503, { errors: [{ code: "service_unavailable" }] });
  }

  if (req.method === "POST" && url.pathname === "/v3/customers") {
    if (!corpo?.name || !corpo?.cpfCnpj) return responder(res, 400, { errors: [{ code: "invalid_object", description: "name e cpfCnpj" }] });
    const id = `cus_${randomUUID().slice(0, 12)}`;
    clientes.set(id, corpo);
    return responder(res, 200, { id, ...corpo });
  }
  if (req.method === "POST" && url.pathname === "/v3/subscriptions") {
    for (const c of ["customer", "billingType", "value", "nextDueDate", "cycle"]) {
      if (corpo?.[c] === undefined) return responder(res, 400, { errors: [{ code: "invalid_object", description: c }] });
    }
    if (!clientes.has(corpo.customer)) return responder(res, 400, { errors: [{ code: "invalid_customer" }] });
    const id = `sub_${randomUUID().slice(0, 12)}`;
    const cobranca = {
      id: `pay_${randomUUID().slice(0, 12)}`,
      status: "PENDING",
      dueDate: corpo.nextDueDate,
      value: corpo.value,
      subscription: id,
      invoiceUrl: `http://127.0.0.1:${porta}/i/${id}`,
    };
    assinaturas.set(id, { ...corpo, id, status: "ACTIVE", cobrancas: [cobranca] });
    return responder(res, 200, { id, status: "ACTIVE" });
  }
  const m = url.pathname.match(/^\/v3\/subscriptions\/([^/]+)(\/payments)?$/);
  if (m && assinaturas.has(m[1])) {
    const a = assinaturas.get(m[1]);
    if (req.method === "GET" && m[2]) return responder(res, 200, { object: "list", hasMore: false, totalCount: a.cobrancas.length, data: a.cobrancas });
    if (req.method === "DELETE" && !m[2]) {
      assinaturas.delete(m[1]);
      return responder(res, 200, { deleted: true, id: m[1] });
    }
  }
  responder(res, 404, { errors: [{ code: "not_found" }] });
}).listen(porta, "127.0.0.1", () => console.log(`Asaas falso em http://127.0.0.1:${porta}/v3`));
