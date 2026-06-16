export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  defaultChainId: Number(import.meta.env.VITE_DEFAULT_CHAIN_ID ?? 11155111),
  rpcUrl: import.meta.env.VITE_RPC_URL ?? "https://rpc.sepolia.org",
  appName: import.meta.env.VITE_APP_NAME ?? "Perk Wallet",
}
