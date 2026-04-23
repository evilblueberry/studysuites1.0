"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  Brain,
  LayoutDashboard,
  Plus,
  ChevronRight,
  BookOpen,
  Clock,
  Users,
  Archive,
  Search,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { cn, formatDate, daysUntil } from "@/lib/utils";

interface Suite {
  id: string;
  courseName: string;
  examTitle: string;
  examDate: string | null;
  status: string;
  isArchived: boolean;
  updatedAt: string;
}

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const [ownedSuites, setOwnedSuites] = useState<Suite[]>([]);
  const [sharedSuites, setSharedSuites] = useState<Suite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/suites")
      .then((r) => r.json())
      .then((data) => {
        setOwnedSuites(data.owned ?? []);
        setSharedSuites(data.collaborated ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pathname]); // Refresh on navigation

  const filterSuites = (suites: Suite[]) =>
    suites.filter(
      (s) =>
        !s.isArchived &&
        (s.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.examTitle.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const currentSuiteId = pathname.startsWith("/suite/")
    ? pathname.split("/")[2]
    : null;

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r border-border transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-72",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base tracking-tight">StudySuite</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="flex items-center justify-center w-full">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed ? (
        // Collapsed view — just icons
        <div className="flex flex-col items-center gap-1 p-2 flex-1">
          <button
            onClick={() => setCollapsed(false)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mb-2"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
          <Link href="/dashboard" className={cn("sidebar-item w-10 h-10 justify-center", pathname === "/dashboard" && "active")}>
            <LayoutDashboard className="w-4 h-4" />
          </Link>
          <Link href="/suite/new" className="sidebar-item w-10 h-10 justify-center">
            <Plus className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Search */}
          <div className="px-3 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search suites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-accent border-0 rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Nav links */}
          <div className="px-3 py-2 border-b border-border space-y-0.5">
            <Link href="/dashboard" className={cn("sidebar-item", pathname === "/dashboard" && "active")}>
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/suite/new"
              className="sidebar-item text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10"
            >
              <Plus className="w-4 h-4" />
              New Suite
            </Link>
          </div>

          {/* Suite list */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* My Suites */}
                <div>
                  <div className="flex items-center gap-1.5 px-2 mb-1.5">
                    <BookOpen className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      My Suites
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">{filterSuites(ownedSuites).length}</span>
                  </div>
                  {filterSuites(ownedSuites).length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">
                      No suites yet.{" "}
                      <Link href="/suite/new" className="text-indigo-400 hover:underline">
                        Create one
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {filterSuites(ownedSuites).map((suite) => (
                        <SuiteItem
                          key={suite.id}
                          suite={suite}
                          active={currentSuiteId === suite.id}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Shared Suites */}
                {sharedSuites.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 mb-1.5">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Shared With Me
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {filterSuites(sharedSuites).map((suite) => (
                        <SuiteItem
                          key={suite.id}
                          suite={suite}
                          active={currentSuiteId === suite.id}
                          shared
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* User footer */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName ?? "User"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              <Link href="/profile" className="p-1.5 rounded hover:bg-accent transition-colors">
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function SuiteItem({
  suite,
  active,
  shared,
}: {
  suite: Suite;
  active: boolean;
  shared?: boolean;
}) {
  const days = daysUntil(suite.examDate);
  const isUrgent = days !== null && days <= 7 && days >= 0;

  return (
    <Link
      href={`/suite/${suite.id}`}
      className={cn(
        "flex items-start gap-2 px-2 py-2 rounded-lg text-sm transition-all duration-150 group",
        active
          ? "bg-indigo-500/15 text-foreground border border-indigo-500/20"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
          suite.status === "READY"
            ? "bg-emerald-400"
            : suite.status === "PROCESSING"
            ? "bg-amber-400 animate-pulse"
            : suite.status === "ERROR"
            ? "bg-red-400"
            : "bg-slate-500"
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-xs leading-tight">{suite.courseName}</p>
        <p className="text-xs text-muted-foreground truncate">{suite.examTitle}</p>
        {days !== null && (
          <p className={cn("text-xs mt-0.5", isUrgent ? "text-amber-400" : "text-muted-foreground")}>
            {days === 0 ? "Today!" : days < 0 ? "Past" : `${days}d away`}
          </p>
        )}
      </div>
      {shared && (
        <Users className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
      )}
    </Link>
  );
}
