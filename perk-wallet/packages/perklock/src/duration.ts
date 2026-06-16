/**
 * Tiny human-duration parser used by PerkLock.
 * Supports compound durations like "1y2mo3d", "12h", "90m", "45s".
 *
 * Units: s (seconds), m (minutes), h (hours), d (days),
 *        w (weeks), mo (months ≈ 30d), y (years ≈ 365d).
 */

const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
  mo: 2_592_000_000, // 30 days
  y: 31_536_000_000, // 365 days
}

const TOKEN = /(\d+)\s*(mo|[smhdwy])/gi

/** Parse a duration string into milliseconds. Throws on invalid input. */
export function parseDuration(input: string): number {
  const normalized = input.trim().toLowerCase()
  if (!normalized) throw new Error("PerkLock: empty duration")

  let ms = 0
  let matched = false
  let lastIndex = 0
  TOKEN.lastIndex = 0
  for (let m = TOKEN.exec(normalized); m; m = TOKEN.exec(normalized)) {
    matched = true
    const amount = Number(m[1])
    const unit = m[2]
    const unitMs = UNIT_MS[unit]
    if (!unitMs) throw new Error(`PerkLock: unknown duration unit "${unit}"`)
    ms += amount * unitMs
    lastIndex = TOKEN.lastIndex
  }

  if (!matched || lastIndex !== normalized.length) {
    throw new Error(`PerkLock: invalid duration "${input}" (try "30d", "12h", "1y")`)
  }
  return ms
}

/** Returns a Date `duration` from now. */
export function fromNow(duration: string, now: Date = new Date()): Date {
  return new Date(now.getTime() + parseDuration(duration))
}

/** Format a millisecond delta as a compact human countdown, e.g. "3d 04:12:09". */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "unlocked"
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  const hms = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  return days > 0 ? `${days}d ${hms}` : hms
}
