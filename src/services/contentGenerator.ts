/**
 * contentGenerator.ts — Mock AI generation pipeline
 *
 * This service exposes clean async interfaces for generating all study content.
 * For MVP, it produces rich, realistic mock data derived from the extracted text.
 *
 * To integrate real AI (OpenAI, Anthropic, etc.), replace each function body
 * with an API call. The interfaces and return types stay identical.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

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
  topicIndex?: number; // links to topic by index
}

export interface GeneratedQuizQuestion {
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  choices?: string[];
  correctAnswer: string;
  explanation: string;
  topicIndex?: number;
}

export interface GeneratedQuiz {
  title: string;
  topicIndex?: number;
  questions: GeneratedQuizQuestion[];
}

export interface GeneratedEssayPrompt {
  prompt: string;
  outline: string;
  keyPoints: string[];
  topicIndex?: number;
}

export interface GenerationResult {
  topics: GeneratedTopic[];
  flashcards: GeneratedFlashcard[];
  quizzes: GeneratedQuiz[];
  essayPrompts: GeneratedEssayPrompt[];
}

// ─── Text Analysis Helpers ────────────────────────────────────────────────────

/**
 * Segments raw text into sections by detecting heading patterns.
 */
function segmentTextIntoTopics(text: string, courseName: string, examTitle: string): string[] {
  // Try to split by common heading patterns
  const headingPatterns = [
    /^#{1,3}\s+.+$/gm,           // Markdown headers
    /^[A-Z][A-Z\s]{4,}$/gm,      // ALL CAPS headings
    /^\d+\.\s+[A-Z].{3,}$/gm,    // Numbered sections: "1. Introduction"
    /^Chapter\s+\d+/gim,
    /^Section\s+\d+/gim,
    /^Unit\s+\d+/gim,
    /^Topic\s+\d+/gim,
    /^Part\s+[IVX\d]+/gim,
  ];

  let segments: string[] = [];

  for (const pattern of headingPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length >= 2) {
      segments = text.split(pattern).filter((s) => s.trim().length > 100);
      if (segments.length >= 2) break;
    }
  }

  // Fallback: split into roughly equal chunks (~800 words each)
  if (segments.length < 2) {
    const words = text.split(/\s+/);
    const chunkSize = Math.max(200, Math.floor(words.length / 5));
    for (let i = 0; i < words.length; i += chunkSize) {
      segments.push(words.slice(i, i + chunkSize).join(" "));
    }
  }

  return segments.slice(0, 10); // max 10 topics per suite
}

/**
 * Extract potential key terms from text (bolded, capitalized multi-word phrases, etc.)
 */
function extractKeyTermsFromText(text: string): GeneratedKeyTerm[] {
  // Look for patterns like "Term: definition" or "Term - definition"
  const colonPattern = /\b([A-Z][a-zA-Z\s]{2,25}):\s+([^.\n]{20,120})/g;
  const terms: GeneratedKeyTerm[] = [];
  let match;

  while ((match = colonPattern.exec(text)) !== null && terms.length < 8) {
    const term = match[1].trim();
    const definition = match[2].trim().replace(/\s+/g, " ");
    if (term.split(" ").length <= 4 && definition.length > 15) {
      terms.push({ term, definition });
    }
  }

  return terms;
}

// ─── Topic Generation ─────────────────────────────────────────────────────────

const TOPIC_TEMPLATES = [
  {
    prefix: "Overview of",
    summaryTemplate: (t: string) =>
      `A comprehensive introduction to ${t}, covering foundational concepts, key definitions, and the scope of the subject as it relates to the exam.`,
    traps: [
      "Confusing correlation with causation in examples",
      "Overlooking edge cases mentioned in lecture",
      "Misapplying definitions in novel contexts",
    ],
  },
  {
    prefix: "Key Concepts in",
    summaryTemplate: (t: string) =>
      `Deep dive into the core theoretical frameworks of ${t}, including major models, competing perspectives, and exam-critical distinctions.`,
    traps: [
      "Mixing up similar-sounding terminology",
      "Forgetting to apply the concept to specific examples",
      "Ignoring exceptions to the general rule",
    ],
  },
  {
    prefix: "Applications of",
    summaryTemplate: (t: string) =>
      `Practical application of ${t} across real-world scenarios. Focus on how exam questions test applied understanding, not just recall.`,
    traps: [
      "Applying theory to the wrong context",
      "Missing the 'why' behind procedures",
      "Over-generalizing from a single example",
    ],
  },
  {
    prefix: "Critical Analysis:",
    summaryTemplate: (t: string) =>
      `Analytical frameworks for evaluating ${t}. This section is high-yield for essays and short-answer questions requiring argument construction.`,
    traps: [
      "Presenting one-sided analysis without counterarguments",
      "Using weak evidence to support claims",
      "Conflating description with analysis",
    ],
  },
  {
    prefix: "Comparisons and Contrasts in",
    summaryTemplate: (t: string) =>
      `Side-by-side analysis of competing theories, models, and perspectives within ${t}. Critical for distinction-style exam questions.`,
    traps: [
      "Treating similar concepts as identical",
      "Missing nuance in comparative frameworks",
      "Forgetting to state the basis of comparison",
    ],
  },
];

const CONTENT_TEMPLATE = (title: string, summary: string) => `
## ${title}

### High-Yield Overview
${summary}

### In-Depth Explanation
This topic represents a core area of examination focus. Understanding it requires both conceptual clarity and the ability to apply ideas across different scenarios. Exam questions frequently test whether students can distinguish between related concepts and apply them appropriately.

Key frameworks to understand:
- The theoretical basis and why it matters
- How this concept connects to other topics in the course
- Real-world applications and case studies discussed in class
- Historical or contextual development of the idea

### Why This Is Exam-Critical
Professors frequently test this material through:
1. **Definition questions** — requiring precise, technical language
2. **Application questions** — giving you a scenario and asking you to identify or apply the concept
3. **Compare/contrast questions** — distinguishing this from a similar concept
4. **Essay prompts** — integrating this concept with broader course themes

### Mini Recap
Review this section the night before the exam. Focus on the key terms, common traps, and the high-yield overview. Make sure you can explain this concept clearly in your own words.
`.trim();

// ─── Main Generation Functions ────────────────────────────────────────────────

/**
 * Generate structured topics from extracted document text.
 * SWAP: Replace this with an LLM call (OpenAI/Anthropic) returning the same shape.
 */
export async function generateTopics(
  text: string,
  courseName: string,
  examTitle: string
): Promise<GeneratedTopic[]> {
  const segments = segmentTextIntoTopics(text, courseName, examTitle);

  const courseSubject = courseName.replace(/[A-Z]{2,4}\s*\d+/g, "").trim() || courseName;

  return segments.map((segment, index) => {
    const template = TOPIC_TEMPLATES[index % TOPIC_TEMPLATES.length];
    const topicTitle = `${template.prefix} ${courseSubject}${
      segments.length > 1 ? ` — Part ${index + 1}` : ""
    }`;

    const keyTerms = extractKeyTermsFromText(segment);
    if (keyTerms.length < 3) {
      // Add generic key terms if extraction yields few results
      keyTerms.push(
        {
          term: `${courseSubject} Framework`,
          definition: `The organizational structure used to understand and analyze ${courseSubject} concepts`,
        },
        {
          term: "Theoretical Model",
          definition: "A simplified representation of reality used to explain phenomena and make predictions",
        },
        {
          term: "Applied Analysis",
          definition: "The practical application of theoretical knowledge to real-world situations and case studies",
        }
      );
    }

    return {
      title: topicTitle,
      orderIndex: index,
      summary: template.summaryTemplate(courseSubject),
      fullContent: CONTENT_TEMPLATE(topicTitle, template.summaryTemplate(courseSubject)),
      keyTerms: keyTerms.slice(0, 8),
      commonTraps: template.traps,
    };
  });
}

/**
 * Generate flashcards from topics.
 * SWAP: Replace with LLM call.
 */
export async function generateFlashcards(
  topics: GeneratedTopic[],
  _text: string
): Promise<GeneratedFlashcard[]> {
  const cards: GeneratedFlashcard[] = [];

  for (let topicIndex = 0; topicIndex < topics.length; topicIndex++) {
    const topic = topics[topicIndex];

    // One card per key term
    for (const term of topic.keyTerms) {
      cards.push({
        front: `What is ${term.term}?`,
        back: term.definition,
        topicIndex,
      });
    }

    // One concept application card per topic
    cards.push({
      front: `How would you apply the concepts from "${topic.title}" to a real-world scenario?`,
      back: `Focus on the core framework: identify the relevant theory, apply it to the scenario using specific terminology, and note any exceptions or edge cases. ${topic.summary}`,
      topicIndex,
    });

    // One trap card per topic
    if (topic.commonTraps.length > 0) {
      cards.push({
        front: `What is the most common mistake students make about ${topic.title}?`,
        back: topic.commonTraps[0],
        topicIndex,
      });
    }
  }

  return cards;
}

/**
 * Generate quiz questions from topics.
 * SWAP: Replace with LLM call.
 */
export async function generateQuiz(
  topics: GeneratedTopic[],
  courseName: string
): Promise<GeneratedQuiz[]> {
  const quizzes: GeneratedQuiz[] = [];

  // Full suite quiz
  const allQuestions: GeneratedQuizQuestion[] = [];

  for (let topicIndex = 0; topicIndex < topics.length; topicIndex++) {
    const topic = topics[topicIndex];

    const topicQuestions: GeneratedQuizQuestion[] = [
      {
        questionText: `Which of the following best describes the core focus of "${topic.title}"?`,
        questionType: "MULTIPLE_CHOICE",
        choices: [
          topic.summary.slice(0, 80) + "...",
          "A historical overview without practical applications",
          "A purely mathematical or quantitative analysis",
          "An unrelated theoretical framework from a different discipline",
        ],
        correctAnswer: topic.summary.slice(0, 80) + "...",
        explanation: `Correct. ${topic.summary}`,
        topicIndex,
      },
      {
        questionText: `"${topic.commonTraps[0] ?? "Confusing correlation with causation"}" is an example of:`,
        questionType: "MULTIPLE_CHOICE",
        choices: [
          "A common exam trap to avoid",
          "A recommended study strategy",
          "A valid analytical approach",
          "An advanced theoretical concept",
        ],
        correctAnswer: "A common exam trap to avoid",
        explanation: `This is a frequently tested misconception. ${topic.commonTraps[0] ?? "Being aware of it helps you avoid losing points on exam questions."}`,
        topicIndex,
      },
    ];

    if (topic.keyTerms.length > 0) {
      const term = topic.keyTerms[0];
      topicQuestions.push({
        questionText: `Define "${term.term}" as used in the context of ${courseName}.`,
        questionType: "SHORT_ANSWER",
        correctAnswer: term.definition,
        explanation: `${term.term}: ${term.definition}`,
        topicIndex,
      });
    }

    allQuestions.push(...topicQuestions);

    // Topic-specific quiz
    quizzes.push({
      title: `Quiz: ${topic.title}`,
      topicIndex,
      questions: topicQuestions,
    });
  }

  // Full suite quiz
  quizzes.unshift({
    title: `Full Review Quiz: ${courseName}`,
    questions: allQuestions,
  });

  return quizzes;
}

/**
 * Generate essay prompts from topics.
 * SWAP: Replace with LLM call.
 */
export async function generateEssayPrompts(
  topics: GeneratedTopic[],
  courseName: string,
  examTitle: string
): Promise<GeneratedEssayPrompt[]> {
  const prompts: GeneratedEssayPrompt[] = [];

  for (let topicIndex = 0; topicIndex < topics.length; topicIndex++) {
    const topic = topics[topicIndex];

    prompts.push({
      prompt: `Critically evaluate the key concepts covered in "${topic.title}" as they apply to ${courseName}. Use specific examples and theoretical frameworks to support your argument.`,
      outline: `**Introduction (1 paragraph)**
- Define the core concept and its significance
- State your thesis/argument

**Body Paragraph 1 — Theoretical Framework**
- Introduce the main theory or model
- Explain its components and logic
- Cite any relevant scholars or frameworks

**Body Paragraph 2 — Application**
- Apply the concept to a concrete example
- Analyze how the theory explains the example
- Note any limitations or complications

**Body Paragraph 3 — Critical Evaluation**
- Assess the strengths and weaknesses of the framework
- Compare to alternative perspectives
- Address counterarguments

**Conclusion (1 paragraph)**
- Restate thesis with new nuance
- Summarize key analytical points
- End with broader implications`,
      keyPoints: [
        `Define all key terms before using them`,
        `Connect your argument to ${topic.title} explicitly`,
        `Use at least 2 specific examples from course material`,
        `Address at least one counterargument`,
        `Avoid logical fallacies — especially: ${topic.commonTraps[0] ?? "overgeneralization"}`,
      ],
      topicIndex,
    });
  }

  // Synthesis essay prompt
  if (topics.length > 1) {
    prompts.push({
      prompt: `Write a synthesis essay comparing and contrasting the major themes covered in ${examTitle} for ${courseName}. How do these concepts interrelate, and what broader conclusion can be drawn about the subject?`,
      outline: `**Introduction**
- Overview of major themes
- Thesis about their relationship

**Thematic Body Sections** (one per major theme)
- Explain concept
- Connect to other themes

**Synthesis**
- Where themes converge
- Where tensions or contradictions exist

**Conclusion**
- Broader significance`,
      keyPoints: [
        "Cover all major topics, not just your favorites",
        "Show connections between topics — don't treat them in isolation",
        "Use transitions that indicate comparative analysis (however, similarly, in contrast)",
        "Balance depth with breadth",
      ],
    });
  }

  return prompts;
}
