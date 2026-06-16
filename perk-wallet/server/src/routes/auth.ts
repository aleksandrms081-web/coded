/**
 * /api/auth — Sign-In-With-Ethereum challenge/response.
 *
 *   GET  /api/auth/nonce   -> { nonce }
 *   POST /api/auth/verify  -> { token, address }
 */
import { Router } from "express"
import { z } from "zod"
import { makeNonce, verifySiwe, issueToken } from "../auth.js"
import { authRateLimit } from "../security.js"

export const authRouter = Router()

authRouter.use(authRateLimit)

authRouter.get("/nonce", (_req, res) => {
  res.json({ nonce: makeNonce() })
})

const VerifyBody = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
  nonce: z.string().optional(),
})

authRouter.post("/verify", async (req, res) => {
  const parsed = VerifyBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ error: { code: "VALIDATION", message: "message and signature are required." } })
    return
  }
  try {
    const address = await verifySiwe(parsed.data.message, parsed.data.signature, parsed.data.nonce)
    const token = issueToken(address)
    res.json({ token, address })
  } catch {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Signature verification failed." } })
  }
})
