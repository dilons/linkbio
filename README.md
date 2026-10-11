# linkbio

Página "link na bio" para criadores e pequenos negócios brasileiros, construída
com o pacote Replica para validar as skills de ponta a ponta, inclusive as
brasileiras (INPI e LGPD).

O app de referência é o Linktree. O clone reproduz funcionalidades e fluxos,
escritos do zero: nada do código, da marca, dos textos ou das imagens do
original.

## Onde está cada coisa

- `replica/`: os arquivos de planejamento das skills (recon, arquitetura,
  design, testes, marca, LGPD...). Nunca vão para produção.
- `.claude/skills/`: as 13 skills do Replica, copiadas de
  [dilons/random](https://github.com/dilons/random) (`replica-skill/` e
  `replica-br/`), para qualquer sessão do Claude Code neste repositório.

## Rodar

Precisa de Node 22 e Docker (para o Supabase local).

```bash
npm install
npm run db:start     # Supabase local: Postgres, Auth, Storage, API e Mailpit
npm run db:reset     # migrações de supabase/migrations + supabase/seed.sql
cp .env.example .env.local   # preencha com o que o db:start imprimiu
npm run dev          # http://localhost:3000
```

Conta demo: `demo@linkbio.test` / `linkbio-demo-2026`, página em
`/doces.da.ana`. Os emails do desenvolvimento (confirmação, senha nova,
cobrança) chegam no Mailpit: http://127.0.0.1:54324. `/design` mostra o design
system.

Outros comandos:

```bash
npm run typecheck && npm run lint && npm run build
npm run tokens       # depois de mudar replica/design/tokens.json
npm run db:types     # depois de uma migração nova: regera src/lib/db/schema.ts
npm run test:backend # 37 testes do backend contra o banco local
```

Testes de ponta a ponta (Playwright, um arquivo por fluxo em `e2e/`). O
Playwright sobe o app em produção e o Asaas falso sozinho:

```bash
npm run build
npm run test:e2e     # 87 casos; plano e resultados em replica/test-plan.md
# CHROMIUM_PATH=... se o Chromium do Playwright não estiver baixado
```

Bugs achados e corrigidos: `replica/bugs.md`.

O que precisa de conta e chave sua (Supabase, Resend, Asaas, Google, Vercel)
está em `replica/backend.md`, passo a passo.

Next.js 16 (App Router, Cache Components), React 19, Tailwind 4, TypeScript,
Supabase, Drizzle. O `AGENTS.md` aponta para a documentação do Next que vem em
`node_modules/next/dist/docs/`: esta versão mudou APIs, então leia lá antes de
escrever código.

## Andamento

| skill | estado |
| --- | --- |
| `/replica-recon` | feito: `replica/recon.md`, `replica/features.csv` (faltam screenshots) |
| `/replica-architect` | feito: `replica/architecture.md`, `replica/schema.sql` (testado no PGlite) |
| `/replica-design` | feito: `replica/design/` (tokens, componentes, contraste 0 falhas, capturas) e a rota `/design` |
| `/replica-build` | fatia vertical e as lacunas da paridade feitas (temas, formulário de email, audiência e CSV, redes sociais, prévia no celular, excluir só a página): 6 telas feitas e 8 parciais de 19; `replica/build-log.md`, `replica/clone-screens/` |
| `/replica-backend` | feito: Supabase (banco, login, Storage), Asaas, emails, jobs, limites; `replica/backend.md` |
| `/replica-lgpd` | |
| `/replica-test` | feito: 87 casos de ponta a ponta + 37 do backend (com os da segunda `/replica-build`), 11 bugs (1 S1 e 7 S3 corrigidos); `replica/test-plan.md`, `replica/bugs.md` |
| `/replica-diff` | feito e atualizado: funcionalidades 64,2/100 (era 48,9), must-haves 17 de 18 (falta validar o Asaas no sandbox); layout contra o original sem medir (rede bloqueia linktr.ee); `replica/parity.md` |
| `/replica-entrepreneur` | mock: coleta pronta (`scripts/coletar_avaliacoes.py`, `replica/coleta.md`, `replica/temas.json`) e o caminho inteiro testado com 60 avaliações fictícias em `replica/mock/`; falta trazer as reais (a rede daqui bloqueia as fontes) |
| `/replica-brand` | |
| `/replica-inpi` | |
| `/replica-launch` | |
| `/replica-deploy` | |
