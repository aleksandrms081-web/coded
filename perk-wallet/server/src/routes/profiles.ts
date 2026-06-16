/**
 * /api/profiles — public profile lookups + authenticated create/update.
 */
import { Router } from "express"
import { z } from "zod"
import { profiles } from "../db.js"
import { requireAuth, type AuthedRequest } from "../auth.js"

export const profilesRouter = Router()

const usernameSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers and underscores only.")

const socialsSchema = z
  .object({
    x: z.string().max(100).optional(),
    github: z.string().max(100).optional(),
    website: z.string().url().max(200).optional(),
  })
  .partial()

// --- public reads ---

profilesRouter.get("/check-username/:username", (req, res) => {
  const parsed = usernameSchema.safeParse(req.params.username)
  if (!parsed.success) {
    res.json({ available: false, reason: "invalid" })
    return
  }
  res.json({ available: !profiles.usernameTaken(parsed.data) })
})

profilesRouter.get("/by-address/:address", (req, res) => {
  const p = profiles.getByAddress(req.params.address)
  if (!p) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Profile not found." } })
    return
  }
  res.json(p)
})

profilesRouter.get("/:username", (req, res) => {
  const p = profiles.getByUsername(req.params.username)
  if (!p) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Profile not found." } })
    return
  }
  res.json(p)
})

// --- authenticated writes ---

const CreateBody = z.object({
  username: usernameSchema,
  displayName: z.string().min(1).max(60),
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().url().max(400).optional(),
  socials: socialsSchema.optional(),
})

profilesRouter.post("/", requireAuth, (req: AuthedRequest, res) => {
  const parsed = CreateBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid input." } })
    return
  }
  const existing = profiles.getByUsername(parsed.data.username)
  if (existing && existing.address !== req.address) {
    res.status(409).json({ error: { code: "USERNAME_TAKEN", message: "That username is already in use." } })
    return
  }
  const profile = profiles.upsert({
    address: req.address!,
    username: parsed.data.username,
    displayName: parsed.data.displayName,
    bio: parsed.data.bio ?? null,
    avatarUrl: parsed.data.avatarUrl ?? null,
    socials: parsed.data.socials ?? null,
  })
  res.status(201).json(profile)
})

const PatchBody = CreateBody.partial()

profilesRouter.patch("/", requireAuth, (req: AuthedRequest, res) => {
  const parsed = PatchBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid input." } })
    return
  }
  const current = profiles.getByAddress(req.address!)
  if (!current) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Create a profile first." } })
    return
  }
  if (parsed.data.username && parsed.data.username !== current.username) {
    const taken = profiles.getByUsername(parsed.data.username)
    if (taken && taken.address !== req.address) {
      res.status(409).json({ error: { code: "USERNAME_TAKEN", message: "That username is already in use." } })
      return
    }
  }
  const profile = profiles.upsert({
    address: req.address!,
    username: parsed.data.username ?? current.username,
    displayName: parsed.data.displayName ?? current.displayName,
    bio: parsed.data.bio ?? current.bio,
    avatarUrl: parsed.data.avatarUrl ?? current.avatarUrl,
    socials: parsed.data.socials ?? current.socials,
  })
  res.json(profile)
})
