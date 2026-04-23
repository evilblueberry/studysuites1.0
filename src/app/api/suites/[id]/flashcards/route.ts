import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId");

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

    const flashcards = await prisma.flashcard.findMany({
      where: {
        suiteId: params.id,
        ...(topicId ? { topicId } : {}),
      },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ data: flashcards });
  } catch (err) {
    console.error("[GET /api/suites/[id]/flashcards]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// PATCH /api/suites/[id]/flashcards — update difficulty tag
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { flashcardId, difficultyTag } = body;

    // Verify access
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

    const updated = await prisma.flashcard.update({
      where: { id: flashcardId },
      data: { difficultyTag },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[PATCH /api/suites/[id]/flashcards]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
