import { describe, it, expect } from "vitest"
import { parseRegistrationsCsv } from "@/lib/csv-parse"

const headers = "Name,Email,Age,Phone,Address"

describe("parseRegistrationsCsv", () => {
  it("parses basic rows", () => {
    const result = parseRegistrationsCsv(
      `${headers}\nAung Aung,a@b.com,25,0912345678,Yangon\nSu Su,s@b.com,30,0999999999,Mandalay`
    )
    expect(result.errors).toEqual([])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({
      row: 2,
      name: "Aung Aung",
      email: "a@b.com",
      age: "25",
      phone: "0912345678",
      address: "Yangon",
    })
  })

  it("strips the UTF-8 BOM", () => {
    const result = parseRegistrationsCsv(
      `\uFEFF${headers}\nAung Aung,a@b.com,25,0912345678,Yangon`
    )
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].name).toBe("Aung Aung")
  })

  it("handles quoted fields with commas", () => {
    const result = parseRegistrationsCsv(
      `${headers}\n"Doe, John",j@b.com,25,0912345678,"Yangon, Myanmar"`
    )
    expect(result.rows[0].name).toBe("Doe, John")
    expect(result.rows[0].address).toBe("Yangon, Myanmar")
  })

  it("strips the Excel text-formula wrapper on phone cells", () => {
    // This is exactly how lib/csv.ts writes the phone column.
    const result = parseRegistrationsCsv(
      `${headers}\nAung Aung,a@b.com,25,"=""0912345678""",Yangon`
    )
    expect(result.rows[0].phone).toBe("0912345678")
  })

  it("unescapes doubled quotes inside Excel formula cells", () => {
    const result = parseRegistrationsCsv(
      `${headers}\nAung Aung,a@b.com,25,"=""09""12""",Yangon`
    )
    expect(result.rows[0].phone).toBe('09"12')
  })

  it("ignores extra columns like Registered Date", () => {
    const result = parseRegistrationsCsv(
      `${headers},Registered Date\nAung Aung,a@b.com,25,0912345678,Yangon,8/8/2026`
    )
    expect(result.rows[0].name).toBe("Aung Aung")
  })

  it("reports missing required columns", () => {
    const result = parseRegistrationsCsv("Name,Email,Age,Phone\nAung Aung,a@b.com,25,0912345678")
    expect(result.rows).toHaveLength(0)
    expect(result.errors[0].error).toContain("address")
  })

  it("handles CRLF line endings", () => {
    const result = parseRegistrationsCsv(
      `${headers}\r\nAung Aung,a@b.com,25,0912345678,Yangon\r\n`
    )
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].email).toBe("a@b.com")
  })

  it("handles multi-line quoted fields", () => {
    const result = parseRegistrationsCsv(
      `${headers}\nAung Aung,a@b.com,25,0912345678,"Line 1\nLine 2"`
    )
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].address).toBe("Line 1\nLine 2")
  })

  it("returns an error for an empty file", () => {
    const result = parseRegistrationsCsv("")
    expect(result.rows).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
