/**
 * Perk Wallet API entry point.
 *
 * Custody-free: stores public profiles + ciphertext-only time-lock vaults.
 * Security middleware (helmet, CSP, CORS allow-list, rate limiting) is applied
 * before any route. See security.ts.
 */
import express from "express"
import { config } from "./config.js"
import { applySecurity } from "./security.js"
import { authRouter } from "./routes/auth.js"
import { profilesRouter } from "./routes/profiles.js"
import { vaultsRouter } from "./routes/vaults.js"

const app = express()

// Trust the reverse proxy (Caddy/nginx) so rate-limit + secure cookies see
// the real client IP and protocol.
app.set("trust proxy", 1)

// Security first, then body parsing.
applySecurity(app)
app.use(express.json({ limit: "256kb" }))

// Liveness probe (used by the Docker HEALTHCHECK).
app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() })
})

// API routes
app.use("/api/auth", authRouter)
app.use("/api/profiles", profilesRouter)
app.use("/api/vaults", vaultsRouter)

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Resource not found." } })
})

// Centralised error handler.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : "Unexpected error"
  const status = message === "Not allowed by CORS" ? 403 : 500
  // eslint-disable-next-line no-console
  if (status >= 500) console.error("[api] error:", err)
  res.status(status).json({ error: { code: status === 403 ? "FORBIDDEN" : "INTERNAL", message } })
})

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Perk Wallet API listening on :${config.port} (${config.env})`)
})

export default app
