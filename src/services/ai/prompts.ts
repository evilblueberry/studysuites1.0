/**
 * All Gemini prompts for study content generation.
 * Prompts are exam-focused, structured, and produce JSON outputs.
 */

export function buildTopicsPrompt(
  courseName: string,
  examTitle: string,
  content: string
): string {
  return `You are an expert academic tutor creating exam study guides. Your output must be valid JSON only.

COURSE: ${courseName}
EXAM: ${examTitle}

STUDY MATERIAL:
---
${content}
---

Generate a comprehensive, exam-focused topic breakdown from the above material.

Return a JSON object with this exact structure:
{
  "topics": [
    {
      "title": "Precise, informative topic title",
      "orderIndex": 0,
      "summary": "2–3 sentence exam-oriented summary of what this topic covers and why it matters",
      "fullContent": "Full detailed markdown study guide. Use ## for sections, ### for sub-sections, **bold** for terms, - for bullets. Minimum 400 words. Include: overview, key concepts, mechanisms/processes, examples, and exam-critical details.",
      "keyTerms": [
        { "term": "Exact term from the material", "definition": "Clear, precise definition a student can memorize" }
      ],
      "commonTraps": [
        "Specific misconception or error students commonly make on exams for this topic"
      ]
    }
  ]
}

Rules:
- Generate 3–8 topics depending on content breadth. Do not pad with generic filler topics.
- Topics must come directly from the provided material — do not invent content.
- fullContent should be richly detailed: explain the "how" and "why," not just definitions.
- keyTerms: include every important term, formula, person, date, or concept likely to appear on the exam.
- commonTraps: be specific — name the exact confusion or mistake (e.g., "Confusing X with Y" not "Be careful").
- Order topics logically (foundational concepts first).
- Use markdown in fullContent for readability.`;
}

export function buildFlashcardsPrompt(
  courseName: string,
  examTitle: string,
  topicTitle: string,
  topicContent: string
): string {
  return `You are creating flashcards for exam preparation. Your output must be valid JSON only.

COURSE: ${courseName}
EXAM: ${examTitle}
TOPIC: ${topicTitle}

TOPIC CONTENT:
---
${topicContent}
---

Generate high-quality flashcards that cover all exam-relevant content from this topic.

Return a JSON object:
{
  "flashcards": [
    {
      "front": "Clear, specific question or term prompt",
      "back": "Complete, accurate answer (1–3 sentences max, no padding)"
    }
  ]
}

Rules:
- Generate 6–15 flashcards per topic. Quantity depends on content richness.
- Cover: definitions, key terms, formulas, processes, differences between concepts, examples, dates/names.
- Front: phrase as a question when possible (e.g., "What is X?" or "How does X differ from Y?").
- Back: be complete but concise. Include just enough to fully answer the question.
- Do NOT generate duplicate or near-duplicate cards.
- Focus on what is most likely to be tested.`;
}

export function buildQuizPrompt(
  courseName: string,
  examTitle: string,
  topicTitle: string,
  topicContent: string
): string {
  return `You are creating practice exam questions. Your output must be valid JSON only.

COURSE: ${courseName}
EXAM: ${examTitle}
TOPIC: ${topicTitle}

TOPIC CONTENT:
---
${topicContent}
---

Generate practice quiz questions for this topic.

Return a JSON object:
{
  "questions": [
    {
      "questionText": "The complete question text",
      "questionType": "MULTIPLE_CHOICE",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this answer is correct, and why the others are not"
    }
  ]
}

Rules:
- Generate 3–6 questions per topic.
- Mix question types:
  - 80% MULTIPLE_CHOICE (4 options, exactly one correct)
  - 20% SHORT_ANSWER (set questionType to "SHORT_ANSWER", omit choices, correctAnswer is a model answer)
- Distractors must be plausible — not obviously wrong. Use common misconceptions.
- correctAnswer must exactly match one of the choices (for MC).
- Explanation should explain why the correct answer is right AND why plausible wrong answers are wrong.
- Difficulty should match a real exam: not trivial, not impossibly obscure.
- Base all questions directly on the provided topic content.`;
}

export function buildEssayPromptsPrompt(
  courseName: string,
  examTitle: string,
  allTopics: Array<{ title: string; summary: string }>
): string {
  const topicList = allTopics
    .map((t, i) => `${i + 1}. ${t.title}: ${t.summary}`)
    .join("\n");

  return `You are generating likely essay/long-answer exam prompts. Your output must be valid JSON only.

COURSE: ${courseName}
EXAM: ${examTitle}

TOPICS COVERED:
${topicList}

Generate essay preparation materials for this exam.

Return a JSON object:
{
  "prompts": [
    {
      "prompt": "The complete essay question as it might appear on the exam",
      "topicIndex": 0,
      "outline": "Detailed essay outline with: Introduction (thesis), Body sections (2–4), Conclusion. Format as plain text with clear section labels.",
      "keyPoints": [
        "Specific argument, evidence, or concept the essay MUST address to score well"
      ]
    }
  ]
}

Rules:
- Generate 2–4 essay prompts.
- Prompts should be substantive: require synthesis, analysis, or argument — not just recall.
- Each outline should provide enough structure for a student to write a complete essay.
- keyPoints: list 4–7 specific, concrete points that separate an A answer from a C answer.
- topicIndex: 0-based index of the most relevant topic from the list above.
- Make prompts feel like real exam questions from a college/university course.`;
}
