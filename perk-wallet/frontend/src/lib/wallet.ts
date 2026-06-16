/**
 * Non-custodial wallet helpers built on ethers v6.
 *
 * Wallets are generated entirely in the browser. The seed phrase is encrypted
 * with a user passphrase (ethers encrypted JSON keystore) before being stored
 * locally. The plaintext seed/key never leaves the device and is never sent to
 * the server.
 */
import { HDNodeWallet, Mnemonic, Wallet, JsonRpcProvider, formatEther, isAddress, getAddress } from "ethers"
import { env } from "./env"

const KEYSTORE_KEY = "perk-wallet:keystore"
const ADDRESS_KEY = "perk-wallet:address"

export interface NewWallet {
  address: string
  mnemonic: string
  privateKey: string
}

/** Generate a fresh BIP-39 wallet (12-word mnemonic + HD account at m/44'/60'/0'/0/0). */
export function createWallet(): NewWallet {
  const wallet = HDNodeWallet.createRandom()
  return {
    address: wallet.address,
    mnemonic: wallet.mnemonic?.phrase ?? "",
    privateKey: wallet.privateKey,
  }
}

/** Restore an HD wallet from a mnemonic phrase. */
export function fromMnemonic(phrase: string): NewWallet {
  const wallet = HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(phrase.trim()))
  return { address: wallet.address, mnemonic: phrase.trim(), privateKey: wallet.privateKey }
}

/** Encrypt a private key into a JSON keystore and persist it locally. */
export async function saveEncrypted(privateKey: string, passphrase: string): Promise<string> {
  const wallet = new Wallet(privateKey)
  const keystore = await wallet.encrypt(passphrase)
  localStorage.setItem(KEYSTORE_KEY, keystore)
  localStorage.setItem(ADDRESS_KEY, wallet.address)
  return wallet.address
}

export function hasLocalWallet(): boolean {
  return !!localStorage.getItem(KEYSTORE_KEY)
}

export function localAddress(): string | null {
  return localStorage.getItem(ADDRESS_KEY)
}

/** Decrypt the locally stored keystore with the user's passphrase. */
export async function unlockLocal(passphrase: string): Promise<Wallet> {
  const keystore = localStorage.getItem(KEYSTORE_KEY)
  if (!keystore) throw new Error("No local wallet found")
  return (await Wallet.fromEncryptedJson(keystore, passphrase)) as Wallet
}

export function forgetLocalWallet(): void {
  localStorage.removeItem(KEYSTORE_KEY)
  localStorage.removeItem(ADDRESS_KEY)
}

/** Read-only provider for balance / ENS lookups. */
export function getProvider(): JsonRpcProvider {
  return new JsonRpcProvider(env.rpcUrl, env.defaultChainId)
}

export async function getBalanceEth(address: string): Promise<string> {
  try {
    const provider = getProvider()
    const wei = await provider.getBalance(address)
    return formatEther(wei)
  } catch {
    return "0"
  }
}

export async function resolveEns(address: string): Promise<string | null> {
  try {
    return await getProvider().lookupAddress(address)
  } catch {
    return null
  }
}

export function shortAddress(address: string): string {
  if (!isAddress(address)) return address
  const a = getAddress(address)
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

/** Connect an injected wallet (MetaMask etc.) and return the selected address. */
export async function connectInjected(): Promise<string> {
  if (!window.ethereum) throw new Error("No injected wallet found. Install MetaMask or create a Perk Wallet.")
  const accounts: string[] = await window.ethereum.request({ method: "eth_requestAccounts" })
  if (!accounts.length) throw new Error("No account selected")
  return getAddress(accounts[0])
}
