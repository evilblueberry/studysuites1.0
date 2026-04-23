import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/friends/request — send a friend request
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { email } = await req.json();

    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { email } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (target.id === user.id) return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });

    // Check if already friends
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: user.id, userBId: target.id },
          { userAId: target.id, userBId: user.id },
        ],
      },
    });
    if (existing) return NextResponse.json({ error: "Already friends" }, { status: 409 });

    // Check for existing pending request
    const existingReq = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: target.id },
          { senderId: target.id, receiverId: user.id },
        ],
        status: "PENDING",
      },
    });
    if (existingReq) return NextResponse.json({ error: "Request already pending" }, { status: 409 });

    const request = await prisma.friendRequest.create({
      data: { senderId: user.id, receiverId: target.id },
      include: {
        receiver: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ data: request });
  } catch (err) {
    console.error("[POST /api/friends/request]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/friends/request — accept or decline a request
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const { requestId, action } = await req.json();

    if (!requestId || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const request = await prisma.friendRequest.findFirst({
      where: { id: requestId, receiverId: user.id, status: "PENDING" },
    });

    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    if (action === "accept") {
      await prisma.$transaction([
        prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: "ACCEPTED" },
        }),
        prisma.friendship.create({
          data: { userAId: request.senderId, userBId: user.id },
        }),
      ]);
    } else {
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "DECLINED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/friends/request]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
