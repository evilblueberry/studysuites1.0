import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "VIEWER"]).default("VIEWER"),
});

// GET /api/suites/[id]/collaborators
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

    const collaborators = await prisma.testSuiteCollaborator.findMany({
      where: { suiteId: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ data: collaborators });
  } catch (err) {
    console.error("[GET /api/suites/[id]/collaborators]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST /api/suites/[id]/collaborators — invite a collaborator by email
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    const suite = await prisma.testSuite.findFirst({
      where: { id: params.id, ownerId: user.id },
    });

    if (!suite) return NextResponse.json({ error: "Not found or not owner" }, { status: 404 });

    const body = await req.json();
    const { email, role } = InviteSchema.parse(body);

    // Find user by email
    const invitedUser = await prisma.user.findUnique({ where: { email } });
    if (!invitedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (invitedUser.id === user.id) {
      return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 });
    }

    // Upsert collaborator
    const collaborator = await prisma.testSuiteCollaborator.upsert({
      where: { suiteId_userId: { suiteId: params.id, userId: invitedUser.id } },
      update: { role },
      create: { suiteId: params.id, userId: invitedUser.id, role },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        suiteId: params.id,
        userId: user.id,
        actionType: "COLLABORATOR_INVITED",
        metadata: { invitedUserId: invitedUser.id, role },
      },
    });

    return NextResponse.json({ data: collaborator });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("[POST /api/suites/[id]/collaborators]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/suites/[id]/collaborators?userId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    // Only owner can remove others; collaborators can remove themselves
    const suite = await prisma.testSuite.findUnique({ where: { id: params.id } });
    if (!suite) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (suite.ownerId !== user.id && targetUserId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.testSuiteCollaborator.delete({
      where: { suiteId_userId: { suiteId: params.id, userId: targetUserId } },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/suites/[id]/collaborators]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
