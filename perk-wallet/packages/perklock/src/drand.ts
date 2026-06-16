/**
 * Thin wrapper around tlock-js drand clients.
 *
 * Time-lock encryption requires the drand "quicknet" beacon (unchained, G1
 * signatures). tlock-js exposes ready-made clients for it via `mainnetClient()`.
 */
import {
  mainnetClient,
  testnetClient,
  roundAt,
  roundTime,
  type HttpChainClient,
  type ChainInfo,
} from "tlock-js"
import type { DrandNetwork } from "./types.js"

export interface DrandConnection {
  client: HttpChainClient
  info: ChainInfo
  network: DrandNetwork
}

/** Connect to drand and cache the chain info (period, genesis, public key). */
export async function connectDrand(
  network: DrandNetwork = "mainnet",
): Promise<DrandConnection> {
  const client = network === "testnet" ? testnetClient() : mainnetClient()
  const info = await client.chain().info()
  return { client, info, network }
}

/** The drand round that will be reached at the given time. */
export function roundForTime(info: ChainInfo, when: Date): number {
  // roundAt expects epoch milliseconds.
  return roundAt(when.getTime(), info)
}

/** The wall-clock time (ms epoch) a given round is expected to be published. */
export function timeForRound(info: ChainInfo, round: number): number {
  return roundTime(info, round)
}
