import type { Browser } from "playwright";
import type { RawCandidate, Source as SourceName } from "../types.js";
import type { Source } from "./index.js";

/**
 * Factory for "not implemented" sources.
 *
 * Some sources (LinkedIn, Facebook, JobBKK's talent search) gate their candidate
 * data behind an authenticated session and, in LinkedIn/Facebook's case, behind
 * terms-of-service that prohibit scraping outright. Implementing them safely
 * needs cookie/session injection and is out of scope for this public-only
 * service. Rather than crash on these sources, we register a stub that logs and
 * returns [] so the service degrades gracefully.
 */
export function makeStubSource(name: SourceName, reason: string): Source {
  return {
    name,
    async scrape(_browser: Browser, query: string): Promise<RawCandidate[]> {
      console.warn(
        `[${name}] requires session — not implemented (${reason}). ` +
          `Skipping query: ${JSON.stringify(query)}`
      );
      return [];
    },
  };
}
