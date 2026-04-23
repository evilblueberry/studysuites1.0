import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";

/**
 * Gets the currently authenticated Clerk user and syncs them to our DB.
 * Creates the user record if it doesn't exist yet (first login).
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  // Upsert user — create on first login, update name/avatar on subsequent logins
  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      name:
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ||
        "User",
      avatarUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId: userId,
      name:
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ||
        "User",
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      avatarUrl: clerkUser.imageUrl,
    },
  });

  return user;
}

/**
 * Requires authentication. Throws if no user is found.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
