# Environment Configuration Guide

## MongoDB Authentication Fix

**IMPORTANT**: If you encounter MongoDB authentication errors, ensure your environment files have the correct `authSource` parameter.

### Correct Configuration

Your `.env`, `.env.docker`, and `.env.local` files should use:

```bash
# ✅ CORRECT - Use authSource=mjcarros
DATABASE_URL=mongodb://mjcarros:786Password@mongodb:27017/mjcarros?authSource=mjcarros

# For local development
DATABASE_URL=mongodb://mjcarros:786Password@localhost:27017/mjcarros?authSource=mjcarros
```

### Common Error

If you see this error:
```
❌ Error setting up admin: MongoServerError: Authentication failed.
```

It means your environment file has:
```bash
# ❌ WRONG - Don't use authSource=admin
DATABASE_URL=mongodb://mjcarros:786Password@mongodb:27017/mjcarros?authSource=admin
```

### Quick Fix Command

Run this command to fix all environment files at once:
```bash
sed -i.bak 's/authSource=admin/authSource=mjcarros/g' .env .env.docker .env.local
```

## Docker Startup Sequence

Always start MongoDB before Next.js:

```bash
# 1. Start MongoDB first
docker compose -f docker-compose.prod.yml up mongodb -d

# 2. Wait for MongoDB to initialize (optional)
sleep 10

# 3. Start Next.js
docker compose -f docker-compose.prod.yml up nextjs -d
```

## Default Login Credentials

After successful setup:
- **Admin**: `admin@mjcarros.com` / `Admin123!`
- **Test User**: `test@mjcarros.com` / `Test123!`

## Access URLs

- **Public Site**: http://localhost:8080
- **Admin Panel**: http://localhost:8080/admin
- **Sign In**: http://localhost:8080/sign-in

## Troubleshooting

1. **Authentication Failed**: Check `authSource=mjcarros` in environment files
2. **Connection Refused**: Ensure MongoDB container is running first
3. **Build Errors**: Check that all environment variables are properly set
4. **Port Conflicts**: Ensure ports 8080 and 27017 are available

## Sample Data

Use `sample-vehicles.csv` for testing bulk product uploads through the admin panel.
