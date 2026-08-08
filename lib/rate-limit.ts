const store = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(options: { maxRequests: number; windowMs: number }) {
  return (key: string): { allowed: boolean; remaining: number; resetAt: number } => {
    const now = Date.now()
    const record = store.get(key)

    if (!record || now > record.resetAt) {
      const resetAt = now + options.windowMs
      store.set(key, { count: 1, resetAt })
      return { allowed: true, remaining: options.maxRequests - 1, resetAt }
    }

    record.count++
    if (record.count > options.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt }
    }

    return { allowed: true, remaining: options.maxRequests - record.count, resetAt: record.resetAt }
  }
}

/** Resolve client IP from a Headers bag (API routes or Server Actions). */
export function getClientIp(headerStore: Headers): string {
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "anonymous"
  )
}

/**
 * Shared single-registration limiter.
 * Used by createRegistration so both the form Server Action path and
 * /api/register (which calls the same action) share one counter.
 */
export const registrationRateLimit = rateLimit({
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX || "300", 10) || 300,
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10) || 60000,
})

/**
 * Shared login limiter to prevent brute force attacks.
 * Allows 5 attempts per minute per IP.
 */
export const loginRateLimit = rateLimit({
  maxRequests: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || "5", 10) || 5,
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || "60000", 10) || 60000,
})
