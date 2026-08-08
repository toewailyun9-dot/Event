import { createRegistrationsBatch } from "@/app/actions/registration";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const limit = rateLimit({
  // Configurable via env. Batch sync legitimately sends fewer, larger
  // requests than the single-registration route, so allow a higher rate.
  // Tune via RATE_LIMIT_BATCH_MAX / RATE_LIMIT_WINDOW_MS.
  maxRequests: parseInt(process.env.RATE_LIMIT_BATCH_MAX || "1000", 10) || 1000,
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10) || 60000,
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "anonymous";

    const { allowed } = limit(ip);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 200_000) {
      return NextResponse.json(
        { success: false, error: "Request body too large" },
        { status: 413 }
      );
    }

    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Expected an array of registrations" },
        { status: 400 }
      );
    }

    const result = await createRegistrationsBatch(body);

    if (result.success) {
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Batch registration failed" },
      { status: 400 }
    );
  }
}
