FROM node:20-alpine AS base

RUN npm install -g pnpm

FROM base AS dependencies

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

FROM base AS build

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/web/node_modules ./apps/web/node_modules

COPY apps/web ./apps/web

WORKDIR /app/apps/web

RUN pnpm build

FROM base AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/public ./public
COPY --from=build /app/apps/web/package.json ./package.json
COPY --from=dependencies /app/apps/web/node_modules ./node_modules

EXPOSE 4000

CMD ["pnpm", "start"]