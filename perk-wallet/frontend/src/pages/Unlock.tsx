import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CountdownRing } from "../components/CountdownRing"
import { getPerkLock } from "../lib/perklock"
import { api, type VaultRecord } from "../lib/api"

/**
 * Public landing page for a shared time-lock vault. Anyone with the share
 * token can load the (still encrypted) vault and reveal its contents once the
 * drand network has passed the unlock round.
 */
export function Unlock() {
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""

  const [vault, setVault] = useState<VaultRecord | null>(null)
  const [revealed, setRevealed] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("No share token provided.")
      return
    }
    api
      .getSharedVault(token)
      .then(setVault)
      .catch(() => setError("This share link is invalid or has been revoked."))
  }, [token])

  const isOpen = vault ? new Date(vault.unlockAt).getTime() <= Date.now() : false

  async function reveal() {
    if (!vault) return
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

  if (error && !vault) {
    return (
      <div className="container narrow">
        <div className="glass section">{error}</div>
      </div>
    )
  }
  if (!vault) {
    return (
      <div className="container narrow">
        <div className="glass section">Loading shared vault…</div>
      </div>
    )
  }

  return (
    <div className="container narrow fade-in">
      <h1 className="page-title">Shared time-lock</h1>
      <div className="glass section center">
        <div className="row center">
          <CountdownRing unlockAt={vault.unlockAt} size={140} />
        </div>
        <h2 className="m-0 mt-sm">{vault.label}</h2>
        <p className="muted">
          {isOpen ? "This vault is unlocked." : `Unlocks on ${new Date(vault.unlockAt).toLocaleString()}`}
        </p>

        {revealed && <div className="alert alert-ok wrap-anywhere mono">{revealed}</div>}
        {error && <div className="alert alert-warn">{error}</div>}

        <button className="btn btn-primary" onClick={reveal} disabled={busy || !isOpen}>
          {isOpen ? (busy ? "Revealing…" : "Reveal secret") : "🔒 Locked"}
        </button>
      </div>
      <p className="muted center">Powered by PerkLock · drand time-lock encryption</p>
    </div>
  )
}
