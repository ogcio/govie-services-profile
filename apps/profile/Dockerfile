FROM base-deps AS profile-base-deps

RUN apk add --no-cache pnpm

FROM profile-base-deps AS deps

WORKDIR /app
ENV LOG_LEVEL=trace

COPY package.json pnpm-*.yaml /app/
COPY apps/profile/package*.json /app/apps/profile/

RUN pnpm i --frozen-lockfile

COPY ./apps/profile/ /app/apps/profile/

FROM deps AS builder
WORKDIR /app

ARG NEXT_PUBLIC_PROFILE_SERVICE_ENTRY_POINT

ENV NODE_ENV=production
ENV LOG_LEVEL=trace
ENV NEXT_PUBLIC_PROFILE_SERVICE_ENTRY_POINT=$NEXT_PUBLIC_PROFILE_SERVICE_ENTRY_POINT

RUN pnpm build:www

FROM profile-base-deps AS runner

WORKDIR /app

ENV LOG_LEVEL=trace
ENV NODE_ENV=production

COPY --from=builder /app/apps/profile/.next/standalone ./
COPY --from=builder /app/apps/profile/.next/static ./apps/profile/.next/static
COPY --from=deps /app/node_modules/ /app/node_modules/

EXPOSE 3003

ENV PORT=3003

CMD [ "node", "apps/profile/server.js" ]
