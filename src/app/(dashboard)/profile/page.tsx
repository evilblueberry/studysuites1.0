import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { User, BookOpen, Users, Clock, UserCheck } from "lucide-react";
import ProfileFriends from "./ProfileFriends";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();

  const [ownedCount, friendships, pendingRequests, recentProgress] = await Promise.all([
    prisma.testSuite.count({ where: { ownerId: user.id } }),
    prisma.friendship.findMany({
      where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
      include: {
        userA: { select: { id: true, name: true, email: true, avatarUrl: true } },
        userB: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    }),
    prisma.friendRequest.findMany({
      where: { receiverId: user.id, status: "PENDING" },
      include: {
        sender: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    }),
    prisma.studyProgress.findMany({
      where: { userId: user.id },
      orderBy: { lastStudiedAt: "desc" },
      take: 10,
      include: {
        suite: { select: { id: true, courseName: true, examTitle: true } },
        topic: { select: { id: true, title: true } },
      },
    }),
  ]);

  const friends = friendships.map((f) =>
    f.userAId === user.id ? f.userB : f.userA
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-5">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-border"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
              <User className="w-10 h-10 text-indigo-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">Joined {formatDate(user.createdAt)}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          {[
            { icon: BookOpen, label: "Suites Created", value: ownedCount, color: "text-indigo-400" },
            { icon: Users, label: "Friends", value: friends.length, color: "text-emerald-400" },
            { icon: Clock, label: "Study Sessions", value: recentProgress.length, color: "text-amber-400" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className={`w-4.5 h-4.5 ${stat.color} mx-auto mb-1`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Friends & Requests */}
      <ProfileFriends
        friends={friends}
        pendingRequests={pendingRequests as any}
      />

      {/* Recent Study Activity */}
      {recentProgress.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-muted-foreground" />
            Recent Study Activity
          </h2>
          <div className="space-y-2">
            {recentProgress.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.suite.courseName} — {p.suite.examTitle}</p>
                  {p.topic && <p className="text-xs text-muted-foreground truncate">{p.topic.title}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium">{Math.round(p.completionPercent)}%</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeDate(p.lastStudiedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
