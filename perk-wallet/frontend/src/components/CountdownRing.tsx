import { useEffect, useState, type CSSProperties } from "react"
import { formatCountdown } from "../lib/perklock"

/** Animated circular countdown to a vault's unlock time. */
export function CountdownRing({ unlockAt, size = 120 }: { unlockAt: string; size?: number }) {
  const target = new Date(unlockAt).getTime()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = target - now
  const unlocked = remaining <= 0
  // Progress over a rolling 30-day window for visual effect.
  const windowMs = 30 * 86_400_000
  const progress = unlocked ? 1 : Math.max(0, Math.min(1, 1 - remaining / windowMs))
  const radius = size / 2 - 8
  const circumference = 2 * Math.PI * radius
  const dash = circumference * progress
  const wrapStyle: CSSProperties = { width: size, height: size }

  return (
    <div className="ring-wrap" style={wrapStyle}>
      <svg width={size} height={size} className={unlocked ? "ring unlocked" : "ring"}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="55%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth={8} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-label">
        <span className={unlocked ? "ring-status open" : "ring-status"}>{unlocked ? "🔓 Unlocked" : "🔒 Locked"}</span>
        <span className="mono ring-time">{formatCountdown(remaining)}</span>
      </div>
    </div>
  )
}
