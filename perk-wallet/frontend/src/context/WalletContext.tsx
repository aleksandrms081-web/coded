import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { BrowserProvider } from "ethers"
import {
  connectInjected,
  forgetLocalWallet,
  hasLocalWallet,
  localAddress,
  unlockLocal,
} from "../lib/wallet"
import { api, clearToken, setToken } from "../lib/api"
import { buildSiweMessage } from "../lib/siwe"
import type { Profile } from "../lib/api"

interface WalletState {
  address: string | null
  profile: Profile | null
  isAuthed: boolean
  loading: boolean
  connectBrowserWallet: () => Promise<void>
  signInLocal: (passphrase: string) => Promise<void>
  setAddress: (address: string) => void
  refreshProfile: () => Promise<void>
  signOut: () => void
  hasLocal: boolean
}

const WalletCtx = createContext<WalletState | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddressState] = useState<string | null>(localAddress())
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAuthed, setIsAuthed] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)

  const refreshProfile = useCallback(async () => {
    if (!address) return
    try {
      setProfile(await api.getProfileByAddress(address))
    } catch {
      setProfile(null)
    }
  }, [address])

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  // Sign-In-With-Ethereum against the API to get a session token.
  const authenticate = useCallback(
    async (addr: string, signMessage: (msg: string) => Promise<string>) => {
      const { nonce } = await api.getNonce()
      const message = buildSiweMessage(addr, nonce)
      const signature = await signMessage(message)
      const { token } = await api.verifySiwe(message, signature)
      setToken(token)
      setIsAuthed(true)
    },
    [],
  )

  const connectBrowserWallet = useCallback(async () => {
    setLoading(true)
    try {
      const addr = await connectInjected()
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      await authenticate(addr, (msg) => signer.signMessage(msg))
      setAddressState(addr)
    } finally {
      setLoading(false)
    }
  }, [authenticate])

  const signInLocal = useCallback(
    async (passphrase: string) => {
      setLoading(true)
      try {
        const wallet = await unlockLocal(passphrase)
        await authenticate(wallet.address, (msg) => wallet.signMessage(msg))
        setAddressState(wallet.address)
      } finally {
        setLoading(false)
      }
    },
    [authenticate],
  )

  const setAddress = useCallback((addr: string) => setAddressState(addr), [])

  const signOut = useCallback(() => {
    clearToken()
    setIsAuthed(false)
    setProfile(null)
  }, [])

  const value = useMemo<WalletState>(
    () => ({
      address,
      profile,
      isAuthed,
      loading,
      connectBrowserWallet,
      signInLocal,
      setAddress,
      refreshProfile,
      signOut,
      hasLocal: hasLocalWallet(),
    }),
    [address, profile, isAuthed, loading, connectBrowserWallet, signInLocal, setAddress, refreshProfile, signOut],
  )

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletCtx)
  if (!ctx) throw new Error("useWallet must be used within WalletProvider")
  return ctx
}

export { forgetLocalWallet }
