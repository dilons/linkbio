// F10 Criador exclui a conta (S13). A troca de endereço ainda não foi construída.
import { ASAAS, capturar, contaPronta, emailPara, entrar, entrarNoPainel, expect, semViolacoes, sql, test } from "./apoio";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

test.describe("F10 exclui a conta", () => {
  test("F10-H1 excluir: confirmação forte, tudo apagado na hora, email, endereço segurado", async ({ page, request }) => {
    const c = await contaPronta("sai", [["Loja", "https://exemplo.com.br"]]);
    await entrarNoPainel(page, c);
    await page.getByRole("button", { name: "Editar título e bio" }).click();
    await page.getByRole("dialog").locator('input[type="file"]').setInputFiles({ name: "eu.png", mimeType: "image/png", buffer: PNG });
    await expect(page.getByText("Foto salva")).toBeVisible();
    await page.keyboard.press("Escape");
    const [{ avatar_path }] = await sql`select avatar_path from profiles where id = ${c.perfil}`;
    const foto = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatares/${avatar_path}`;
    expect((await fetch(foto)).status).toBe(200);

    await page.goto("/admin/conta");
    await semViolacoes(page, "S13");
    await capturar(page, "S13");
    await page.getByRole("button", { name: "Excluir minha conta" }).click();
    const campo = page.getByLabel(`Para confirmar, digite ${c.username}`);
    await campo.fill("excluir");
    await page.getByRole("button", { name: "Excluir para sempre" }).click();
    await expect(page.getByText(`Digite ${c.username} para confirmar.`)).toBeVisible();
    await capturar(page, "S13-excluir");
    await campo.fill(c.username.toUpperCase());
    await page.getByRole("button", { name: "Excluir para sempre" }).click();
    await page.waitForURL("**/entrar?aviso=conta-excluida");
    await expect(page.getByText("Sua conta foi excluída")).toBeVisible();

    await emailPara(c.email, "foi excluída");
    const [p] = await sql`select account_id, title, avatar_path, deleted_at from profiles where id = ${c.perfil}`;
    expect(p).toMatchObject({ account_id: null, title: null, avatar_path: null });
    expect(p.deleted_at).not.toBeNull();
    expect(await sql`select 1 from links where profile_id = ${c.perfil}`).toHaveLength(0);
    expect((await fetch(foto)).status).toBeGreaterThanOrEqual(400);
    const [pedido] = await sql`select kind, completed_at from data_requests where requester_email = ${c.email}`;
    expect(pedido.kind).toBe("delete");
    expect(pedido.completed_at).not.toBeNull();
    expect((await request.get(`/${c.username}`, { headers: { "user-agent": "WhatsApp/2.23" } })).status()).toBe(404);
    await entrar(page, c.email, c.senha);
    await expect(page.getByText("Email ou senha não conferem.")).toBeVisible();
  });

  test("F10-E1 com o Pro ativo, a assinatura é cancelada no Asaas antes de excluir", async ({ page }) => {
    const c = await contaPronta("prosai");
    await sql`insert into subscriptions (account_id, provider_customer_id, provider_subscription_id, plan, billing_type, status, price_cents, current_period_end)
              values (${c.id}, 'cus_teste', ${`sub_teste_${c.perfil.slice(0, 8)}`}, 'pro', 'pix', 'active', 1900, now() + interval '20 days')`;
    await entrarNoPainel(page, c);
    await page.goto("/admin/conta");
    await page.getByRole("button", { name: "Excluir minha conta" }).click();
    await page.getByLabel(`Para confirmar, digite ${c.username}`).fill(c.username);
    await page.getByRole("button", { name: "Excluir para sempre" }).click();
    await page.waitForURL("**/entrar?aviso=conta-excluida");
    const pedidos: Array<{ metodo: string; caminho: string }> = await (await fetch(`${ASAAS}/__pedidos`)).json();
    expect(pedidos.some((p) => p.metodo === "DELETE" && p.caminho === `/v3/subscriptions/sub_teste_${c.perfil.slice(0, 8)}`)).toBe(true);
  });

  test("F10-E2 Asaas fora do ar com o Pro ativo: a conta não é excluída e a pessoa sabe por quê", async ({ page }) => {
    const c = await contaPronta("presa");
    await sql`insert into subscriptions (account_id, provider_customer_id, provider_subscription_id, plan, billing_type, status, price_cents, current_period_end)
              values (${c.id}, 'cus_teste', ${`sub_falha-simulada-${c.perfil.slice(0, 8)}`}, 'pro', 'pix', 'active', 1900, now() + interval '20 days')`;
    await entrarNoPainel(page, c);
    await page.goto("/admin/conta");
    await page.getByRole("button", { name: "Excluir minha conta" }).click();
    await page.getByLabel(`Para confirmar, digite ${c.username}`).fill(c.username);
    await page.getByRole("button", { name: "Excluir para sempre" }).click();
    await expect(page.getByText("Não deu para cancelar sua assinatura agora, então a conta não foi excluída.")).toBeVisible();
    expect(await sql`select 1 from auth.users where id = ${c.id}`).toHaveLength(1);
  });

  test("F10-E3 recadastro com o mesmo email depois de excluir: conta nova, endereço antigo ainda reservado", async ({ page, request }) => {
    const c = await contaPronta("volta");
    await sql`delete from auth.users where id = ${c.id}`;
    const r = await request.get(`/api/username?u=${c.username}`);
    expect(r.status()).toBe(401); // só logado checa endereço
    await page.goto("/cadastro");
    await page.getByLabel("Email").fill(c.email);
    await page.getByLabel("Senha").fill("senha-nova-123");
    await page.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(page.getByRole("heading", { name: "Confira seu email" })).toBeVisible();
    const link = (await emailPara(c.email, "Confirme seu email")).HTML.match(/href="([^"]*\/auth\/confirm\?[^"]+)"/)![1].replaceAll("&amp;", "&");
    await page.goto(link);
    await page.waitForURL("**/comecar");
    await page.getByLabel("Seu endereço").fill(c.username);
    await expect(page.getByText("Alguém já usa esse endereço")).toBeVisible();
  });
});
