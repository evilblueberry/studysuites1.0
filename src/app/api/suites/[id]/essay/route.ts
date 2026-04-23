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

    const prompts = await prisma.essayPrompt.findMany({
      where: { suiteId: params.id },
      include: { topic: { select: { id: true, title: true } } },
    });

    return NextResponse.json({ data: prompts });
  } catch (err) {
    console.error("[GET /api/suites/[id]/essay]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
