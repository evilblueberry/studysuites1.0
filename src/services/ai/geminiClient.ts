import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-2.5-flash-preview-04-17";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY env var is not set");
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Returns a configured Gemini model with JSON output mode.
 * temperature=0.4 gives creative but deterministic enough outputs for study content.
 */
export function getJsonModel(config?: Partial<GenerationConfig>) {
  const client = getClient();
  const modelName = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  return client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 8192,
      ...config,
    },
  });
}

/**
 * Call Gemini and parse the JSON response. Retries once on parse failure.
 */
export async function callGeminiJson<T>(prompt: string): Promise<T> {
  const model = getJsonModel();

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text) as T;
    } catch (err) {
      if (attempt === 2) {
        console.error("[gemini] Failed after 2 attempts:", err);
        throw new Error(
          `Gemini generation failed: ${err instanceof Error ? err.message : String(err)}`
        );
      }
      console.warn("[gemini] Attempt 1 failed, retrying…");
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  throw new Error("Unreachable");
}
