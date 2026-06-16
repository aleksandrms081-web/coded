# Installation

## Prerequisites

- **Node.js 18+** and **npm 9+** — check with `node -v` and `npm -v`
- Git
- (Optional) Docker & Docker Compose for containerized runs

## 1. Clone the repository

```bash
git clone https://github.com/<your-org>/perk-wallet.git
cd perk-wallet
```

## 2. Install dependencies

Perk Wallet is an **npm workspaces monorepo**, so a single install wires up all three packages:

```bash
npm install
```

## 3. Configure the environment

```bash
cp .env.example .env
```

The defaults work out of the box for local development. See [configuration.md](configuration.md) for every variable.

## 4. Run in development

```bash
npm run dev
```

This builds the PerkLock library, then starts the API and the frontend together:

| Service  | URL                     |
|----------|-------------------------|
| Frontend | http://localhost:5173   |
| API      | http://localhost:8080   |

You can also run them separately:

```bash
npm run dev:api   # Express API only
npm run dev:web   # Vite frontend only
```

## 5. Build for production

```bash
npm run build
```

Outputs:

- `frontend/dist` — static SPA assets
- `server/dist` — compiled API
- `packages/perklock/dist` — compiled library

To serve a production build locally:

```bash
npm start   # runs the API which can also serve the built frontend
```

## Workspace layout

```
perk-wallet/
├── packages/perklock/   # time-lock library (build first)
├── server/              # Express API
├── frontend/            # React + Vite SPA
├── deploy/              # Docker + nginx
└── docs/                # you are here
```

Next: [Deployment →](deployment.md)
