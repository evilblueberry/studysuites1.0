"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Layers,
  Zap,
  HelpCircle,
  PenLine,
  FileText,
  Users,
  Settings,
  Calendar,
  ArrowLeft,
  Clock,
  Brain,
} from "lucide-react";
import { cn, formatDate, daysUntil, getStatusColor } from "@/lib/utils";
import OverviewTab from "@/components/suite/OverviewTab";
import TopicsTab from "@/components/suite/TopicsTab";
import FlashcardsTab from "@/components/suite/FlashcardsTab";
import QuizTab from "@/components/suite/QuizTab";
import EssayTab from "@/components/suite/EssayTab";
import FilesTab from "@/components/suite/FilesTab";
import CollaboratorsTab from "@/components/suite/CollaboratorsTab";

type TabId = "overview" | "topics" | "flashcards" | "quiz" | "essay" | "files" | "collaborators";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "topics", label: "Topics", icon: Layers },
  { id: "flashcards", label: "Flashcards", icon: Zap },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
  { id: "essay", label: "Essay Prep", icon: PenLine },
  { id: "files", label: "Files", icon: FileText },
  { id: "collaborators", label: "Collaborators", icon: Users },
];

interface Props {
  suite: any;
  currentUserId: string;
  isOwner: boolean;
  collaboratorRole: string | null;
  userProgress: any[];
}

export default function SuiteDetailClient({
  suite,
  currentUserId,
  isOwner,
  collaboratorRole,
  userProgress,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const days = daysUntil(suite.examDate);
  const isProcessing = suite.status === "PROCESSING" || suite.status === "UPLOADING";

  return (
    <div className="flex flex-col h-full">
      {/* Suite Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 pt-5 pb-0">
          {/* Breadcrumb */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>

          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <p className="text-sm text-muted-foreground font-medium">{suite.courseName}</p>
                <span
                  className={cn(
                    "status-badge text-xs",
                    getStatusColor(suite.status)
                  )}
                >
                  {isProcessing && (
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1" />
                  )}
                  {suite.status === "READY"
                    ? "Ready"
                    : suite.status === "PROCESSING"
                    ? "Processing..."
                    : suite.status === "UPLOADING"
                    ? "Uploading"
                    : "Error"}
                </span>
              </div>
              <h1 className="text-2xl font-bold truncate">{suite.examTitle}</h1>
              {suite.description && (
                <p className="text-sm text-muted-foreground mt-1 truncate">{suite.description}</p>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-6 flex-shrink-0">
              {suite.examDate && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3" /> Exam Date
                  </p>
                  <p className="text-sm font-semibold">{formatDate(suite.examDate)}</p>
                  {days !== null && days >= 0 && (
                    <p className={cn("text-xs font-medium", days <= 7 ? "text-amber-400" : "text-muted-foreground")}>
                      {days === 0 ? "Today!" : `${days} day${days === 1 ? "" : "s"} away`}
                    </p>
                  )}
                </div>
              )}

              <div className="text-right">
                <p className="text-xs text-muted-foreground">Topics</p>
                <p className="text-2xl font-bold">{suite._count.topics}</p>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">Cards</p>
                <p className="text-2xl font-bold">{suite._count.flashcards}</p>
              </div>

              {/* Collaborator avatars */}
              {suite.collaborators.length > 0 && (
                <div className="flex -space-x-2">
                  {[
                    { user: suite.owner, role: "OWNER" },
                    ...suite.collaborators,
                  ]
                    .slice(0, 4)
                    .map((c: any) => (
                      <div
                        key={c.user?.id ?? c.userId}
                        className="w-7 h-7 rounded-full border-2 border-background overflow-hidden bg-indigo-500/50 flex items-center justify-center text-xs font-bold"
                        title={c.user?.name}
                      >
                        {c.user?.avatarUrl ? (
                          <img src={c.user.avatarUrl} alt={c.user.name} className="w-full h-full object-cover" />
                        ) : (
                          c.user?.name?.[0] ?? "?"
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Processing banner */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 mb-4">
              <Brain className="w-3.5 h-3.5 animate-pulse" />
              Generating your study content — this page will update when ready. Refresh in 10–30 seconds.
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-indigo-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === "topics" && suite._count.topics > 0 && (
                  <span className="text-xs bg-accent px-1.5 py-0.5 rounded-full text-muted-foreground">
                    {suite._count.topics}
                  </span>
                )}
                {tab.id === "flashcards" && suite._count.flashcards > 0 && (
                  <span className="text-xs bg-accent px-1.5 py-0.5 rounded-full text-muted-foreground">
                    {suite._count.flashcards}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {activeTab === "overview" && (
            <OverviewTab
              suite={suite}
              userProgress={userProgress}
              onNavigate={(tab) => setActiveTab(tab as TabId)}
            />
          )}
          {activeTab === "topics" && <TopicsTab topics={suite.topics} suiteId={suite.id} />}
          {activeTab === "flashcards" && (
            <FlashcardsTab flashcards={suite.flashcards} suiteId={suite.id} />
          )}
          {activeTab === "quiz" && <QuizTab quizzes={suite.quizzes} />}
          {activeTab === "essay" && <EssayTab prompts={suite.essayPrompts} />}
          {activeTab === "files" && (
            <FilesTab files={suite.files} suiteId={suite.id} isOwner={isOwner} />
          )}
          {activeTab === "collaborators" && (
            <CollaboratorsTab
              suite={suite}
              currentUserId={currentUserId}
              isOwner={isOwner}
            />
          )}
        </div>
      </div>
    </div>
  );
}
