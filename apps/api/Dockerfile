# Build from the repository root: docker build -f apps/api/Dockerfile .
FROM node:24-alpine AS base
RUN npm install -g pnpm@12.11.2
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/api-spec/package.json packages/api-spec/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

FROM base AS build
RUN pnpm install --frozen-lockfile --filter "@mockapis/api..."
COPY packages/api-spec packages/api-spec
COPY apps/api apps/api
RUN pnpm --filter @mockapis/api-spec build && pnpm --filter @mockapis/api build

FROM base AS runtime
ENV NODE_ENV=production
RUN pnpm install --frozen-lockfile --prod --filter "@mockapis/api..." && npm uninstall -g pnpm
COPY --from=build /app/packages/api-spec/dist packages/api-spec/dist
COPY --from=build /app/apps/api/dist apps/api/dist
WORKDIR /app/apps/api
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:4000/health > /dev/null || exit 1
CMD ["node", "dist/server.js"]
