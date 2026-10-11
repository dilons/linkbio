// Gera src/app/tokens.css a partir de replica/design/tokens.json.
// Os tokens são a fonte única: a /replica-brand muda o JSON, roda este script
// (npm run tokens) e confere o contraste com o contrast.py.
import { readFileSync, writeFileSync } from "node:fs";

const tokens = JSON.parse(readFileSync("replica/design/tokens.json", "utf8"));
const px = (n) => `${n}px`;
const lines = ["/* Gerado por scripts/tokens.mjs a partir de replica/design/tokens.json. Não edite. */", ""];

lines.push(":root {");
for (const [name, value] of Object.entries(tokens.color)) {
  if (typeof value === "string") lines.push(`  --${name}: ${value};`);
}
lines.push(`  --font-sans-stack: ${tokens.font.sans};`);
for (const [name, value] of Object.entries(tokens.radius)) lines.push(`  --tk-radius-${name}: ${px(value)};`);
for (const [name, value] of Object.entries(tokens.shadow)) lines.push(`  --tk-shadow-${name}: ${value};`);
for (const [name, value] of Object.entries(tokens.motion)) lines.push(`  --motion-${name}: ${value};`);
for (const [name, value] of Object.entries(tokens.layout)) {
  if (typeof value === "number") lines.push(`  --layout-${name}: ${px(value)};`);
}
lines.push("}", "");

// Temas da página pública: o componente aplica data-theme="nome".
for (const [theme, roles] of Object.entries(tokens.color.theme ?? {})) {
  lines.push(`[data-theme="${theme}"] {`);
  for (const [role, value] of Object.entries(roles)) lines.push(`  --t-${role}: ${value};`);
  lines.push("}", "");
}

writeFileSync("src/app/tokens.css", lines.join("\n"));

// As mesmas cores para o que não lê CSS: emails e a página crua de /r/[id].
const cores = Object.fromEntries(Object.entries(tokens.color).filter(([, v]) => typeof v === "string"));
writeFileSync(
  "src/lib/cores.ts",
  `// Gerado por scripts/tokens.mjs a partir de replica/design/tokens.json. Não edite.\nexport const CORES = ${JSON.stringify(cores, null, 2)} as const;\n`,
);
console.log(`tokens.css: ${Object.keys(tokens.color.theme ?? {}).length} temas`);
