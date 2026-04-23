"use client";

import { useState } from "react";
import { HelpCircle, CheckCircle2, XCircle, ChevronRight, RefreshCw, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  questionText: string;
  questionType: string;
  choices: string[] | null;
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  topicId: string | null;
  topic: { id: string; title: string } | null;
  questions: QuizQuestion[];
}

interface Props {
  quizzes: Quiz[];
}

export default function QuizTab({ quizzes }: Props) {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizState, setQuizState] = useState<"select" | "active" | "complete">("select");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  if (quizzes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
          <HelpCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No quizzes yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Quizzes are generated after you upload study materials. Check back soon.
        </p>
      </div>
    );
  }

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQ(0);
    setAnswers({});
    setRevealed({});
    setQuizState("active");
  };

  const selectAnswer = (questionId: string, answer: string) => {
    if (answers[questionId]) return; // Already answered
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setRevealed((prev) => ({ ...prev, [questionId]: true }));
  };

  const nextQuestion = () => {
    if (!selectedQuiz) return;
    if (currentQ < selectedQuiz.questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setQuizState("complete");
    }
  };

  if (quizState === "select") {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <h2 className="text-lg font-semibold mb-4">Choose a Quiz</h2>
        {quizzes.map((quiz) => (
          <button
            key={quiz.id}
            onClick={() => startQuiz(quiz)}
            className="w-full glass-card p-5 text-left hover:-translate-y-0.5 hover:border-white/10 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">{quiz.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {quiz.questions.length} question{quiz.questions.length === 1 ? "" : "s"}
                  {quiz.topic && ` · ${quiz.topic.title}`}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (quizState === "complete" && selectedQuiz) {
    const totalQ = selectedQuiz.questions.length;
    const correct = selectedQuiz.questions.filter(
      (q) => answers[q.id] === q.correctAnswer
    ).length;
    const pct = Math.round((correct / totalQ) * 100);

    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-10 text-center mb-6">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
            <Trophy className={cn("w-10 h-10", pct >= 80 ? "text-amber-400" : pct >= 60 ? "text-indigo-400" : "text-red-400")} />
          </div>
          <h2 className="text-3xl font-bold mb-2">{pct}%</h2>
          <p className="text-muted-foreground mb-1">
            {correct} / {totalQ} correct
          </p>
          <p className="text-sm text-muted-foreground">
            {pct >= 80 ? "Excellent! You're well-prepared." : pct >= 60 ? "Good progress — review the missed questions." : "Keep studying — focus on the questions you missed."}
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => startQuiz(selectedQuiz)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <button
              onClick={() => setQuizState("select")}
              className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-foreground px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              All Quizzes
            </button>
          </div>
        </div>

        {/* Review answers */}
        <h3 className="font-semibold mb-3">Review Answers</h3>
        <div className="space-y-3">
          {selectedQuiz.questions.map((q, i) => {
            const userAns = answers[q.id];
            const isCorrect = userAns === q.correctAnswer;
            return (
              <div key={q.id} className={cn("glass-card p-4 border", isCorrect ? "border-emerald-500/20" : "border-red-500/20")}>
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4.5 h-4.5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">{q.questionText}</p>
                    {!isCorrect && (
                      <p className="text-xs text-red-400 mb-1">Your answer: {userAns}</p>
                    )}
                    <p className={cn("text-xs font-medium", isCorrect ? "text-emerald-400" : "text-emerald-400")}>
                      Correct: {q.correctAnswer}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active quiz
  if (quizState === "active" && selectedQuiz) {
    const q = selectedQuiz.questions[currentQ];
    const userAnswer = answers[q.id];
    const isRevealed = !!revealed[q.id];
    const isCorrect = userAnswer === q.correctAnswer;
    const progress = ((currentQ + (isRevealed ? 1 : 0)) / selectedQuiz.questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>Question {currentQ + 1} of {selectedQuiz.questions.length}</span>
          <button onClick={() => setQuizState("select")} className="hover:text-foreground transition-colors">
            Exit
          </button>
        </div>
        <div className="h-1.5 bg-accent rounded-full overflow-hidden mb-6">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="glass-card p-6 mb-4">
          <p className="text-base font-semibold leading-relaxed mb-6">{q.questionText}</p>

          {/* Multiple choice */}
          {q.questionType === "MULTIPLE_CHOICE" && q.choices && (
            <div className="space-y-2">
              {q.choices.map((choice) => {
                let variant = "default";
                if (isRevealed) {
                  if (choice === q.correctAnswer) variant = "correct";
                  else if (choice === userAnswer && choice !== q.correctAnswer) variant = "wrong";
                }
                return (
                  <button
                    key={choice}
                    onClick={() => selectAnswer(q.id, choice)}
                    disabled={isRevealed}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl text-sm border transition-all",
                      variant === "correct"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium"
                        : variant === "wrong"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : isRevealed
                        ? "bg-accent border-border text-muted-foreground opacity-60"
                        : "bg-accent border-border text-foreground hover:border-white/20 hover:bg-accent/80 cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {variant === "correct" && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                      {variant === "wrong" && <XCircle className="w-4 h-4 flex-shrink-0" />}
                      {choice}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Short answer */}
          {q.questionType === "SHORT_ANSWER" && (
            <div>
              {!isRevealed ? (
                <div className="space-y-3">
                  <textarea
                    placeholder="Type your answer..."
                    className="w-full bg-accent border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-muted-foreground resize-none"
                    rows={3}
                    id={`answer-${q.id}`}
                  />
                  <button
                    onClick={() => {
                      const val = (document.getElementById(`answer-${q.id}`) as HTMLTextAreaElement)?.value ?? "";
                      selectAnswer(q.id, val);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    Check Answer
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-xs text-emerald-400 font-medium mb-1">Model Answer</p>
                  <p className="text-sm">{q.correctAnswer}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Explanation */}
        {isRevealed && (
          <div className={cn("glass-card p-4 mb-4 border", isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5")}>
            <p className="text-xs font-medium mb-1 text-muted-foreground">Explanation</p>
            <p className="text-sm leading-relaxed">{q.explanation}</p>
          </div>
        )}

        {isRevealed && (
          <button
            onClick={nextQuestion}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium text-sm transition-colors"
          >
            {currentQ < selectedQuiz.questions.length - 1 ? (
              <><ChevronRight className="w-4.5 h-4.5" /> Next Question</>
            ) : (
              <><Trophy className="w-4.5 h-4.5" /> Finish Quiz</>
            )}
          </button>
        )}
      </div>
    );
  }

  return null;
}
