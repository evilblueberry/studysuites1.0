"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  Minus,
  ThumbsDown,
  Zap,
  Shuffle,
} from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficultyTag: "EASY" | "MEDIUM" | "HARD" | "UNREVIEWED";
  topicId: string | null;
}

interface Props {
  flashcards: Flashcard[];
  suiteId: string;
}

type DifficultyFilter = "ALL" | "EASY" | "MEDIUM" | "HARD" | "UNREVIEWED";

export default function FlashcardsTab({ flashcards, suiteId }: Props) {
  const [filter, setFilter] = useState<DifficultyFilter>("ALL");
  const [shuffled, setShuffled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [difficultyMap, setDifficultyMap] = useState<Record<string, Flashcard["difficultyTag"]>>(
    Object.fromEntries(flashcards.map((f) => [f.id, f.difficultyTag]))
  );

  const filteredCards = flashcards
    .filter((c) => filter === "ALL" || difficultyMap[c.id] === filter)
    .slice();

  const displayCards = shuffled
    ? [...filteredCards].sort(() => Math.random() - 0.5)
    : filteredCards;

  const card = displayCards[currentIndex];

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, displayCards.length - 1)));
      setIsFlipped(false);
    },
    [displayCards.length]
  );

  const markDifficulty = async (difficulty: Flashcard["difficultyTag"]) => {
    if (!card) return;
    setDifficultyMap((prev) => ({ ...prev, [card.id]: difficulty }));

    await fetch(`/api/suites/${suiteId}/flashcards`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flashcardId: card.id, difficultyTag: difficulty }),
    }).catch(console.error);

    // Auto-advance after marking
    setTimeout(() => goTo(currentIndex + 1), 300);
  };

  const handleShuffle = () => {
    setShuffled(!shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (flashcards.length === 0) {
    return (
      <EmptyState title="No flashcards yet" desc="Flashcards will be generated after you upload files to this suite." />
    );
  }

  const easy = Object.values(difficultyMap).filter((v) => v === "EASY").length;
  const medium = Object.values(difficultyMap).filter((v) => v === "MEDIUM").length;
  const hard = Object.values(difficultyMap).filter((v) => v === "HARD").length;
  const unreviewed = Object.values(difficultyMap).filter((v) => v === "UNREVIEWED").length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress summary */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Study Progress</p>
          <p className="text-xs text-muted-foreground">{flashcards.length} total cards</p>
        </div>
        <div className="flex rounded-full overflow-hidden h-2 gap-px">
          {easy > 0 && (
            <div className="bg-emerald-500" style={{ width: `${(easy / flashcards.length) * 100}%` }} />
          )}
          {medium > 0 && (
            <div className="bg-amber-500" style={{ width: `${(medium / flashcards.length) * 100}%` }} />
          )}
          {hard > 0 && (
            <div className="bg-red-500" style={{ width: `${(hard / flashcards.length) * 100}%` }} />
          )}
          {unreviewed > 0 && (
            <div className="bg-accent" style={{ width: `${(unreviewed / flashcards.length) * 100}%` }} />
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{easy} easy</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />{medium} medium</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{hard} hard</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" />{unreviewed} unseen</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(["ALL", "UNREVIEWED", "HARD", "MEDIUM", "EASY"] as DifficultyFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setCurrentIndex(0); setIsFlipped(false); }}
              className={cn(
                "px-3 py-1.5 text-xs rounded-lg font-medium transition-colors",
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "ALL" ? `All (${flashcards.length})` : f === "UNREVIEWED" ? `Unseen (${unreviewed})` : f === "EASY" ? `Easy (${easy})` : f === "MEDIUM" ? `Medium (${medium})` : `Hard (${hard})`}
            </button>
          ))}
        </div>
        <button
          onClick={handleShuffle}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors",
            shuffled ? "bg-indigo-600/20 text-indigo-400" : "bg-accent text-muted-foreground hover:text-foreground"
          )}
        >
          <Shuffle className="w-3 h-3" /> Shuffle
        </button>
      </div>

      {displayCards.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No cards in this filter. Try &quot;All&quot; or a different category.
        </div>
      ) : (
        <>
          {/* Card counter */}
          <div className="text-center text-sm text-muted-foreground mb-4">
            {currentIndex + 1} / {displayCards.length}
          </div>

          {/* Flashcard */}
          {card && (
            <div className="flashcard-scene mb-6 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={cn("flashcard-card relative h-64", isFlipped && "flipped")}>
                {/* Front */}
                <div className="flashcard-face absolute inset-0 glass-card border-white/10 flex flex-col items-center justify-center p-8 rounded-2xl">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-medium">
                    Question
                  </p>
                  <p className="text-lg font-semibold text-center leading-relaxed">{card.front}</p>
                  <p className="text-xs text-muted-foreground mt-6">Click to reveal answer</p>
                </div>

                {/* Back */}
                <div className="flashcard-face flashcard-back absolute inset-0 bg-indigo-600/10 border border-indigo-500/30 flex flex-col items-center justify-center p-8 rounded-2xl">
                  <p className="text-xs text-indigo-400 uppercase tracking-wider mb-4 font-medium">
                    Answer
                  </p>
                  <p className="text-base text-center leading-relaxed">{card.back}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation + rating */}
          {isFlipped && (
            <div className="flex items-center justify-center gap-3 mb-4">
              <p className="text-xs text-muted-foreground mr-2">How well did you know this?</p>
              <button
                onClick={() => markDifficulty("HARD")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors"
              >
                <ThumbsDown className="w-3.5 h-3.5" /> Hard
              </button>
              <button
                onClick={() => markDifficulty("MEDIUM")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium transition-colors"
              >
                <Minus className="w-3.5 h-3.5" /> Medium
              </button>
              <button
                onClick={() => markDifficulty("EASY")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Easy
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="p-2.5 rounded-xl bg-accent hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setCurrentIndex(0); setIsFlipped(false); }}
              className="p-2.5 rounded-xl bg-accent hover:bg-accent/80 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex >= displayCards.length - 1}
              className="p-2.5 rounded-xl bg-accent hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
        <Zap className="w-8 h-8 text-violet-400" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm">{desc}</p>
    </div>
  );
}
