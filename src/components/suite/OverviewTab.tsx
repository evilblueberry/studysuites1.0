"use client";

import {
  BookOpen,
  Zap,
  HelpCircle,
  PenLine,
  FileText,
  Users,
  TrendingUp,
  ArrowRight,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { cn, formatDate, daysUntil, getProgressColor } from "@/lib/utils";

interface Props {
  suite: any;
  userProgress: any[];
  onNavigate: (tab: string) => void;
}

export default function OverviewTab({ suite, userProgress, onNavigate }: Props) {
  const days = daysUntil(suite.examDate);
  const overallProgress = userProgress.find((p) => !p.topicId)?.completionPercent ?? 0;

  const studyModes = [
    {
      id: "topics",
      icon: BookOpen,
      title: "Study Topics",
      desc: `${suite._count?.topics ?? 0} topic guides with key terms and common exam traps`,
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
      border: "border-indigo-500/20",
      count: suite._count?.topics ?? 0,
    },
    {
      id: "flashcards",
      icon: Zap,
      title: "Flashcards",
      desc: `${suite.flashcards?.length ?? 0} cards — flip, review, and mark your confidence`,
      color: "text-violet-400",
      bg: "bg-violet-400/10",
      border: "border-violet-500/20",
      count: suite.flashcards?.length ?? 0,
    },
    {
      id: "quiz",
      icon: HelpCircle,
      title: "Practice Quiz",
      desc: `${suite.quizzes?.reduce((s: number, q: any) => s + q.questions.length, 0) ?? 0} questions — multiple choice with explanations`,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-500/20",
      count: suite.quizzes?.length ?? 0,
    },
    {
      id: "essay",
      icon: PenLine,
      title: "Essay Prep",
      desc: `${suite.essayPrompts?.length ?? 0} likely prompts with full outlines`,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-500/20",
      count: suite.essayPrompts?.length ?? 0,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Exam countdown + progress */}
      {suite.examDate && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Calendar className="w-4 h-4" />
                Exam Date
              </div>
              <p className="text-2xl font-bold">{formatDate(suite.examDate)}</p>
              {days !== null && (
                <p className={cn("text-sm mt-1", days <= 7 && days >= 0 ? "text-amber-400 font-medium" : "text-muted-foreground")}>
                  {days < 0
                    ? "Exam has passed"
                    : days === 0
                    ? "Exam is TODAY! 🎯"
                    : `${days} day${days === 1 ? "" : "s"} until your exam`}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Overall Progress</p>
              <p className="text-4xl font-bold gradient-text">{Math.round(overallProgress)}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-accent rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", getProgressColor(overallProgress))}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Study mode cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Study Modes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {studyModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onNavigate(mode.id)}
              disabled={mode.count === 0}
              className={cn(
                "glass-card p-5 text-left hover:-translate-y-0.5 transition-all duration-200 group",
                mode.count === 0 ? "opacity-50 cursor-not-allowed" : "hover:border-white/10 cursor-pointer"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", mode.bg)}>
                <mode.icon className={cn("w-5 h-5", mode.color)} />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold mb-1">{mode.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{mode.desc}</p>
                </div>
                <ArrowRight className={cn("w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 ml-3", mode.count === 0 ? "hidden" : "")} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Topics summary */}
      {suite.topics?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Topics at a Glance</h2>
            <button
              onClick={() => onNavigate("topics")}
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {suite.topics.slice(0, 5).map((topic: any, i: number) => {
              const progress = userProgress.find((p) => p.topicId === topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => onNavigate("topics")}
                  className="w-full flex items-center gap-4 p-3.5 glass-card hover:border-white/10 text-left transition-all cursor-pointer"
                >
                  <span className="text-xs font-mono text-muted-foreground w-4 flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{topic.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{topic.summary}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {progress && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-accent rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", getProgressColor(progress.completionPercent))}
                            style={{ width: `${progress.completionPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{Math.round(progress.completionPercent)}%</span>
                      </div>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
            {suite.topics.length > 5 && (
              <button
                onClick={() => onNavigate("topics")}
                className="w-full text-sm text-center text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                +{suite.topics.length - 5} more topics →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {suite.description && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h2>
          <p className="text-sm text-foreground/90 leading-relaxed">{suite.description}</p>
        </div>
      )}

      {/* Files */}
      {suite.files?.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Source Files</h2>
            <button onClick={() => onNavigate("files")} className="text-xs text-indigo-400 hover:text-indigo-300">
              Manage
            </button>
          </div>
          <div className="space-y-2">
            {suite.files.slice(0, 3).map((file: any) => (
              <div key={file.id} className="flex items-center gap-2 text-sm">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="truncate text-foreground/80">{file.fileName}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
