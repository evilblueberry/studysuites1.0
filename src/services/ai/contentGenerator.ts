/**
 * AI content generation service.
 *
 * USE_MOCK_AI=true  → returns deterministic mock data (fast, no API key needed)
 * USE_MOCK_AI=false → calls Gemini 2.5 Flash (default)
 *
 * All functions accept plain text and return typed objects ready for Prisma.
 */

import { callGeminiJson } from "./geminiClient";
import { chunkDocument, deduplicateTopics } from "./chunker";
import {
  buildTopicsPrompt,
  buildFlashcardsPrompt,
  buildQuizPrompt,
  buildEssayPromptsPrompt,
} from "./prompts";

// ─── Output types ─────────────────────────────────────────────────────────────

export interface GeneratedKeyTerm {
  term: string;
  definition: string;
}

export interface GeneratedTopic {
  title: string;
  orderIndex: number;
  summary: string;
  fullContent: string;
  keyTerms: GeneratedKeyTerm[];
  commonTraps: string[];
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export interface GeneratedQuizQuestion {
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER";
  choices: string[] | null;
  correctAnswer: string;
  explanation: string;
}

export interface GeneratedEssayPrompt {
  prompt: string;
  topicIndex: number;
  outline: string;
  keyPoints: string[];
}

// ─── Mock fallback ─────────────────────────────────────────────────────────────

function useMock(): boolean {
  return process.env.USE_MOCK_AI === "true";
}

function mockTopics(courseName: string, examTitle: string): GeneratedTopic[] {
  return [
    {
      title: `Core Concepts — ${examTitle}`,
      orderIndex: 0,
      summary: `Foundational concepts for ${courseName} ${examTitle}. Review this topic first.`,
      fullContent: `## Core Concepts\n\nThis topic covers the primary material for ${examTitle}.\n\n### Key Ideas\n- Main concept A\n- Main concept B\n\n### Why It Matters\nUnderstanding these concepts is foundational to all other topics.`,
      keyTerms: [{ term: "Core Term", definition: "The fundamental unit of analysis in this subject" }],
      commonTraps: ["Confusing adjacent terms that sound similar but have different meanings"],
    },
    {
      title: `Applications and Analysis — ${examTitle}`,
      orderIndex: 1,
      summary: `Applied reasoning and analytical frameworks relevant to ${courseName}.`,
      fullContent: `## Applications\n\nThis section covers practical application of core concepts.\n\n### Analysis Framework\n1. Identify the key variable\n2. Apply the relevant model\n3. Evaluate the outcome`,
      keyTerms: [{ term: "Applied Method", definition: "A systematic approach to analyzing problems in context" }],
      commonTraps: ["Applying the wrong framework to a problem type"],
    },
  ];
}

// ─── Real AI generation ────────────────────────────────────────────────────────

export async function generateTopics(
  text: string,
  courseName: string,
  examTitle: string
): Promise<GeneratedTopic[]> {
  if (useMock()) return mockTopics(courseName, examTitle);

  const chunks = chunkDocument(text);
  console.log(`[ai] Generating topics from ${chunks.length} chunk(s)…`);

  const allTopics: GeneratedTopic[] = [];

  for (const chunk of chunks) {
    const prompt = buildTopicsPrompt(courseName, examTitle, chunk.text);
    const result = await callGeminiJson<{ topics: GeneratedTopic[] }>(prompt);

    if (Array.isArray(result.topics)) {
      allTopics.push(...result.topics);
    }
  }

  const deduped = deduplicateTopics(allTopics);

  // Re-number orderIndex after dedup
  return deduped.map((t, i) => ({ ...t, orderIndex: i }));
}

export async function generateFlashcards(
  topic: GeneratedTopic,
  courseName: string,
  examTitle: string
): Promise<GeneratedFlashcard[]> {
  if (useMock()) {
    return [
      { front: `What is the main concept of "${topic.title}"?`, back: topic.summary },
      {
        front: topic.keyTerms[0]?.term ?? "Key Term",
        back: topic.keyTerms[0]?.definition ?? "Definition goes here",
      },
    ];
  }

  const prompt = buildFlashcardsPrompt(
    courseName,
    examTitle,
    topic.title,
    topic.fullContent
  );

  const result = await callGeminiJson<{ flashcards: GeneratedFlashcard[] }>(prompt);
  return Array.isArray(result.flashcards) ? result.flashcards : [];
}

export async function generateQuizQuestions(
  topic: GeneratedTopic,
  courseName: string,
  examTitle: string
): Promise<GeneratedQuizQuestion[]> {
  if (useMock()) {
    return [
      {
        questionText: `Which of the following best describes "${topic.title}"?`,
        questionType: "MULTIPLE_CHOICE",
        choices: [topic.summary.slice(0, 80), "A completely unrelated concept", "A specific technique from another field", "None of the above"],
        correctAnswer: topic.summary.slice(0, 80),
        explanation: `The correct answer captures the core idea of ${topic.title}.`,
      },
    ];
  }

  const prompt = buildQuizPrompt(
    courseName,
    examTitle,
    topic.title,
    topic.fullContent
  );

  const result = await callGeminiJson<{ questions: GeneratedQuizQuestion[] }>(prompt);

  return (result.questions ?? []).map((q) => ({
    ...q,
    choices: q.questionType === "MULTIPLE_CHOICE" ? (q.choices ?? []) : null,
  }));
}

export async function generateEssayPrompts(
  topics: GeneratedTopic[],
  courseName: string,
  examTitle: string
): Promise<GeneratedEssayPrompt[]> {
  if (useMock()) {
    return [
      {
        prompt: `Discuss the major themes covered in ${examTitle} for ${courseName}. Use specific examples from the course material.`,
        topicIndex: 0,
        outline: `**Introduction**\n- Define key terms\n- State thesis\n\n**Body**\n- Topic 1 analysis\n- Topic 2 analysis\n\n**Conclusion**\n- Synthesize arguments`,
        keyPoints: [
          "Must reference specific examples from course material",
          "Distinguish between related but distinct concepts",
          "Address both theory and application",
        ],
      },
    ];
  }

  const prompt = buildEssayPromptsPrompt(courseName, examTitle, topics);
  const result = await callGeminiJson<{
    prompts: GeneratedEssayPrompt[];
  }>(prompt);

  return Array.isArray(result.prompts) ? result.prompts : [];
}
