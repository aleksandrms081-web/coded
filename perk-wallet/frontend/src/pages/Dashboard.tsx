import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useWallet } from "../context/WalletContext"
import { getBalanceEth, resolveEns, shortAddress } from "../lib/wallet"
import { api, type VaultRecord } from "../lib/api"
import { env } from "../lib/env"

export function Dashboard() {
  const { address, profile, isAuthed } = useWallet()
  const [balance, setBalance] = useState<string>("…")
  const [ens, setEns] = useState<string | null>(null)
  const [vaults, setVaults] = useState<VaultRecord[]>([])

  useEffect(() => {
    if (!address) return
    void getBalanceEth(address).then(setBalance)
    void resolveEns(address).then(setEns)
  }, [address])

  useEffect(() => {
    if (isAuthed) api.listVaults().then(setVaults).catch(() => setVaults([]))
  }, [isAuthed])

  if (!address) {
    return (
      <div className="container">
        <div className="glass section">
          <h2>No wallet yet</h2>
          <p className="muted">Create or connect a wallet to see your dashboard.</p>
          <Link to="/onboard" className="btn btn-primary">Get started</Link>
        </div>
      </div>
    )
  }

  const locked = vaults.filter((v) => new Date(v.unlockAt).getTime() > Date.now())

  return (
    <div className="container fade-in">
      <h1 className="page-title">Wallet</h1>
      <div className="grid grid-2">
        <div className="glass section">
          <span className="muted">Balance</span>
          <div className="balance gradient-text">{Number(balance).toFixed(4)} ETH</div>
          <div className="kv"><span className="muted">Address</span><span className="mono">{shortAddress(address)}</span></div>
          {ens && <div className="kv"><span className="muted">ENS</span><span>{ens}</span></div>}
          <div className="kv"><span className="muted">Network</span><span>chain #{env.defaultChainId}</span></div>
          <div className="row mt-md">
            <button className="btn" onClick={() => navigator.clipboard.writeText(address)}>Copy address</button>
            <Link to="/vault" className="btn btn-primary">Time-lock something</Link>
          </div>
        </div>

        <div className="glass section">
          <span className="muted">Profile</span>
          <div className="row mt-sm">
            <img className="avatar" src={profile?.avatarUrl || "/brand/logo.svg"} alt="" />
            <div>
              <h2 className="m-0">{profile?.displayName ?? "Unnamed"}</h2>
              <span className="muted">@{profile?.username ?? "—"}</span>
            </div>
          </div>
          {profile?.bio && <p className="muted">{profile.bio}</p>}
          <Link to="/profile" className="btn mt-sm">Edit profile</Link>
        </div>
      </div>

      <div className="glass section mt-lg">
        <div className="row between">
          <h2 className="m-0">Time-lock vaults</h2>
          <Link to="/vault" className="btn">+ New vault</Link>
        </div>
        <p className="muted">{vaults.length} total · {locked.length} still locked</p>
        {vaults.slice(0, 5).map((v) => (
          <div key={v.id} className="kv">
            <span>{v.label}</span>
            <span className="badge">{new Date(v.unlockAt) > new Date() ? "🔒 locked" : "🔓 open"}</span>
          </div>
        ))}
        {!isAuthed && <div className="alert">Sign in to load your vaults.</div>}
      </div>
    </div>
  )
}
