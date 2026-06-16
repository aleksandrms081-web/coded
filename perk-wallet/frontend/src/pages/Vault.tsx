import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useWallet } from "../context/WalletContext"
import { getPerkLock, parseDuration } from "../lib/perklock"
import { api, type VaultRecord } from "../lib/api"
import { VaultCard } from "../components/VaultCard"

const PRESETS = [
  { label: "1 hour", value: "1h" },
  { label: "1 day", value: "1d" },
  { label: "1 week", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "1 year", value: "365d" },
]

const KINDS = [
  { id: "message", label: "Secret message" },
  { id: "key", label: "Private key" },
  { id: "mnemonic", label: "Seed phrase" },
  { id: "address", label: "Address note" },
  { id: "keystore", label: "Keystore JSON" },
]

export function Vault() {
  const { address, isAuthed } = useWallet()
  const [vaults, setVaults] = useState<VaultRecord[]>([])
  const [label, setLabel] = useState("")
  const [secret, setSecret] = useState("")
  const [kind, setKind] = useState("message")
  const [preset, setPreset] = useState("7d")
  const [customDate, setCustomDate] = useState("")
  const [shareable, setShareable] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [ok, setOk] = useState("")

  const unlockAt = useMemo(() => {
    if (customDate) return new Date(customDate)
    return new Date(Date.now() + parseDuration(preset))
  }, [customDate, preset])

  function refresh() {
    if (isAuthed) api.listVaults().then(setVaults).catch(() => setVaults([]))
  }
  useEffect(refresh, [isAuthed])

  async function createVault() {
    if (!secret.trim()) return setError("Enter the secret you want to lock.")
    setBusy(true)
    setError("")
    setOk("")
    try {
      const lock = await getPerkLock()
      const vault = await lock.lock({
        payload: secret,
        unlockAt,
        label: label || "Untitled vault",
        kind: kind as VaultRecord["kind"],
      })
      const record = await api.createVault({
        label: vault.label,
        ciphertext: vault.ciphertext,
        unlockRound: vault.unlockRound,
        unlockAt: vault.unlockAt,
        kind: vault.kind,
        shareable,
      })
      setOk(`Locked “${record.label}” until ${unlockAt.toLocaleString()}.`)
      setSecret("")
      setLabel("")
      refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!address) {
    return (
      <div className="container">
        <div className="glass section">
          <h2>Connect a wallet first</h2>
          <Link to="/onboard" className="btn btn-primary">Get started</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container fade-in">
      <h1 className="page-title">PerkLock time-lock vault</h1>
      <div className="grid grid-2">
        <div className="glass section">
          <h2 className="m-0">Lock a secret</h2>
          <p className="muted">Encrypted to a future drand round. Nobody — not even us — can open it early.</p>

          <div className="field">
            <label className="label">Label</label>
            <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Cold wallet backup" />
          </div>

          <div className="field">
            <label className="label">What are you locking?</label>
            <div className="tabs">
              {KINDS.map((k) => (
                <button key={k.id} className={kind === k.id ? "tab active" : "tab"} onClick={() => setKind(k.id)}>{k.label}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="label">Secret</label>
            <textarea className="textarea" rows={4} value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Paste the key, seed phrase or message to lock" />
          </div>

          <div className="field">
            <label className="label">Unlock after</label>
            <div className="tabs">
              {PRESETS.map((p) => (
                <button key={p.value} className={!customDate && preset === p.value ? "tab active" : "tab"} onClick={() => { setPreset(p.value); setCustomDate("") }}>{p.label}</button>
              ))}
            </div>
            <label className="label mt-sm">…or pick an exact date & time</label>
            <input className="input" type="datetime-local" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
          </div>

          <label className="row gap-sm">
            <input type="checkbox" checked={shareable} onChange={(e) => setShareable(e.target.checked)} />
            <span className="muted">Create a public share link (anyone with the link can unlock after the time)</span>
          </label>

          <p className="muted mt-sm">Unlocks on <b>{unlockAt.toLocaleString()}</b></p>
          {error && <div className="alert alert-warn">{error}</div>}
          {ok && <div className="alert alert-ok">{ok}</div>}
          <button className="btn btn-primary" onClick={createVault} disabled={busy}>{busy ? "Locking…" : "🔒 Lock it"}</button>
        </div>

        <div>
          <h2>Your vaults</h2>
          {!isAuthed && <div className="alert">Sign in to see and manage your vaults.</div>}
          {vaults.length === 0 && isAuthed && <p className="muted">No vaults yet. Lock your first secret →</p>}
          {vaults.map((v) => (
            <VaultCard key={v.id} vault={v} onChange={refresh} />
          ))}
        </div>
      </div>
    </div>
  )
}
