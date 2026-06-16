import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createWallet, saveEncrypted, fromMnemonic, connectInjected, type NewWallet } from "../lib/wallet"
import { useWallet } from "../context/WalletContext"
import { api } from "../lib/api"

type Step = "choose" | "backup" | "secure" | "username" | "import"

export function Onboard() {
  const navigate = useNavigate()
  const { setAddress, signInLocal, connectBrowserWallet } = useWallet()
  const [step, setStep] = useState<Step>("choose")
  const [wallet, setWallet] = useState<NewWallet | null>(null)
  const [passphrase, setPassphrase] = useState("")
  const [importPhrase, setImportPhrase] = useState("")
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  function startCreate() {
    setWallet(createWallet())
    setStep("backup")
  }

  async function checkUsername(value: string) {
    setUsername(value)
    setAvailable(null)
    if (value.length >= 3) {
      try {
        const res = await api.checkUsername(value.toLowerCase())
        setAvailable(res.available)
      } catch {
        setAvailable(null)
      }
    }
  }

  async function secureAndContinue() {
    if (!wallet) return
    if (passphrase.length < 8) return setError("Use a passphrase of at least 8 characters.")
    setBusy(true)
    setError("")
    try {
      const addr = await saveEncrypted(wallet.privateKey, passphrase)
      setAddress(addr)
      await signInLocal(passphrase)
      setStep("username")
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function claimUsername() {
    setBusy(true)
    setError("")
    try {
      await api.createProfile({ username: username.toLowerCase(), displayName: displayName || username })
      navigate("/dashboard")
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function doImport() {
    setBusy(true)
    setError("")
    try {
      const w = fromMnemonic(importPhrase)
      setWallet(w)
      setStep("secure")
    } catch {
      setError("That doesn't look like a valid 12/24-word seed phrase.")
    } finally {
      setBusy(false)
    }
  }

  async function useInjected() {
    setBusy(true)
    setError("")
    try {
      await connectInjected()
      await connectBrowserWallet()
      setStep("username")
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container narrow fade-in">
      <h1 className="page-title">Get started</h1>
      {error && <div className="alert alert-warn">{error}</div>}

      {step === "choose" && (
        <div className="grid">
          <div className="glass section">
            <h2>Create a new wallet</h2>
            <p className="muted">Generate a fresh non-custodial wallet in your browser. Keys never leave this device.</p>
            <button className="btn btn-primary" onClick={startCreate}>Create wallet</button>
          </div>
          <div className="glass section">
            <h2>Import a seed phrase</h2>
            <p className="muted">Already have a wallet? Restore it from your 12 or 24-word phrase.</p>
            <button className="btn" onClick={() => setStep("import")}>Import wallet</button>
          </div>
          <div className="glass section">
            <h2>Connect browser wallet</h2>
            <p className="muted">Use MetaMask or any injected wallet you already have.</p>
            <button className="btn" onClick={useInjected} disabled={busy}>Connect MetaMask</button>
          </div>
        </div>
      )}

      {step === "backup" && wallet && (
        <div className="glass section">
          <h2>📝 Back up your seed phrase</h2>
          <div className="alert alert-warn">
            Write these 12 words down and store them offline. Anyone with them controls your funds. Perk Wallet cannot recover them.
          </div>
          <div className="seed-box">
            {wallet.mnemonic.split(" ").map((word, i) => (
              <div key={i} className="seed-word"><b>{i + 1}</b>{word}</div>
            ))}
          </div>
          <div className="row">
            <button className="btn" onClick={() => navigator.clipboard.writeText(wallet.mnemonic)}>Copy phrase</button>
            <button className="btn btn-primary" onClick={() => setStep("secure")}>I've saved it →</button>
          </div>
        </div>
      )}

      {step === "secure" && (
        <div className="glass section">
          <h2>🔒 Secure this device</h2>
          <p className="muted">Choose a passphrase to encrypt your wallet locally. You'll enter it to sign in.</p>
          <div className="field">
            <label className="label">Passphrase</label>
            <input className="input" type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <button className="btn btn-primary" onClick={secureAndContinue} disabled={busy}>Continue</button>
        </div>
      )}

      {step === "username" && (
        <div className="glass section">
          <h2>🧑‍🚀 Claim your profile</h2>
          <p className="muted">Pick a unique username and display name. You can edit these any time.</p>
          <div className="field">
            <label className="label">Username</label>
            <input className="input" value={username} onChange={(e) => checkUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))} placeholder="satoshi" />
            {available === true && <small className="ok-text">@{username.toLowerCase()} is available ✓</small>}
            {available === false && <small className="warn-text">That username is taken.</small>}
          </div>
          <div className="field">
            <label className="label">Display name</label>
            <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Satoshi Nakamoto" />
          </div>
          <button className="btn btn-primary" onClick={claimUsername} disabled={busy || available === false || username.length < 3}>
            Finish & open wallet
          </button>
        </div>
      )}

      {step === "import" && (
        <div className="glass section">
          <h2>Import seed phrase</h2>
          <div className="field">
            <label className="label">12 or 24-word phrase</label>
            <textarea className="textarea" rows={3} value={importPhrase} onChange={(e) => setImportPhrase(e.target.value)} placeholder="word1 word2 word3 ..." />
          </div>
          <button className="btn btn-primary" onClick={doImport} disabled={busy}>Restore</button>
        </div>
      )}
    </div>
  )
}
