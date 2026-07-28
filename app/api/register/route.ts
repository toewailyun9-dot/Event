import { createRegistration} from "@/app/actions/registration";
import { createRegistrationSchema } from "@/lib/validation/registerations";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createRegistrationSchema.parse(body);
    
    const result = await createRegistration(validated);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Registration failed" },
      { status: 400 }
    );
  }
}