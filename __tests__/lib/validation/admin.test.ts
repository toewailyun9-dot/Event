import { describe, it, expect } from "vitest"
import { createEventSchema, toggleEventStatusSchema, deleteRegistrationSchema, getRegistrationsSchema, updateEventSchema, deleteEventSchema } from "@/lib/validation/admin"

describe("createEventSchema", () => {
  it("accepts valid event data", () => {
    const result = createEventSchema.safeParse({
      title: "Tech Conference 2026",
      slug: "tech-conf-2026",
      eventDate: "2026-12-01T09:00:00Z",
      location: "Yangon",
    })
    expect(result.success).toBe(true)
  })

  it("accepts event without location", () => {
    const result = createEventSchema.safeParse({
      title: "Workshop",
      slug: "workshop",
      eventDate: "2026-12-01T09:00:00Z",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty title", () => {
    const result = createEventSchema.safeParse({
      title: "",
      slug: "workshop",
      eventDate: "2026-12-01T09:00:00Z",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid slug (uppercase)", () => {
    const result = createEventSchema.safeParse({
      title: "Workshop",
      slug: "WORKSHOP",
      eventDate: "2026-12-01T09:00:00Z",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid slug (spaces)", () => {
    const result = createEventSchema.safeParse({
      title: "Workshop",
      slug: "my workshop",
      eventDate: "2026-12-01T09:00:00Z",
    })
    expect(result.success).toBe(false)
  })

  it("transforms eventDate string to Date", () => {
    const result = createEventSchema.safeParse({
      title: "Workshop",
      slug: "workshop",
      eventDate: "2026-12-01T09:00:00Z",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.eventDate).toBeInstanceOf(Date)
    }
  })

  it("accepts eventDate as Date object (server action serialization)", () => {
    const result = createEventSchema.safeParse({
      title: "Workshop",
      slug: "workshop",
      eventDate: new Date("2026-12-01T09:00:00Z"),
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.eventDate).toBeInstanceOf(Date)
    }
  })

  it("rejects eventDate in the past", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const result = createEventSchema.safeParse({
      title: "Workshop",
      slug: "workshop",
      eventDate: past,
    })
    expect(result.success).toBe(false)
  })

  it("rejects eventDate in the past (Date object)", () => {
    const result = createEventSchema.safeParse({
      title: "Workshop",
      slug: "workshop",
      eventDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    })
    expect(result.success).toBe(false)
  })

  it("accepts a future eventDate", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const result = createEventSchema.safeParse({
      title: "Workshop",
      slug: "workshop",
      eventDate: future,
    })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid eventDate string", () => {
    const result = createEventSchema.safeParse({
      title: "Workshop",
      slug: "workshop",
      eventDate: "not-a-date",
    })
    expect(result.success).toBe(false)
  })
})

describe("toggleEventStatusSchema", () => {
  it("accepts valid data", () => {
    const result = toggleEventStatusSchema.safeParse({ id: "evt_001", currentStatus: true })
    expect(result.success).toBe(true)
  })

  it("rejects missing id", () => {
    const result = toggleEventStatusSchema.safeParse({ currentStatus: true })
    expect(result.success).toBe(false)
  })

  it("rejects non-boolean currentStatus", () => {
    const result = toggleEventStatusSchema.safeParse({ id: "evt_001", currentStatus: "yes" })
    expect(result.success).toBe(false)
  })
})

describe("deleteRegistrationSchema", () => {
  it("accepts valid id", () => {
    const result = deleteRegistrationSchema.safeParse({ id: "reg_001" })
    expect(result.success).toBe(true)
  })

  it("rejects empty id", () => {
    const result = deleteRegistrationSchema.safeParse({ id: "" })
    expect(result.success).toBe(false)
  })
})

describe("updateEventSchema", () => {
  const base = {
    id: "evt_001",
    title: "Tech Conference 2026",
    slug: "tech-conf-2026",
    eventDate: "2026-12-01T09:00:00Z",
    location: "Yangon",
  }

  it("accepts valid event data", () => {
    const result = updateEventSchema.safeParse(base)
    expect(result.success).toBe(true)
  })

  it("accepts eventDate as Date object", () => {
    const result = updateEventSchema.safeParse({ ...base, eventDate: new Date("2026-12-01T09:00:00Z") })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.eventDate).toBeInstanceOf(Date)
    }
  })

  it("rejects missing id", () => {
    const { id, ...rest } = base
    const result = updateEventSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it("rejects empty title", () => {
    const result = updateEventSchema.safeParse({ ...base, title: "" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid slug", () => {
    const result = updateEventSchema.safeParse({ ...base, slug: "Invalid Slug" })
    expect(result.success).toBe(false)
  })
})

describe("deleteEventSchema", () => {
  it("accepts valid id", () => {
    const result = deleteEventSchema.safeParse({ id: "evt_001" })
    expect(result.success).toBe(true)
  })

  it("rejects empty id", () => {
    const result = deleteEventSchema.safeParse({ id: "" })
    expect(result.success).toBe(false)
  })
})

describe("getRegistrationsSchema", () => {
  it("applies defaults for empty params", () => {
    const result = getRegistrationsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it("accepts search param", () => {
    const result = getRegistrationsSchema.safeParse({ search: "john" })
    expect(result.success).toBe(true)
  })

  it("accepts eventId filter", () => {
    const result = getRegistrationsSchema.safeParse({ eventId: "evt_001" })
    expect(result.success).toBe(true)
  })

  it("accepts date range", () => {
    const result = getRegistrationsSchema.safeParse({ dateFrom: "2026-01-01", dateTo: "2026-12-31" })
    expect(result.success).toBe(true)
  })

  it("rejects pageSize over 500", () => {
    const result = getRegistrationsSchema.safeParse({ pageSize: 1000 })
    expect(result.success).toBe(false)
  })

  it("coerces string page to number", () => {
    const result = getRegistrationsSchema.safeParse({ page: "3" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
    }
  })
})
