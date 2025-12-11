FROM node:20-alpine AS base

RUN npm install -g pnpm

FROM base AS dependencies

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/shared/package.json ./services/shared/
COPY services/post-service/package.json ./services/post-service/

RUN pnpm install --frozen-lockfile

FROM base AS build

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/services/shared/node_modules ./services/shared/node_modules
COPY --from=dependencies /app/services/post-service/node_modules ./services/post-service/node_modules

COPY tsconfig.json ./
COPY services/shared ./services/shared
COPY services/post-service ./services/post-service

RUN pnpm --filter @wallme/shared build
RUN pnpm --filter @wallme/post-service build

FROM base AS runtime

WORKDIR /app

COPY --from=build /app/services/shared/dist ./services/shared/dist
COPY --from=build /app/services/shared/package.json ./services/shared/
COPY --from=build /app/services/post-service/dist ./services/post-service/dist
COPY --from=build /app/services/post-service/package.json ./services/post-service/

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/services/shared/node_modules ./services/shared/node_modules
COPY --from=dependencies /app/services/post-service/node_modules ./services/post-service/node_modules

WORKDIR /app/services/post-service

EXPOSE 3002

CMD ["node", "dist/index.js"]