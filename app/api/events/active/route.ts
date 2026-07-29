import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const event = await prisma.event.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        eventDate: true,
        location: true,
      },
    });

    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ event: null }, { status: 200 });
  }
}
