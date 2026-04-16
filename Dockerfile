# Base stage
FROM node:18-bullseye AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the app (no real DB in image build context; route modules still import `getMongoDbUri()`)
RUN SKIP_DB_ENV_VALIDATION=1 npm run build

# Runner stage
FROM node:18-bullseye AS runner
WORKDIR /app

# Install basic dependencies (skip Chrome for now to avoid build issues)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy built app (Next reads `next.config.js` at runtime for headers, images, etc.)
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/next.config.js ./next.config.js
COPY --from=base /app/scripts ./scripts
COPY --from=base /app/lib ./lib
COPY --from=base /app/data ./data

EXPOSE 3000

CMD ["npm", "start"]