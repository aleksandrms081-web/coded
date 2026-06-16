/**
 * SQLite-backed data store for profiles and ciphertext-only vaults.
 *
 * The server is custody-free: it never stores private keys, seed phrases or
 * plaintext. Vault rows hold only age-armored tlock ciphertext + public
 * metadata.
 */
import Database from "better-sqlite3"
import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { config } from "./config.js"

export interface Profile {
  address: string
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  socials: Record<string, string> | null
  createdAt: string
  updatedAt: string
}

export interface Vault {
  id: string
  ownerAddress: string
  label: string
  ciphertext: string
  unlockRound: number
  unlockAt: string
  kind: string
  shareToken: string | null
  createdAt: string
}

mkdirSync(config.dataDir, { recursive: true })
const db = new Database(join(config.dataDir, "perk-wallet.db"))
db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    address     TEXT PRIMARY KEY,
    username    TEXT NOT NULL UNIQUE COLLATE NOCASE,
    displayName TEXT NOT NULL,
    bio         TEXT,
    avatarUrl   TEXT,
    socials     TEXT,
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS vaults (
    id          TEXT PRIMARY KEY,
    ownerAddress TEXT NOT NULL REFERENCES profiles(address) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    ciphertext  TEXT NOT NULL,
    unlockRound INTEGER NOT NULL,
    unlockAt    TEXT NOT NULL,
    kind        TEXT NOT NULL,
    shareToken  TEXT UNIQUE,
    createdAt   TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_vaults_owner ON vaults(ownerAddress);
`)

function rowToProfile(r: any): Profile {
  return { ...r, socials: r.socials ? JSON.parse(r.socials) : null }
}

export const profiles = {
  getByAddress(address: string): Profile | null {
    const r = db.prepare("SELECT * FROM profiles WHERE address = ?").get(address)
    return r ? rowToProfile(r) : null
  },
  getByUsername(username: string): Profile | null {
    const r = db.prepare("SELECT * FROM profiles WHERE username = ? COLLATE NOCASE").get(username)
    return r ? rowToProfile(r) : null
  },
  usernameTaken(username: string): boolean {
    return !!db.prepare("SELECT 1 FROM profiles WHERE username = ? COLLATE NOCASE").get(username)
  },
  upsert(p: Omit<Profile, "createdAt" | "updatedAt">): Profile {
    const now = new Date().toISOString()
    const existing = this.getByAddress(p.address)
    if (existing) {
      db.prepare(
        `UPDATE profiles SET username=@username, displayName=@displayName, bio=@bio,
         avatarUrl=@avatarUrl, socials=@socials, updatedAt=@updatedAt WHERE address=@address`,
      ).run({ ...p, socials: p.socials ? JSON.stringify(p.socials) : null, updatedAt: now })
    } else {
      db.prepare(
        `INSERT INTO profiles (address, username, displayName, bio, avatarUrl, socials, createdAt, updatedAt)
         VALUES (@address, @username, @displayName, @bio, @avatarUrl, @socials, @createdAt, @updatedAt)`,
      ).run({ ...p, socials: p.socials ? JSON.stringify(p.socials) : null, createdAt: now, updatedAt: now })
    }
    return this.getByAddress(p.address)!
  },
}

export const vaults = {
  listByOwner(ownerAddress: string): Vault[] {
    return db.prepare("SELECT * FROM vaults WHERE ownerAddress = ? ORDER BY createdAt DESC").all(ownerAddress) as Vault[]
  },
  get(id: string): Vault | null {
    return (db.prepare("SELECT * FROM vaults WHERE id = ?").get(id) as Vault) ?? null
  },
  getByShareToken(token: string): Vault | null {
    return (db.prepare("SELECT * FROM vaults WHERE shareToken = ?").get(token) as Vault) ?? null
  },
  create(v: Vault): Vault {
    db.prepare(
      `INSERT INTO vaults (id, ownerAddress, label, ciphertext, unlockRound, unlockAt, kind, shareToken, createdAt)
       VALUES (@id, @ownerAddress, @label, @ciphertext, @unlockRound, @unlockAt, @kind, @shareToken, @createdAt)`,
    ).run(v)
    return this.get(v.id)!
  },
  delete(id: string, ownerAddress: string): boolean {
    const info = db.prepare("DELETE FROM vaults WHERE id = ? AND ownerAddress = ?").run(id, ownerAddress)
    return info.changes > 0
  },
}

export default db
