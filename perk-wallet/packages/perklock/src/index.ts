/**
 * @perk-wallet/perklock
 *
 * Exclusive time-lock vault engine for Perk Wallet.
 * Lock keys, seeds, addresses & secrets until a future moment using drand tlock.
 */
export { PerkLock } from "./perklock.js"
export { parseDuration, fromNow, formatCountdown } from "./duration.js"
export { connectDrand, roundForTime, timeForRound } from "./drand.js"
export * as shamir from "./shamir.js"
export type {
  DrandNetwork,
  PerkLockOptions,
  LockParams,
  LockForParams,
  VaultKind,
  VaultMetadata,
  Vault,
  VaultShare,
  DeadMansSwitchOptions,
} from "./types.js"
