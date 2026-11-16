FROM node:22-slim AS build
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile --filter @flownote/server... --ignore-scripts
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @flownote/server build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000 NODE_PATH=/app/node_modules/.pnpm/node_modules
COPY --from=build /repo/apps/server/.next/standalone ./
COPY --from=build /repo/apps/server/.next/static ./apps/server/.next/static
COPY --from=build /repo/apps/server/public ./apps/server/public
COPY --from=build /repo/apps/server/db/schema.sql ./apps/server/schema.sql
COPY --from=build /repo/apps/server/scripts/migrate.mjs ./apps/server/migrate.mjs
USER node
EXPOSE 3000
CMD ["sh", "-c", "node apps/server/migrate.mjs && node apps/server/server.js"]
