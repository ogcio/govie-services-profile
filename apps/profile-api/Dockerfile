FROM node:22-alpine AS base-deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat pnpm
# Add non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -G nodejs

FROM base-deps AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY apps/profile-api/package*.json ./apps/profile-api/
RUN pnpm i --frozen-lockfile

FROM deps AS builder
WORKDIR /app

COPY apps/profile-api/src ./apps/profile-api/src
RUN pnpm --filter profile-api build

FROM base-deps AS assembler
WORKDIR /app

ARG PORT

ENV NODE_ENV=production
ENV LOG_LEVEL=INFO
ENV PORT=$PORT

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/apps/profile-api/dist ./apps/profile-api/dist
COPY --from=builder /app/apps/profile-api/node_modules ./apps/profile-api/node_modules
COPY --from=builder /app/apps/profile-api/package*.json ./apps/profile-api/

RUN pnpm prune --prod

FROM base-deps AS runner

ENV NODE_ENV=production
ENV LOG_LEVEL=trace

COPY --from=assembler /app /app

EXPOSE ${PORT}

WORKDIR /app/apps/profile-api

CMD [ "node", "dist/", "index.js" ]
