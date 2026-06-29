import { PDFParse } from "pdf-parse";

/**
 * Server-side PDF text extraction (token optimization for Module 2).
 *
 * Sending a PDF to Claude as a native document counts the rendered *image* of every
 * page on top of its text — several times the tokens of plain text. For ordinary
 * text-based CVs we extract the text here first and send only that. Scanned/image-only
 * CVs yield little or no text; we return null so the caller falls back to Claude's
 * native PDF reading (which can OCR), trading cost for correctness only when needed.
 *
 * Runs on the server only (pdf-parse pulls in Node APIs).
 */
export async function extractPdfText(base64: string): Promise<string | null> {
  try {
    const buffer = Buffer.from(base64, "base64");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text?.trim() ?? "";
    // Too little text almost certainly means a scanned/image PDF — let Claude OCR it.
    return text.length >= 80 ? text : null;
  } catch {
    // Corrupt/unsupported PDF — fall back to native reading rather than failing.
    return null;
  }
}
