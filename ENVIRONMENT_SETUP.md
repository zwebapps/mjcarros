# Environment Configuration Guide

## Secrets

**Never commit real passwords or API keys.** Copy `.env.example` to `.env` (or `.env.local`) and fill in values locally. In production, inject secrets via your host (Docker secrets, Kubernetes secrets, CI variables, etc.).

## MongoDB connection

Use either a full `DATABASE_URL` **or** discrete variables (`MONGO_PASSWORD`, `MONGO_USERNAME`, `MONGO_HOST`, `MONGO_DATABASE`, `MONGO_AUTH_SOURCE`). The app does not ship with default database passwords.

Example shape (replace `YOUR_*` placeholders):

```bash
DATABASE_URL=mongodb://YOUR_USER:YOUR_PASSWORD@mongodb:27017/mjcarros?authSource=mjcarros
```

For local development against Docker, point the host at `localhost` if the app runs on the host (not inside the Compose network).

### Authentication errors

If you see `MongoServerError: Authentication failed`, check that:

- The user and password match the user created in MongoDB.
- `authSource` matches where that user was defined (often the database name or `admin`).

### Docker startup sequence

Start MongoDB before the app:

```bash
docker compose -f docker-compose.prod.yml up mongodb -d
sleep 10
docker compose -f docker-compose.prod.yml up nextjs -d
```

Ensure `.env` (or env file loaded by Compose) defines `MONGO_ROOT_*`, `MONGO_PASSWORD`, `ADMIN_PASSWORD`, and other required variables with **no committed defaults** for secrets.

## Admin and optional test user

- Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` for `npm run setup-admin`.
- A test user is created only if `TEST_USER_PASSWORD` is set (optional; omit in production).

## Access URLs (local Compose)

- Public: http://localhost:8080  
- Admin: http://localhost:8080/admin  

## PayPal

Set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENV`, and `NEXT_PUBLIC_PAYPAL_CLIENT_ID` in your environment. See PayPal Developer docs for sandbox vs live.

## Sample data

Use `sample-vehicles.csv` for bulk upload tests in admin.
