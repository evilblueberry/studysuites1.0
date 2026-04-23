import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const quizzes = await prisma.quiz.findMany({
      where: {
        suiteId: params.id,
        ...(topicId ? { topicId } : {}),
      },
      include: {
        questions: true,
        topic: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ data: quizzes });
  } catch (err) {
    console.error("[GET /api/suites/[id]/quiz]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
