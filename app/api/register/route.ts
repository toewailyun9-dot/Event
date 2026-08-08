import { createRegistration } from "@/app/actions/registration";
import { createRegistrationSchema } from "@/lib/validation/registerations";
import { NextResponse } from "next/server";

/**
 * HTTP wrapper around createRegistration.
 * Rate limiting lives in the Server Action so the online form path
 * (which calls the action directly) is covered too — do not re-check here
 * or a single API request would consume two limiter slots.
 */
export async function POST(request: Request) {
  try {
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

    const status =
      result.error === "Too many requests. Please try again later." ? 429 : 409;

    return NextResponse.json(
      { success: false, error: result.error },
      {
        status,
        ...(status === 429 ? { headers: { "Retry-After": "60" } } : {}),
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Registration failed" },
      { status: 400 }
    );
  }
}
