"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, Zap, AlertTriangle, Tag, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyTerm {
  term: string;
  definition: string;
}

interface Topic {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  keyTerms: KeyTerm[];
  commonTraps: string[];
  orderIndex: number;
}

interface Props {
  topics: Topic[];
  suiteId: string;
}

export default function TopicsTab({ topics, suiteId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(topics[0]?.id ?? null);
  const [search, setSearch] = useState("");

  const filtered = topics.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.summary.toLowerCase().includes(search.toLowerCase())
  );

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Topics are being generated</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Upload files and the app will automatically generate topic guides.
          Check back in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-muted-foreground"
        />
      </div>

      {/* Topic list */}
      <div className="space-y-3">
        {filtered.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            expanded={expandedId === topic.id}
            onToggle={() => setExpandedId(expandedId === topic.id ? null : topic.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No topics match &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}

function TopicCard({
  topic,
  expanded,
  onToggle,
}: {
  topic: Topic;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={cn("glass-card transition-all duration-200", expanded && "border-indigo-500/20")}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-indigo-400">
            {String(topic.orderIndex + 1).padStart(2, "0")}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-0.5">{topic.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{topic.summary}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">{topic.keyTerms?.length ?? 0} terms</span>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-5 pb-5">
          {/* Study guide content */}
          <div className="mt-4">
            <div
              className="study-content text-sm"
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(topic.fullContent),
              }}
            />
          </div>

          {/* Key Terms */}
          {topic.keyTerms?.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-indigo-400" />
                <h4 className="font-semibold text-sm">Key Terms</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topic.keyTerms.map((kt) => (
                  <div key={kt.term} className="bg-accent rounded-lg p-3">
                    <p className="text-xs font-semibold text-indigo-400 mb-1">{kt.term}</p>
                    <p className="text-xs text-foreground/80 leading-relaxed">{kt.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Traps */}
          {topic.commonTraps?.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h4 className="font-semibold text-sm">Common Exam Traps</h4>
              </div>
              <div className="space-y-2">
                {topic.commonTraps.map((trap, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-xs bg-amber-400/5 border border-amber-400/10 rounded-lg p-3"
                  >
                    <span className="text-amber-400 font-bold flex-shrink-0">!</span>
                    <p className="text-foreground/80">{trap}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simple markdown → HTML (no extra lib needed)
function formatMarkdown(text: string): string {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.+<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, '')
    .trim();
}
