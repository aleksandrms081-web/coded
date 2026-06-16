import { Link, useNavigate } from "react-router-dom"
import { useWallet } from "../context/WalletContext"
import { shortAddress } from "../lib/wallet"
import { env } from "../lib/env"

export function Navbar() {
  const { address, profile, isAuthed, signOut } = useWallet()
  const navigate = useNavigate()

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <img src="/brand/logo.svg" alt="" width={34} height={34} />
          <span className="gradient-text">{env.appName}</span>
        </Link>
        <div className="navbar-links">
          <Link to="/dashboard">Wallet</Link>
          <Link to="/vault">Time-Lock</Link>
          <Link to="/profile">Profile</Link>
          {address ? (
            <button
              className="btn"
              onClick={() => {
                signOut()
                navigate("/")
              }}
            >
              {profile ? `@${profile.username}` : shortAddress(address)}
              {isAuthed ? "" : " · locked"}
            </button>
          ) : (
            <Link to="/onboard" className="btn btn-primary">
              Launch app
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
