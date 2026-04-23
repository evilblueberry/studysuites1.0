import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SuiteDetailClient from "./SuiteDetailClient";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const suite = await prisma.testSuite.findUnique({ where: { id: params.id } });
  return { title: suite ? `${suite.courseName} — ${suite.examTitle}` : "Suite" };
}

export default async function SuiteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();

  const suite = await prisma.testSuite.findFirst({
    where: {
      id: params.id,
      OR: [
        { ownerId: user.id },
        { collaborators: { some: { userId: user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      collaborators: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
      },
      files: { orderBy: { uploadedAt: "desc" } },
      topics: { orderBy: { orderIndex: "asc" } },
      flashcards: { orderBy: { orderIndex: "asc" } },
      quizzes: { include: { questions: true, topic: { select: { id: true, title: true } } } },
      essayPrompts: { include: { topic: { select: { id: true, title: true } } } },
      _count: { select: { topics: true, flashcards: true, files: true } },
    },
  });

  if (!suite) notFound();

  const userProgress = await prisma.studyProgress.findMany({
    where: { userId: user.id, suiteId: params.id },
  });

  const isOwner = suite.ownerId === user.id;
  const collaboratorRole = suite.collaborators.find((c) => c.userId === user.id)?.role ?? null;

  return (
    <SuiteDetailClient
      suite={suite as any}
      currentUserId={user.id}
      isOwner={isOwner}
      collaboratorRole={collaboratorRole}
      userProgress={userProgress}
    />
  );
}
