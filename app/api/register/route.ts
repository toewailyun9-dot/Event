import { createRegistration } from "@/app/actions/registration";
import { createRegistrationSchema } from "@/lib/validation/registerations";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const limit = rateLimit({ maxRequests: 10, windowMs: 60 * 1000 });

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "anonymous";

    const { allowed, remaining } = limit(ip);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 100_000) {
      return NextResponse.json(
        { success: false, error: "Request body too large" },
        { status: 413 }
      );
    }

    const body = await request.json();
    const validated = createRegistrationSchema.parse(body);

    const result = await createRegistration(validated);

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 409 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Registration failed" },
      { status: 400 }
    );
  }
}
