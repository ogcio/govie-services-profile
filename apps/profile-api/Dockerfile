FROM node:22-alpine AS base-deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat pnpm
# Add non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -G nodejs

FROM base-deps AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml /app/
COPY apps/profile-api/package*.json /app/apps/profile-api/

RUN pnpm i --frozen-lockfile

FROM deps AS builder
WORKDIR /app

COPY apps/profile-api /app/apps/profile-api
COPY apps/profile-api/node_modules /app/apps/profile-api/node_modules
COPY node_modules /app/node_modules

RUN pnpm --filter "@govie-services/profile-api" run build

FROM base-deps AS assembler
WORKDIR /app

ARG PORT

ENV NODE_ENV=production
ENV LOG_LEVEL=INFO
ENV PORT=$PORT

COPY --from=builder --chown=node:node /app/package.json /app/
COPY --from=builder --chown=node:node /app/apps/profile-api/dist /app/apps/profile-api/dist
COPY --from=builder --chown=node:node /app/apps/profile-api/package*.json /app/apps/profile-api/
COPY --from=builder --chown=node:node /app/apps/profile-api/node_modules /app/apps/profile-api/node_modules
COPY --from=builder --chown=node:node /app/node_modules /app/node_modules

RUN pnpm prune --prod

FROM base-deps AS runner

ENV NODE_ENV=production
ENV LOG_LEVEL=trace

COPY --from=assembler /app /app

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

WORKDIR /app/apps/profile-api

CMD [ "node", "dist/", "index.js" ]
