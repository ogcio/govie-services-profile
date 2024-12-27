FROM node:22-alpine AS base-deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

FROM base-deps AS deps

WORKDIR /app/src

COPY ./package*.json /app/
COPY ./tsconfig*.json /app/
COPY ./src/ /app/src/

RUN npm ci


FROM deps AS builder

RUN npm run build


FROM base-deps AS assembler
WORKDIR /app

ARG PORT

ENV NODE_ENV=production
ENV LOG_LEVEL=INFO
ENV PORT=$PORT

COPY --from=builder /app/ /app/

RUN npm prune --omit=dev
RUN rm -rf src

FROM base-deps AS runner

ENV NODE_ENV=production
ENV LOG_LEVEL=trace

COPY --from=assembler /app /app

EXPOSE ${PORT}

WORKDIR /app/

CMD [ "node", "dist/", "index.js" ]
