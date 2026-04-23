declare module "mammoth" {
  export interface ExtractionResult {
    value: string; // The generated text
    messages: any[]; // Any messages, such as warnings during conversion
  }

  export function extractRawText(input: {
    buffer: Buffer;
  }): Promise<ExtractionResult>;
}
