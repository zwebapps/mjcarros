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

Start the stack (**production uses `docker-compose.prod.yml`** — includes `mongo-init-simple.js` and app startup):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Ensure `public/uploads` exists on the server (bind-mounted for product images).

- **`mjcarros_mongodb_data`** volume: database files (see `docker-compose.prod.yml`).
- Optional: `docker-compose.ionos.yml` uses a named **`uploads_data`** volume instead of a host bind mount if you prefer that layout.

To inspect volumes:

```bash
docker volume ls | grep mjcarros
```

## 3. HTTPS (recommended)

Point DNS for your domain to the server IP. Use **Certbot** (Let’s Encrypt) or IONOS certificates, then put **nginx** (or Caddy) in front of the app. See `deploy/nginx-ionos.conf.example` — it proxies to `127.0.0.1:8080` (prod compose maps **8080:3000**).

## 4. GitHub Actions pipeline

Repository **Secrets** (Settings → Secrets and variables → Actions):

| Name           | Example        |
|----------------|----------------|
| `VPS_HOST`     | `123.45.67.89` |
| `VPS_USER`     | `deploy`       |
| `VPS_SSH_KEY`  | Private SSH key (full PEM) |
| `VPS_SSH_KEY_PASSPHRASE` | Only if that key was created **with** a passphrase; omit for unencrypted deploy keys |

If the workflow log shows `this private key is passphrase protected`, add **`VPS_SSH_KEY_PASSPHRASE`** with the key’s passphrase, **or** generate a **new** deploy key **without** a passphrase (`ssh-keygen -N ""`) and put its private key in `VPS_SSH_KEY` (CI cannot prompt for a passphrase).

**Deploy path** (pick **Variables** or **Secrets** — the workflow reads both):

| Name | Where | Example value |
|------|--------|-----------------|
| `VPS_APP_DIR` **or** `IONOS_APP_DIR` | **Variables** tab *or* **Secrets** tab | `/var/www/mjcarros` |

If you already store `IONOS_APP_DIR` under **Secrets** (with `VPS_HOST`, etc.), you do **not** need to duplicate it as a Variable; the workflow uses `secrets.IONOS_APP_DIR` / `secrets.VPS_APP_DIR` when Variables are empty.

On each push to `main`, the workflow SSHs into the server, `git pull`, and runs:

`docker compose -f docker-compose.prod.yml up -d --build`

Uploads and Mongo data stay in Docker volumes; only the app image rebuilds.

## 5. Backups

- **MongoDB:** schedule `mongodump` (e.g. `docker exec mongodb ...` with prod compose) or backup the `mjcarros_mongodb_data` volume under `/var/lib/docker/volumes/`.
- **Uploads:** backup the `uploads_data` volume the same way, or `docker run --rm -v uploads_data:/data alpine tar czf - /data` (volume name is prefixed by project name; use `docker volume ls`).

## 6. Notes

- Do not commit `.env`. Keep secrets only on the server and in GitHub Secrets where relevant.
- If you previously used a **bind mount** `./public/uploads`, migrate files into the named volume once (copy into the running container’s `/app/public/uploads` or `docker cp`).


## Testing

Use staging credentials only; do not commit `.env`.
