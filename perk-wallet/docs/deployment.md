# Deployment

This guide walks through deploying **Perk Wallet** to your own host and domain so
you can start onboarding real users. The whole platform (frontend + API) runs
from a single `docker compose up`.

> Perk Wallet is non-custodial. Private keys and seed phrases are generated and
> encrypted **in the browser** and never reach the server. The server only
> stores public profiles and **ciphertext-only** time-lock vaults.

---

## 1. Prerequisites

- A Linux host (DigitalOcean, Hetzner, AWS EC2, or bare metal) with 1 vCPU / 1 GB RAM minimum.
- A domain name pointing at the host's public IP (an `A` record for `app.example.com`).
- [Docker](https://docs.docker.com/engine/install/) and the Docker Compose plugin installed.
- Ports **80** and **443** open in your firewall.

```bash
# quick Docker install (Debian/Ubuntu)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker
```

---

## 2. Clone & configure

```bash
git clone https://github.com/your-org/perk-wallet.git
cd perk-wallet
cp .env.example .env
```

Edit `.env` and set at minimum:

| Variable | Example | Notes |
| --- | --- | --- |
| `PUBLIC_DOMAIN` | `app.example.com` | Your domain, used by nginx + TLS. |
| `LETSENCRYPT_EMAIL` | `you@example.com` | For HTTPS certificate registration. |
| `VITE_API_BASE_URL` | `https://app.example.com` | Public API URL the frontend calls. |
| `JWT_SECRET` | `openssl rand -hex 32` | Sign session tokens. **Change this.** |
| `SIWE_DOMAIN` | `app.example.com` | Must match the domain users sign in from. |
| `CORS_ORIGINS` | `https://app.example.com` | Allowed browser origins. |
| `VITE_RPC_URL` | `https://mainnet.infura.io/v3/<key>` | RPC for balances/ENS. |
| `VITE_DEFAULT_CHAIN_ID` | `1` | `1` mainnet, `11155111` Sepolia. |

Generate a strong secret:

```bash
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
```

---

## 3. Launch with Docker Compose

```bash
docker compose up -d --build
```

This starts three services:

- **web** — the built React frontend (static files).
- **api** — the Express API + vault/profile store.
- **caddy** — reverse proxy that terminates HTTPS and auto-provisions a
  Let's Encrypt certificate for `PUBLIC_DOMAIN`.

Visit `https://app.example.com` — you should see the Perk Wallet landing page
with a valid certificate.

```bash
docker compose logs -f api      # tail API logs
docker compose ps               # service health
docker compose down             # stop everything
```

---

## 4. HTTPS options

The default `docker-compose.yml` uses **Caddy**, which obtains and renews
Let's Encrypt certificates automatically — no manual certbot steps. Just point
your domain at the host and set `PUBLIC_DOMAIN` + `LETSENCRYPT_EMAIL`.

If you prefer **nginx + certbot** instead, a ready-to-use `deploy/nginx.conf`
(with security headers and a hardened CSP) is included:

```bash
# issue a cert once, then mount it into the nginx container
sudo certbot certonly --standalone -d app.example.com
```

See `deploy/nginx.conf` for the full server block.

---

## 5. Persisted data

The API stores profiles and ciphertext vaults under `DATA_DIR` (default
`./data`), mounted as the `perk-data` Docker volume. Back it up regularly:

```bash
docker run --rm -v perk-wallet_perk-data:/data -v $PWD:/backup alpine \
  tar czf /backup/perk-backup-$(date +%F).tar.gz -C /data .
```

Because vaults are ciphertext-only, a backup never exposes user secrets.

---

## 6. Updating

```bash
git pull
docker compose up -d --build
```

---

## 7. Cloud one-liners

**DigitalOcean / Hetzner droplet**

```bash
curl -fsSL https://get.docker.com | sh
git clone https://github.com/your-org/perk-wallet.git && cd perk-wallet
cp .env.example .env && nano .env   # set PUBLIC_DOMAIN, JWT_SECRET, ...
docker compose up -d --build
```

**AWS EC2** — use the same steps on an Amazon Linux 2023 / Ubuntu instance, and
open ports 80/443 in the security group.

---

## 8. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Certificate not issued | Confirm DNS `A` record resolves to the host and ports 80/443 are open. |
| `CORS` errors in console | Add your domain to `CORS_ORIGINS` and rebuild. |
| Sign-in fails | Ensure `SIWE_DOMAIN` matches the domain in the browser address bar. |
| Balances show 0 | Set a working `VITE_RPC_URL` and the correct `VITE_DEFAULT_CHAIN_ID`. |
