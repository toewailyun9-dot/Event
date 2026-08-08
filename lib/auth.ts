import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("AUTH_SECRET is not set in production. Please set it in your environment variables.");
}

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-change-in-production"
)

const COOKIE_NAME = "admin_session"
const SESSION_DURATION = 60 * 60 * 24 // 24 hours

export async function createSession(): Promise<string> {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DURATION}s`)
    .setIssuedAt()
    .sign(ADMIN_SECRET)
  return token
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_SECRET)
    return payload.role === "admin"
  } catch {
    return false
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionToken()
  if (!token) return false
  return verifySession(token)
}

export async function requireAuth(): Promise<{ success: true } | { success: false; error: string }> {
  if (!(await isAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }
  return { success: true }
}

