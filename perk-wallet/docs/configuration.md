# Configuration

All configuration is via environment variables. Copy `.env.example` to `.env` and edit.

## Shared / deployment

| Variable | Default | Description |
|----------|---------|-------------|
| `PUBLIC_DOMAIN` | `perkwallet.example.com` | Domain you deploy to; used by nginx + HTTPS. |
| `LETSENCRYPT_EMAIL` | — | Email for Let's Encrypt certificate registration. |

## Frontend (Vite — must be prefixed `VITE_`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Where the SPA reaches the API. |
| `VITE_DEFAULT_CHAIN_ID` | `11155111` | EVM chain id (1 = mainnet, 11155111 = Sepolia). |
| `VITE_RPC_URL` | `https://rpc.sepolia.org` | JSON-RPC for balance/ENS reads. |
| `VITE_APP_NAME` | `Perk Wallet` | Branding shown in the UI. |

## Backend (server)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | API listen port. |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins. |
| `JWT_SECRET` | — | **Required.** Long random string for signing sessions. |
| `SIWE_DOMAIN` | `localhost` | Domain bound into SIWE messages (set to `PUBLIC_DOMAIN` in prod). |
| `DATA_DIR` | `./data` | Where the JSON/SQLite store lives. |

## PerkLock (time-lock)

| Variable | Default | Description |
|----------|---------|-------------|
| `PERKLOCK_DRAND_NETWORK` | `mainnet` | `mainnet` (quicknet, required for timelock) or `testnet`. |
| `PERKLOCK_DRAND_URLS` | `https://api.drand.sh,https://drand.cloudflare.com` | drand HTTP relays (comma separated). |

## Generating a strong JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
