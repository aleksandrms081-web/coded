/**
 * Minimal Shamir Secret Sharing over GF(256), used by PerkLock's staged /
 * partial-unlock feature. Each byte of the secret is split independently.
 *
 * This is a compact, dependency-free implementation intended for splitting
 * short secrets (keys, seeds). For very large payloads, encrypt first and split
 * the key.
 */

// GF(256) log/exp tables using the AES-standard primitive polynomial 0x11b.
const LOG = new Uint8Array(256)
const EXP = new Uint8Array(256)
;(function initTables() {
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x ^= mul_xtime(x)
  }
  EXP[255] = EXP[0]
})()

function mul_xtime(a: number): number {
  const hi = a & 0x80
  let r = (a << 1) & 0xff
  if (hi) r ^= 0x1b
  return r
}

function gmul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return EXP[(LOG[a] + LOG[b]) % 255]
}

function gdiv(a: number, b: number): number {
  if (b === 0) throw new Error("shamir: division by zero")
  if (a === 0) return 0
  return EXP[(LOG[a] - LOG[b] + 255) % 255]
}

/** Evaluate a polynomial (coeffs low->high) at x in GF(256). */
function evalPoly(coeffs: Uint8Array, x: number): number {
  let result = 0
  for (let i = coeffs.length - 1; i >= 0; i--) {
    result = gmul(result, x) ^ coeffs[i]
  }
  return result
}

export interface Share {
  x: number
  y: Uint8Array
}

/** Split `secret` into `total` shares, any `threshold` of which can recover it. */
export function split(secret: Uint8Array, total: number, threshold: number): Share[] {
  if (threshold < 2 || threshold > total) throw new Error("shamir: bad threshold")
  if (total > 255) throw new Error("shamir: total must be <= 255")

  const shares: Share[] = []
  for (let s = 1; s <= total; s++) shares.push({ x: s, y: new Uint8Array(secret.length) })

  for (let byteIndex = 0; byteIndex < secret.length; byteIndex++) {
    const coeffs = new Uint8Array(threshold)
    coeffs[0] = secret[byteIndex]
    crypto.getRandomValues(coeffs.subarray(1))
    for (const share of shares) {
      share.y[byteIndex] = evalPoly(coeffs, share.x)
    }
  }
  return shares
}

/** Recover the secret from at least `threshold` shares via Lagrange interpolation at x=0. */
export function combine(shares: Share[]): Uint8Array {
  if (shares.length < 2) throw new Error("shamir: need at least 2 shares")
  const len = shares[0].y.length
  const secret = new Uint8Array(len)

  for (let byteIndex = 0; byteIndex < len; byteIndex++) {
    let acc = 0
    for (let i = 0; i < shares.length; i++) {
      let num = 1
      let den = 1
      for (let j = 0; j < shares.length; j++) {
        if (i === j) continue
        num = gmul(num, shares[j].x)
        den = gmul(den, shares[i].x ^ shares[j].x)
      }
      const lagrange = gdiv(num, den)
      acc ^= gmul(shares[i].y[byteIndex], lagrange)
    }
    secret[byteIndex] = acc
  }
  return secret
}
