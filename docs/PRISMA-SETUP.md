# Prisma / Postgres setup (avoid CLI hangs)

If `npx prisma generate` or `migrate diff` hangs on **"warming up"**, it is usually Prisma downloading query engines. Run these **once on your machine** (not in Cursor’s slow sandbox):

```bash
cd /path/to/mjcarros-ecommerce
npm install
npx prisma generate
```

If you see `ERESOLVE` from an old `@typescript-eslint` pin, use `npm install` (project `.npmrc` sets `legacy-peer-deps=true`) — do **not** add a separate `@typescript-eslint/eslint-plugin@6`; `eslint-config-next` already provides v8.

**Stay on Prisma 6** (`6.19.0` in `package.json`). Prisma 7 removes `url` from `schema.prisma` and needs `prisma.config.ts` — not required for this project yet.

Optional (offline / slow network):

```bash
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```

## Local Postgres

```bash
# Start DB only
docker compose up db -d

# In .env.local
POSTGRES_PRISMA_URL=postgresql://postgres:postgres@127.0.0.1:5433/mjcarros?schema=public
POSTGRES_PORT=5433
```

**Mac tip:** If `npm run db:deploy` fails with P1010 on port 5432, another Postgres may be running locally (`lsof -i :5432`). This project maps Docker to **5433** by default.

# Apply schema (pick one)
npm run db:deploy
# or: npm run db:push

npm run setup-admin
npm run dev
```

## Production (IONOS)

Migrations are committed under `prisma/migrations/`. On deploy, the container runs:

`prisma migrate deploy` (fallback: `prisma db push`)

## Mongo → Postgres (one-time)

```bash
export MONGODB_URI="mongodb://..."
export DATABASE_URL="postgresql://..."
npm run db:deploy
npm run migrate:mongo-to-postgres
```

Dry run: `DRY_RUN=1 npm run migrate:mongo-to-postgres`
