import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/suites/[id]/status
 * Lightweight status poll — the Create Suite page polls this until status = READY.
 * Returns only id, status, and counts so it's cheap to call every 3s.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    const suite = await prisma.testSuite.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: user.id },
          { collaborators: { some: { userId: user.id } } },
        ],
      },
      select: {
        id: true,
        status: true,
        _count: { select: { topics: true, flashcards: true } },
      },
    });

    if (!suite) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: suite });
  } catch (err) {
    console.error("[GET /api/suites/[id]/status]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
