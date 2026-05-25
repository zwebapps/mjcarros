# Environment Setup Guide

## Required variables (`.env` / `.env.local`)

### PostgreSQL (primary database)

```bash
# Mongo (legacy scripts / one-time migration)
DATABASE_URL=mongodb://USER:PASSWORD@127.0.0.1:27017/YOUR_DB?authSource=YOUR_DB

# Postgres (Prisma) — use 5433 on Mac if local Postgres already uses 5432
POSTGRES_PRISMA_URL=postgresql://postgres:postgres@127.0.0.1:5433/mjcarros?schema=public
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mjcarros
POSTGRES_PORT=5433
```

**Docker Compose** (app container): host is `db`, not `localhost`:

```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db:5432/mjcarros?schema=public"
```

After changing the schema:

```bash
npm run db:deploy     # apply committed migrations
npm run db:generate   # regenerate Prisma client (run locally if IDE hangs)
```

If Prisma CLI hangs on **"warming up"**, see [docs/PRISMA-SETUP.md](docs/PRISMA-SETUP.md).

### Admin bootstrap (not public signup)

```bash
ADMIN_EMAIL=admin@mjcarros.pt
ADMIN_PASSWORD=change-me-after-first-login
ADMIN_NAME=MJ Carros Admin
```

On container start, `npm run setup-admin` upserts the admin user and seeds default categories/products.

### JWT

```bash
JWT_SECRET="your-super-secure-jwt-secret-key-here"
```

Generate:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### App

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Stripe / PayPal / Email

See existing `.env.example` for `STRIPE_*`, `PAYPAL_*`, `EMAIL_*`.

---

## Migrating existing MongoDB data (one-time)

On staging first, then production during a maintenance window:

```bash
# Source Mongo (production backup URI)
export MONGODB_URI="mongodb://user:pass@host:27017/mjcarros?authSource=admin"
export MONGO_DATABASE=mjcarros

# Target Postgres
export DATABASE_URL="postgresql://user:pass@host:5432/mjcarros?schema=public"

npm run db:migrate          # ensure Postgres schema exists
npm run migrate:mongo-to-postgres

# Dry run (counts only)
DRY_RUN=1 npm run migrate:mongo-to-postgres
```

Compare row counts and spot-check products/orders/users before cutover.

---

## Docker production (IONOS / VPS)

```bash
docker compose -f docker-compose.prod.yml up -d
# or
docker compose -f docker-compose.ionos.yml up -d --build
```

Stack: **Postgres 16** + **Next.js** + persistent `./public/uploads` (or named volume on IONOS file).

GitHub Actions builds the image on CI and loads it on the VPS (`deploy-ionos.yml`).

---

## Legacy Mongo variables

`MONGO_*` is only needed for `npm run migrate:mongo-to-postgres`. Remove from production `.env` after migration.

---

## Security notes

1. Never commit `.env` / `.env.local`
2. Change `ADMIN_PASSWORD` after first login
3. Signup creates `USER` role only; admin email is reserved via `ADMIN_EMAIL`
