# Security & Threat Model

Perk Wallet is built around one principle: **the backend should never be able to steal funds or open a vault early.**

## What lives where

| Data | Location | Notes |
|------|----------|-------|
| Private keys / seed phrases | Browser only | Encrypted at rest with a user passphrase before touching storage. |
| Time-lock plaintext | Browser only | Encrypted via PerkLock before leaving the device. |
| Vault ciphertext | Server | Useless until its drand round. |
| Profile (username, bio, avatar) | Server | Public by design. |
| Session JWT | Browser | Short-lived; signed with `JWT_SECRET`. |

## Threat model

- **Compromised server**: attacker gets ciphertext (locked) + public profiles. Cannot open vaults early, cannot access keys.
- **Compromised drand**: drand is a threshold network (League of Entropy). A minority of malicious nodes cannot forge early signatures. A catastrophic majority compromise could in theory unlock early — mitigated by drand's diverse, independent operators.
- **Malicious client / XSS**: the most dangerous vector for any web wallet. Mitigations below.
- **Phishing**: SIWE messages bind the domain; teach users to verify the domain.

## Hardening checklist for operators

- [ ] Set a strong unique `JWT_SECRET` (48+ random bytes).
- [ ] Serve only over HTTPS (the bundled nginx config does this via Let's Encrypt).
- [ ] Set strict CSP / security headers (sample provided in `deploy/nginx.conf`).
- [ ] Set `SIWE_DOMAIN` to your real domain.
- [ ] Keep dependencies patched (`npm audit`, Dependabot).
- [ ] Back up the data store (profiles + ciphertext) regularly.
- [ ] Consider a Content-Security-Policy that disallows third-party scripts entirely.

## Guidance for users (surface this in your UI)

- Back up your seed phrase offline; Perk Wallet cannot recover it.
- Download/back up vault ciphertext — losing it loses the secret.
- Verify the domain before signing in.
- For multi-decade locks, save the drand chain public key alongside the ciphertext.

## Responsible disclosure

See [SECURITY.md](../SECURITY.md) at the repo root.
