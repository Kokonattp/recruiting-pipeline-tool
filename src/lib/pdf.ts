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
    // pdf-parse's bundled pdfjs-dist constructs a module-scope `new DOMMatrix()`
    // singleton the moment it's loaded — even for plain text extraction with no
    // rendering — and DOMMatrix (a browser Canvas API) doesn't exist in Vercel's
    // Node.js serverless runtime. pdfjs has its own polyfill-acceptance check for
    // exactly this case (`globalThis.DOMMatrix || ...`), so provide one. Must import
    // pdf-parse dynamically (not as a static top-level import) so this runs before
    // its module evaluates — static ESM imports are hoisted ahead of any code in
    // this file, which is what let the crash happen at all.
    if (typeof globalThis.DOMMatrix === "undefined") {
      const { default: DOMMatrixPolyfill } = await import("dommatrix");
      (globalThis as unknown as { DOMMatrix: unknown }).DOMMatrix = DOMMatrixPolyfill;
    }
    const { PDFParse } = await import("pdf-parse");
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
