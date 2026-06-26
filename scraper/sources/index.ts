import type { Browser } from "playwright";
import type { RawCandidate, Source as SourceName } from "../types.js";

import { webSource } from "./web.js";
import { jobsdbSource } from "./jobsdb.js";
import { jobthaiSource } from "./jobthai.js";
import { linkedinSource } from "./linkedin.js";
import { facebookSource } from "./facebook.js";
import { jobbkkSource } from "./jobbkk.js";

/**
 * A pluggable scraper source.
 *
 * Each source lives in its own file, owns exactly one site, and is independently
 * testable: call `scrape(browser, query)` with a Playwright browser and get back
 * a list of raw candidates. Sources are responsible for opening/closing their
 * own page (via the browser helper). They should throw on hard failure — the
 * server wraps every call in try/catch so one bad source never sinks the request.
 */
export interface Source {
  /** Which contract source this maps to. */
  readonly name: SourceName;
  /** Run a search and return raw candidate records. */
  scrape(browser: Browser, query: string): Promise<RawCandidate[]>;
}

/** Registry of every known source, keyed by its contract name. */
export const sources: Record<SourceName, Source | undefined> = {
  WEB: webSource,
  JOBSDB: jobsdbSource,
  JOBTHAI: jobthaiSource,
  LINKEDIN: linkedinSource,
  FACEBOOK: facebookSource,
  JOBBKK: jobbkkSource,
  // REFERRAL and MANUAL are human-entered sources — nothing to scrape.
  REFERRAL: undefined,
  MANUAL: undefined,
};

export function getSource(name: SourceName): Source | undefined {
  return sources[name];
}
