import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateSuiteSchema = z.object({
  courseName: z.string().min(1).max(100),
  examTitle: z.string().min(1).max(100),
  examDate: z.string().datetime().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  visibility: z.enum(["PRIVATE", "COLLABORATIVE"]).default("PRIVATE"),
});

// GET /api/suites — list all suites for the current user
export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();

    const [ownedSuites, collaboratedSuites] = await Promise.all([
      prisma.testSuite.findMany({
        where: { ownerId: user.id, isArchived: false },
        include: {
          owner: { select: { id: true, name: true, avatarUrl: true } },
          collaborators: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true, email: true } },
            },
          },
          _count: { select: { topics: true, flashcards: true, files: true, collaborators: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.testSuite.findMany({
        where: {
          isArchived: false,
          collaborators: { some: { userId: user.id } },
        },
        include: {
          owner: { select: { id: true, name: true, avatarUrl: true } },
          collaborators: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true, email: true } },
            },
          },
          _count: { select: { topics: true, flashcards: true, files: true, collaborators: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      owned: ownedSuites,
      collaborated: collaboratedSuites,
    });
  } catch (err) {
    console.error("[GET /api/suites]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST /api/suites — create a new test suite
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = CreateSuiteSchema.parse(body);

    const suite = await prisma.testSuite.create({
      data: {
        ownerId: user.id,
        courseName: parsed.courseName,
        examTitle: parsed.examTitle,
        examDate: parsed.examDate ? new Date(parsed.examDate) : null,
        description: parsed.description ?? null,
        visibility: parsed.visibility,
        status: "UPLOADING",
      },
    });

    return NextResponse.json({ data: suite }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("[POST /api/suites]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
