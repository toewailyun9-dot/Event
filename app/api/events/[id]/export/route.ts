import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { csvCell, csvField } from "@/lib/csv";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 1000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    select: { title: true },
  });

  if (!event) {
    return new Response("Event not found", { status: 404 });
  }

  const filename = `${event.title.replace(/[^a-zA-Z0-9 ]/g, "_")}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  const BOM = "\uFEFF";
  const headers = "Name,Email,Age,Phone,Address,Registered Date\n";

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(BOM + headers));

      let cursorId: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const batch = await prisma.registration.findMany({
          where: { eventId: id },
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          take: BATCH_SIZE,
          ...(cursorId
            ? {
                cursor: { id: cursorId },
                skip: 1,
              }
            : {}),
          select: {
            id: true,
            fullName: true,
            email: true,
            age: true,
            phone: true,
            address: true,
            createdAt: true,
          },
        });

        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        let rows = "";
        for (const r of batch) {
          rows += [
            csvField(r.fullName),
            csvField(r.email),
            r.age,
            csvCell(r.phone),
            csvField(r.address),
            csvField(new Date(r.createdAt).toLocaleDateString()),
          ].join(",");
          rows += "\n";
        }
        controller.enqueue(encoder.encode(rows));

        cursorId = batch[batch.length - 1].id;
        hasMore = batch.length === BATCH_SIZE;
      }

      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
