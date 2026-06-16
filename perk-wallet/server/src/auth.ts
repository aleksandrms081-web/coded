/**
 * Sign-In-With-Ethereum (EIP-4361) verification and JWT session middleware.
 * The wallet proves control of an address by signing a nonce; we issue a
 * short-lived JWT in return. No passwords, no custody.
 */
import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { SiweMessage } from "siwe"
import { randomBytes } from "node:crypto"
import { config } from "./config.js"

export interface AuthedRequest extends Request {
  address?: string
}

/** Generate a random nonce for a SIWE challenge. */
export function makeNonce(): string {
  return randomBytes(16).toString("hex")
}

/** Verify a signed SIWE message and return the recovered address. */
export async function verifySiwe(message: string, signature: string, expectedNonce?: string): Promise<string> {
  const siwe = new SiweMessage(message)
  const result = await siwe.verify({
    signature,
    domain: config.siwe.domain,
    nonce: expectedNonce,
  })
  if (!result.success) {
    throw new Error("SIWE verification failed")
  }
  return result.data.address
}

/** Issue a session token for an authenticated address. */
export function issueToken(address: string): string {
  return jwt.sign({ sub: address }, config.jwt.secret, { expiresIn: config.jwt.ttl })
}

/** Express middleware that requires a valid bearer token. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing bearer token." } })
    return
  }
  try {
    const payload = jwt.verify(header.slice(7), config.jwt.secret) as { sub: string }
    req.address = payload.sub
    next()
  } catch {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid or expired token." } })
  }
}
