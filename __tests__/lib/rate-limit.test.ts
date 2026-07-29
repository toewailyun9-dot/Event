import { describe, it, expect, beforeEach } from "vitest"
import { rateLimit } from "@/lib/rate-limit"

describe("rateLimit", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("allows first request", () => {
    const limiter = rateLimit({ maxRequests: 3, windowMs: 1000 })
    const result = limiter("test-1")
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it("allows requests within limit", () => {
    const limiter = rateLimit({ maxRequests: 3, windowMs: 1000 })
    limiter("test-2")
    limiter("test-2")
    const result = limiter("test-2")
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it("blocks request when limit exceeded", () => {
    const limiter = rateLimit({ maxRequests: 3, windowMs: 1000 })
    for (let i = 0; i < 3; i++) limiter("test-3")
    const result = limiter("test-3")
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("tracks remaining requests correctly", () => {
    const limiter = rateLimit({ maxRequests: 3, windowMs: 1000 })
    expect(limiter("test-4").remaining).toBe(2)
    expect(limiter("test-4").remaining).toBe(1)
    expect(limiter("test-4").remaining).toBe(0)
    expect(limiter("test-4").remaining).toBe(0)
  })

  it("has separate counters for different IPs", () => {
    const limiter = rateLimit({ maxRequests: 3, windowMs: 1000 })
    limiter("ip-a")
    limiter("ip-a")

    const resultB = limiter("ip-b")
    expect(resultB.allowed).toBe(true)
    expect(resultB.remaining).toBe(2)
  })

  it("resets after window expires", async () => {
    const fastLimiter = rateLimit({ maxRequests: 1, windowMs: 50 })

    fastLimiter("test-5")
    expect(fastLimiter("test-5").allowed).toBe(false)

    await new Promise((r) => setTimeout(r, 60))

    const result = fastLimiter("test-5")
    expect(result.allowed).toBe(true)
  })
})
