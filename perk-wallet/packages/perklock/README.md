# @perk-wallet/perklock

The exclusive time-lock vault engine that powers Perk Wallet. Lock a private key, seed phrase, wallet address or any secret so it can only be decrypted **after a future moment you choose** — using [drand](https://drand.love) `tlock` timelock encryption.

> Inspired by [drand/timevault](https://github.com/drand/timevault), rebuilt as an independent library with wallet-focused pro features. Ciphertexts are compatible with the Go [`tlock`](https://github.com/drand/tlock) CLI.

## Install

```bash
npm install @perk-wallet/perklock
```

## Basic usage

```ts
import { PerkLock } from "@perk-wallet/perklock"

const lock = await PerkLock.connect() // drand mainnet (quicknet)

const vault = await lock.lock({
  payload: "my seed phrase ...",
  unlockAt: new Date("2030-01-01T00:00:00Z"),
  label: "Cold wallet seed",
  kind: "mnemonic",
})

// store vault.ciphertext anywhere — it is useless until the unlock time

// after the unlock time:
const secret = await lock.unlockText(vault.ciphertext)
```

Lock for a duration instead of a date:

```ts
await lock.lockFor({ payload: secret, duration: "30d" })
```

## Pro features

### Staged / partial unlock (Shamir)
```ts
const shares = await lock.lockShares({
  payload: secret,
  threshold: 2,
  schedule: [fromNow("30d"), fromNow("60d"), fromNow("90d")],
})
// reconstruct once enough shares have unlocked:
const recovered = await lock.unlockShares(shares.slice(0, 2))
```

### Multi-recipient lock
```ts
const vaults = await lock.lockForRecipients({
  payload: secret,
  unlockAt: fromNow("1y"),
  recipients: ["0xAlice...", "0xBob..."],
})
```

### Dead-man's switch (key inheritance)
```ts
let vault = await lock.arm({ payload: secret, interval: "30d" })
// keep calling before it expires; if you stop, it unlocks for your heirs
vault = await lock.heartbeat({ payload: secret, interval: "30d" })
```

### Re-lock & shareable links
```ts
const again = await lock.relock(vault.ciphertext, fromNow("180d"))
const link = lock.toShareLink("https://your-domain", vault)
const parsed = PerkLock.fromShareLink(link)
```

## API summary

| Method | Purpose |
|--------|---------|
| `PerkLock.connect(opts?)` | Connect to drand (mainnet/testnet). |
| `lock(params)` | Lock until an absolute `Date`. |
| `lockFor(params)` | Lock for a duration string. |
| `unlock(ct)` / `unlockText(ct)` | Decrypt after unlock time. |
| `lockShares(args)` / `unlockShares(shares)` | Staged/partial unlock via Shamir. |
| `lockForRecipients(args)` | Multi-recipient locks. |
| `arm(opts)` / `heartbeat(opts)` | Dead-man's switch. |
| `relock(ct, date)` | Decrypt + re-lock. |
| `toShareLink()` / `PerkLock.fromShareLink()` | Shareable links. |
| `roundForTime(date)` / `estimatedUnlockDate(round)` | drand round helpers. |

## How it works

The secret is encrypted to a **future drand round**. The decryption key is the drand BLS signature for that round, which does not exist until the network reaches it. drand is a threshold network (League of Entropy), so no single party can produce it early. See [../../docs/timelock.md](../../docs/timelock.md).

## License

MIT
