import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const COOKIE_NAME = "admin_session"

const protectedPaths = ["/admin"]
const excludedPaths = ["/admin/login"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
  const isExcluded = excludedPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !isExcluded) {
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
