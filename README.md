# Chamaqui

Página de link na bio para quem vende e atende pelas redes no Brasil: todos os
links, o WhatsApp e um formulário de contato numa página só, com cobrança em
reais. Construída com o pacote Replica para validar as skills de ponta a
ponta, inclusive as brasileiras (INPI e LGPD).

As funcionalidades partem de um app de referência mapeado em
`replica/recon.md`, reescritas do zero: nada do código, da marca, dos textos
ou das imagens dele. Nome e identidade em `replica/brand.md` (Chamaqui é o
nome de trabalho; as buscas de marca ainda precisam ser feitas).

## Onde está cada coisa

- `replica/`: os arquivos de planejamento das skills (recon, arquitetura,
  design, testes, marca, LGPD...). Nunca vão para produção.
- `.claude/skills/`: as 13 skills do Replica, copiadas de
  [dilons/random](https://github.com/dilons/random) (`replica-skill/` e
  `replica-br/`), para qualquer sessão do Claude Code neste repositório.

## Rodar

Precisa de Node 22 (`nvm use` lê o `.nvmrc`), Python 3 e Docker (para o
Supabase local).

```bash
npm install
npx playwright install chromium   # o Chromium da versão fixada, para os testes
npm run db:start     # Supabase local: Postgres, Auth, Storage, API e Mailpit
npm run db:reset     # migrações de supabase/migrations + supabase/seed.sql
cp .env.example .env.local   # preencha com o que o db:start imprimiu
npm run dev          # http://localhost:3000
```

Conta demo: `demo@chamaqui.test` / `chamaqui-demo-2026`, página em
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
| `/replica-diff` | feito e atualizado: funcionalidades 64,2/100 (era 48,9), must-haves 17 de 18 (falta validar o Asaas no sandbox); layout contra o original sem medir (a rede daqui bloqueia o site dele); `replica/parity.md` |
| `/replica-entrepreneur` | feito com dados reais, provisório: 605 avaliações de 2 plataformas (App Store e Hacker News; falta a terceira, que é colada à mão), `replica/feedback.md`, `replica/fixes.md`, 8 correções na `features.csv`. O ângulo do mock (vender no Brasil) não se sustentou; o recomendado é "sem pegadinha no dinheiro" |
| `/replica-brand` | feito: nome de trabalho Chamaqui (buscas de marca a rodar), paleta brasa com 0 falhas AA, briefing do logo, voz e 10 textos reescritos, sweep limpo; `replica/brand.md`, `replica/brand.json`. Checagens de 2026-10-11: conflito para os dois nomes ("ChamaAqui E-commerce" no Brasil; Logali registrada na UE e no registro internacional), domínios exatos ocupados; ver `replica/brand.md` |
| `/replica-inpi` | preparado: classes 9 e 42, 18 termos de busca (som, grafia, sentido e tradução), reserva Logali, checagens e passo a passo do depósito em `replica/inpi.md`; falta você fazer a busca no pePI (a rede daqui bloqueia o INPI) |
| `/replica-launch` | |
| `/replica-deploy` | |
