# Contributing to Perk Wallet

Thanks for your interest in improving Perk Wallet! 🎉

## Ways to contribute

- 🐛 Report bugs via [issues](../../issues)
- ✨ Propose features (open a discussion or feature-request issue first)
- 📝 Improve docs in `docs/`
- 🔐 Report security issues privately — see [SECURITY.md](SECURITY.md)

## Development setup

```bash
git clone https://github.com/<your-org>/perk-wallet.git
cd perk-wallet
npm install
cp .env.example .env
npm run dev
```

The repo is an npm workspaces monorepo:

- `packages/perklock` — the time-lock library (build it first: `npm run build:perklock`)
- `server` — the Express API
- `frontend` — the React SPA

## Coding standards

- TypeScript everywhere, `strict` mode on.
- Run `npm run format` (Prettier) and `npm run lint` before pushing.
- Keep PRs focused and include a clear description + screenshots for UI changes.
- Add/update tests where it makes sense.

## Commit style

We loosely follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(perklock): add staged unlock schedule
fix(frontend): correct countdown ring rounding
docs: clarify deployment DNS steps
```

## Pull request checklist

- [ ] Code builds (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Docs updated if behavior changed
- [ ] No secrets or `.env` committed

## Code of Conduct

By participating you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).
