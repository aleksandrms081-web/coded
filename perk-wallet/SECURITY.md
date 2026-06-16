# Security Policy

## Reporting a vulnerability

**Please do not open public issues for security vulnerabilities.**

Email the maintainers at `security@your-domain` (replace with your address) with:

- A description of the issue and its impact
- Steps to reproduce / proof of concept
- Affected versions or commit hashes

You will receive an acknowledgement within 72 hours and a remediation timeline.

## Scope & threat model

Perk Wallet is **non-custodial**. Private keys and seed phrases are generated and held client-side. Key areas:

- **PerkLock vaults** rely on the [drand](https://drand.love) network for time-lock guarantees. A vault cannot be opened before its round is reached, including by the server operator.
- The server stores **ciphertexts only** — never plaintext secrets and never private keys.
- Authentication uses Sign-In-With-Ethereum (EIP-4361); sessions are short-lived JWTs.

See [docs/security.md](docs/security.md) for the full threat model and hardening checklist.

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅        |
