'use server'

import { createSession, setSessionCookie } from "@/lib/auth"

export async function login(password: string) {
  if (password !== process.env.ADMIN_PASSWORD) {
    return { success: false, error: "Incorrect password" }
  }

  const token = await createSession()
  await setSessionCookie(token)

  return { success: true }
}
