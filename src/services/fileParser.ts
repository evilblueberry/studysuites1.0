/**
 * fileParser.ts — Extract plain text from uploaded documents
 *
 * Supports: PDF, DOCX (.docx), TXT, and plain text fallback.
 * Returns extracted text for use by the content generation pipeline.
 */

import fs from "fs/promises";

export interface ParsedFile {
  text: string;
  charCount: number;
  wordCount: number;
}

/**
 * Extract text from a file buffer based on MIME type.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ParsedFile> {
  try {
    let text = "";

    if (
      mimeType === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf")
    ) {
      text = await extractFromPdf(buffer);
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.toLowerCase().endsWith(".docx")
    ) {
      text = await extractFromDocx(buffer);
    } else {
      // TXT or any other text-based format
      text = buffer.toString("utf-8");
    }

    const wordCount = text
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    return {
      text: text.trim(),
      charCount: text.length,
      wordCount,
    };
  } catch (err) {
    console.error("[fileParser] Extraction error:", err);
    return {
      text: `[Unable to extract text from ${fileName}. Please ensure the file is not password-protected or corrupted.]`,
      charCount: 0,
      wordCount: 0,
    };
  }
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid issues with Next.js server components
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return result.text;
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Extract text from a file path (used in seed/testing).
 */
export async function extractTextFromPath(filePath: string): Promise<ParsedFile> {
  const ext = filePath.toLowerCase().split(".").pop() ?? "";
  let mimeType = "text/plain";

  if (ext === "pdf") mimeType = "application/pdf";
  else if (ext === "docx")
    mimeType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const buffer = await fs.readFile(filePath);
  const fileName = filePath.split("/").pop() ?? "file";
  return extractTextFromBuffer(buffer, mimeType, fileName);
}
