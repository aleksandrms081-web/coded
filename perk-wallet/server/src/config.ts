/**
 * Centralised, validated runtime configuration.
 * Fails fast at startup if required secrets are missing in production.
 */
import { z } from "zod"

const RawEnv = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  DATA_DIR: z.string().default("./data"),

  // Auth / sessions
  JWT_SECRET: z.string().min(16).optional(),
  JWT_TTL: z.string().default("7d"),

  // Sign-In-With-Ethereum
  SIWE_DOMAIN: z.string().default("localhost"),
  SIWE_ORIGIN: z.string().optional(),

  // CORS — comma-separated list of allowed browser origins
  CORS_ORIGINS: z.string().default("http://localhost:5173"),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
})

const parsed = RawEnv.parse(process.env)

const isProd = parsed.NODE_ENV === "production"

// In production a strong JWT secret is mandatory. In dev we generate an
// ephemeral one so the app still boots, but warn loudly.
let jwtSecret = parsed.JWT_SECRET
if (!jwtSecret) {
  if (isProd) {
    throw new Error("JWT_SECRET is required in production. Set it to a 32+ byte random string.")
  }
  jwtSecret = "dev-only-insecure-secret-change-me"
  // eslint-disable-next-line no-console
  console.warn("[config] JWT_SECRET not set — using an insecure development secret.")
}

export const config = {
  env: parsed.NODE_ENV,
  isProd,
  port: parsed.PORT,
  dataDir: parsed.DATA_DIR,
  jwt: {
    secret: jwtSecret,
    ttl: parsed.JWT_TTL,
  },
  siwe: {
    domain: parsed.SIWE_DOMAIN,
    origin: parsed.SIWE_ORIGIN ?? `https://${parsed.SIWE_DOMAIN}`,
  },
  corsOrigins: parsed.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
  rateLimit: {
    windowMs: parsed.RATE_LIMIT_WINDOW_MS,
    max: parsed.RATE_LIMIT_MAX,
  },
} as const

export type Config = typeof config
