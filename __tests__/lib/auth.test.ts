// @vitest-environment node
import { describe, it, expect } from "vitest"
import { createSession, verifySession } from "@/lib/auth"

describe("auth", () => {
  describe("createSession", () => {
    it("returns a JWT string", async () => {
      const token = await createSession()
      expect(token).toBeDefined()
      expect(typeof token).toBe("string")
      expect(token.split(".").length).toBe(3)
    })
  })

  describe("verifySession", () => {
    it("returns true for a valid token", async () => {
      const token = await createSession()
      const result = await verifySession(token)
      expect(result).toBe(true)
    })

    it("returns false for an expired token", async () => {
      const { SignJWT } = await import("jose")
      const secret = new TextEncoder().encode("test-secret-that-is-at-least-32-chars-long!!")
      const expiredToken = await new SignJWT({ role: "admin" })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("0s")
        .sign(secret)

      const result = await verifySession(expiredToken)
      expect(result).toBe(false)
    })

    it("returns false for a tampered token", async () => {
      const token = await createSession()
      const parts = token.split(".")
      const tampered = parts[0] + "." + parts[1] + ".invalidsignature"
      const result = await verifySession(tampered)
      expect(result).toBe(false)
    })

    it("returns false for an empty string", async () => {
      const result = await verifySession("")
      expect(result).toBe(false)
    })

    it("returns false for garbage string", async () => {
      const result = await verifySession("not.a.jwt")
      expect(result).toBe(false)
    })

    it("returns false when role is not admin", async () => {
      const { SignJWT } = await import("jose")
      const secret = new TextEncoder().encode("test-secret-that-is-at-least-32-chars-long!!")
      const userToken = await new SignJWT({ role: "user" })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("1h")
        .sign(secret)

      const result = await verifySession(userToken)
      expect(result).toBe(false)
    })

    it("returns false when token has no role", async () => {
      const { SignJWT } = await import("jose")
      const secret = new TextEncoder().encode("test-secret-that-is-at-least-32-chars-long!!")
      const noRoleToken = await new SignJWT({ sub: "123" })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("1h")
        .sign(secret)

      const result = await verifySession(noRoleToken)
      expect(result).toBe(false)
    })
  })
})
