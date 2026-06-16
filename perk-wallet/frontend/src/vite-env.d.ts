/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_DEFAULT_CHAIN_ID: string
  readonly VITE_RPC_URL: string
  readonly VITE_APP_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Injected EIP-1193 provider (MetaMask et al.)
interface Window {
  ethereum?: any
}
