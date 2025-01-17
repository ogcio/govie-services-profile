FROM base-deps AS profile-api-base-deps

RUN apk add --no-cache pnpm
# Add non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -G nodejs

FROM profile-api-base-deps AS deps

WORKDIR /app

COPY package.json pnpm-*.yaml /app/
COPY apps/profile-api/package*.json /app/apps/profile-api/

RUN pnpm i --frozen-lockfile

FROM deps AS builder
WORKDIR /app

COPY --from=deps --chown=node:node /app/apps/profile-api/node_modules /app/apps/profile-api/node_modules
COPY --from=deps --chown=node:node /app/node_modules /app/node_modules
COPY apps/profile-api/src /app/apps/profile-api/src
COPY apps/profile-api/tsconfig* /app/apps/profile-api/

RUN pnpm build:api

FROM profile-api-base-deps AS assembler
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

FROM profile-api-base-deps AS runner

ENV NODE_ENV=production
ENV LOG_LEVEL=trace

COPY --from=assembler /app /app

EXPOSE ${PORT}

WORKDIR /app/apps/profile-api

CMD [ "node", "dist/", "index.js" ]
