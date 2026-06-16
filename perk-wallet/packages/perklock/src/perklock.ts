/**
 * PerkLock — the time-lock vault engine.
 *
 * Wraps tlock-js (drand timelock encryption) with a wallet-friendly API and a
 * set of pro features: durations, staged/partial unlocks (Shamir),
 * multi-recipient locks, dead-man's switch, re-locking and shareable links.
 */
import {
  timelockEncrypt,
  timelockDecrypt,
  Buffer as TlockBuffer,
} from "tlock-js"
import {
  connectDrand,
  roundForTime,
  timeForRound,
  type DrandConnection,
} from "./drand.js"
import { parseDuration, fromNow } from "./duration.js"
import * as shamir from "./shamir.js"
import type {
  PerkLockOptions,
  LockParams,
  LockForParams,
  Vault,
  VaultMetadata,
  VaultShare,
  DeadMansSwitchOptions,
  DrandNetwork,
} from "./types.js"

const enc = new TextEncoder()
const dec = new TextDecoder()

function toBytes(payload: string | Uint8Array): Uint8Array {
  return typeof payload === "string" ? enc.encode(payload) : payload
}

export class PerkLock {
  private constructor(private readonly conn: DrandConnection) {}

  /** Connect to drand and return a ready PerkLock instance. */
  static async connect(opts: PerkLockOptions = {}): Promise<PerkLock> {
    const conn = await connectDrand(opts.network ?? "mainnet")
    return new PerkLock(conn)
  }

  get network(): DrandNetwork {
    return this.conn.network
  }

  /** drand round that unlocks at the given time. */
  roundForTime(when: Date): number {
    return roundForTime(this.conn.info, when)
  }

  /** Estimated wall-clock unlock date for a round. */
  estimatedUnlockDate(round: number): Date {
    return new Date(timeForRound(this.conn.info, round))
  }

  private buildMeta(p: { label?: string; kind?: VaultMetadata["kind"]; unlockAt: Date; round: number }): VaultMetadata {
    return {
      label: p.label ?? "Untitled vault",
      kind: p.kind ?? "message",
      createdAt: new Date().toISOString(),
      unlockAt: p.unlockAt.toISOString(),
      unlockRound: p.round,
      network: this.conn.network,
      version: 1,
    }
  }

  /** Lock a secret until an absolute date. */
  async lock(params: LockParams): Promise<Vault> {
    const round = this.roundForTime(params.unlockAt)
    const meta = this.buildMeta({ ...params, round })
    const envelope = JSON.stringify({ meta, data: Array.from(toBytes(params.payload)) })
    const ciphertext = await timelockEncrypt(
      round,
      TlockBuffer.from(enc.encode(envelope)),
      this.conn.client,
    )
    return { ciphertext, unlockRound: round, meta }
  }

  /** Lock a secret for a relative duration ("30d", "12h", ...). */
  async lockFor(params: LockForParams): Promise<Vault> {
    return this.lock({
      payload: params.payload,
      unlockAt: fromNow(params.duration),
      label: params.label,
      kind: params.kind,
    })
  }

  /** Decrypt a vault ciphertext (throws if the unlock round has not arrived). */
  async unlock(ciphertext: string): Promise<Uint8Array> {
    const plain = await timelockDecrypt(ciphertext, this.conn.client)
    const envelope = JSON.parse(dec.decode(plain)) as { meta: VaultMetadata; data: number[] }
    return Uint8Array.from(envelope.data)
  }

  /** Decrypt and decode a vault as UTF-8 text. */
  async unlockText(ciphertext: string): Promise<string> {
    return dec.decode(await this.unlock(ciphertext))
  }

  /** Staged / partial unlock: split into shares that unlock on a schedule. */
  async lockShares(args: {
    payload: string | Uint8Array
    threshold: number
    schedule: Date[]
    label?: string
    kind?: VaultMetadata["kind"]
  }): Promise<VaultShare[]> {
    const total = args.schedule.length
    const shares = shamir.split(toBytes(args.payload), total, args.threshold)
    const vaults: VaultShare[] = []
    for (let i = 0; i < total; i++) {
      const vault = await this.lock({
        payload: shares[i].y,
        unlockAt: args.schedule[i],
        label: `${args.label ?? "Vault"} — share ${i + 1}/${total}`,
        kind: args.kind,
      })
      vaults.push({ index: shares[i].x, threshold: args.threshold, total, vault })
    }
    return vaults
  }

  /** Reconstruct a staged secret from enough unlocked shares. */
  async unlockShares(shares: VaultShare[]): Promise<Uint8Array> {
    const recovered: shamir.Share[] = []
    for (const s of shares) {
      recovered.push({ x: s.index, y: await this.unlock(s.vault.ciphertext) })
    }
    return shamir.combine(recovered)
  }

  /** Lock the same secret for multiple recipients (one vault each). */
  async lockForRecipients(args: {
    payload: string | Uint8Array
    unlockAt: Date
    recipients: string[]
    label?: string
    kind?: VaultMetadata["kind"]
  }): Promise<Record<string, Vault>> {
    const out: Record<string, Vault> = {}
    for (const r of args.recipients) {
      out[r] = await this.lock({
        payload: args.payload,
        unlockAt: args.unlockAt,
        label: `${args.label ?? "Shared vault"} — ${r}`,
        kind: args.kind,
      })
    }
    return out
  }

  /** Dead-man's switch: arm a vault that unlocks `interval` from now. */
  async arm(opts: DeadMansSwitchOptions): Promise<Vault> {
    return this.lockFor({
      payload: opts.payload,
      duration: opts.interval,
      label: opts.label ?? "Dead-man's switch",
      kind: opts.kind,
    })
  }

  /** Heartbeat: re-arm the switch by re-locking for another interval. */
  async heartbeat(opts: DeadMansSwitchOptions): Promise<Vault> {
    return this.arm(opts)
  }

  /** Decrypt then immediately re-lock with a new unlock date. */
  async relock(ciphertext: string, unlockAt: Date, label?: string): Promise<Vault> {
    const payload = await this.unlock(ciphertext)
    return this.lock({ payload, unlockAt, label })
  }

  /** Encode a vault as a shareable link anyone can open after unlock time. */
  toShareLink(baseUrl: string, vault: Vault): string {
    const token = btoa(JSON.stringify(vault)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    return `${baseUrl.replace(/\/$/, "")}/v/${token}`
  }

  /** Parse a shareable link (or raw token) back into a vault. */
  static fromShareLink(link: string): Vault {
    const token = link.split("/v/").pop() ?? link
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(atob(b64)) as Vault
  }
}
