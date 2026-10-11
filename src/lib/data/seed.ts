import type { PGlite } from "@electric-sql/pglite";
import { createHash } from "node:crypto";
import { hashSenha } from "./senha";

export const DEMO = { email: "demo@linkbio.test", senha: "linkbio-demo-2026", username: "doces.da.ana" };

/** Uma conta de demonstração com página, links, redes e uma semana de visitas. */
export async function semearDemo(db: PGlite): Promise<void> {
  const { rows } = await db.query<{ id: string }>(
    "insert into auth.users (email, password_hash, email_confirmed_at) values ($1, $2, now()) returning id",
    [DEMO.email, await hashSenha(DEMO.senha)],
  );
  const conta = rows[0].id;
  await db.query("insert into accounts (id) values ($1)", [conta]);
  const perfil = await db.query<{ id: string }>(
    `insert into profiles (account_id, username, title, bio)
     values ($1, $2, 'Doces da Ana', 'Confeitaria artesanal em BH. Encomendas pelo link abaixo.') returning id`,
    [conta, DEMO.username],
  );
  const pid = perfil.rows[0].id;
  await db.query("insert into appearances (profile_id, theme) values ($1, 'papel')", [pid]);
  const links = [
    ["Faça sua encomenda", "https://exemplo.com.br/encomendas"],
    ["Cardápio da semana", "https://exemplo.com.br/cardapio"],
    ["Bolos de aniversário", "https://exemplo.com.br/aniversario"],
    ["Onde estamos", "https://exemplo.com.br/endereco"],
  ];
  const ids: string[] = [];
  for (const [i, [titulo, url]] of links.entries()) {
    const r = await db.query<{ id: string }>(
      "insert into links (profile_id, title, url, position) values ($1, $2, $3, $4) returning id",
      [pid, titulo, url, i],
    );
    ids.push(r.rows[0].id);
  }
  for (const [i, [plataforma, url]] of [
    ["instagram", "https://instagram.com/exemplo"],
    ["whatsapp", "https://wa.me/5500000000000"],
    ["tiktok", "https://tiktok.com/@exemplo"],
  ].entries()) {
    await db.query("insert into social_links (profile_id, platform, url, position) values ($1, $2, $3, $4)", [
      pid,
      plataforma,
      url,
      i,
    ]);
  }
  // Uma semana de eventos com números fixos (sem aleatoriedade: telas e testes estáveis).
  const fontes = ["instagram", "instagram", "whatsapp", "direct", "tiktok"];
  for (let d = 0; d < 7; d++) {
    const visitas = 20 + d * 3;
    for (let v = 0; v < visitas; v++) {
      const quando = new Date(Date.now() - d * 86400_000 - v * 600_000).toISOString();
      const hash = createHash("sha256").update(`demo-${d}-${v % 15}`).digest();
      await db.query(
        `insert into events (profile_id, type, occurred_at, visitor_hash, country, source, device)
         values ($1, 'view', $2, $3, 'BR', $4, 'mobile')`,
        [pid, quando, hash, fontes[v % fontes.length]],
      );
      if (v % 2 === 0) {
        await db.query(
          `insert into events (profile_id, link_id, type, occurred_at, visitor_hash, country, source, device)
           values ($1, $2, 'click', $3, $4, 'BR', $5, 'mobile')`,
          [pid, ids[v % 3], quando, hash, fontes[v % fontes.length]],
        );
      }
    }
  }
}
