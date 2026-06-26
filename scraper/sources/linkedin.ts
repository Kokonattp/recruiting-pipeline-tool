import { makeStubSource } from "./_stub.js";

/**
 * LINKEDIN — stubbed.
 *
 * LinkedIn requires an authenticated session for any candidate/people search and
 * actively blocks automation; its Terms of Service prohibit scraping. A real
 * implementation would need authorized API access or injected session cookies,
 * which is intentionally out of scope here. Returns [] and logs.
 */
export const linkedinSource = makeStubSource(
  "LINKEDIN",
  "auth + ToS restrictions"
);
