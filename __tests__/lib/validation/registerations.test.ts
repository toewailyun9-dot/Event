import { describe, it, expect } from "vitest"
import { createRegistrationSchema } from "@/lib/validation/registerations"

const validData = {
  eventId: "evt_001",
  name: "John Doe",
  email: "john@example.com",
  age: 25,
  phone: "0912345678",
  address: "123 Main Street, Yangon",
}

describe("createRegistrationSchema", () => {
  it("accepts valid registration data", () => {
    const result = createRegistrationSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("accepts data without eventId (offline auto-detect)", () => {
    const { eventId, ...noEvent } = validData
    const result = createRegistrationSchema.safeParse(noEvent)
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = createRegistrationSchema.safeParse({ ...validData, name: "" })
    expect(result.success).toBe(false)
  })

  it("rejects name shorter than 2 characters", () => {
    const result = createRegistrationSchema.safeParse({ ...validData, name: "A" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const result = createRegistrationSchema.safeParse({ ...validData, email: "not-an-email" })
    expect(result.success).toBe(false)
  })

  it("rejects age below 10", () => {
    const result = createRegistrationSchema.safeParse({ ...validData, age: 5 })
    expect(result.success).toBe(false)
  })

  it("rejects age above 120", () => {
    const result = createRegistrationSchema.safeParse({ ...validData, age: 200 })
    expect(result.success).toBe(false)
  })

  it("rejects phone shorter than 8 characters", () => {
    const result = createRegistrationSchema.safeParse({ ...validData, phone: "12345" })
    expect(result.success).toBe(false)
  })

  it("rejects address shorter than 5 characters", () => {
    const result = createRegistrationSchema.safeParse({ ...validData, address: "ABC" })
    expect(result.success).toBe(false)
  })

  it("accepts optional syncId field", () => {
    const result = createRegistrationSchema.safeParse({ ...validData, syncId: "uuid-123" })
    expect(result.success).toBe(true)
  })

  it("accepts isOfflineSynced field", () => {
    const result = createRegistrationSchema.safeParse({ ...validData, isOfflineSynced: true })
    expect(result.success).toBe(true)
  })

  it("accepts isOfflineSynced=false", () => {
    const result = createRegistrationSchema.safeParse({ ...validData, isOfflineSynced: false })
    expect(result.success).toBe(true)
  })
})
