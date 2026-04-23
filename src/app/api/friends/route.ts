import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/friends — list all friends
export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: user.id }, { userBId: user.id }],
      },
      include: {
        userA: { select: { id: true, name: true, email: true, avatarUrl: true } },
        userB: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    const friends = friendships.map((f) =>
      f.userAId === user.id ? f.userB : f.userA
    );

    const pendingRequests = await prisma.friendRequest.findMany({
      where: { receiverId: user.id, status: "PENDING" },
      include: {
        sender: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    const sentRequests = await prisma.friendRequest.findMany({
      where: { senderId: user.id, status: "PENDING" },
      include: {
        receiver: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ data: { friends, pendingRequests, sentRequests } });
  } catch (err) {
    console.error("[GET /api/friends]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
