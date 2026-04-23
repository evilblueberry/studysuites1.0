import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Plus,
  BookOpen,
  Clock,
  Users,
  ArrowRight,
  ChevronRight,
  Zap,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { cn, formatDate, daysUntil, getStatusColor } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();

  const [ownedSuites, collaboratedSuites, recentProgress] = await Promise.all([
    prisma.testSuite.findMany({
      where: { ownerId: user.id, isArchived: false },
      include: {
        _count: { select: { topics: true, flashcards: true, collaborators: true } },
        collaborators: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          take: 3,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.testSuite.findMany({
      where: {
        isArchived: false,
        collaborators: { some: { userId: user.id } },
      },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { topics: true, flashcards: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.studyProgress.findMany({
      where: { userId: user.id },
      orderBy: { lastStudiedAt: "desc" },
      take: 5,
      include: { suite: { select: { id: true, courseName: true, examTitle: true } } },
    }),
  ]);

  const upcomingSuites = ownedSuites
    .filter((s) => s.examDate && daysUntil(s.examDate) !== null && daysUntil(s.examDate)! >= 0)
    .sort((a, b) => new Date(a.examDate!).getTime() - new Date(b.examDate!).getTime())
    .slice(0, 3);

  const recentSuites = ownedSuites.slice(0, 6);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {ownedSuites.length === 0
              ? "Create your first study suite to get started."
              : `You have ${ownedSuites.length} suite${ownedSuites.length === 1 ? "" : "s"} — keep it up!`}
          </p>
        </div>
        <Link
          href="/suite/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          New Suite
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: BookOpen,
            label: "My Suites",
            value: ownedSuites.length,
            color: "text-indigo-400",
            bg: "bg-indigo-400/10",
          },
          {
            icon: Zap,
            label: "Total Flashcards",
            value: ownedSuites.reduce((sum, s) => sum + s._count.flashcards, 0),
            color: "text-violet-400",
            bg: "bg-violet-400/10",
          },
          {
            icon: Users,
            label: "Shared With Me",
            value: collaboratedSuites.length,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
          },
          {
            icon: TrendingUp,
            label: "Study Sessions",
            value: recentProgress.length,
            color: "text-amber-400",
            bg: "bg-amber-400/10",
          },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", stat.bg)}>
              <stat.icon className={cn("w-4.5 h-4.5", stat.color)} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent suites — 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Suites</h2>
            <Link href="/suite/new" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentSuites.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentSuites.map((suite) => (
                <SuiteCard key={suite.id} suite={suite} />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming exams */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Upcoming Exams</h2>
            </div>
            {upcomingSuites.length === 0 ? (
              <div className="glass-card p-4 text-sm text-muted-foreground">
                No upcoming exams. Set exam dates when creating suites.
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingSuites.map((suite) => {
                  const days = daysUntil(suite.examDate);
                  return (
                    <Link key={suite.id} href={`/suite/${suite.id}`}>
                      <div className="glass-card p-3.5 hover:border-white/10 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{suite.courseName}</p>
                            <p className="text-xs text-muted-foreground truncate">{suite.examTitle}</p>
                          </div>
                          <div
                            className={cn(
                              "flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full",
                              days! <= 3
                                ? "bg-red-400/10 text-red-400"
                                : days! <= 7
                                ? "bg-amber-400/10 text-amber-400"
                                : "bg-indigo-400/10 text-indigo-400"
                            )}
                          >
                            {days === 0 ? "Today" : `${days}d`}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(suite.examDate!)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shared with me */}
          {collaboratedSuites.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Shared With Me</h2>
              </div>
              <div className="space-y-2">
                {collaboratedSuites.map((suite) => (
                  <Link key={suite.id} href={`/suite/${suite.id}`}>
                    <div className="glass-card p-3.5 hover:border-white/10 transition-colors">
                      <p className="font-medium text-sm truncate">{suite.courseName}</p>
                      <p className="text-xs text-muted-foreground truncate">{suite.examTitle}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {suite.owner.avatarUrl ? (
                          <img
                            src={suite.owner.avatarUrl}
                            alt={suite.owner.name}
                            className="w-4 h-4 rounded-full"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-indigo-500/50 flex items-center justify-center text-[8px] font-bold">
                            {suite.owner.name[0]}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">by {suite.owner.name}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SuiteCard({ suite }: { suite: any }) {
  const days = daysUntil(suite.examDate);
  const statusColor = getStatusColor(suite.status);

  return (
    <Link href={`/suite/${suite.id}`}>
      <div className="glass-card p-5 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground mb-0.5 truncate">{suite.courseName}</p>
            <h3 className="font-semibold text-sm truncate">{suite.examTitle}</h3>
          </div>
          <span className={cn("status-badge flex-shrink-0", statusColor)}>
            {suite.status === "READY" ? "Ready" : suite.status === "PROCESSING" ? "Processing..." : suite.status === "UPLOADING" ? "Uploading" : "Error"}
          </span>
        </div>

        {suite.examDate && (
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(suite.examDate)}
            {days !== null && days >= 0 && (
              <span className={cn("ml-1 font-medium", days <= 7 ? "text-amber-400" : "")}>
                ({days === 0 ? "Today!" : `${days}d away`})
              </span>
            )}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {suite._count.topics} topics
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {suite._count.flashcards} cards
          </span>
          {suite._count.collaborators > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {suite._count.collaborators}
            </span>
          )}
        </div>

        {/* Collaborator avatars */}
        {suite.collaborators?.length > 0 && (
          <div className="flex -space-x-1.5 mt-3">
            {suite.collaborators.slice(0, 3).map((c: any) => (
              <div key={c.userId} className="w-5 h-5 rounded-full bg-indigo-500/50 border border-background flex items-center justify-center text-[8px] font-bold">
                {c.user.name[0]}
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
        <BookOpen className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="font-semibold text-lg mb-2">No suites yet</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        Create your first study suite by uploading your class materials. We&apos;ll
        generate a complete study plan for your exam.
      </p>
      <Link
        href="/suite/new"
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create Your First Suite
      </Link>
    </div>
  );
}

