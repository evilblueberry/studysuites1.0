/**
 * Document chunking for long study materials.
 *
 * Gemini 2.5 Flash has a 1M token context window, but we chunk at ~8k chars
 * per topic-generation pass so each pass is focused and outputs are clean.
 * For flashcard/quiz generation we use the full topic content (already bounded).
 */

const CHUNK_SIZE = 8000; // chars (~2000 tokens)
const OVERLAP = 400; // chars of overlap between chunks

interface Chunk {
  text: string;
  index: number;
}

/**
 * Split document text into chunks by headings first, then by fixed window.
 * Tries to split on Markdown headings (##, ###) or double-newlines.
 */
export function chunkDocument(text: string): Chunk[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  // If short enough, return as a single chunk
  if (normalized.length <= CHUNK_SIZE * 1.5) {
    return [{ text: normalized, index: 0 }];
  }

  // Try heading-based splitting first
  const headingChunks = splitByHeadings(normalized);
  if (headingChunks.length > 1) {
    // Merge very small adjacent chunks
    return mergeSmallChunks(headingChunks);
  }

  // Fall back to fixed-window splitting
  return splitByWindow(normalized);
}

function splitByHeadings(text: string): Chunk[] {
  // Split on lines that look like headings
  const headingPattern = /^(#{1,3}\s+.+|[A-Z][^.!?]{10,80}:?\s*$)/m;
  const parts = text.split(/\n(?=#{1,3}\s+)/);

  if (parts.length <= 1) {
    // No markdown headings — try bold section headers
    const boldParts = text.split(/\n(?=\*\*[A-Z])/);
    if (boldParts.length > 1) {
      return boldParts.map((p, i) => ({ text: p.trim(), index: i })).filter((c) => c.text.length > 100);
    }
    return [{ text: text, index: 0 }];
  }

  return parts
    .map((p, i) => ({ text: p.trim(), index: i }))
    .filter((c) => c.text.length > 100);
}

function mergeSmallChunks(chunks: Chunk[]): Chunk[] {
  const merged: Chunk[] = [];
  let current = "";
  let startIndex = 0;

  for (const chunk of chunks) {
    if (current.length + chunk.text.length <= CHUNK_SIZE) {
      current = current ? `${current}\n\n${chunk.text}` : chunk.text;
    } else {
      if (current) {
        merged.push({ text: current, index: startIndex });
        startIndex = chunk.index;
      }
      current = chunk.text;
    }
  }

  if (current) merged.push({ text: current, index: startIndex });
  return merged;
}

function splitByWindow(text: string): Chunk[] {
  const chunks: Chunk[] = [];
  let pos = 0;
  let index = 0;

  while (pos < text.length) {
    const end = Math.min(pos + CHUNK_SIZE, text.length);

    // Try to break at a paragraph boundary
    let breakPoint = end;
    if (end < text.length) {
      const lastNewline = text.lastIndexOf("\n\n", end);
      if (lastNewline > pos + CHUNK_SIZE / 2) {
        breakPoint = lastNewline;
      }
    }

    chunks.push({ text: text.slice(pos, breakPoint).trim(), index });
    pos = breakPoint - OVERLAP;
    index++;
  }

  return chunks.filter((c) => c.text.length > 50);
}

/**
 * Merge topic results from multiple chunks, deduplicating by title similarity.
 */
export function deduplicateTopics<T extends { title: string }>(topics: T[]): T[] {
  const seen = new Set<string>();
  return topics.filter((topic) => {
    const key = topic.title.toLowerCase().replace(/\s+/g, " ").trim();
    // Check for very similar titles (first 30 chars)
    const prefix = key.slice(0, 30);
    if (seen.has(prefix)) return false;
    seen.add(prefix);
    return true;
  });
}
