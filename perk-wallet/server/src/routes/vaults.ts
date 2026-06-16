/**
 * /api/vaults — ciphertext-only time-lock vault storage.
 *
 * The server NEVER sees plaintext. It stores age-armored tlock ciphertext plus
 * public metadata (label, unlock round/time, kind). All encryption and
 * decryption happens in the user's browser via @perk-wallet/perklock.
 */
import { Router } from "express"
import { z } from "zod"
import { randomUUID, randomBytes } from "node:crypto"
import { vaults } from "../db.js"
import { requireAuth, type AuthedRequest } from "../auth.js"

export const vaultsRouter = Router()

const CreateBody = z.object({
  label: z.string().min(1).max(120),
  ciphertext: z.string().min(1).max(200_000),
  unlockRound: z.number().int().positive(),
  unlockAt: z.string().datetime(),
  kind: z.enum(["key", "mnemonic", "address", "message"]).default("message"),
  shareable: z.boolean().optional(),
})

// --- public: resolve a shareable lock link ---
vaultsRouter.get("/shared/:token", (req, res) => {
  const v = vaults.getByShareToken(req.params.token)
  if (!v) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Shared vault not found." } })
    return
  }
  // Public link exposes ciphertext + metadata only — still undecryptable early.
  res.json({
    label: v.label,
    ciphertext: v.ciphertext,
    unlockRound: v.unlockRound,
    unlockAt: v.unlockAt,
    kind: v.kind,
  })
})

// --- authenticated routes ---
vaultsRouter.use(requireAuth)

vaultsRouter.get("/", (req: AuthedRequest, res) => {
  res.json(vaults.listByOwner(req.address!))
})

vaultsRouter.get("/:id", (req: AuthedRequest, res) => {
  const v = vaults.get(req.params.id)
  if (!v || v.ownerAddress !== req.address) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Vault not found." } })
    return
  }
  res.json(v)
})

vaultsRouter.post("/", (req: AuthedRequest, res) => {
  const parsed = CreateBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid input." } })
    return
  }
  const created = vaults.create({
    id: randomUUID(),
    ownerAddress: req.address!,
    label: parsed.data.label,
    ciphertext: parsed.data.ciphertext,
    unlockRound: parsed.data.unlockRound,
    unlockAt: parsed.data.unlockAt,
    kind: parsed.data.kind,
    shareToken: parsed.data.shareable ? randomBytes(12).toString("hex") : null,
    createdAt: new Date().toISOString(),
  })
  res.status(201).json(created)
})

vaultsRouter.delete("/:id", (req: AuthedRequest, res) => {
  const ok = vaults.delete(req.params.id, req.address!)
  if (!ok) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Vault not found." } })
    return
  }
  res.status(204).end()
})
