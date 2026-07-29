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

    if (record.count >= options.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt }
    }

    record.count++
    return { allowed: true, remaining: options.maxRequests - record.count, resetAt: record.resetAt }
  }
}
