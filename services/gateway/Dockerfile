FROM node:20-alpine AS base

RUN npm install -g pnpm

FROM base AS dependencies

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/shared/package.json ./services/shared/
COPY services/gateway/package.json ./services/gateway/

RUN pnpm install --frozen-lockfile

FROM base AS build

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/services/shared/node_modules ./services/shared/node_modules
COPY --from=dependencies /app/services/gateway/node_modules ./services/gateway/node_modules

COPY tsconfig.json ./
COPY services/shared ./services/shared
COPY services/gateway ./services/gateway

RUN pnpm --filter @wallme/shared build
RUN pnpm --filter @wallme/gateway build

FROM base AS runtime

WORKDIR /app

COPY --from=build /app/services/shared/dist ./services/shared/dist
COPY --from=build /app/services/shared/package.json ./services/shared/
COPY --from=build /app/services/gateway/dist ./services/gateway/dist
COPY --from=build /app/services/gateway/package.json ./services/gateway/

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/services/shared/node_modules ./services/shared/node_modules
COPY --from=dependencies /app/services/gateway/node_modules ./services/gateway/node_modules

WORKDIR /app/services/gateway

EXPOSE 3000

CMD ["node", "dist/index.js"]