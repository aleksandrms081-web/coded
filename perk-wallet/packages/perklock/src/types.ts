/** Public types for the PerkLock time-lock engine. */

export type DrandNetwork = "mainnet" | "testnet"

export interface PerkLockOptions {
  /** Which drand network to use. Defaults to "mainnet" (quicknet). */
  network?: DrandNetwork
}

/** What a vault payload represents — purely informational metadata. */
export type VaultKind = "key" | "mnemonic" | "address" | "keystore" | "message"

export interface LockParams {
  /** The secret to time-lock. Strings are UTF-8 encoded; bytes are used as-is. */
  payload: string | Uint8Array
  /** Absolute moment the vault becomes decryptable. */
  unlockAt: Date
  /** Optional human label shown in the UI. */
  label?: string
  /** Optional payload kind for UI hints. */
  kind?: VaultKind
}

export interface LockForParams {
  payload: string | Uint8Array
  /** Duration string such as "30d", "12h", "1y2mo". */
  duration: string
  label?: string
  kind?: VaultKind
}

/** Tamper-evident metadata embedded alongside the ciphertext. */
export interface VaultMetadata {
  label: string
  kind: VaultKind
  createdAt: string // ISO
  unlockAt: string // ISO (informational)
  unlockRound: number
  network: DrandNetwork
  version: 1
}

export interface Vault {
  /** age-armored tlock ciphertext. */
  ciphertext: string
  /** drand round at which the vault unlocks. */
  unlockRound: number
  /** Embedded metadata. */
  meta: VaultMetadata
}

/** One Shamir share of a staged/partial-unlock secret. */
export interface VaultShare {
  index: number
  threshold: number
  total: number
  vault: Vault
}

export interface DeadMansSwitchOptions {
  payload: string | Uint8Array
  /** Check-in interval, e.g. "30d". If you stop checking in, the vault unlocks. */
  interval: string
  label?: string
  kind?: VaultKind
}
