import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/progress — upsert study progress
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { suiteId, topicId, completionPercent, masteryLevel } = await req.json();

    if (!suiteId) return NextResponse.json({ error: "suiteId required" }, { status: 400 });

    const progress = await prisma.studyProgress.upsert({
      where: {
        userId_suiteId_topicId: {
          userId: user.id,
          suiteId,
          topicId: topicId ?? null,
        },
      },
      update: {
        completionPercent: completionPercent ?? undefined,
        masteryLevel: masteryLevel ?? undefined,
        lastStudiedAt: new Date(),
      },
      create: {
        userId: user.id,
        suiteId,
        topicId: topicId ?? null,
        completionPercent: completionPercent ?? 0,
        masteryLevel: masteryLevel ?? 0,
      },
    });

    return NextResponse.json({ data: progress });
  } catch (err) {
    console.error("[POST /api/progress]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/progress?suiteId=xxx
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const suiteId = searchParams.get("suiteId");

    const where = suiteId
      ? { userId: user.id, suiteId }
      : { userId: user.id };

    const progress = await prisma.studyProgress.findMany({ where });
    return NextResponse.json({ data: progress });
  } catch (err) {
    console.error("[GET /api/progress]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
