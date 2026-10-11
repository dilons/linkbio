# Imagem do demo no cluster kamino (namespace `demo`, chamaqui.dilon.me). Não
# é a de produção: a produção vai para a Vercel (replica/backend.md).
#
# As NEXT_PUBLIC_* entram no build (o Next as fixa no código), então a imagem
# vale só para o endereço e a chave publicável com que foi feita:
#
#   docker buildx build --builder default --platform linux/amd64 \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=https://chamaqui.dilon.me \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://chamaqui.dilon.me \
#     --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key do Secret> \
#     -t registry.internal.dilon.me/chamaqui:<commit> --push .
#
# Além do servidor, leva as migrações e o seed (scripts/demo-banco.mjs, que o
# pod roda antes do app) e o Asaas falso dos testes (o pagamento do demo).

FROM node:22-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392 AS build
WORKDIR /app
COPY package.json package-lock.json ./
# sem scripts: o postinstall do supabase (CLI) baixa um binário que a imagem não usa
RUN npm ci --ignore-scripts
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1
RUN test -n "$NEXT_PUBLIC_SUPABASE_URL" && test -n "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
 && npm run build

FROM node:22-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build /app/supabase/migrations ./supabase/migrations
COPY --from=build /app/supabase/seed.sql ./supabase/seed.sql
COPY --from=build /app/scripts/demo-banco.mjs ./scripts/demo-banco.mjs
# o Turbopack embute o `postgres` no bundle do servidor; o script precisa dele
# solto (o pacote não tem dependências)
COPY --from=build /app/node_modules/postgres ./node_modules/postgres
COPY --from=build /app/tests/asaas-falso.mjs ./tests/asaas-falso.mjs
USER node
EXPOSE 3000
CMD ["node", "server.js"]
