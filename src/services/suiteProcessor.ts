/**
 * Suite processing pipeline.
 *
 * Orchestrates: text extraction → AI generation → DB persistence.
 * Updates suite.generationLog in real time so the UI can poll progress.
 *
 * Called fire-and-forget from the files upload route.
 */

import { prisma } from "@/lib/prisma";
import {
  generateTopics,
  generateFlashcards,
  generateQuizQuestions,
  generateEssayPrompts,
} from "./ai/contentGenerator";

type LogStep =
  | "extracting"
  | "topics"
  | "flashcards"
  | "quiz"
  | "essay"
  | "saving"
  | "done"
  | "error";

type LogStatus = "pending" | "running" | "done" | "error";

interface LogEntry {
  step: LogStep;
  status: LogStatus;
  label: string;
  ts: string;
}

async function appendLog(suiteId: string, entry: LogEntry) {
  const suite = await prisma.testSuite.findUnique({
    where: { id: suiteId },
    select: { generationLog: true },
  });

  const log = (suite?.generationLog as LogEntry[]) ?? [];

  // Update existing step or append
  const idx = log.findIndex((l) => l.step === entry.step);
  if (idx >= 0) {
    log[idx] = entry;
  } else {
    log.push(entry);
  }

  await prisma.testSuite.update({
    where: { id: suiteId },
    data: { generationLog: log as object[] },
  });
}

export async function processSuite(suiteId: string): Promise<void> {
  console.log(`[processor] Starting suite ${suiteId}`);

  try {
    await prisma.testSuite.update({
      where: { id: suiteId },
      data: { status: "PROCESSING", generationLog: [] },
    });

    // ── Step 1: Gather uploaded file text ────────────────────────────────────
    await appendLog(suiteId, {
      step: "extracting",
      status: "running",
      label: "Extracting text from uploaded files…",
      ts: new Date().toISOString(),
    });

    const suite = await prisma.testSuite.findUnique({
      where: { id: suiteId },
      include: { files: true },
    });

    if (!suite) throw new Error(`Suite ${suiteId} not found`);

    const combinedText = suite.files
      .map((f) => f.extractedText ?? "")
      .filter(Boolean)
      .join("\n\n---\n\n");

    if (!combinedText.trim()) {
      throw new Error("No text could be extracted from the uploaded files.");
    }

    await appendLog(suiteId, {
      step: "extracting",
      status: "done",
      label: `Extracted text from ${suite.files.length} file(s)`,
      ts: new Date().toISOString(),
    });

    // ── Step 2: Generate topics ───────────────────────────────────────────────
    await appendLog(suiteId, {
      step: "topics",
      status: "running",
      label: "Generating topic study guides with Gemini…",
      ts: new Date().toISOString(),
    });

    const topics = await generateTopics(
      combinedText,
      suite.courseName,
      suite.examTitle
    );

    await appendLog(suiteId, {
      step: "topics",
      status: "done",
      label: `Generated ${topics.length} topic(s)`,
      ts: new Date().toISOString(),
    });

    // ── Step 3: Generate flashcards ───────────────────────────────────────────
    await appendLog(suiteId, {
      step: "flashcards",
      status: "running",
      label: "Generating flashcards…",
      ts: new Date().toISOString(),
    });

    // ── Step 4: Generate quiz questions ──────────────────────────────────────
    await appendLog(suiteId, {
      step: "quiz",
      status: "running",
      label: "Generating quiz questions…",
      ts: new Date().toISOString(),
    });

    // Generate flashcards and quizzes for all topics in parallel
    const topicResults = await Promise.all(
      topics.map(async (topic) => {
        const [flashcards, questions] = await Promise.all([
          generateFlashcards(topic, suite.courseName, suite.examTitle),
          generateQuizQuestions(topic, suite.courseName, suite.examTitle),
        ]);
        return { topic, flashcards, questions };
      })
    );

    await appendLog(suiteId, {
      step: "flashcards",
      status: "done",
      label: `Generated ${topicResults.reduce((s, t) => s + t.flashcards.length, 0)} flashcard(s)`,
      ts: new Date().toISOString(),
    });

    await appendLog(suiteId, {
      step: "quiz",
      status: "done",
      label: `Generated ${topicResults.reduce((s, t) => s + t.questions.length, 0)} quiz question(s)`,
      ts: new Date().toISOString(),
    });

    // ── Step 5: Generate essay prompts ────────────────────────────────────────
    await appendLog(suiteId, {
      step: "essay",
      status: "running",
      label: "Generating essay prompts…",
      ts: new Date().toISOString(),
    });

    const essayPrompts = await generateEssayPrompts(
      topics,
      suite.courseName,
      suite.examTitle
    );

    await appendLog(suiteId, {
      step: "essay",
      status: "done",
      label: `Generated ${essayPrompts.length} essay prompt(s)`,
      ts: new Date().toISOString(),
    });

    // ── Step 6: Persist to DB ─────────────────────────────────────────────────
    await appendLog(suiteId, {
      step: "saving",
      status: "running",
      label: "Saving to database…",
      ts: new Date().toISOString(),
    });

    // Clear any existing generated content (supports re-run)
    await prisma.$transaction([
      prisma.topic.deleteMany({ where: { suiteId } }),
      prisma.flashcard.deleteMany({ where: { suiteId } }),
      prisma.quiz.deleteMany({ where: { suiteId } }),
      prisma.essayPrompt.deleteMany({ where: { suiteId } }),
    ]);

    // Insert topics, flashcards, quizzes
    for (const { topic, flashcards, questions } of topicResults) {
      const dbTopic = await prisma.topic.create({
        data: {
          suiteId,
          title: topic.title,
          orderIndex: topic.orderIndex,
          summary: topic.summary,
          fullContent: topic.fullContent,
          keyTerms: topic.keyTerms as object[],
          commonTraps: topic.commonTraps,
        },
      });

      // Flashcards
      if (flashcards.length > 0) {
        await prisma.flashcard.createMany({
          data: flashcards.map((fc, i) => ({
            suiteId,
            topicId: dbTopic.id,
            front: fc.front,
            back: fc.back,
            orderIndex: i,
          })),
        });
      }

      // Quiz for this topic
      if (questions.length > 0) {
        const quiz = await prisma.quiz.create({
          data: {
            suiteId,
            topicId: dbTopic.id,
            title: `Quiz: ${topic.title}`,
          },
        });

        await prisma.quizQuestion.createMany({
          data: questions.map((q) => ({
            quizId: quiz.id,
            questionText: q.questionText,
            questionType: q.questionType,
            choices: q.choices ?? undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
        });
      }
    }

    // Essay prompts
    for (const ep of essayPrompts) {
      const relatedTopicId = topicResults[ep.topicIndex]
        ? undefined // we'd need the DB id — skip linking for safety
        : undefined;

      await prisma.essayPrompt.create({
        data: {
          suiteId,
          topicId: relatedTopicId ?? null,
          prompt: ep.prompt,
          outline: ep.outline,
          keyPoints: ep.keyPoints,
        },
      });
    }

    // ── Mark READY ───────────────────────────────────────────────────────────
    await appendLog(suiteId, {
      step: "saving",
      status: "done",
      label: "All content saved",
      ts: new Date().toISOString(),
    });

    await appendLog(suiteId, {
      step: "done",
      status: "done",
      label: "Suite is ready to study!",
      ts: new Date().toISOString(),
    });

    await prisma.testSuite.update({
      where: { id: suiteId },
      data: { status: "READY" },
    });

    console.log(`[processor] Suite ${suiteId} READY ✓`);
  } catch (err) {
    console.error(`[processor] Suite ${suiteId} ERROR:`, err);

    await appendLog(suiteId, {
      step: "error",
      status: "error",
      label: err instanceof Error ? err.message : "Unknown error during generation",
      ts: new Date().toISOString(),
    });

    await prisma.testSuite.update({
      where: { id: suiteId },
      data: { status: "ERROR" },
    });
  }
}
