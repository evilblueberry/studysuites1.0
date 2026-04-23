"use client";

import { useState } from "react";
import { PenLine, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EssayPrompt {
  id: string;
  prompt: string;
  outline: string;
  keyPoints: string[];
  topicId: string | null;
  topic: { id: string; title: string } | null;
}

interface Props {
  prompts: EssayPrompt[];
}

export default function EssayTab({ prompts }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(prompts[0]?.id ?? null);

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
          <PenLine className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No essay prompts yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Essay prompts are generated from your uploaded materials. Upload files to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-1">Essay Preparation</h2>
        <p className="text-sm text-muted-foreground">
          Likely exam essay prompts with structured outlines and key argument points.
        </p>
      </div>

      {prompts.map((prompt, index) => (
        <div
          key={prompt.id}
          className={cn("glass-card transition-all duration-200", expandedId === prompt.id && "border-amber-500/20")}
        >
          <button
            onClick={() => setExpandedId(expandedId === prompt.id ? null : prompt.id)}
            className="w-full flex items-start gap-4 p-5 text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <PenLine className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">Prompt {index + 1}</span>
                {prompt.topic && (
                  <span className="text-xs bg-accent px-2 py-0.5 rounded-full text-muted-foreground">
                    {prompt.topic.title}
                  </span>
                )}
              </div>
              <p className="font-medium text-sm leading-relaxed">{prompt.prompt}</p>
            </div>
            {expandedId === prompt.id ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
            )}
          </button>

          {expandedId === prompt.id && (
            <div className="border-t border-border px-5 pb-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
                {/* Outline */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs">✎</span>
                    Suggested Outline
                  </h3>
                  <div className="bg-accent rounded-xl p-4 text-xs leading-relaxed whitespace-pre-line font-mono text-foreground/80">
                    {prompt.outline}
                  </div>
                </div>

                {/* Key Points */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Key Points to Address
                  </h3>
                  <div className="space-y-2">
                    {prompt.keyPoints.map((point, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 text-xs bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3"
                      >
                        <span className="text-emerald-400 font-bold flex-shrink-0">{i + 1}.</span>
                        <p className="text-foreground/80 leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
