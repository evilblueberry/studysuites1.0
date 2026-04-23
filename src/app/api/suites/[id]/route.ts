import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function checkSuiteAccess(suiteId: string, userId: string, requireOwner = false) {
  const suite = await prisma.testSuite.findUnique({
    where: { id: suiteId },
    include: {
      collaborators: { select: { userId: true, role: true } },
    },
  });

  if (!suite) return null;

  const isOwner = suite.ownerId === userId;
  const collaborator = suite.collaborators.find((c: any) => c.userId === userId);
  const hasAccess = isOwner || !!collaborator;

  if (requireOwner && !isOwner) return null;
  if (!hasAccess) return null;

  return suite;
}

// GET /api/suites/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const suite = await checkSuiteAccess(params.id, user.id);
    if (!suite) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const fullSuite = await prisma.testSuite.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        collaborators: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, email: true } },
          },
        },
        files: true,
        topics: { orderBy: { orderIndex: "asc" } },
        _count: { select: { topics: true, flashcards: true, files: true, collaborators: true } },
      },
    });

    return NextResponse.json({ data: fullSuite });
  } catch (err) {
    console.error("[GET /api/suites/[id]]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// PATCH /api/suites/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const suite = await checkSuiteAccess(params.id, user.id, true);
    if (!suite) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const updated = await prisma.testSuite.update({
      where: { id: params.id },
      data: {
        courseName: body.courseName,
        examTitle: body.examTitle,
        examDate: body.examDate ? new Date(body.examDate) : undefined,
        description: body.description,
        visibility: body.visibility,
        isArchived: body.isArchived,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[PATCH /api/suites/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/suites/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const suite = await checkSuiteAccess(params.id, user.id, true);
    if (!suite) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.testSuite.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/suites/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
