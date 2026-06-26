import { makeStubSource } from "./_stub.js";

/**
 * FACEBOOK — stubbed.
 *
 * Facebook content (groups, job posts, profiles) sits behind login and heavy
 * anti-automation, and its Terms prohibit scraping. A real implementation needs
 * an authenticated session and the Graph API where permitted. Returns [] and logs.
 */
export const facebookSource = makeStubSource(
  "FACEBOOK",
  "login wall + ToS restrictions"
);
