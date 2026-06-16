import { Link } from "react-router-dom"

const features = [
  { emoji: "🔐", title: "Non-custodial wallets", text: "BIP-39 wallets generated in your browser. Keys never touch our servers." },
  { emoji: "⏳", title: "PerkLock time-lock", text: "Lock keys, seeds or secrets until an exact future moment with drand tlock." },
  { emoji: "🚀", title: "Pro lock features", text: "Staged unlocks, multi-recipient locks, dead-man's switch & share links." },
  { emoji: "🧑‍🚀", title: "On-chain profiles", text: "Claim a unique @username, display name, bio, avatar and socials." },
  { emoji: "🌐", title: "Fully web3", text: "Connect MetaMask, read balances & ENS, sign in with Ethereum." },
  { emoji: "📦", title: "Self-host ready", text: "One docker compose up to run the whole platform on your domain." },
]

export function Landing() {
  return (
    <div className="container fade-in">
      <section className="hero">
        <span className="badge">Open-source · Web3 · MIT</span>
        <h1>
          Your crypto, <span className="gradient-text">locked in time.</span>
        </h1>
        <p className="lead">
          Perk Wallet is an open-source web3 wallet with built-in time-locked asset vaults. Create a wallet, claim your
          profile, and lock keys or secrets until exactly when you want them back.
        </p>
        <div className="hero-cta">
          <Link to="/onboard" className="btn btn-primary">
            Create your wallet
          </Link>
          <a className="btn btn-ghost" href="https://github.com/your-org/perk-wallet" target="_blank" rel="noreferrer">
            ⭐ Star on GitHub
          </a>
        </div>
        <img className="hero-img" src="/brand/hero.svg" alt="Perk Wallet preview" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
      </section>

      <section className="grid grid-3 feature-grid">
        {features.map((f) => (
          <div key={f.title} className="glass feature">
            <div className="emoji">{f.emoji}</div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
