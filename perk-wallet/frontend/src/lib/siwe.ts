/**
 * Build a minimal EIP-4361 (Sign-In-With-Ethereum) message. We keep it
 * dependency-light on the client; the server verifies with the `siwe` package.
 */
import { env } from "./env"

export function buildSiweMessage(address: string, nonce: string): string {
  const domain = new URL(env.apiBaseUrl).hostname === "localhost" ? "localhost" : window.location.host
  const uri = window.location.origin
  const issuedAt = new Date().toISOString()
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    "",
    `Sign in to ${env.appName}.`,
    "",
    `URI: ${uri}`,
    "Version: 1",
    `Chain ID: ${env.defaultChainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n")
}
