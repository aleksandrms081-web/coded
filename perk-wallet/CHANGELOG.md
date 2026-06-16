# Changelog

All notable changes to Perk Wallet are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - Initial release

### Added
- Non-custodial web3 wallet: in-browser BIP-39 wallet creation, import, and
  MetaMask connect, with encrypted-at-rest keystore.
- **PerkLock** time-lock engine (`@perk-wallet/perklock`) built on drand tlock:
  - Lock keys, seed phrases, addresses, keystores, or messages until an exact
    date/time or relative duration.
  - Pro features: staged/partial unlock via Shamir secret sharing,
    multi-recipient locks, dead-man's-switch heartbeats, re-locking, and
    shareable unlock links.
- On-chain identity: unique `@username`, display name, bio, avatar, and social
  links with a public profile page.
- Sign-In-With-Ethereum authentication and ciphertext-only vault storage.
- Creative glassmorphism UI with animated aurora background and live countdown
  rings.
- Full self-hosting stack: Docker Compose, Caddy auto-HTTPS, nginx config, and
  documentation for host + domain deployment.
- GitHub-ready docs, CI workflow, and issue/PR templates.
