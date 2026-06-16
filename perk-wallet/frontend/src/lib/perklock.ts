/**
 * Browser-side singleton for the PerkLock engine so we only connect to drand
 * once per session.
 */
import { PerkLock } from "@perk-wallet/perklock"

let instance: Promise<PerkLock> | null = null

export function getPerkLock(): Promise<PerkLock> {
  if (!instance) {
    instance = PerkLock.connect({ network: "mainnet" })
  }
  return instance
}

export { PerkLock }
export { formatCountdown, fromNow, parseDuration } from "@perk-wallet/perklock"
