/**
 * Tests for PerkLock helpers that do not require live drand network access.
 * Run with: node --test (after building) or via ts-node/tsx.
 *
 * Network-dependent lock/unlock round-trips are covered by integration tests
 * that hit the drand testnet; they are skipped here to keep unit tests offline.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { parseDuration, fromNow, formatCountdown } from "./duration.js"
import * as shamir from "./shamir.js"
import { PerkLock } from "./perklock.js"

test("parseDuration handles single and compound units", () => {
  assert.equal(parseDuration("30d"), 30 * 86_400_000)
  assert.equal(parseDuration("12h"), 12 * 3_600_000)
  assert.equal(parseDuration("90m"), 90 * 60_000)
  assert.equal(parseDuration("1y"), 31_536_000_000)
  assert.equal(parseDuration("1mo"), 2_592_000_000)
  assert.equal(parseDuration("1d12h"), 86_400_000 + 12 * 3_600_000)
})

test("parseDuration rejects invalid input", () => {
  assert.throws(() => parseDuration(""))
  assert.throws(() => parseDuration("abc"))
  assert.throws(() => parseDuration("10x"))
  assert.throws(() => parseDuration("5 days"))
})

test("fromNow returns a future date", () => {
  const now = new Date("2025-01-01T00:00:00Z")
  const later = fromNow("7d", now)
  assert.equal(later.getTime() - now.getTime(), 7 * 86_400_000)
})

test("formatCountdown formats deltas", () => {
  assert.equal(formatCountdown(0), "unlocked")
  assert.equal(formatCountdown(-5), "unlocked")
  assert.equal(formatCountdown(3 * 86_400_000 + 4 * 3_600_000 + 12 * 60_000 + 9_000), "3d 04:12:09")
  assert.equal(formatCountdown(5 * 60_000), "00:05:00")
})

test("shamir splits and recombines a secret", () => {
  const secret = new TextEncoder().encode("correct horse battery staple")
  const shares = shamir.split(secret, 5, 3)
  assert.equal(shares.length, 5)
  // any 3 of 5 shares recover the secret
  const recovered = shamir.combine([shares[0], shares[2], shares[4]])
  assert.deepEqual(recovered, secret)
  // a different subset also works
  const recovered2 = shamir.combine([shares[1], shares[3], shares[4]])
  assert.deepEqual(recovered2, secret)
})

test("shamir rejects bad thresholds", () => {
  const secret = new Uint8Array([1, 2, 3])
  assert.throws(() => shamir.split(secret, 3, 1))
  assert.throws(() => shamir.split(secret, 2, 3))
})

test("share links round-trip", () => {
  const vault = {
    ciphertext: "-----BEGIN AGE ENCRYPTED FILE-----\nabc\n-----END AGE ENCRYPTED FILE-----",
    unlockRound: 1234,
    meta: {
      label: "Test",
      kind: "message" as const,
      createdAt: "2025-01-01T00:00:00.000Z",
      unlockAt: "2030-01-01T00:00:00.000Z",
      unlockRound: 1234,
      network: "mainnet" as const,
      version: 1 as const,
    },
  }
  const link = PerkLock.prototype.toShareLink.call(null as never, "https://example.com", vault)
  const parsed = PerkLock.fromShareLink(link)
  assert.deepEqual(parsed, vault)
})
