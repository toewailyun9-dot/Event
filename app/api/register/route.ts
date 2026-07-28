import { createRegistration} from "@/app/actions/registration";
import { createRegistrationSchema } from "@/lib/validation/registerations";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createRegistrationSchema.parse(body);
    
    const result = await createRegistration(validated);

    // Return proper HTTP status codes so the Service Worker can act accordingly
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data }, { status: 200 });
    }

    // Validation or business logic errors (e.g. duplicate email)
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
