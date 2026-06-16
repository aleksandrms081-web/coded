# FAQ

### Is Perk Wallet custodial?
No. Wallets are generated client-side and the server never receives private keys or seed phrases. It only stores public profile data and time-lock **ciphertext**.

### Can the server operator open my time-lock vault early?
No. Decryption requires a drand signature for a future round that does not exist yet. Not even the operator can produce it early.

### What happens if I lose my ciphertext?
The secret is gone. Encourage users to download/back up their vault files. PerkLock can export a vault as a file or shareable link.

### What chains are supported?
Any EVM chain for the wallet/balance/ENS features — set `VITE_DEFAULT_CHAIN_ID` and `VITE_RPC_URL`. The time-lock feature is chain-agnostic; it relies on drand, not a blockchain.

### Is PerkLock compatible with drand's tlock?
Yes. Ciphertexts use the age-armored `tlock` format and can be decrypted with the Go [`tlock`](https://github.com/drand/tlock) CLI after unlock time.

### How long can I lock something for?
From minutes to many years. For very long locks, keep your own copy of the drand chain public key (see [security.md](security.md)).

### Can I use my own database?
Yes. The data store is an interface; the default is a JSON file. Swap in SQLite/Postgres by implementing the repository (see `server/src/db.ts`).

### Do users need MetaMask?
No — they can create a fresh in-app wallet. MetaMask / injected wallets are supported for users who already have one.
