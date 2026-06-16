/**
 * Centralised security middleware: hardened HTTP headers, a strict
 * Content-Security-Policy, CORS allow-listing and rate limiting.
 *
 * Applied early in the Express pipeline (see index.ts).
 */
import type { Express, Request, Response, NextFunction } from "express"
import helmet from "helmet"
import cors from "cors"
import rateLimit from "express-rate-limit"
import { config } from "./config.js"

/** Strict CSP — the SPA is self-hosted, so default to 'self' and deny framing. */
const contentSecurityPolicy = {
  useDefaults: true,
  directives: {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    imgSrc: ["'self'", "data:", "blob:"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    // RPC + drand endpoints are reached from the browser; allow https/wss.
    connectSrc: ["'self'", "https:", "wss:"],
    fontSrc: ["'self'", "data:"],
    formAction: ["'self'"],
    upgradeInsecureRequests: config.isProd ? [] : null,
  },
}

/** Allow only configured origins; reject others. */
const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // same-origin / curl / server-to-server (no Origin header) is allowed
    if (!origin || config.corsOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}

/** Global rate limiter to blunt brute-force / abuse. */
export const globalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests, slow down." } },
})

/** Tighter limiter for auth endpoints (nonce/verify). */
export const authRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many auth attempts." } },
})

/** Strip fingerprinting header. */
function removePoweredBy(_req: Request, res: Response, next: NextFunction): void {
  res.removeHeader("X-Powered-By")
  next()
}

/** Wire all security middleware onto the app. Call before routes. */
export function applySecurity(app: Express): void {
  app.disable("x-powered-by")
  app.use(removePoweredBy)
  app.use(
    helmet({
      contentSecurityPolicy,
      crossOriginEmbedderPolicy: false,
      hsts: config.isProd ? { maxAge: 15552000, includeSubDomains: true, preload: true } : false,
      referrerPolicy: { policy: "no-referrer" },
    }),
  )
  app.use(cors(corsOptions))
  app.use(globalRateLimit)
}
