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

```bash
npm install
npm run dev          # http://localhost:3000/design mostra o design system
npm run tokens       # depois de mudar replica/design/tokens.json
npm run typecheck && npm run lint && npm run build
```

Next.js 16 (App Router), React 19, Tailwind 4, TypeScript. O `AGENTS.md` aponta
para a documentação do Next que vem em `node_modules/next/dist/docs/`: esta
versão mudou APIs, então leia lá antes de escrever código.

## Andamento

| skill | estado |
| --- | --- |
| `/replica-recon` | feito: `replica/recon.md`, `replica/features.csv` (faltam screenshots) |
| `/replica-architect` | feito: `replica/architecture.md`, `replica/schema.sql` (testado no PGlite) |
| `/replica-design` | feito: `replica/design/` (tokens, componentes, contraste 0 falhas, capturas) e a rota `/design` |
| `/replica-build` | próximo |
| `/replica-backend` | |
| `/replica-lgpd` | |
| `/replica-test` | |
| `/replica-diff` | |
| `/replica-entrepreneur` | |
| `/replica-brand` | |
| `/replica-inpi` | |
| `/replica-launch` | |
| `/replica-deploy` | |
