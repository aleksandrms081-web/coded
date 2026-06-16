import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useWallet } from "../context/WalletContext"
import { api } from "../lib/api"

/**
 * Edit (or create) the signed-in user's on-chain profile: display name, bio,
 * avatar and social links. Requires an authenticated session.
 */
export function ProfileEditor() {
  const { address, profile, isAuthed, refreshProfile } = useWallet()
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [x, setX] = useState("")
  const [github, setGithub] = useState("")
  const [website, setWebsite] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [ok, setOk] = useState("")

  const isNew = !profile

  useEffect(() => {
    if (!profile) return
    setUsername(profile.username)
    setDisplayName(profile.displayName ?? "")
    setBio(profile.bio ?? "")
    setAvatarUrl(profile.avatarUrl ?? "")
    setX(profile.socials?.x ?? "")
    setGithub(profile.socials?.github ?? "")
    setWebsite(profile.socials?.website ?? "")
  }, [profile])

  async function save() {
    setBusy(true)
    setError("")
    setOk("")
    try {
      const payload = {
        displayName: displayName || username,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
        socials: {
          x: x || undefined,
          github: github || undefined,
          website: website || undefined,
        },
      }
      if (isNew) {
        await api.createProfile({ username: username.toLowerCase(), ...payload })
      } else {
        await api.updateProfile(payload)
      }
      await refreshProfile()
      setOk("Profile saved.")
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
    <div className="container narrow fade-in">
      <h1 className="page-title">{isNew ? "Create your profile" : "Edit profile"}</h1>
      {!isAuthed && <div className="alert">Sign in to edit your profile.</div>}

      <div className="glass section">
        <div className="row mt-sm">
          <img className="avatar" src={avatarUrl || "/brand/logo.svg"} alt="" onError={(e) => ((e.target as HTMLImageElement).src = "/brand/logo.svg")} />
          <div>
            <h2 className="m-0">{displayName || "Your name"}</h2>
            <span className="muted">@{(username || "username").toLowerCase()}</span>
          </div>
        </div>

        <div className="field mt-md">
          <label className="label">Username</label>
          <input
            className="input"
            value={username}
            disabled={!isNew}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
            placeholder="satoshi"
          />
          {!isNew && <small className="muted">Usernames are permanent and cannot be changed.</small>}
        </div>

        <div className="field">
          <label className="label">Display name</label>
          <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Satoshi Nakamoto" />
        </div>

        <div className="field">
          <label className="label">Bio</label>
          <textarea className="textarea" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short bio" />
        </div>

        <div className="field">
          <label className="label">Avatar URL</label>
          <input className="input" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
        </div>

        <div className="grid grid-3">
          <div className="field">
            <label className="label">X / Twitter</label>
            <input className="input" value={x} onChange={(e) => setX(e.target.value)} placeholder="@handle" />
          </div>
          <div className="field">
            <label className="label">GitHub</label>
            <input className="input" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="@handle" />
          </div>
          <div className="field">
            <label className="label">Website</label>
            <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
          </div>
        </div>

        {error && <div className="alert alert-warn">{error}</div>}
        {ok && <div className="alert alert-ok">{ok}</div>}

        <div className="row mt-sm gap-sm">
          <button className="btn btn-primary" onClick={save} disabled={busy || !isAuthed || username.length < 3}>
            {busy ? "Saving…" : "Save profile"}
          </button>
          {!isNew && (
            <button className="btn" onClick={() => navigate(`/u/${profile!.username}`)}>View public page</button>
          )}
        </div>
      </div>
    </div>
  )
}
