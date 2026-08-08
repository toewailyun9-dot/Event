import { describe, it, expect } from "vitest"
import {
  escapeHtml,
  replacePlaceholders,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
  buildEmailHtml,
  buildUnsubscribeUrl,
} from "@/lib/email-utils"

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`<script>alert("x") & 'y'</script>`)).toBe(
      `&lt;script&gt;alert(&quot;x&quot;) &amp; &#39;y&#39;&lt;/script&gt;`
    )
  })

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("Hello မင်္ဂလာပါ")).toBe("Hello မင်္ဂလာပါ")
  })
})

describe("replacePlaceholders", () => {
  it("replaces all placeholders", () => {
    const out = replacePlaceholders(
      "{name} — {eventTitle} — {eventDate}",
      { name: "Aung", eventTitle: "Tech Summit", eventDate: "Aug 12" }
    )
    expect(out).toBe("Aung — Tech Summit — Aug 12")
  })

  it("leaves unknown placeholders untouched", () => {
    expect(replacePlaceholders("{name} {foo}", { name: "Aung" })).toBe("Aung {foo}")
  })

  it("replaces repeated occurrences", () => {
    expect(replacePlaceholders("{eventTitle} vs {eventTitle}", { eventTitle: "A" })).toBe("A vs A")
  })

  it("handles text without placeholders", () => {
    expect(replacePlaceholders("plain text", { name: "x" })).toBe("plain text")
  })
})

describe("unsubscribe token", () => {
  it("verifies a valid token", () => {
    const token = signUnsubscribeToken("user@example.com")
    expect(verifyUnsubscribeToken("user@example.com", token)).toBe(true)
  })

  it("rejects a tampered token", () => {
    const token = signUnsubscribeToken("user@example.com")
    expect(verifyUnsubscribeToken("user@example.com", token + "x")).toBe(false)
    expect(verifyUnsubscribeToken("other@example.com", token)).toBe(false)
  })

  it("rejects a malformed token", () => {
    expect(verifyUnsubscribeToken("user@example.com", "not-a-token")).toBe(false)
  })

  it("builds a URL with email and token", () => {
    const url = buildUnsubscribeUrl("user@example.com")
    expect(decodeURIComponent(url)).toContain("user@example.com")
    expect(url).toContain("token=")
  })
})

describe("buildEmailHtml", () => {
  it("includes the personalized name and body", () => {
    const html = buildEmailHtml({
      name: "Aung",
      body: "လာမည့် Event တွင် ပါဝင်ရန် ဖိတ်ခေါ်ပါသည်။",
      unsubscribeUrl: "https://example.com/api/unsubscribe?x=1",
    })
    expect(html).toContain("Aung")
    expect(html).toContain("လာမည့် Event")
    expect(html).toContain("https://example.com/api/unsubscribe?x=1")
  })

  it("escapes unsafe content in name and body", () => {
    const html = buildEmailHtml({
      name: "<script>alert(1)</script>",
      body: "<img src=x onerror=alert(1)>",
      unsubscribeUrl: "https://example.com",
    })
    expect(html).not.toContain("<script>")
    expect(html).not.toContain("<img")
    expect(html).toContain("&lt;script&gt;")
  })

  it("defaults greeting when name is missing", () => {
    const html = buildEmailHtml({
      body: "hi",
      unsubscribeUrl: "https://example.com",
    })
    expect(html).toContain("လေးစားအပ်ပါသော")
  })
})
