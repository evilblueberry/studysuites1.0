import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processSuite } from "@/services/suiteProcessor";

/**
 * POST /api/suites/[id]/regenerate
 *
 * Re-runs the full AI generation pipeline for a suite.
 * Only the owner can trigger this. Suite must have uploaded files.
 * Clears existing generated content and regenerates from scratch.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    const suite = await prisma.testSuite.findFirst({
      where: { id: params.id, ownerId: user.id },
      include: { _count: { select: { files: true } } },
    });

    if (!suite) {
      return NextResponse.json(
        { error: "Not found or unauthorized — only the owner can regenerate" },
        { status: 403 }
      );
    }

    if (suite._count.files === 0) {
      return NextResponse.json(
        { error: "No files uploaded — upload study materials first" },
        { status: 400 }
      );
    }

    if (suite.status === "PROCESSING") {
      return NextResponse.json(
        { error: "Generation already in progress" },
        { status: 409 }
      );
    }

    // Fire and forget — client polls /status
    processSuite(params.id).catch((err) =>
      console.error("[regenerate] processSuite error:", err)
    );

    return NextResponse.json({
      message: "Regeneration started",
      suiteId: params.id,
    });
  } catch (err: unknown) {
    console.error("[POST /api/suites/[id]/regenerate]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
