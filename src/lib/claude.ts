import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/**
 * Central Claude API helper.
 *
 * Every AI feature in the app (Module 1 query-gen/normalize/rank, Module 2 screening)
 * goes through `structured()` so we get *validated* JSON back, never free-form text.
 * The model is forced to fill a strict tool schema; the result is then re-checked with
 * a zod schema before any caller trusts it. This is the guardrail against hallucinated
 * shapes breaking the database write.
 */

/** Default model — used where reasoning depth matters (JD gen, query plan, ranking). */
export const CLAUDE_MODEL = "claude-opus-4-8";

/**
 * Model for high-volume, well-scoped extraction like resume screening. Haiku is far
 * cheaper than Opus and the screening task is bounded by a strict tool schema, so the
 * quality trade-off is small while the per-CV cost drops by an order of magnitude.
 */
export const SCREENING_MODEL = "claude-haiku-4-5-20251001";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY. Add it to .env.local.");
  }
  _client = new Anthropic();
  return _client;
}

interface StructuredOptions<T> {
  /** System prompt — the role/instructions. */
  system: string;
  /** User content — plain text, or content blocks (e.g. a PDF document + text). */
  user: string | Anthropic.ContentBlockParam[];
  /** Name of the synthetic tool the model must call. */
  toolName: string;
  /** Human description of what the tool captures. */
  toolDescription: string;
  /** JSON schema for the tool input (must set additionalProperties:false + required). */
  inputSchema: Record<string, unknown>;
  /** zod schema used to validate + type the result after the model responds. */
  validate: z.ZodType<T>;
  maxTokens?: number;
  /** Override the model (defaults to CLAUDE_MODEL). e.g. SCREENING_MODEL for cheap, bounded tasks. */
  model?: string;
}

/**
 * Ask Claude to produce structured output by forcing a single strict tool call,
 * then validate the result with zod. Throws if the model declines or the shape
 * fails validation — callers should surface that as a clear error, not a silent fallback.
 */
export async function structured<T>(opts: StructuredOptions<T>): Promise<T> {
  const response = await client().messages.create({
    model: opts.model ?? CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 16000,
    thinking: { type: "adaptive" },
    system: opts.system,
    tools: [
      {
        name: opts.toolName,
        description: opts.toolDescription,
        // strict guarantees the input validates exactly against the schema
        strict: true,
        input_schema: opts.inputSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: opts.toolName },
    messages: [{ role: "user", content: opts.user }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude refused the request (safety).");
  }

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a tool call.");
  }

  // zod re-validates the model output before any caller trusts it.
  return opts.validate.parse(toolUse.input);
}

/** Build a PDF document content block from base64 — Claude reads PDFs natively,
 *  which is more robust than parsing them ourselves. */
export function pdfBlock(base64: string): Anthropic.ContentBlockParam {
  return {
    type: "document",
    source: { type: "base64", media_type: "application/pdf", data: base64 },
  };
}

/** Plain text content block. */
export function textBlock(text: string): Anthropic.ContentBlockParam {
  return { type: "text", text };
}
