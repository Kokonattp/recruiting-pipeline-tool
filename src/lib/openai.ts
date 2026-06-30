/**
 * OpenAI image helper — generates a hiring-poster image from a prompt via gpt-image-1.
 *
 * Used by the JD → poster feature (Module 1). Separate from the Claude helper because
 * it's a different provider with a different key (OPENAI_API_KEY). Uses a plain fetch to
 * the Images API so we don't pull in another SDK. Returns raw base64 PNG.
 *
 * Note: image models render large blocks of text (especially Thai) unreliably — the UI
 * warns HR to treat generated text as decorative and rely on the saved JD as the source
 * of truth.
 */

const OPENAI_IMAGE_URL = "https://api.openai.com/v1/images/generations";
/** Default to gpt-image-1 (the current OpenAI image model). Override via env if OpenAI
 *  ships a newer one — no code change needed, just set OPENAI_IMAGE_MODEL. */
export const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";

export type PosterSize = "1024x1024" | "1792x1024" | "1024x1792";

export async function generatePosterImage(
  prompt: string,
  size: PosterSize = "1024x1792",
): Promise<{ base64: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY. Add it to .env.local.");

  const body: Record<string, unknown> = {
    model: IMAGE_MODEL,
    prompt,
    size,
    n: 1,
    response_format: "b64_json",
  };
  // dall-e-3 doesn't support quality param the same way; gpt-image-* does
  if (IMAGE_MODEL.startsWith("gpt-image")) body.quality = "medium";

  const res = await fetch(OPENAI_IMAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI image API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image data.");
  return { base64: b64 };
}
