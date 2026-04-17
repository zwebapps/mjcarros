# Deploy on IONOS (VPS) with GitHub Actions

This app runs in **Docker**. **MongoDB** and **uploaded files** (`public/uploads` → `/uploads/...`) are stored in **named volumes** so they survive `git pull`, image rebuilds, and redeploys.

## 1. IONOS server

Use an **IONOS Cloud Server / VPS** (or similar) with a public IP. Install **Docker Engine** and the **Compose plugin** (v2).

## 2. One-time server setup

```bash
# Example install path
sudo mkdir -p /opt/mjcarros-ecommerce
sudo chown "$USER":"$USER" /opt/mjcarros-ecommerce
cd /opt/mjcarros-ecommerce

git clone <YOUR_REPO_URL> .
cp .env.example .env
# Edit .env: Mongo, JWT_SECRET, NEXT_PUBLIC_APP_URL (https://your-domain), payments, email, etc.
```

Ensure `.env` includes strong passwords and `NEXT_PUBLIC_APP_URL` pointing at your real HTTPS URL.

Start the stack:

```bash
docker compose -f docker-compose.ionos.yml up -d --build
```

- **`mongodb_data`** volume: database files.
- **`uploads_data`** volume: user images under `/app/public/uploads` in the container (served as `/uploads/...`).

To inspect volumes:

```bash
docker volume ls | grep mjcarros
```

## 3. HTTPS (recommended)

Point DNS for your domain to the server IP. Use **Certbot** (Let’s Encrypt) or IONOS certificates, then put **nginx** (or Caddy) in front of the app. See `deploy/nginx-ionos.conf.example` — it proxies to `127.0.0.1:8080`, which matches `IONOS_HTTP_PORT` default in `docker-compose.ionos.yml`.

## 4. GitHub Actions pipeline

Repository **Secrets** (Settings → Secrets and variables → Actions):

| Name           | Example        |
|----------------|----------------|
| `VPS_HOST`     | `123.45.67.89` |
| `VPS_USER`     | `deploy`       |
| `VPS_SSH_KEY`  | Private SSH key (full PEM) |

Repository **Variables** (same settings page, “Variables” tab):

| Name            | Example                  |
|-----------------|--------------------------|
| `IONOS_APP_DIR` | `/opt/mjcarros-ecommerce` |

**Required:** If `IONOS_APP_DIR` is not set, the workflow is skipped.

On each push to `main`, the workflow SSHs into the server, `git pull`, and runs:

`docker compose -f docker-compose.ionos.yml up -d --build`

Uploads and Mongo data stay in Docker volumes; only the app image rebuilds.

## 5. Backups

- **MongoDB:** schedule `mongodump` (host can run a cron job with `docker exec mjcarros-mongodb ...` or backup the `mongodb_data` volume path under `/var/lib/docker/volumes/`.
- **Uploads:** backup the `uploads_data` volume the same way, or `docker run --rm -v uploads_data:/data alpine tar czf - /data` (volume name is prefixed by project name; use `docker volume ls`).

## 6. Notes

- Do not commit `.env`. Keep secrets only on the server and in GitHub Secrets where relevant.
- If you previously used a **bind mount** `./public/uploads`, migrate files into the named volume once (copy into the running container’s `/app/public/uploads` or `docker cp`).
