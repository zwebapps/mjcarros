# Base stage
FROM node:18-bullseye AS base
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
# Make npm installs resilient to transient network failures in CI.
# Use `npm ci` for deterministic installs (requires package-lock.json).
# `postinstall` runs `prisma generate`, so the schema is copied first.
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm config set fetch-timeout 120000 \
  && npm ci --legacy-peer-deps --no-audit --no-fund

COPY . .

ARG NODE_MAX_OLD_SPACE_SIZE=4096
RUN set -e && \
  echo "=== next build: start ===" && \
  export NODE_OPTIONS="--max-old-space-size=${NODE_MAX_OLD_SPACE_SIZE}" && \
  export SKIP_DB_ENV_VALIDATION=1 && \
  export POSTGRES_PRISMA_URL="${POSTGRES_PRISMA_URL:-postgresql://build:build@127.0.0.1:5432/buildtime?schema=public}" && \
  export JWT_SECRET="${JWT_SECRET:-docker-build-placeholder-not-used-at-runtime}" && \
  export NEXT_TELEMETRY_DISABLED=1 && \
  npm run build && \
  echo "=== next build: done ==="

# Runner stage
FROM node:18-bullseye AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/next.config.js ./next.config.js
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/scripts ./scripts
COPY --from=base /app/lib ./lib
COPY --from=base /app/data ./data

EXPOSE 3000

CMD ["npm", "start"]
