import { useState } from "react"
import { CountdownRing } from "./CountdownRing"
import { getPerkLock } from "../lib/perklock"
import { api, type VaultRecord } from "../lib/api"

/** A single time-lock vault with inline unlock + share controls. */
export function VaultCard({ vault, onChange }: { vault: VaultRecord; onChange?: () => void }) {
  const [revealed, setRevealed] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const isOpen = new Date(vault.unlockAt).getTime() <= Date.now()

  async function tryUnlock() {
    setBusy(true)
    setError("")
    try {
      const lock = await getPerkLock()
      const plaintext = await lock.unlockText(vault.ciphertext)
      setRevealed(plaintext)
    } catch (e) {
      setError((e as Error).message || "Still locked. The drand network has not reached the unlock round yet.")
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm("Delete this vault? This cannot be undone.")) return
    await api.deleteVault(vault.id)
    onChange?.()
  }

  function copyShare() {
    if (!vault.shareToken) return
    const url = `${window.location.origin}/unlock?token=${vault.shareToken}`
    navigator.clipboard.writeText(url)
  }

  return (
    <div className="glass vault-card">
      <CountdownRing unlockAt={vault.unlockAt} size={110} />
      <div className="meta">
        <div className="row between">
          <h3>{vault.label}</h3>
          <span className="badge">{vault.kind}</span>
        </div>
        <p className="muted m-0">Unlocks {new Date(vault.unlockAt).toLocaleString()}</p>
        {revealed && (
          <div className="alert alert-ok wrap-anywhere mono">{revealed}</div>
        )}
        {error && <div className="alert alert-warn">{error}</div>}
        <div className="row mt-sm gap-sm">
          <button className="btn btn-primary" onClick={tryUnlock} disabled={busy || !isOpen}>
            {isOpen ? "Reveal secret" : "🔒 Locked"}
          </button>
          {vault.shareToken && <button className="btn" onClick={copyShare}>Copy share link</button>}
          <button className="btn btn-ghost" onClick={remove}>Delete</button>
        </div>
      </div>
    </div>
  )
}
