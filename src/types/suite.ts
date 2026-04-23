import { TestSuite, Topic, Flashcard, QuizQuestion, EssayPrompt, User, TestSuiteCollaborator, CollaboratorRole } from "@prisma/client";

// ─── Suite Types ──────────────────────────────────────────────────────────────

export type SuiteWithDetails = TestSuite & {
  owner: Pick<User, "id" | "name" | "avatarUrl">;
  collaborators: (TestSuiteCollaborator & {
    user: Pick<User, "id" | "name" | "avatarUrl" | "email">;
  })[];
  topics: Topic[];
  _count: {
    topics: number;
    flashcards: number;
    files: number;
  };
};

export type SuiteCard = Pick<
  TestSuite,
  "id" | "courseName" | "examTitle" | "examDate" | "status" | "visibility" | "isArchived" | "createdAt" | "updatedAt"
> & {
  owner: Pick<User, "id" | "name" | "avatarUrl">;
  _count: {
    topics: number;
    flashcards: number;
    files: number;
    collaborators: number;
  };
  progress?: number; // 0-100
};

// ─── Topic Types ──────────────────────────────────────────────────────────────

export interface KeyTerm {
  term: string;
  definition: string;
}

export type TopicWithKeyTerms = Omit<Topic, "keyTerms" | "commonTraps"> & {
  keyTerms: KeyTerm[];
  commonTraps: string[];
};

// ─── Quiz Types ───────────────────────────────────────────────────────────────

export type QuizWithQuestions = {
  id: string;
  suiteId: string;
  topicId: string | null;
  title: string;
  questions: QuizQuestion[];
};

export type QuizAnswer = {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
};

export type QuizSession = {
  quiz: QuizWithQuestions;
  answers: QuizAnswer[];
  currentIndex: number;
  isComplete: boolean;
  score: number;
};

// ─── Flashcard Types ──────────────────────────────────────────────────────────

export type FlashcardSession = {
  cards: Flashcard[];
  currentIndex: number;
  isFlipped: boolean;
  studied: Set<string>;
};

// ─── Essay Types ──────────────────────────────────────────────────────────────

export type EssayPromptWithPoints = Omit<EssayPrompt, "keyPoints"> & {
  keyPoints: string[];
};

// ─── Collaboration Types ──────────────────────────────────────────────────────

export type CollaboratorWithUser = TestSuiteCollaborator & {
  user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
};

export type InviteCollaboratorInput = {
  email: string;
  role: CollaboratorRole;
};

// ─── Create Suite Types ───────────────────────────────────────────────────────

export type CreateSuiteInput = {
  courseName: string;
  examTitle: string;
  examDate?: string;
  description?: string;
  visibility: "PRIVATE" | "COLLABORATIVE";
};

// ─── API Response Types ───────────────────────────────────────────────────────

export type ApiResponse<T> = {
  data?: T;
  error?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
