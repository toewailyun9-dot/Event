'use server'

import { createSession, setSessionCookie } from "@/lib/auth"
import { getClientIp, loginRateLimit } from "@/lib/rate-limit"
import { headers } from "next/headers"

export async function login(password: string) {
  const ip = getClientIp(await headers())
  const { allowed } = loginRateLimit(ip)
  
  if (!allowed) {
    return { success: false, error: "Too many login attempts. Please try again later." }
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return { success: false, error: "Incorrect password" }
  }

  const token = await createSession()
  await setSessionCookie(token)

  return { success: true }
}
