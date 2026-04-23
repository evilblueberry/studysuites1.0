import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    });

    if (!suite) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const topics = await prisma.topic.findMany({
      where: { suiteId: params.id },
      include: {
        _count: { select: { flashcards: true, notes: true } },
        notes: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ data: topics });
  } catch (err) {
    console.error("[GET /api/suites/[id]/topics]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
