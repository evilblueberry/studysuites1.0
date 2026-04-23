import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const NoteSchema = z.object({
  topicId: z.string().min(1),
  content: z.string().min(1).max(5000),
});

// GET /api/suites/[id]/notes?topicId=xxx
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

    const notes = await prisma.topicNote.findMany({
      where: {
        suiteId: params.id,
        ...(topicId ? { topicId } : {}),
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: notes });
  } catch (err) {
    console.error("[GET /api/suites/[id]/notes]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST /api/suites/[id]/notes
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { topicId, content } = NoteSchema.parse(body);

    const suite = await prisma.testSuite.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: user.id },
          {
            collaborators: {
              some: { userId: user.id, role: { in: ["OWNER", "EDITOR"] } },
            },
          },
        ],
      },
    });

    if (!suite) {
      return NextResponse.json(
        { error: "Not found or insufficient permission" },
        { status: 403 }
      );
    }

    const note = await prisma.topicNote.create({
      data: {
        suiteId: params.id,
        topicId,
        authorId: user.id,
        content,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        suiteId: params.id,
        userId: user.id,
        actionType: "NOTE_ADDED",
        metadata: { topicId, noteId: note.id },
      },
    });

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("[POST /api/suites/[id]/notes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/suites/[id]/notes?noteId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json({ error: "noteId required" }, { status: 400 });
    }

    const note = await prisma.topicNote.findFirst({
      where: { id: noteId, suiteId: params.id },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Only the author or suite owner can delete a note
    const suite = await prisma.testSuite.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    });

    if (note.authorId !== user.id && suite?.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.topicNote.delete({ where: { id: noteId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/suites/[id]/notes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
