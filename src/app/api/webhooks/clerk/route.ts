import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

/**
 * Clerk webhook handler — syncs user events to the database.
 *
 * Events handled:
 * - user.created → create user in DB
 * - user.updated → update name/avatar
 * - user.deleted → delete user (cascades to all owned data)
 *
 * Setup:
 * 1. In Clerk Dashboard → Webhooks → Add endpoint
 * 2. URL: https://your-domain.com/api/webhooks/clerk
 * 3. Subscribe to: user.created, user.updated, user.deleted
 * 4. Copy the signing secret → CLERK_WEBHOOK_SECRET in .env.local
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  // If no secret configured, skip webhook verification in local dev
  if (!secret) {
    console.warn(
      "[clerk-webhook] CLERK_WEBHOOK_SECRET not set — skipping verification (dev mode)"
    );
    return NextResponse.json({ message: "Webhook received (unverified)" });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();

  let event: {
    type: string;
    data: {
      id: string;
      first_name?: string;
      last_name?: string;
      email_addresses?: Array<{ email_address: string }>;
      image_url?: string;
    };
  };

  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch (err) {
    console.error("[clerk-webhook] Verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = event;

  try {
    if (type === "user.created" || type === "user.updated") {
      const name =
        `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() ||
        data.email_addresses?.[0]?.email_address?.split("@")[0] ||
        "User";

      await prisma.user.upsert({
        where: { clerkId: data.id },
        update: { name, avatarUrl: data.image_url },
        create: {
          clerkId: data.id,
          name,
          email: data.email_addresses?.[0]?.email_address ?? "",
          avatarUrl: data.image_url,
        },
      });
    } else if (type === "user.deleted") {
      await prisma.user.deleteMany({ where: { clerkId: data.id } });
    }

    return NextResponse.json({ message: "OK" });
  } catch (err: unknown) {
    console.error("[clerk-webhook] DB error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
