FROM node:20-alpine AS base

RUN npm install -g pnpm

FROM base AS dependencies

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/shared/package.json ./services/shared/
COPY services/auth-service/package.json ./services/auth-service/

RUN pnpm install --frozen-lockfile

FROM base AS build

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/services/shared/node_modules ./services/shared/node_modules
COPY --from=dependencies /app/services/auth-service/node_modules ./services/auth-service/node_modules

COPY tsconfig.json ./
COPY services/shared ./services/shared
COPY services/auth-service ./services/auth-service

RUN pnpm --filter @wallme/shared build
RUN pnpm --filter @wallme/auth-service build

FROM base AS runtime

WORKDIR /app

COPY --from=build /app/services/shared/dist ./services/shared/dist
COPY --from=build /app/services/shared/package.json ./services/shared/
COPY --from=build /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=build /app/services/auth-service/package.json ./services/auth-service/

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/services/shared/node_modules ./services/shared/node_modules
COPY --from=dependencies /app/services/auth-service/node_modules ./services/auth-service/node_modules

WORKDIR /app/services/auth-service

EXPOSE 3001

CMD ["node", "dist/index.js"]