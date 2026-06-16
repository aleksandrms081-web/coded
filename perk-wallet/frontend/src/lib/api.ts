/**
 * Thin typed client for the Perk Wallet API.
 */
import { env } from "./env"

const TOKEN_KEY = "perk-wallet:jwt"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = body?.error?.message ?? `Request failed (${res.status})`
    throw new Error(message)
  }
  return body as T
}

export interface Profile {
  address: string
  username: string
  displayName: string
  bio?: string
  avatarUrl?: string
  socials?: { x?: string; github?: string; website?: string }
  createdAt: string
  updatedAt: string
}

export interface VaultRecord {
  id: string
  ownerAddress: string
  label: string
  ciphertext: string
  unlockRound: number
  unlockAt: string
  kind: "key" | "mnemonic" | "address" | "keystore" | "message"
  shareToken?: string
  createdAt: string
}

export const api = {
  // auth
  getNonce: () => request<{ nonce: string }>("/api/auth/nonce"),
  verifySiwe: (message: string, signature: string) =>
    request<{ token: string; address: string }>("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ message, signature }),
    }),

  // profiles
  checkUsername: (username: string) =>
    request<{ available: boolean }>(`/api/profiles/check-username/${encodeURIComponent(username)}`),
  getProfileByAddress: (address: string) =>
    request<Profile>(`/api/profiles/by-address/${address}`),
  getProfile: (username: string) => request<Profile>(`/api/profiles/${encodeURIComponent(username)}`),
  createProfile: (data: Partial<Profile>) =>
    request<Profile>("/api/profiles", { method: "POST", body: JSON.stringify(data) }),
  updateProfile: (data: Partial<Profile>) =>
    request<Profile>("/api/profiles", { method: "PATCH", body: JSON.stringify(data) }),

  // vaults
  listVaults: () => request<VaultRecord[]>("/api/vaults"),
  createVault: (data: Partial<VaultRecord> & { shareable?: boolean }) =>
    request<VaultRecord>("/api/vaults", { method: "POST", body: JSON.stringify(data) }),
  getVault: (id: string) => request<VaultRecord>(`/api/vaults/${id}`),
  deleteVault: (id: string) => request<void>(`/api/vaults/${id}`, { method: "DELETE" }),
  getSharedVault: (token: string) => request<VaultRecord>(`/api/vaults/shared/${token}`),
}
