import { defineConfig } from "@playwright/test";

// Testes de ponta a ponta do Chamaqui (replica/test-plan.md). Rodam contra o
// build de produção local e o Supabase local:
//   npm run db:start && npm run db:reset && npm run build && npm run test:e2e
try {
  process.loadEnvFile(".env.local");
} catch {
  // sem .env.local, valem as variáveis do ambiente
}

const BASE = process.env.E2E_BASE ?? "http://localhost:3123";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/preparar.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 3,
  reporter: [["list"], ["json", { outputFile: "test-results/resultado.json" }]],
  use: {
    baseURL: BASE,
    // a largura das capturas de referência (replica/clone-screens, 1440 e 390)
    viewport: { width: 1440, height: 900 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    // o Chromium headless se apresenta como robô e não seria contado nas visitas
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    { command: "node tests/asaas-falso.mjs 4010", url: "http://127.0.0.1:4010/__pedidos", reuseExistingServer: true },
    { command: "npx next start -p 3123", url: BASE, reuseExistingServer: true, timeout: 60_000 },
  ],
});
