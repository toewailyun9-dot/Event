'use client'

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { login } from "@/app/actions/auth"
import { toast } from "sonner"

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-zinc-400">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/admin"
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const result = await login(form.get("password") as string)

    if (result.success) {
      toast.success("Login successful")
      router.push(redirectTo)
    } else {
      toast.error(result.error || "Login failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-sm text-zinc-400">အက်ဒမင် စာမျက်နှာသို့ ဝင်ရောက်ရန်</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
