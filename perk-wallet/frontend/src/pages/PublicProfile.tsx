import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api, type Profile } from "../lib/api"
import { shortAddress } from "../lib/wallet"

export function PublicProfile() {
  const { username } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!username) return
    api.getProfile(username).then(setProfile).catch(() => setError("Profile not found."))
  }, [username])

  if (error) {
    return (
      <div className="container">
        <div className="glass section">{error}</div>
      </div>
    )
  }
  if (!profile) return <div className="container"><div className="glass section">Loading…</div></div>

  const xUrl = profile.socials?.x ? "https://x.com/" + profile.socials.x.replace(/^@/, "") : null
  const ghUrl = profile.socials?.github ? "https://github.com/" + profile.socials.github.replace(/^@/, "") : null

  return (
    <div className="container narrow fade-in">
      <div className="glass section center">
        <img className="avatar" src={profile.avatarUrl || "/brand/logo.svg"} alt="" />
        <h1 className="m-0 mt-sm">{profile.displayName}</h1>
        <p className="muted m-0">@{profile.username}</p>
        {profile.bio && <p className="mt-md">{profile.bio}</p>}
        <p className="mono muted">{shortAddress(profile.address)}</p>
        <div className="row gap-sm center">
          {xUrl && <a className="btn" href={xUrl} target="_blank" rel="noreferrer">X</a>}
          {ghUrl && <a className="btn" href={ghUrl} target="_blank" rel="noreferrer">GitHub</a>}
          {profile.socials?.website && <a className="btn" href={profile.socials.website} target="_blank" rel="noreferrer">Website</a>}
        </div>
      </div>
    </div>
  )
}
