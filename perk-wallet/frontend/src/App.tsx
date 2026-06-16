import { Routes, Route } from "react-router-dom"
import { Navbar } from "./components/Navbar"
import { Landing } from "./pages/Landing"
import { Onboard } from "./pages/Onboard"
import { Dashboard } from "./pages/Dashboard"
import { Vault } from "./pages/Vault"
import { ProfileEditor } from "./pages/ProfileEditor"
import { PublicProfile } from "./pages/PublicProfile"
import { Unlock } from "./pages/Unlock"
import "./styles/app.css"
import "./styles/util.css"

export function App() {
  return (
    <>
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboard" element={<Onboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/profile" element={<ProfileEditor />} />
          <Route path="/u/:username" element={<PublicProfile />} />
          <Route path="/unlock" element={<Unlock />} />
        </Routes>
      </main>
      <footer className="app-footer container">
        <span className="muted">Perk Wallet · open-source · MIT</span>
        <span className="muted">Time-lock powered by drand</span>
      </footer>
    </>
  )
}
